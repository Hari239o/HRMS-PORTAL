const fs = require('fs');
let lines = fs.readFileSync('client/backend/routes/attendance.js', 'utf8').split('\n');
lines[405] = "        const isTodayAfterOffice = false; // Checkout allowed till midnight";
fs.writeFileSync('client/backend/routes/attendance.js', lines.join('\n'));
