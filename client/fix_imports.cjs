const fs = require('fs');
const path = require('path');

function replaceImports(dir) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceImports(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf-8');
            let originalContent = content;
            
            // Replace ../../../ with @/
            content = content.replace(/from\s+['"]\.\.\/\.\.\/\.\.\/([^'"]+)['"]/g, "from '@/$1'");
            // Replace ../../ with @/
            content = content.replace(/from\s+['"]\.\.\/\.\.\/([^'"]+)['"]/g, "from '@/$1'");
            // Replace ../ with @/ (but careful with siblings like ./ )
            content = content.replace(/from\s+['"]\.\.\/([^'"]+)['"]/g, "from '@/$1'");

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed imports in', fullPath);
            }
        }
    }
}

replaceImports(path.join(__dirname, 'src', 'app'));
replaceImports(path.join(__dirname, 'src', 'components'));
replaceImports(path.join(__dirname, 'src', 'context'));
