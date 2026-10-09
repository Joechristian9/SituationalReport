<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Backups (php artisan backup:create)
    |--------------------------------------------------------------------------
    |
    | Each backup is one zip holding a dump of the database and the stored
    | files (disaster report PDFs). Backups stay on this server, so copy them
    | somewhere else regularly: a backup on the same disk dies with the disk.
    |
    */

    // Where the zips are written. Not under public/, so they are never served.
    'path' => env('BACKUP_PATH', storage_path('app/private/backups')),

    // Stored files to include alongside the database.
    'files' => storage_path('app/public'),

    // Older backups beyond this many are deleted.
    'keep' => (int) env('BACKUP_KEEP', 14),

    // Full path when mysqldump is not on PATH (XAMPP: C:/xampp/mysql/bin/mysqldump.exe).
    'mysqldump' => env('MYSQLDUMP_PATH', 'mysqldump'),

    // When set, the zip is AES-256 encrypted with it. The dump contains names of
    // casualties; keep this password somewhere other than the server.
    'password' => env('BACKUP_PASSWORD'),

];
