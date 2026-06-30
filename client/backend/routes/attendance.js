const express = require('express');
const prisma = require('../../prisma/client');
const { authenticate } = require('../middleware/auth');
const upload = require('../utils/uploadMiddleware');
const { uploadStreamToGCS, generateSignedUrl } = require('../utils/gcs');
const { DateTime } = require('luxon');

const router = express.Router();

const OFFICE_LAT = 17.4392424; // Hardcoded to prevent Vercel env var overrides
const OFFICE_LONG = 78.3948356;
const OFFICE_RADIUS = 15;

const hasMultiDeviceAccess = (role) => {
  return role === 'admin' || role === 'manager' || role.endsWith('_manager');
};

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; 
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

router.post('/checkin', authenticate, upload.single('photo'), async (req, res) => {
  const { latitude, longitude, deviceId } = req.body;
  const employeeId = req.user.id;
  const today = DateTime.now().setZone('Asia/Kolkata').toISODate();
  const now = DateTime.now().setZone('Asia/Kolkata');

  try {
    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (emp) {
      const enforceDeviceLock = !hasMultiDeviceAccess(emp.role);
      if (enforceDeviceLock) {
        if (!emp.deviceId && deviceId) {
          await prisma.employee.update({ where: { id: employeeId }, data: { deviceId } });
        } else if (emp.deviceId && deviceId && emp.deviceId !== deviceId) {
          return res.status(403).json({ error: 'Device Lock Violation. Contact Admin to unpair previous device.' });
        }
      }
    }

    const existing = await prisma.attendance.findFirst({
      where: { employeeId, date: today }
    });
    if (existing) return res.status(400).json({ error: 'Already checked in today' });

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Geolocation data required to verify office presence.' });
    }

    const officeLat = OFFICE_LAT;
    const officeLong = OFFICE_LONG;
    const radius = OFFICE_RADIUS;
    const distance = getDistance(parseFloat(latitude), parseFloat(longitude), officeLat, officeLong);

    if (req.user.role !== 'admin' && Math.round(distance) > radius) {
      return res.status(400).json({ error: `Geofencing failure: You are out of office range (${Math.round(distance)}m). Required: ${radius}m. Your Exact GPS: ${latitude}, ${longitude}` });
    }

    let officeStartTime = '11:00';
    let officeEndTime = '20:00';
    try {
      const settingsDoc = await prisma.setting.findUnique({ where: { key: 'general' } });
      if (settingsDoc) {
        const settingsData = settingsDoc.value;
        if (settingsData.officeStartTime) officeStartTime = settingsData.officeStartTime;
        if (settingsData.officeEndTime) officeEndTime = settingsData.officeEndTime;
      }
    } catch (e) {
      console.error('Failed to fetch settings:', e);
    }

    const [startHour, startMinute] = officeStartTime.split(':').map(Number);
    const [endHour, endMinute] = officeEndTime.split(':').map(Number);
    const shiftStart = now.set({ hour: startHour, minute: startMinute, second: 0, millisecond: 0 });
    const shiftEnd = now.set({ hour: endHour, minute: endMinute, second: 0, millisecond: 0 });
    const allowedStart = shiftStart.minus({ hours: 2 });

    if (now < allowedStart || now > shiftEnd) {
      return res.status(400).json({ error: `Attendance can only be taken between ${officeStartTime} (allowed 2 hrs early) and ${officeEndTime}.` });
    }

    const maxPossibleHours = shiftEnd.diff(now, 'hours').hours;
    let status = 'Present';
    const limitTime = shiftStart.plus({ minutes: 5 });
    
    if (now > limitTime) {
      status = 'Half Day';
    } else if (maxPossibleHours < 5) {
      status = 'Absent';
    }

    let gcsPath = null;
    if (req.file) {
      gcsPath = await uploadStreamToGCS(req.file, 'attendance_photos');
      await prisma.fileMetadata.create({
        data: {
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          gcsPath: gcsPath,
          uploadedBy: employeeId,
          entityType: 'Attendance',
          entityId: employeeId
        }
      });
    }

    const newAttendance = await prisma.attendance.create({
      data: {
        employeeId,
        date: today,
        checkIn: now.toJSDate(),
        checkInPhoto: gcsPath,
        checkInLatitude: parseFloat(latitude),
        checkInLongitude: parseFloat(longitude),
        status
      }
    });

    try {
      const admin = await prisma.employee.findFirst({ where: { role: 'admin' } });
      if (admin) {
        const adminId = admin.id;
        const msgContent = `[Darwin Bot] 🔔 Automated Alert: ${req.user.name} checked in successfully at ${now.toLocaleString({ hour: '2-digit', minute: '2-digit' })} from location: https://maps.google.com/?q=${latitude},${longitude}. Status: ${status}`;
        
        await prisma.message.create({
          data: {
            senderId: 'system_bot',
            receiverId: adminId,
            content: msgContent,
            isRead: false
          }
        });
      }
    } catch (e) {
      console.error('Failed to send admin notification:', e);
    }
    res.status(201).json({ id: newAttendance.id, employeeId, date: today, status });
  } catch (error) {
    console.error('Checkin Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/checkout', authenticate, upload.single('photo'), async (req, res) => {
  const { latitude, longitude } = req.body;
  const employeeId = req.user.id;
  const today = DateTime.now().setZone('Asia/Kolkata').toISODate();
  const now = DateTime.now().setZone('Asia/Kolkata');

  try {
    const attendance = await prisma.attendance.findFirst({
      where: { employeeId, date: today }
    });

    if (!attendance) return res.status(400).json({ error: 'No check-in found for today' });
    if (attendance.checkOut) return res.status(400).json({ error: 'Already checked out today' });
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Geolocation data required to verify office presence.' });
    }

    const officeLat = OFFICE_LAT;
    const officeLong = OFFICE_LONG;
    const radius = OFFICE_RADIUS;
    const distance = getDistance(parseFloat(latitude), parseFloat(longitude), officeLat, officeLong);

    if (req.user.role !== 'admin' && Math.round(distance) > radius) {
      return res.status(400).json({ error: `Geofencing failure: You are out of office range for checkout (${Math.round(distance)}m). Required: ${radius}m. Your Exact GPS: ${latitude}, ${longitude}` });
    }

    const officeStartTime = '11:00';
    const officeEndTime = '20:00';
    const [endHour, endMinute] = officeEndTime.split(':').map(Number);
    const shiftEnd = now.set({ hour: endHour, minute: endMinute, second: 0, millisecond: 0 });
    if (now > shiftEnd) {
      return res.status(400).json({ error: `Check-out is only allowed before ${officeEndTime}.` });
    }

    const checkInTime = DateTime.fromJSDate(attendance.checkIn).setZone('Asia/Kolkata');
    const durationHours = now.diff(checkInTime, 'hours').hours;

    let finalStatus = attendance.status; 

    if (finalStatus === 'Present') {
      if (durationHours < 5) {
        finalStatus = 'Absent';
      } else if (durationHours < 8) {
        finalStatus = 'Half Day';
      }
    } else if (finalStatus === 'Half Day') {
       if (durationHours < 5) {
         finalStatus = 'Absent'; 
       }
    }

    let gcsPath = null;
    if (req.file) {
      gcsPath = await uploadStreamToGCS(req.file, 'attendance_photos');
      await prisma.fileMetadata.create({
        data: {
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          gcsPath: gcsPath,
          uploadedBy: employeeId,
          entityType: 'Attendance',
          entityId: attendance.id
        }
      });
    }

    await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: now.toJSDate(),
        checkOutPhoto: gcsPath,
        checkOutLatitude: parseFloat(latitude),
        checkOutLongitude: parseFloat(longitude),
        status: finalStatus
      }
    });

    try {
      const admin = await prisma.employee.findFirst({ where: { role: 'admin' } });
      if (admin) {
        const adminId = admin.id;
        const msgContent = `[Darwin Bot] 🔔 Automated Alert: ${req.user.name} checked out successfully at ${now.toLocaleString({ hour: '2-digit', minute: '2-digit' })} from location: https://maps.google.com/?q=${latitude},${longitude}.`;
        
        await prisma.message.create({
          data: {
            senderId: 'system_bot',
            receiverId: adminId,
            content: msgContent,
            isRead: false
          }
        });
      }
    } catch (e) {
      console.error('Failed to send admin notification:', e);
    }

    res.json({ message: 'Checked out successfully' });
  } catch (error) {
    console.error('Checkout Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/status', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can modify attendance' });
  }
  
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['Present', 'Absent', 'Half Day'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  try {
    if (id.startsWith('absent_')) {
      const parts = id.split('_');
      const employeeId = parts[1];
      const date = parts.slice(2).join('_');
      
      const newAttendance = await prisma.attendance.create({
        data: {
          employeeId,
          date,
          status,
          checkIn: new Date(),
          adminEdited: true
        }
      });
      return res.json({ message: 'Status updated', id: newAttendance.id, status });
    } else {
      await prisma.attendance.update({
        where: { id },
        data: { status, adminEdited: true }
      });
      return res.json({ message: 'Status updated', id, status });
    }
  } catch (err) {
    console.error('Update Status Error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  const { role, id } = req.user;
  try {
    let attendance = [];
    if (role !== 'admin') {
      attendance = await prisma.attendance.findMany({
        where: { employeeId: id },
        include: { employee: { select: { id: true, name: true, email: true, department: true } } },
        orderBy: { checkIn: 'desc' },
        take: 60 // Limit to last 60 records to prevent massive payload lag
      });
    } else {
      attendance = await prisma.attendance.findMany({
        orderBy: { checkIn: 'desc' },
        take: 100, // Reduced from 300 to improve initial load speed
        include: { employee: { select: { id: true, name: true, email: true, department: true } } }
      });
    }
    
    const officeLat = OFFICE_LAT;
    const officeLong = OFFICE_LONG;
    const officeEndTime = '20:00';
    const [endHour, endMinute] = officeEndTime.split(':').map(Number);
    const afterOffice = DateTime.now().setZone('Asia/Kolkata').set({ hour: endHour, minute: endMinute, second: 0, millisecond: 0 });
    const currentTime = DateTime.now().setZone('Asia/Kolkata');
    const today = currentTime.toISODate();

    if (role === 'admin') {
      const allEmployees = await prisma.employee.findMany();
      const presentTodayIds = new Set(attendance.filter((a) => a.date === today).map((a) => a.employeeId));
      allEmployees.forEach((emp) => {
        if (!presentTodayIds.has(emp.id) && currentTime > afterOffice) {
          attendance.push({
            id: `absent_${emp.id}_${today}`,
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
        id: `absent_${id}_${today}`,
        employeeId: id,
        date: today,
        status: 'Absent',
        checkIn: null,
        checkOut: null,
        employee: emp
      });
    }

    const formatted = await Promise.all(attendance.map(async a => {
      const checkInLat = a.checkInLatitude != null ? parseFloat(a.checkInLatitude) : null;
      const checkInLong = a.checkInLongitude != null ? parseFloat(a.checkInLongitude) : null;
      const checkOutLat = a.checkOutLatitude != null ? parseFloat(a.checkOutLatitude) : null;
      const checkOutLong = a.checkOutLongitude != null ? parseFloat(a.checkOutLongitude) : null;

      const checkInDistance = checkInLat != null && checkInLong != null
        ? Math.round(getDistance(checkInLat, checkInLong, officeLat, officeLong))
        : null;
      const checkOutDistance = checkOutLat != null && checkOutLong != null
        ? Math.round(getDistance(checkOutLat, checkOutLong, officeLat, officeLong))
        : null;

      let effectiveStatus = a.status;
      
      if (!a.checkOut && a.checkIn && !a.adminEdited) {
        const isPastDay = a.date < today;
        const isTodayAfterOffice = a.date === today && currentTime > afterOffice;
        if (isPastDay || isTodayAfterOffice) {
          effectiveStatus = 'Absent';
          if (a.status !== 'Absent' && a.id && !a.id.toString().startsWith('absent_')) {
            prisma.attendance.update({
              where: { id: a.id },
              data: { status: 'Absent' }
            }).catch(err => {
              console.error(`Failed to auto-update forgotten checkout status for doc ${a.id}:`, err);
            });
          }
        } else {
           effectiveStatus = a.status;
        }
      }

      return {
        ...a,
        status: effectiveStatus,
        checkInPhoto: a.checkInPhoto || null,
        checkOutPhoto: a.checkOutPhoto || null,
        employee: { name: a.employee?.name || 'Unknown', department: a.employee?.department || 'Unknown' },
        checkInLocation: checkInLat != null ? { latitude: checkInLat, longitude: checkInLong } : null,
        checkOutLocation: checkOutLat != null ? { latitude: checkOutLat, longitude: checkOutLong } : null,
        checkInDistance,
        checkOutDistance,
        officeLocation: { latitude: officeLat, longitude: officeLong },
      };
    }));
    res.json(formatted);
  } catch (error) {
    console.error('Get Attendance Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
