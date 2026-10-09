<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use RuntimeException;
use Throwable;
use ZipArchive;

class CreateBackup extends Command
{
    protected $signature = 'backup:create
        {--connection= : Database connection to dump (default: the app\'s default)}';

    protected $description = 'Zip a database dump and the stored report PDFs into the backup folder';

    public function handle(): int
    {
        $connection = $this->option('connection') ?: config('database.default');
        $database = config("database.connections.{$connection}");

        if (! in_array($database['driver'] ?? null, ['mysql', 'mariadb'], true)) {
            $this->error("Backups need a MySQL connection; [{$connection}] is not one.");

            return self::FAILURE;
        }

        $directory = config('backup.path');
        File::ensureDirectoryExists($directory);

        $stamp = now()->format('Y-m-d_His');
        $dumpPath = "{$directory}/database-{$stamp}.sql";
        $zipPath = "{$directory}/backup-{$stamp}.zip";

        try {
            $this->dumpDatabase($database, $dumpPath);
            $this->zip($dumpPath, $zipPath);
        } catch (Throwable $e) {
            File::delete($zipPath);
            Log::error('Backup failed', ['error' => $e->getMessage()]);
            $this->error('Backup failed: '.$e->getMessage());

            return self::FAILURE;
        } finally {
            File::delete($dumpPath);
        }

        $this->prune($directory);
        $this->info(sprintf('Backup written: %s (%s KB)', $zipPath, number_format(filesize($zipPath) / 1024)));

        return self::SUCCESS;
    }

    /**
     * The password goes in a 0600 options file rather than the command line, where
     * other accounts on a shared server could read it from the process list.
     */
    private function dumpDatabase(array $database, string $dumpPath): void
    {
        $optionsFile = dirname($dumpPath).'/.my-'.uniqid().'.cnf';
        File::put($optionsFile, "[client]\npassword=\"".addcslashes((string) ($database['password'] ?? ''), '"\\')."\"\n");
        chmod($optionsFile, 0600);

        try {
            $command = [
                config('backup.mysqldump'),
                '--defaults-extra-file='.$optionsFile, // must come first
                '--user='.$database['username'],
                '--host='.$database['host'],
                '--port='.$database['port'],
                '--single-transaction', // consistent dump without locking the forms
                '--quick',
                '--no-tablespaces', // shared hosting accounts lack the PROCESS privilege
                '--default-character-set=utf8mb4',
                '--result-file='.$dumpPath,
            ];
            if (! empty($database['unix_socket'])) {
                $command[] = '--socket='.$database['unix_socket'];
            }
            $command[] = $database['database'];

            $result = Process::timeout(600)->run($command);
        } finally {
            File::delete($optionsFile);
        }

        if ($result->failed() || ! is_file($dumpPath) || filesize($dumpPath) === 0) {
            throw new RuntimeException(trim($result->errorOutput()) ?: 'mysqldump wrote nothing.');
        }
    }

    private function zip(string $dumpPath, string $zipPath): void
    {
        $zip = new ZipArchive;
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new RuntimeException("Cannot create {$zipPath}.");
        }

        $zip->addFile($dumpPath, 'database.sql');

        $filesRoot = config('backup.files');
        if (is_dir($filesRoot)) {
            foreach (File::allFiles($filesRoot) as $file) {
                $zip->addFile($file->getPathname(), 'storage/'.str_replace('\\', '/', $file->getRelativePathname()));
            }
        }

        if ($password = config('backup.password')) {
            $zip->setPassword($password);
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $zip->setEncryptionIndex($i, ZipArchive::EM_AES_256);
            }
        }

        // Files are read when the archive closes, so the dump must still exist here.
        if (! $zip->close()) {
            throw new RuntimeException("Cannot write {$zipPath}.");
        }
    }

    private function prune(string $directory): void
    {
        $backups = collect(File::glob("{$directory}/backup-*.zip"))->sort()->values();

        $backups->slice(0, max(0, $backups->count() - max(1, (int) config('backup.keep'))))
            ->each(fn (string $old) => File::delete($old));
    }
}
