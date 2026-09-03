<?php
/**
 * Force Upload Manifest - Updates production manifest.json
 * 
 * This script reads the manifest.json content from a POST request
 * and writes it to the production build directory.
 * 
 * Access: https://pitonmain.com/force-upload-manifest.php
 */

header('Content-Type: application/json');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Define paths
$manifestPath = __DIR__ . '/build/manifest.json';
$backupPath = __DIR__ . '/build/manifest.json.backup.' . date('Y-m-d_H-i-s');

try {
    // Check if this is a POST request with manifest data
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = file_get_contents('php://input');
        
        if (empty($input)) {
            throw new Exception('No manifest data provided');
        }
        
        // Validate JSON
        $manifestData = json_decode($input, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON: ' . json_last_error_msg());
        }
        
        // Backup existing manifest
        if (file_exists($manifestPath)) {
            copy($manifestPath, $backupPath);
        }
        
        // Write new manifest
        $result = file_put_contents($manifestPath, json_encode($manifestData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        
        if ($result === false) {
            throw new Exception('Failed to write manifest file');
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Manifest updated successfully',
            'backup' => $backupPath,
            'bytes_written' => $result,
            'entries_count' => count($manifestData)
        ]);
        exit;
    }
    
    // GET request - show current status and provide upload form
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <title>Force Upload Manifest</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            .status { padding: 15px; background: #f0f0f0; border-radius: 5px; margin: 20px 0; }
            .success { background: #d4edda; color: #155724; }
            .error { background: #f8d7da; color: #721c24; }
            textarea { width: 100%; height: 200px; font-family: monospace; font-size: 12px; }
            button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
            button:hover { background: #0056b3; }
            pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        </style>
    </head>
    <body>
        <h1>Force Upload Manifest</h1>
        
        <div class="status">
            <h3>Current Manifest Status:</h3>
            <p><strong>Path:</strong> <?php echo $manifestPath; ?></p>
            <p><strong>Exists:</strong> <?php echo file_exists($manifestPath) ? '✅ Yes' : '❌ No'; ?></p>
            <?php if (file_exists($manifestPath)): ?>
                <p><strong>Size:</strong> <?php echo number_format(filesize($manifestPath)); ?> bytes</p>
                <p><strong>Last Modified:</strong> <?php echo date('Y-m-d H:i:s', filemtime($manifestPath)); ?></p>
                <?php
                $currentManifest = json_decode(file_get_contents($manifestPath), true);
                $hasAdminDashboard = isset($currentManifest['resources/js/Pages/Admin/Dashboard.jsx']);
                ?>
                <p><strong>Entries:</strong> <?php echo count($currentManifest); ?></p>
                <p><strong>Admin/Dashboard.jsx:</strong> <?php echo $hasAdminDashboard ? '✅ Present' : '❌ Missing'; ?></p>
            <?php endif; ?>
        </div>
        
        <h3>Upload New Manifest:</h3>
        <form id="uploadForm">
            <textarea id="manifestData" placeholder="Paste manifest.json content here..."></textarea>
            <br><br>
            <button type="submit">Upload Manifest</button>
        </form>
        
        <div id="result"></div>
        
        <?php if (file_exists($manifestPath)): ?>
            <h3>Current Manifest Preview (first 50 lines):</h3>
            <pre><?php
                $lines = file($manifestPath);
                echo htmlspecialchars(implode('', array_slice($lines, 0, 50)));
                if (count($lines) > 50) {
                    echo "\n... (truncated, " . (count($lines) - 50) . " more lines)";
                }
            ?></pre>
        <?php endif; ?>
        
        <script>
            document.getElementById('uploadForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const manifestData = document.getElementById('manifestData').value;
                const resultDiv = document.getElementById('result');
                
                if (!manifestData.trim()) {
                    resultDiv.innerHTML = '<div class="status error">Please paste manifest content</div>';
                    return;
                }
                
                try {
                    // Validate JSON
                    JSON.parse(manifestData);
                    
                    resultDiv.innerHTML = '<div class="status">Uploading...</div>';
                    
                    const response = await fetch('<?php echo $_SERVER['PHP_SELF']; ?>', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: manifestData
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        resultDiv.innerHTML = '<div class="status success">' +
                            '<strong>Success!</strong><br>' +
                            result.message + '<br>' +
                            'Entries: ' + result.entries_count + '<br>' +
                            'Bytes written: ' + result.bytes_written + '<br>' +
                            'Backup: ' + result.backup +
                            '</div>';
                        
                        // Reload page after 2 seconds
                        setTimeout(() => location.reload(), 2000);
                    } else {
                        resultDiv.innerHTML = '<div class="status error">Error: ' + result.message + '</div>';
                    }
                } catch (error) {
                    resultDiv.innerHTML = '<div class="status error">Error: ' + error.message + '</div>';
                }
            });
        </script>
    </body>
    </html>
    <?php
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
