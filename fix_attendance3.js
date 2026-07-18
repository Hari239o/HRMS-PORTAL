const fs = require('fs');
let code = fs.readFileSync('client/src/app/(protected)/attendance/page.jsx', 'utf8');

const closingTag = '    </div>\r\n  );\r\n}';
const closingTagUnix = '    </div>\n  );\n}';
const newClosing = '    </>\n  );\n}';

if (code.lastIndexOf(closingTag) !== -1) {
  code = code.substring(0, code.lastIndexOf(closingTag)) + newClosing + code.substring(code.lastIndexOf(closingTag) + closingTag.length);
} else if (code.lastIndexOf(closingTagUnix) !== -1) {
  code = code.substring(0, code.lastIndexOf(closingTagUnix)) + newClosing + code.substring(code.lastIndexOf(closingTagUnix) + closingTagUnix.length);
} else {
  console.log("Could not find closing tag!");
}

fs.writeFileSync('client/src/app/(protected)/attendance/page.jsx', code);
console.log('Fixed JSX correctly');
