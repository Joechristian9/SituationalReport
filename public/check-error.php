<?php
/**
 * Quick Error Checker
 */
header('Content-Type: text/plain');

$logPath = __DIR__ . '/../storage/logs/laravel.log';

if (file_exists($logPath)) {
    $lines = file($logPath);
    $lastLines = array_slice($lines, -100);
    echo "=== Last 100 lines of Laravel log ===\n\n";
    echo implode('', $lastLines);
} else {
    echo "Log file not found at: $logPath\n";
}
