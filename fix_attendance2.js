const fs = require('fs');
let code = fs.readFileSync('client/src/app/(protected)/attendance/page.jsx', 'utf8');

// 1. Fix the return statement
code = code.replace(
  /return\s*\(\s*<div className="space-y-8 fade-in relative">/,
  'return (\n    <>\n      <div className="space-y-8 fade-in relative">'
);

// 2. Fix the file end using lastIndexOf
const matchStr = '    </div>\r\n  );\r\n}';
const matchStr2 = '    </div>\n  );\n}';

if (code.endsWith(matchStr)) {
  code = code.substring(0, code.length - matchStr.length) + '    </>\r\n  );\r\n}';
} else if (code.endsWith(matchStr2)) {
  code = code.substring(0, code.length - matchStr2.length) + '    </>\n  );\n}';
} else {
  // fallback using regex matching the end of the string
  code = code.replace(/    <\/div>\r?\n  \);\r?\n}$/, '    </>\n  );\n}');
}

fs.writeFileSync('client/src/app/(protected)/attendance/page.jsx', code);
console.log('Fixed JSX correctly');
