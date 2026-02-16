const fs = require('fs');
const path = require('path');

const copyRecursiveSync = (src, dest) => {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    
    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }
        
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
};

const deleteRecursiveSync = (src) => {
    if (fs.existsSync(src)) {
        fs.readdirSync(src).forEach((file, index) => {
            const curPath = path.join(src, file);
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteRecursiveSync(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(src);
    }
};

const src = path.join(__dirname, 'frontend', 'assets', 'assets', 'global');
const dest = path.join(__dirname, 'frontend', 'assets', 'global');

if (fs.existsSync(src)) {
    console.log(`Merging ${src} into ${dest}...`);
    copyRecursiveSync(src, dest);
    console.log('Merge complete. Deleting source...');
    deleteRecursiveSync(src);
    
    // Also remove parent 'assets' dir if empty
    const parent = path.join(__dirname, 'frontend', 'assets', 'assets');
    try {
        fs.rmdirSync(parent);
        console.log('Removed empty parent directory');
    } catch (e) {
        // ignore
    }
} else {
    console.log('Source directory does not exist:', src);
}
