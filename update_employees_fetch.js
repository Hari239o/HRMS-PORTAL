const fs = require('fs');
const file = 'client/src/app/(protected)/employees/page.jsx';
let content = fs.readFileSync(file, 'utf8');

const oldFetchData = `  const fetchData = async () => {
    await Promise.all([fetchEmployees(), fetchAttendanceData()]);
    setLoading(false);
  };`;

const newFetchData = `  const fetchData = async () => {
    const promises = [fetchEmployees(), fetchAttendanceData()];
    if (user?.role === 'post_sales' || user?.role === 'post sales') {
        promises.push(
            api.get(\`/api/tasks/submit/clearances\`)
               .then(res => setClearances(res.data))
               .catch(err => console.error(err))
        );
    }
    await Promise.all(promises);
    setLoading(false);
  };`;

if (content.includes(oldFetchData)) {
    content = content.replace(oldFetchData, newFetchData);
    fs.writeFileSync(file, content, 'utf8');
    console.log('fetchData updated');
} else {
    console.log('fetchData not found exactly');
}
