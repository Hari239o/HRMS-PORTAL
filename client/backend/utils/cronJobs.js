const schedule = require('node-schedule');
const prisma = require('../prisma');

function initCronJobs() {
  // Run every day at midnight (0 0 * * *)
  schedule.scheduleJob('0 0 * * *', async () => {
    console.log('Running midnight attendance check for missing punch-outs...');
    try {
      // Find anyone who checked in on any past date but didn't check out
      // Since it's midnight, any checkIn from "yesterday" or earlier without checkOut is a missing punch-out.
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
}

module.exports = { initCronJobs };
