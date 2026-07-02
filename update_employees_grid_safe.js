const fs = require('fs');
const file = 'client/src/app/(protected)/employees/page.jsx';
let content = fs.readFileSync(file, 'utf8');

const target1 = '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">\n        {employees.map((emp) => {';
const replacement1 = '{hasAdminAccess(user) && (\n      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">\n        {employees.map((emp) => {';

if (content.includes(target1)) {
    content = content.replace(target1, replacement1);
}

const target2 = '        )})}\n      </div>\n\n      {showModal && (';
const replacement2 = '        )})}\n      </div>\n      )}\n\n      {showModal && (';

if (content.includes(target2)) {
    content = content.replace(target2, replacement2);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed safely');
