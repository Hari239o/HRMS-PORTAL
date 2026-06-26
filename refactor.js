const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'client', 'src');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.jsx') || dirFile.endsWith('.js')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const files = walkSync(srcDir);

files.forEach(file => {
  if (file.endsWith('api.js')) return;

  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  if (content.includes("import axios from 'axios';")) {
    const relativePathToApi = path.relative(path.dirname(file), path.join(srcDir, 'utils', 'api')).replace(/\\/g, '/');
    let importPath = relativePathToApi.startsWith('.') ? relativePathToApi : './' + relativePathToApi;
    
    content = content.replace(/import axios from 'axios';/g, `import api from '${importPath}';`);

    // Replace standard double-nested and single instances observed
    content = content.replace(/\$\{import\.meta\.env\.VITE_API_URL\s*\|\|\s*`\$\{import\.meta\.env\.VITE_API_URL\s*\|\|\s*"http:\/\/localhost:5002"`\}`\}/g, '');
    content = content.replace(/\$\{import\.meta\.env\.VITE_API_URL\s*\|\|\s*"http:\/\/localhost:5002"\}/g, '');
    content = content.replace(/\$\{import\.meta\.env\.VITE_API_URL\s*\|\|\s*""\}/g, '');
    content = content.replace(/import\.meta\.env\.VITE_API_URL\s*\|\|\s*"http:\/\/localhost:5002"/g, "''");

    // Replace axios.methods with api.methods
    content = content.replace(/axios\.get/g, 'api.get');
    content = content.replace(/axios\.post/g, 'api.post');
    content = content.replace(/axios\.put/g, 'api.put');
    content = content.replace(/axios\.patch/g, 'api.patch');
    content = content.replace(/axios\.delete/g, 'api.delete');

    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated:', file);
    }
  }
});
