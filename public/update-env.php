<?php
// Script to update .env file on Hostinger
// Upload to: public_html/public/update-env.php

$envPath = __DIR__ . '/../.env';

echo "<h2>Update .env File</h2>";

if (file_exists($envPath)) {
    echo "<p style='color: green;'><strong>✅ .env file found</strong></p>";
    
    // Read current content
    $content = file_get_contents($envPath);
    
    // Update APP_URL
    $content = preg_replace(
        '/APP_URL=.*$/m',
        'APP_URL=https://pitonmain.com',
        $content
    );
    
    // Write back
    if (file_put_contents($envPath, $content)) {
        echo "<p style='color: green;'><strong>✅ APP_URL updated successfully!</strong></p>";
        echo "<pre>";
        echo "Old: APP_URL=https://pitonmain.com/public/public\n";
        echo "New: APP_URL=https://pitonmain.com\n";
        echo "</pre>";
        
        echo "<h3>Updated .env content:</h3>";
        echo "<pre style='background: #f5f5f5; padding: 15px; overflow-x: auto;'>";
        echo htmlspecialchars($content);
        echo "</pre>";
    } else {
        echo "<p style='color: red;'><strong>❌ Failed to update .env</strong></p>";
    }
} else {
    echo "<p style='color: red;'><strong>❌ .env file not found at: $envPath</strong></p>";
}

echo "<hr>";
echo "<p style='color: red;'><strong>⚠️ IMPORTANT: Delete this file after use!</strong></p>";
?>
