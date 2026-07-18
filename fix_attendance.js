const fs = require('fs');
let code = fs.readFileSync('client/src/app/(protected)/attendance/page.jsx', 'utf8');

// 1. Fix the return statement
code = code.replace(
  /return\s*\(\s*<div className="space-y-8 fade-in relative">/,
  'return (\n    <>\n      <div className="space-y-8 fade-in relative">'
);

// 2. Fix the file end (it should be </>\n  );\n})
code = code.replace(
  /    <\/div>\s*\);\s*}/,
  '    </>\n  );\n}'
);

fs.writeFileSync('client/src/app/(protected)/attendance/page.jsx', code);
console.log('Fixed JSX correctly');
