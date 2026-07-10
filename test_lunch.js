require('dotenv').config({ path: './.env' });
const prisma = require('./client/prisma/client');

async function runLunch() {
  console.log('Running 1:20 PM lunch reminder manually WITH NOTIFICATIONS...');
  try {
    const todayDate = new Date().toISOString().split('T')[0];
    const allEmployees = await prisma.employee.findMany({ where: { role: { not: 'admin' } } });
    const attendancesToday = await prisma.attendance.findMany({ where: { date: todayDate } });
    
    const attendanceMap = new Set(attendancesToday.filter(a => a.checkIn && !a.checkOut && a.status !== 'Absent').map(a => a.employeeId));
    let count = 0;
    for (const emp of allEmployees) {
      if (attendanceMap.has(emp.id)) {
        await prisma.notification.create({
          data: {
            userId: emp.id,
            title: 'Lunch Time!',
            message: `Hey ${emp.name} I think you tired get lunch from 1:30 pm to 2:30 pm and come fast with full of energy to complete today task`,
            type: 'attendance'
          }
        });
        count++;
      }
    }
    console.log(`Sent ${count} lunch notifications.`);
  } catch (error) {
    console.error('Error in lunch reminder:', error);
  }
}
runLunch().then(() => process.exit(0));
