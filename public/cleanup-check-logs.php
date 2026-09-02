<?php
// Delete check-logs.php for security
$fileToDelete = __DIR__ . '/check-logs.php';

if (file_exists($fileToDelete)) {
    if (unlink($fileToDelete)) {
        echo "✅ Successfully deleted check-logs.php<br>";
    } else {
        echo "❌ Failed to delete check-logs.php<br>";
    }
} else {
    echo "ℹ️ check-logs.php already deleted<br>";
}

// Delete this cleanup script itself
$thisSelfScript = __FILE__;
echo "<p>Now deleting cleanup script...</p>";
if (unlink($thisSelfScript)) {
    echo "✅ Cleanup complete! Both files deleted.";
} else {
    echo "⚠️ Please manually delete: cleanup-check-logs.php";
}
?>
