const fs = require('fs');

const filePath = 'client/backend/routes/attendance.js';
let content = fs.readFileSync(filePath, 'utf8');

const targetBlock = `    if (role === 'admin' || role === 'hr') {
      const allEmployees = await prisma.employee.findMany();
      const presentTodayIds = new Set(attendance.filter((a) => a.date === today).map((a) => a.employeeId));
      allEmployees.forEach((emp) => {
        if (!presentTodayIds.has(emp.id) && currentTime > afterOffice) {
          attendance.push({
            id: \`absent_\${emp.id}_\${today}\`,
            employeeId: emp.id,
            date: today,
            status: 'Absent',
            checkIn: null,
            checkOut: null,
            employee: emp
          });
        }
      });
    } else if (attendance.length === 0 && currentTime > afterOffice) {
      const emp = await prisma.employee.findUnique({ where: { id } });
      attendance.push({
        id: \`absent_\${id}_\${today}\`,
        employeeId: id,
        date: today,
        status: 'Absent',
        checkIn: null,
        checkOut: null,
        employee: emp
      });
    }`;

const replacementBlock = `    const pastDates = [];
    for (let i = 0; i <= 45; i++) {
      const d = currentTime.minus({ days: i });
      if (d.weekday !== 7) { // Skip Sunday
        pastDates.push({ date: d.toISODate(), isToday: i === 0, dateTime: d.startOf('day') });
      }
    }

    if (role === 'admin' || role === 'hr') {
      const allEmployees = await prisma.employee.findMany();
      
      const attendanceMap = new Set(attendance.map(a => \`\${a.employeeId}_\${a.date}\`));

      allEmployees.forEach((emp) => {
        const empJoinedDate = emp.createdAt ? DateTime.fromJSDate(emp.createdAt).setZone('Asia/Kolkata').startOf('day') : DateTime.fromISO('2000-01-01');
        
        pastDates.forEach(({ date, isToday, dateTime }) => {
          if (dateTime < empJoinedDate) return; // Skip dates before employee joined
          if (isToday && currentTime <= afterOffice) return; // Wait for end of day for today
          
          const key = \`\${emp.id}_\${date}\`;
          if (!attendanceMap.has(key)) {
            attendance.push({
              id: \`absent_\${emp.id}_\${date}\`,
              employeeId: emp.id,
              date: date,
              status: 'Absent',
              checkIn: null,
              checkOut: null,
              employee: emp
            });
          }
        });
      });
    } else {
      const emp = await prisma.employee.findUnique({ where: { id } });
      const attendanceMap = new Set(attendance.map(a => a.date));
      const empJoinedDate = emp.createdAt ? DateTime.fromJSDate(emp.createdAt).setZone('Asia/Kolkata').startOf('day') : DateTime.fromISO('2000-01-01');

      pastDates.forEach(({ date, isToday, dateTime }) => {
        if (dateTime < empJoinedDate) return;
        if (isToday && currentTime <= afterOffice) return;
        
        if (!attendanceMap.has(date)) {
          attendance.push({
            id: \`absent_\${id}_\${date}\`,
            employeeId: id,
            date: date,
            status: 'Absent',
            checkIn: null,
            checkOut: null,
            employee: emp
          });
        }
      });
    }`;

if(content.includes(targetBlock.trim())) {
  content = content.replace(targetBlock.trim(), replacementBlock.trim());
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated absent logic');
} else {
  console.log('Target block not found!');
}
