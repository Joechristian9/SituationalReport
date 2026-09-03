<?php
// Complete fix script for Hostinger deployment
$envPath = __DIR__ . '/../.env';

echo "<h2>Complete System Fix</h2>";
echo "<hr>";

// Step 1: Check .env file
echo "<h3>Step 1: Check .env file</h3>";
if (!file_exists($envPath)) {
    echo "<p style='color: red;'>❌ .env file not found!</p>";
    echo "<p>Creating from .env.example...</p>";
    if (file_exists(__DIR__ . '/../.env.example')) {
        copy(__DIR__ . '/../.env.example', $envPath);
        echo "<p style='color: green;'>✅ .env created</p>";
    } else {
        echo "<p style='color: red;'>❌ .env.example not found either!</p>";
        exit;
    }
} else {
    echo "<p style='color: green;'>✅ .env file exists</p>";
}

// Step 2: Read current content
$content = file_get_contents($envPath);

// Step 3: Fix APP_URL
echo "<h3>Step 2: Fix APP_URL</h3>";
if (strpos($content, 'APP_URL=https://pitonmain.com') !== false) {
    echo "<p style='color: green;'>✅ APP_URL is correct</p>";
} else {
    $content = preg_replace('/APP_URL=.*$/m', 'APP_URL=https://pitonmain.com', $content);
    echo "<p style='color: orange;'>⚠️ Fixed APP_URL to https://pitonmain.com</p>";
}

// Step 4: Fix database password (hyphen to underscore)
echo "<h3>Step 3: Fix Database Password</h3>";
if (strpos($content, 'DB_PASSWORD=CuteniByu-09') !== false) {
    $content = str_replace('DB_PASSWORD=CuteniByu-09', 'DB_PASSWORD=CuteniByu_09', $content);
    echo "<p style='color: orange;'>⚠️ Fixed password: CuteniByu-09 → CuteniByu_09</p>";
} elseif (strpos($content, 'DB_PASSWORD=CuteniByu_09') !== false) {
    echo "<p style='color: green;'>✅ Database password is correct</p>";
} else {
    echo "<p style='color: red;'>❌ Database password not found in expected format</p>";
}

// Step 5: Verify database credentials
echo "<h3>Step 4: Database Configuration</h3>";
echo "<pre>";
if (preg_match('/DB_DATABASE=(.+)$/m', $content, $match)) {
    echo "Database: " . trim($match[1]) . "\n";
}
if (preg_match('/DB_USERNAME=(.+)$/m', $content, $match)) {
    echo "Username: " . trim($match[1]) . "\n";
}
if (preg_match('/DB_PASSWORD=(.+)$/m', $content, $match)) {
    $pass = trim($match[1]);
    echo "Password: " . str_repeat('*', strlen($pass) - 4) . substr($pass, -4) . "\n";
}
echo "</pre>";

// Step 6: Save changes
if (file_put_contents($envPath, $content)) {
    echo "<p style='color: green;'><strong>✅ All changes saved successfully!</strong></p>";
} else {
    echo "<p style='color: red;'><strong>❌ Failed to save changes</strong></p>";
}

// Step 7: Test database connection
echo "<h3>Step 5: Test Database Connection</h3>";
try {
    preg_match('/DB_HOST=(.+)$/m', $content, $hostMatch);
    preg_match('/DB_DATABASE=(.+)$/m', $content, $dbMatch);
    preg_match('/DB_USERNAME=(.+)$/m', $content, $userMatch);
    preg_match('/DB_PASSWORD=(.+)$/m', $content, $passMatch);
    
    $host = trim($hostMatch[1] ?? 'localhost');
    $db = trim($dbMatch[1] ?? '');
    $user = trim($userMatch[1] ?? '');
    $pass = trim($passMatch[1] ?? '');
    
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    echo "<p style='color: green;'><strong>✅ Database connection successful!</strong></p>";
    
    // Count tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "<p>Found " . count($tables) . " tables in database</p>";
    
} catch (PDOException $e) {
    echo "<p style='color: red;'><strong>❌ Database connection failed!</strong></p>";
    echo "<pre>" . htmlspecialchars($e->getMessage()) . "</pre>";
}

echo "<hr>";
echo "<h3>✅ Setup Complete!</h3>";
echo "<p><strong>Try your site now:</strong></p>";
echo "<ul>";
echo "<li><a href='https://pitonmain.com'>Home Page</a></li>";
echo "<li><a href='https://pitonmain.com/login'>Login Page</a></li>";
echo "<li><a href='https://pitonmain.com/admin-dashboard'>Admin Dashboard</a></li>";
echo "</ul>";
echo "<hr>";
echo "<p style='color: red;'><strong>⚠️ IMPORTANT: Delete this file (fix-all.php) after verifying everything works!</strong></p>";
?>
