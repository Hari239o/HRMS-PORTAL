const fs = require('fs');
let c = fs.readFileSync('client/src/components/Sidebar.jsx', 'utf8');
c = c.replace(
  "{ name: 'Workforce Directory', icon: Users, path: '/employees' },", 
  "{ name: 'Workforce Directory', icon: Users, path: '/employees' },\n    { name: 'Teams & Targets', icon: Target, path: '/teams' },"
);
fs.writeFileSync('client/src/components/Sidebar.jsx', c);
