const fs = require('fs');
const path = require('path');

function fixSyntax(dir) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
            fixSyntax(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf-8');
            let originalContent = content;

            // Ensure "use client"; is at the top
            content = content.replace(/"use client";\s*/g, '');
            content = '"use client";\n\n' + content.trimStart();

            // Fix Link imports
            // Find if next/navigation imports Link
            if (content.includes("from 'next/navigation'")) {
                const navRegex = /import\s+\{([^}]*)\}\s+from\s+['"]next\/navigation['"]/;
                const match = content.match(navRegex);
                if (match) {
                    let imports = match[1].split(',').map(s => s.trim()).filter(Boolean);
                    if (imports.includes('Link')) {
                        imports = imports.filter(i => i !== 'Link');
                        if (imports.length > 0) {
                            content = content.replace(navRegex, `import { ${imports.join(', ')} } from 'next/navigation'`);
                        } else {
                            content = content.replace(navRegex, '');
                        }
                    }
                }
            }

            // Clean up duplicate default Link imports
            const linkImport = "import Link from 'next/link';\n";
            content = content.replace(/import Link from 'next\/link';\s*/g, '');
            if (originalContent.includes('Link')) {
                // Only inject if the component actually uses Link
                content = content.replace(/"use client";\n\n/, '"use client";\n\n' + linkImport);
            }

            // Fix any "import {  } from 'next/navigation';"
            content = content.replace(/import\s+\{\s*\}\s+from\s+['"]next\/navigation['"];?/g, '');

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed syntax in', fullPath);
            }
        }
    }
}

fixSyntax(path.join(__dirname, 'src', 'app'));
fixSyntax(path.join(__dirname, 'src', 'components'));
fixSyntax(path.join(__dirname, 'src', 'context'));
