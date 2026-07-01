const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('client/src');
let changed = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Regex to match user.role === 'admin' or user?.role === 'admin'
  const regex = /user\??\.role\s*===\s*['"]admin['"]/g;
  
  if (regex.test(content)) {
    content = content.replace(regex, 'hasAdminAccess(user)');
    
    if (!content.includes('import { hasAdminAccess')) {
      const importMatches = [...content.matchAll(/^import.*from.*$/gm)];
      if (importMatches.length > 0) {
        const lastImportIndex = importMatches[importMatches.length - 1].index + importMatches[importMatches.length - 1][0].length;
        content = content.slice(0, lastImportIndex) + '\nimport { hasAdminAccess, isSuperAdmin } from \'@/utils/rbac\';' + content.slice(lastImportIndex);
      } else {
        content = 'import { hasAdminAccess, isSuperAdmin } from \'@/utils/rbac\';\n' + content;
      }
    }

    if (content !== original) {
      fs.writeFileSync(file, content);
      changed++;
      console.log('Updated', file);
    }
  }
});
console.log('Total files updated:', changed);
