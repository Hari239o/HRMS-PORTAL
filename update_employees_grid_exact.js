const fs = require('fs');
const file = 'client/src/app/(protected)/employees/page.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex1 = /<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">\s*\{employees\.map\(\(emp\) => \{/g;
if (content.match(regex1)) {
    content = content.replace(regex1, `{hasAdminAccess(user) && (\n      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">\n        {employees.map((emp) => {`);
}

const target2 = `        )})}\n      </div>\n\n      {showModal && (`;
if (content.includes(target2)) {
    content = content.replace(target2, `        )})}\n      </div>\n      )}\n\n      {showModal && (`);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed exactly');
