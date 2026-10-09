<?php

use Illuminate\Process\PendingProcess;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;

beforeEach(function () {
    $this->backupRoot = sys_get_temp_dir().'/sitrep-backup-test-'.uniqid();
    File::ensureDirectoryExists("{$this->backupRoot}/files/reports");
    File::put("{$this->backupRoot}/files/reports/Typhoon_Report.pdf", '%PDF-1.4 test');

    config([
        'backup.path' => "{$this->backupRoot}/backups",
        'backup.files' => "{$this->backupRoot}/files",
        'backup.keep' => 14,
        'backup.password' => null,
        'database.connections.backup_test' => [
            'driver' => 'mysql', 'host' => 'db.example', 'port' => 3306,
            'database' => 'sitrep', 'username' => 'sitrep_user', 'password' => 's3cret',
        ],
    ]);
});

afterEach(fn () => File::deleteDirectory($this->backupRoot));

/** Pretend mysqldump ran and wrote a dump to the file named in its arguments. */
function fakeMysqldump(?array &$seen = null, string $sql = "CREATE TABLE users (id int);\n"): void
{
    Process::fake(function (PendingProcess $process) use (&$seen, $sql) {
        $seen = $process->command;
        $optionsFile = substr(collect($process->command)->first(fn ($arg) => str_starts_with($arg, '--defaults-extra-file=')), 22);
        $seen[] = 'options:'.File::get($optionsFile);
        $target = substr(collect($process->command)->first(fn ($arg) => str_starts_with($arg, '--result-file=')), 14);
        File::put($target, $sql);

        return Process::result();
    });
}

it('zips the database dump and stored files, leaving no loose dump behind', function () {
    fakeMysqldump();

    $this->artisan('backup:create', ['--connection' => 'backup_test'])->assertSuccessful();

    $zips = File::glob("{$this->backupRoot}/backups/backup-*.zip");
    expect($zips)->toHaveCount(1)
        ->and(File::glob("{$this->backupRoot}/backups/*.sql"))->toBeEmpty()
        ->and(File::glob("{$this->backupRoot}/backups/.my-*"))->toBeEmpty();

    $zip = new ZipArchive;
    $zip->open($zips[0]);
    expect($zip->getFromName('database.sql'))->toContain('CREATE TABLE users')
        ->and($zip->getFromName('storage/reports/Typhoon_Report.pdf'))->toBe('%PDF-1.4 test');
    $zip->close();
});

it('keeps the database password off the command line', function () {
    fakeMysqldump($seen);

    $this->artisan('backup:create', ['--connection' => 'backup_test'])->assertSuccessful();

    $arguments = array_slice($seen, 0, -1);
    expect(implode(' ', $arguments))->not->toContain('s3cret')
        ->and($arguments[1])->toStartWith('--defaults-extra-file=')
        ->and(end($seen))->toContain('password="s3cret"');
});

it('fails loudly and writes nothing when mysqldump fails', function () {
    Process::fake(fn () => Process::result(errorOutput: 'Access denied for user', exitCode: 2));

    $this->artisan('backup:create', ['--connection' => 'backup_test'])
        ->expectsOutputToContain('Access denied for user')
        ->assertFailed();

    expect(File::glob("{$this->backupRoot}/backups/*"))->toBeEmpty();
});

it('keeps only the newest backups', function () {
    config(['backup.keep' => 2]);
    File::ensureDirectoryExists("{$this->backupRoot}/backups");
    foreach (['2026-01-01_010000', '2026-01-02_010000', '2026-01-03_010000'] as $stamp) {
        File::put("{$this->backupRoot}/backups/backup-{$stamp}.zip", 'old');
    }
    fakeMysqldump();

    $this->artisan('backup:create', ['--connection' => 'backup_test'])->assertSuccessful();

    $names = collect(File::glob("{$this->backupRoot}/backups/backup-*.zip"))->map(fn ($p) => basename($p));
    expect($names)->toHaveCount(2)
        ->and($names->first())->toBe('backup-2026-01-03_010000.zip')
        ->and($names->contains('backup-2026-01-01_010000.zip'))->toBeFalse();
});

it('encrypts the zip when a backup password is set', function () {
    config(['backup.password' => 'zip-pass']);
    fakeMysqldump();

    $this->artisan('backup:create', ['--connection' => 'backup_test'])->assertSuccessful();

    $zip = new ZipArchive;
    $zip->open(File::glob("{$this->backupRoot}/backups/backup-*.zip")[0]);
    expect($zip->statName('database.sql')['encryption_method'])->toBe(ZipArchive::EM_AES_256)
        ->and($zip->getFromName('database.sql'))->toBeFalse();
    $zip->setPassword('zip-pass');
    expect($zip->getFromName('database.sql'))->toContain('CREATE TABLE users');
    $zip->close();
});

it('refuses a connection that is not MySQL', function () {
    Process::fake();

    $this->artisan('backup:create', ['--connection' => 'sqlite'])->assertFailed();

    Process::assertNothingRan();
});

it('schedules a nightly backup', function () {
    $this->artisan('schedule:list')->expectsOutputToContain('backup:create');
});
