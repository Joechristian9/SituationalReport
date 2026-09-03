<?php
// Fix database password in .env
$envPath = __DIR__ . '/../.env';

echo "<h2>Fix Database Password</h2>";

if (file_exists($envPath)) {
    $content = file_get_contents($envPath);
    
    // Fix the password (change hyphen to underscore)
    $content = str_replace(
        'DB_PASSWORD=CuteniByu-09',
        'DB_PASSWORD=CuteniByu_09',
        $content
    );
    
    if (file_put_contents($envPath, $content)) {
        echo "<p style='color: green;'><strong>✅ Database password fixed!</strong></p>";
        echo "<pre>Changed: DB_PASSWORD=CuteniByu-09\n";
        echo "To:      DB_PASSWORD=CuteniByu_09</pre>";
    } else {
        echo "<p style='color: red;'><strong>❌ Failed to update password</strong></p>";
    }
    
    echo "<h3>Database Configuration:</h3>";
    echo "<pre>";
    echo "DB_CONNECTION=mysql\n";
    echo "DB_HOST=localhost\n";
    echo "DB_PORT=3306\n";
    echo "DB_DATABASE=u988863428_sitrepilagan\n";
    echo "DB_USERNAME=u988863428_joe\n";
    echo "DB_PASSWORD=CuteniByu_09\n";
    echo "</pre>";
} else {
    echo "<p style='color: red;'><strong>❌ .env file not found</strong></p>";
}

echo "<hr>";
echo "<p><strong>✅ Now try: <a href='https://pitonmain.com'>https://pitonmain.com</a></strong></p>";
echo "<p style='color: red;'><strong>⚠️ Delete this file after use!</strong></p>";
?>
