const fs = require('fs');
const file = 'client/src/app/(protected)/employees/page.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const fetchData = async \(\) => \{\s*await Promise\.all\(\[fetchEmployees\(\), fetchAttendanceData\(\)\]\);\s*setLoading\(false\);\s*\};/; 
const replacement = `const fetchData = async () => {
    const promises = [fetchEmployees(), fetchAttendanceData()];
    if (user?.role === 'post_sales' || user?.role === 'post sales') {
        promises.push(api.get(\`/api/tasks/submit/clearances\`).then(res => setClearances(res.data)).catch(err => console.error(err)));
    }
    await Promise.all(promises);
    setLoading(false);
};`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content, 'utf8');
    console.log('success');
} else {
    console.log('regex did not match');
}
