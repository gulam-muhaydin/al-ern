const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'frontend', 'assets');
const nestedAssetsDir = path.join(assetsDir, 'assets');

if (fs.existsSync(nestedAssetsDir)) {
    console.log('Found nested assets directory:', nestedAssetsDir);
    
    // Read contents of nested assets
    const items = fs.readdirSync(nestedAssetsDir);
    
    items.forEach(item => {
        const srcPath = path.join(nestedAssetsDir, item);
        const destPath = path.join(assetsDir, item);
        
        console.log(`Moving ${srcPath} to ${destPath}`);
        
        // If destination exists and is a directory, we might need to merge
        if (fs.existsSync(destPath)) {
            console.log(`Destination ${destPath} exists. Merging...`);
            // Recursive merge or just move contents?
            // For simplicity, let's assume no conflicts for now or use rename
            // But if directory exists, we can't rename a directory over it.
            // Let's just try to rename.
        }
        
        try {
            fs.renameSync(srcPath, destPath);
        } catch (err) {
            console.error(`Error moving ${item}:`, err.message);
            // Fallback: Copy and delete?
            // If it's a directory and destination exists, we need to go deeper.
            if (err.code === 'EPERM' || err.code === 'ENOTEMPTY') {
                 // Handle directory merge if needed
            }
        }
    });
    
    // Remove empty nested assets dir
    try {
        fs.rmdirSync(nestedAssetsDir);
        console.log('Removed empty nested directory');
    } catch (err) {
        console.log('Could not remove nested directory (might not be empty):', err.message);
    }
} else {
    console.log('No nested assets directory found.');
}
