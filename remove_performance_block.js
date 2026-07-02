const fs = require('fs');
const file = 'client/src/app/(protected)/performance/page.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<div className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-700 col-span-1 md:col-span-3">[\s\S]*?<\/h4>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

if (regex.test(content)) {
    content = content.replace(regex, '');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Successfully removed from performance');
} else {
    console.log('Regex did not match');
}
