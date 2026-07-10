const express = require('express');
const prisma = require('../../prisma/client');
const { DateTime } = require('luxon');

const router = express.Router();

router.get('/reminders', async (req, res) => {
  try {
    // Basic security to prevent random public hits if needed
    // Optional: check process.env.CRON_SECRET if you set one in Vercel
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const now = DateTime.now().setZone('Asia/Kolkata');
    const today = now.toISODate();
    const currentHour = now.hour;

    const allEmployees = await prisma.employee.findMany({
      where: {
        role: {
          not: 'admin' // don't send to admin
        }
      }
    });

    const attendancesToday = await prisma.attendance.findMany({
      where: { date: today }
    });

    const attendanceMap = new Map();
    attendancesToday.forEach(a => {
      attendanceMap.set(a.employeeId, a);
    });

    let notificationsSent = 0;

    // 9:00 AM - Good Morning (Sent to all)
    if (currentHour === 9) {
      for (const emp of allEmployees) {
        await prisma.notification.create({
          data: {
            userId: emp.id,
            title: 'Good Morning! 🌅',
            message: `Hi ${emp.name}, rise and shine! Wishing you an amazing and highly productive day ahead! ✨`,
            type: 'attendance'
          }
        });
        notificationsSent++;
      }
    }
    // 11:00 AM - Missing Punch In
    else if (currentHour === 11) {
      for (const emp of allEmployees) {
        if (!attendanceMap.has(emp.id)) {
          await prisma.notification.create({
            data: {
              userId: emp.id,
              title: 'We are waiting for you! 🏢',
              message: `Hi ${emp.name}, the office is waiting for you! Please punch in before 11:05 AM to avoid a half-day mark. ⏰`,
              type: 'attendance'
            }
          });
          notificationsSent++;
        }
      }
    }
    // 1:00 PM - Lunch Reminder
    else if (currentHour === 13) {
      for (const emp of allEmployees) {
        const attendance = attendanceMap.get(emp.id);
        if (attendance && attendance.checkIn && !attendance.checkOut && attendance.status !== 'Absent') {
          await prisma.notification.create({
            data: {
              userId: emp.id,
              title: 'Lunch Time! 🍱',
              message: `Hey ${emp.name}, you must be tired! Grab your lunch from 1:30 PM to 2:30 PM and come back with full energy for today's tasks! ⚡`,
              type: 'attendance'
            }
          });
          notificationsSent++;
        }
      }
    } 
    // 3:30 PM - Keep Going Target
    else if (currentHour === 15) {
      for (const emp of allEmployees) {
        const attendance = attendanceMap.get(emp.id);
        if (attendance && attendance.checkIn && !attendance.checkOut && attendance.status !== 'Absent') {
          await prisma.notification.create({
            data: {
              userId: emp.id,
              title: 'Keep Going! 🚀',
              message: `Hi ${emp.name}, you are doing great! Keep pushing towards your daily targets. You've got this! 💪`,
              type: 'attendance'
            }
          });
          notificationsSent++;
        }
      }
    }
    // 4:00 PM - Tea Break Reminder
    else if (currentHour === 16) {
      for (const emp of allEmployees) {
        const attendance = attendanceMap.get(emp.id);
        if (attendance && attendance.checkIn && !attendance.checkOut && attendance.status !== 'Absent') {
          await prisma.notification.create({
            data: {
              userId: emp.id,
              title: 'Tea Break! ☕',
              message: `Hi ${emp.name}, time for a short break! Grab a cup of tea or coffee and relax your mind for a few minutes! 🌿`,
              type: 'attendance'
            }
          });
          notificationsSent++;
        }
      }
    }
    // 6:55 PM - One more hour to go
    else if (currentHour === 18) {
      for (const emp of allEmployees) {
        const attendance = attendanceMap.get(emp.id);
        if (attendance && attendance.checkIn && !attendance.checkOut && attendance.status !== 'Absent') {
          await prisma.notification.create({
            data: {
              userId: emp.id,
              title: 'One more hour to go! ⏰',
              message: `Hi ${emp.name}, almost done! Just one more hour to go. Finish up your tasks and get ready to head home! 💪`,
              type: 'attendance'
            }
          });
          notificationsSent++;
        }
      }
    }
    // 8:00 PM - Evening Punch Out (How was your day)
    else if (currentHour === 20) {
      for (const emp of allEmployees) {
        const attendance = attendanceMap.get(emp.id);
        if (attendance && attendance.checkIn && !attendance.checkOut && attendance.status !== 'Absent') {
          await prisma.notification.create({
            data: {
              userId: emp.id,
              title: 'Time to Wrap Up! 🌇',
              message: `Hi ${emp.name}, how was your day? You did an amazing job today. Please remember to punch out before you leave! 👏`,
              type: 'attendance'
            }
          });
          notificationsSent++;
        }
      }
    }
    // 10:00 PM - Good Night
    else if (currentHour === 22) {
      for (const emp of allEmployees) {
        await prisma.notification.create({
          data: {
            userId: emp.id,
            title: 'Good Night! 🌙',
            message: `Hi ${emp.name}, it's time to rest and recharge. Have a peaceful night and sweet dreams! See you tomorrow! 💫`,
            type: 'attendance'
          }
        });
        notificationsSent++;
      }
    }

    res.json({ success: true, message: `Processed cron reminders. Notifications sent: ${notificationsSent}` });
  } catch (error) {
    console.error('Cron reminder error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
