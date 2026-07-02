const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('./src', function(filePath) {
    if (filePath.endsWith('.scss')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content
            .replace(/#ff5722/g, '#c99b2e')
            .replace(/#e64a19/g, '#a67c21')
            .replace(/255, 87, 34/g, '201, 155, 46');
            
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Updated: ' + filePath);
        }
    }
});
