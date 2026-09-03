<?php
// Script to create/fix .env file on Hostinger
$envPath = __DIR__ . '/../.env';
$envExamplePath = __DIR__ . '/../.env.example';

echo "<h2>Fix .env File</h2>";

// Check if .env exists
if (!file_exists($envPath)) {
    echo "<p style='color: orange;'><strong>⚠️ .env file not found. Creating from .env.example...</strong></p>";
    
    if (file_exists($envExamplePath)) {
        copy($envExamplePath, $envPath);
        echo "<p style='color: green;'><strong>✅ .env file created from .env.example</strong></p>";
    } else {
        echo "<p style='color: red;'><strong>❌ .env.example not found!</strong></p>";
        exit;
    }
}

// Read .env content
$content = file_get_contents($envPath);

// Check if APP_KEY is empty
if (preg_match('/APP_KEY=\s*$/m', $content) || !preg_match('/APP_KEY=.+/m', $content)) {
    echo "<p style='color: orange;'><strong>⚠️ APP_KEY is empty. Generating new key...</strong></p>";
    
    // Generate a new key
    $key = 'base64:' . base64_encode(random_bytes(32));
    
    // Update APP_KEY
    $content = preg_replace('/APP_KEY=.*$/m', 'APP_KEY=' . $key, $content);
    
    if (file_put_contents($envPath, $content)) {
        echo "<p style='color: green;'><strong>✅ New APP_KEY generated!</strong></p>";
        echo "<pre>APP_KEY=$key</pre>";
    } else {
        echo "<p style='color: red;'><strong>❌ Failed to write APP_KEY</strong></p>";
    }
} else {
    echo "<p style='color: green;'><strong>✅ APP_KEY already exists</strong></p>";
}

// Update APP_URL if needed
if (strpos($content, 'APP_URL=https://pitonmain.com/public/public') !== false) {
    echo "<p style='color: orange;'><strong>⚠️ Fixing APP_URL...</strong></p>";
    $content = str_replace(
        'APP_URL=https://pitonmain.com/public/public',
        'APP_URL=https://pitonmain.com',
        $content
    );
    file_put_contents($envPath, $content);
    echo "<p style='color: green;'><strong>✅ APP_URL updated to https://pitonmain.com</strong></p>";
}

// Display current .env content
echo "<h3>Current .env content:</h3>";
echo "<pre style='background: #f5f5f5; padding: 15px; overflow-x: auto; max-height: 400px;'>";
echo htmlspecialchars(file_get_contents($envPath));
echo "</pre>";

echo "<hr>";
echo "<p><strong>✅ Configuration complete! Try visiting: <a href='https://pitonmain.com'>https://pitonmain.com</a></strong></p>";
echo "<p style='color: red;'><strong>⚠️ IMPORTANT: Delete this file after use!</strong></p>";
?>
