const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'client/src/app/(protected)/performance/page.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add `isStandardEmployee`
content = content.replace(
  "  const { user } = useAuth();",
  "  const { user } = useAuth();\n  const isStandardEmployee = !['admin', 'hr', 'manager', 'post_sales', 'post sales'].includes(user?.role);"
);

// 2. Wrap Top Widgets and Charts
const topSectionStart = "{/* HEADER SECTION WITH GLASSMORPHISM */}";
const topSectionEnd = "{user.role !== 'admin' && (";

// We need to wrap everything from HEADER SECTION up to just before user.role !== 'admin'
const searchPattern = content.substring(content.indexOf(topSectionStart), content.indexOf(topSectionEnd));

const replacementPattern = `{isStandardEmployee && (
  <>
  ${searchPattern}
  </>
)}
`;

content = content.replace(searchPattern, replacementPattern);

// 3. Change user.role !== 'admin' to isStandardEmployee
content = content.replace("{user.role !== 'admin' && (", "{isStandardEmployee && (");

fs.writeFileSync(file, content, 'utf8');
console.log('Performance page updated.');
