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
    } else if (file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('client/backend/routes');
let changed = 0;

files.forEach(file => {
  // Don't touch settings.js if it exists, admin only
  if (file.includes('settings.js')) return;
  
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace authorize(['admin']) with authorize(['admin', 'hr'])
  // Need to handle variations like authorize(["admin"]) or authorize(['admin'])
  const regex = /authorize\(\[\s*['"]admin['"]\s*\]\)/g;
  
  if (regex.test(content)) {
    content = content.replace(regex, "authorize(['admin', 'hr'])");
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
    changed++;
    console.log('Updated', file);
  }
});
console.log('Total files updated:', changed);
