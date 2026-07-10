const schedule = require('node-schedule');
const prisma = require('../../prisma/client'); // updated import

function initCronJobs() {
  // Run every day at midnight (0 0 * * *)
  schedule.scheduleJob('0 0 * * *', async () => {
    console.log('Running midnight attendance check for missing punch-outs...');
    try {
      // Find anyone who checked in on any past date but didn't check out
      const todayDate = new Date().toISOString().split('T')[0];

      const missingCheckouts = await prisma.attendance.findMany({
        where: {
          checkOut: null,
          date: {
            lt: todayDate
          },
          status: {
            not: 'Absent'
          }
        }
      });

      if (missingCheckouts.length > 0) {
        console.log(`Found ${missingCheckouts.length} employees who missed checkout. Marking as Absent.`);
        
        await prisma.attendance.updateMany({
          where: {
            id: {
              in: missingCheckouts.map(record => record.id)
            }
          },
          data: {
            status: 'Absent'
          }
        });
      } else {
        console.log('No missing punch-outs found.');
      }
    } catch (error) {
      console.error('Error in midnight attendance check:', error);
    }
  });

  // Afternoon check for tomorrow's holiday/weekoff (run at 5:00 PM)
  schedule.scheduleJob('0 17 * * *', async () => {
    console.log('Running afternoon check for upcoming holidays...');
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      const tomorrowDay = tomorrow.toLocaleDateString('en-US', { weekday: 'long' }); // e.g., 'Sunday'

      // Check if tomorrow is a global holiday
      const holidays = await prisma.holiday.findMany({
        where: {
          date: {
            gte: new Date(`${tomorrowStr}T00:00:00.000Z`),
            lt: new Date(`${tomorrowStr}T23:59:59.999Z`)
          }
        }
      });

      const isGlobalHoliday = holidays.length > 0;
      const holidayName = isGlobalHoliday ? holidays[0].name : '';

      // Get all active employees
      const employees = await prisma.employee.findMany();
      
      for (const emp of employees) {
        const isWeekOff = emp.weekOff === tomorrowDay;
        if (isGlobalHoliday || isWeekOff) {
          const reason = isGlobalHoliday ? holidayName : 'Week Off';
          await prisma.notification.create({
            data: {
              userId: emp.id,
              title: `Upcoming ${reason}`,
              message: `Hey ${emp.name}! 🌟 Tomorrow is a ${reason} at Geonixa! Let's enjoy tomorrow, relax, and be careful! See you when you get back!`,
              type: 'holiday_reminder',
              data: { date: tomorrowStr, reason }
            }
          });
        }
      }
      console.log('Holiday notifications sent successfully.');
    } catch (error) {
      console.error('Error in afternoon holiday check:', error);
    }
  });

  // Morning Punch In Reminder (11:00 AM)
  schedule.scheduleJob({ rule: '0 11 * * *', tz: 'Asia/Kolkata' }, async () => {
    console.log('Running 11:00 AM punch-in reminder...');
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      const allEmployees = await prisma.employee.findMany({ where: { role: { not: 'admin' } } });
      const attendancesToday = await prisma.attendance.findMany({ where: { date: todayDate } });
      
      const attendanceMap = new Set(attendancesToday.map(a => a.employeeId));
      for (const emp of allEmployees) {
        if (!attendanceMap.has(emp.id)) {
          await prisma.notification.create({
            data: {
              userId: emp.id,
              title: 'Attendance Reminder',
              message: `Hi ${emp.name}, you haven't punched in yet! Please check in before 11:05 AM to avoid a Half Day mark.`,
              type: 'attendance'
            }
          });
        }
      }
    } catch (error) {
      console.error('Error in punch-in reminder:', error);
    }
  });

  // Lunch Reminder (1:00 PM)
  schedule.scheduleJob({ rule: '0 13 * * *', tz: 'Asia/Kolkata' }, async () => {
    console.log('Running 1:00 PM lunch reminder...');
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      const allEmployees = await prisma.employee.findMany({ where: { role: { not: 'admin' } } });
      const attendancesToday = await prisma.attendance.findMany({ where: { date: todayDate } });
      
      const attendanceMap = new Set(attendancesToday.filter(a => a.checkIn && !a.checkOut && a.status !== 'Absent').map(a => a.employeeId));
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
        }
      }
    } catch (error) {
      console.error('Error in lunch reminder:', error);
    }
  });

  // Tea Break Reminder (4:30 PM)
  schedule.scheduleJob({ rule: '30 16 * * *', tz: 'Asia/Kolkata' }, async () => {
    console.log('Running 4:30 PM tea break reminder...');
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      const allEmployees = await prisma.employee.findMany({ where: { role: { not: 'admin' } } });
      const attendancesToday = await prisma.attendance.findMany({ where: { date: todayDate } });
      
      const attendanceMap = new Set(attendancesToday.filter(a => a.checkIn && !a.checkOut && a.status !== 'Absent').map(a => a.employeeId));
      for (const emp of allEmployees) {
        if (attendanceMap.has(emp.id)) {
          await prisma.notification.create({
            data: {
              userId: emp.id,
              title: 'Tea Break!',
              message: `Hi ${emp.name}, it's time for a short Tea Break! Grab a cup of tea or coffee and relax for a few minutes! ☕`,
              type: 'attendance'
            }
          });
        }
      }
    } catch (error) {
      console.error('Error in tea break reminder:', error);
    }
  });

  // Evening Punch Out Reminders (8 PM)
  const eveningHours = [20];
  eveningHours.forEach(hour => {
    schedule.scheduleJob({ rule: `0 ${hour} * * *`, tz: 'Asia/Kolkata' }, async () => {
      console.log(`Running ${hour}:00 punch-out reminder...`);
      try {
        const todayDate = new Date().toISOString().split('T')[0];
        const allEmployees = await prisma.employee.findMany({ where: { role: { not: 'admin' } } });
        const attendancesToday = await prisma.attendance.findMany({ where: { date: todayDate } });
        
        const attendanceMap = new Map();
        attendancesToday.forEach(a => attendanceMap.set(a.employeeId, a));

        for (const emp of allEmployees) {
          const attendance = attendanceMap.get(emp.id);
          if (attendance && attendance.checkIn && !attendance.checkOut && attendance.status !== 'Absent') {
            await prisma.notification.create({
              data: {
                userId: emp.id,
                title: 'Punch Out Reminder',
                message: `Hi ${emp.name}, it's ${hour > 12 ? hour - 12 : hour}:00 PM. Please remember to punch out before midnight to avoid being marked absent for today!`,
                type: 'attendance'
              }
            });
          }
        }
      } catch (error) {
        console.error(`Error in punch-out reminder at ${hour}:00:`, error);
      }
    });
  });
}

module.exports = { initCronJobs };
