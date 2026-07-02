const fs = require('fs');
const file = 'client/src/app/(protected)/employees/page.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">\s*\{employees\.map\(\(emp\) => \{/g;
const replacement = `{hasAdminAccess(user) && (\n      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">\n        {employees.map((emp) => {`;

content = content.replace(regex, replacement);

const endRegex = /        \)\}\)\}\n      <\/div>/g;
const endReplacement = `        )})}\n      </div>\n      )}`;

content = content.replace(endRegex, endReplacement);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed');
