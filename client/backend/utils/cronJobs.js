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
}

module.exports = { initCronJobs };
