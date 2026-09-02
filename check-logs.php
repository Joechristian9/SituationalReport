<?php
// Script to check Laravel logs on Hostinger
// Upload this to: public_html/public/public/check-logs.php

$logPath = __DIR__ . '/../../storage/logs/laravel.log';

echo "<h2>Laravel Log Checker</h2>";
echo "<p><strong>Log file path:</strong> $logPath</p>";

if (file_exists($logPath)) {
    echo "<p style='color: green;'><strong>✅ Log file exists</strong></p>";
    
    // Get last 100 lines
    $lines = file($logPath);
    $lastLines = array_slice($lines, -100);
    
    echo "<h3>Last 100 lines of log:</h3>";
    echo "<pre style='background: #f5f5f5; padding: 15px; overflow-x: auto;'>";
    echo htmlspecialchars(implode('', $lastLines));
    echo "</pre>";
    
    // File size
    $size = filesize($logPath);
    echo "<p><strong>Log file size:</strong> " . number_format($size / 1024, 2) . " KB</p>";
} else {
    echo "<p style='color: red;'><strong>❌ Log file not found</strong></p>";
    echo "<p>Checking directory structure:</p>";
    echo "<pre>";
    echo "Current directory: " . __DIR__ . "\n";
    echo "Storage path: " . __DIR__ . '/../../storage' . "\n";
    if (is_dir(__DIR__ . '/../../storage')) {
        echo "Storage directory exists\n";
        if (is_dir(__DIR__ . '/../../storage/logs')) {
            echo "Logs directory exists\n";
            $files = scandir(__DIR__ . '/../../storage/logs');
            echo "Files in logs directory:\n";
            print_r($files);
        } else {
            echo "Logs directory does NOT exist\n";
        }
    } else {
        echo "Storage directory does NOT exist\n";
    }
    echo "</pre>";
}

echo "<hr>";
echo "<p style='color: red;'><strong>⚠️ IMPORTANT: Delete this file after viewing!</strong></p>";
?>
