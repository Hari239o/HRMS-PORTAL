const fs = require('fs');
const file = 'client/src/app/(protected)/dashboard/page.jsx';
let content = fs.readFileSync(file, 'utf8');

const oldStr = '<AppGridItem title="Member" icon={Users} link="#" color="teal" />';
const newStr = `<AppGridItem title="Member" icon={Users} link={(user?.role === 'post_sales' || user?.role === 'post sales') ? "/employees" : "#"} color="teal" />`;

if (content.includes(oldStr)) {
    content = content.replace(oldStr, newStr);
    fs.writeFileSync(file, content, 'utf8');
    console.log('updated dashboard');
} else {
    console.log('not found in dashboard');
}
