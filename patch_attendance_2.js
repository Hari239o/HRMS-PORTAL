const fs = require('fs');
let code = fs.readFileSync('client/backend/routes/attendance.js', 'utf8');

code = code.replace(
  "const isTodayAfterOffice = a.date === today && currentTime > afterOffice;\n        if (isPastDay || isTodayAfterOffice) {",
  "const isTodayAfterOffice = false;\n        if (isPastDay) {"
);

fs.writeFileSync('client/backend/routes/attendance.js', code);
