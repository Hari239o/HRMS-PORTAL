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

    // 11:00 AM Reminder (Punch In)
    if (currentHour === 11) {
      for (const emp of allEmployees) {
        if (!attendanceMap.has(emp.id)) {
          // Hasn't punched in yet
          await prisma.notification.create({
            data: {
              userId: emp.id,
              title: 'Attendance Reminder',
              message: `Hi ${emp.name}, you haven't punched in yet! Please check in before 11:05 AM to avoid a Half Day mark.`,
              type: 'attendance'
            }
          });
          notificationsSent++;
        }
      }
    } 
    // 8:00 PM Reminder (Punch Out)
    else if (currentHour === 20) {
      for (const emp of allEmployees) {
        const attendance = attendanceMap.get(emp.id);
        if (attendance && attendance.checkIn && !attendance.checkOut && attendance.status !== 'Absent') {
          // Has punched in but hasn't punched out yet
          await prisma.notification.create({
            data: {
              userId: emp.id,
              title: 'Punch Out Reminder',
              message: `Hi ${emp.name}, it's ${currentHour}:00. Please remember to punch out before midnight to avoid being marked absent for today!`,
              type: 'attendance'
            }
          });
          notificationsSent++;
        }
      }
    }

    res.json({ success: true, message: `Processed cron reminders. Notifications sent: ${notificationsSent}` });
  } catch (error) {
    console.error('Cron reminder error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
