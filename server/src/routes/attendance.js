const express = require('express');
const { db } = require('../db');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../utils/cloudinary');
const { DateTime } = require('luxon');

const router = express.Router();

const OFFICE_LAT = 17.438989; // Hardcoded to bypass Vercel typos
const OFFICE_LONG = 78.394794; // Hardcoded to bypass Vercel typos
const OFFICE_RADIUS = 30; // Hardcoded to 30m to forcefully forgive GPS drift and bypass Vercel

const hasMultiDeviceAccess = (role) => {
  return role === 'admin' || role === 'manager' || role.endsWith('_manager');
};

// Helper to calculate distance between two coordinates in meters
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

router.post('/checkin', authenticate, upload.single('photo'), async (req, res) => {
  const { latitude, longitude, deviceId } = req.body;
  const employeeId = req.user.id;
  const today = DateTime.now().toISODate();
  const now = DateTime.now();

  try {
    // 0. Enforce Device Locking
    const empDoc = await db.collection('employees').doc(employeeId).get();
    if (empDoc.exists) {
      const emp = empDoc.data();
      const enforceDeviceLock = !hasMultiDeviceAccess(emp.role);
      if (enforceDeviceLock) {
        if (!emp.deviceId && deviceId) {
          // First login/check-in, lock the device
          await db.collection('employees').doc(employeeId).update({ deviceId });
        } else if (emp.deviceId && deviceId && emp.deviceId !== deviceId) {
          return res.status(403).json({ error: 'Device Lock Violation. Contact Admin to unpair previous device.' });
        }
      }
    }

    // 1. Check if already checked in today
    const existing = await db.collection('attendance')
      .where('employeeId', '==', employeeId)
      .where('date', '==', today)
      .get();
    if (!existing.empty) return res.status(400).json({ error: 'Already checked in today' });

    // 2. Validate Location (Mandatory Geofencing)
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Geolocation data required to verify office presence.' });
    }

    const officeLat = OFFICE_LAT;
    const officeLong = OFFICE_LONG;
    const radius = OFFICE_RADIUS;
    const distance = getDistance(parseFloat(latitude), parseFloat(longitude), officeLat, officeLong);

    if (Math.round(distance) > radius) {
      return res.status(400).json({ error: `Geofencing failure: You are out of office range (${Math.round(distance)}m). Required: ${radius}m. Your Exact GPS: ${latitude}, ${longitude}` });
    }

    // 3. Enforce office attendance window
    let officeStartTime = '11:00';
    let officeEndTime = '20:00';
    try {
      const settingsDoc = await db.collection('settings').doc('general').get();
      if (settingsDoc.exists) {
        const settingsData = settingsDoc.data();
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
    const limitTime = shiftStart.plus({ minutes: 5 }); // 11:05 AM limit
    
    if (now > limitTime) {
      // Checked in after 11:05 AM
      status = 'Half Day';
    } else if (maxPossibleHours < 5) {
      status = 'Absent';
    }

    const photoUrl = req.file ? (req.file.path.startsWith('http') ? req.file.path : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`) : null;

    const id = Date.now().toString();
    await db.collection('attendance').doc(id).set({
      id,
      employeeId,
      date: today,
      checkIn: now.toISO(),
      checkInPhoto: photoUrl,
      checkInLocation: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
      status
    });

    try {
      const adminSnap = await db.collection('employees').where('role', '==', 'admin').limit(1).get();
      if (!adminSnap.empty) {
        const adminId = adminSnap.docs[0].id;
        const msgContent = `[Darwin Bot] 🔔 Automated Alert: ${req.user.name} checked in successfully at ${now.toLocaleString({ hour: '2-digit', minute: '2-digit' })} from location: https://maps.google.com/?q=${latitude},${longitude}. Status: ${status}`;
        
        await db.collection('messages').add({
          senderId: 'system_bot',
          receiverId: adminId,
          content: msgContent,
          conversationId: ['system_bot', adminId].sort().join('_'),
          timestamp: new Date().toISOString(),
          senderName: 'Darwin Bot',
          senderRole: 'system'
        });
      }
    } catch (e) {
      console.error('Failed to send admin notification:', e);
    }
    res.status(201).json({ id, employeeId, date: today, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/checkout', authenticate, upload.single('photo'), async (req, res) => {
  const { latitude, longitude } = req.body;
  const employeeId = req.user.id;
  const today = DateTime.now().toISODate();
  const now = DateTime.now();

  try {
    const attendanceQuery = await db.collection('attendance')
      .where('employeeId', '==', employeeId)
      .where('date', '==', today)
      .get();

    if (attendanceQuery.empty) return res.status(400).json({ error: 'No check-in found for today' });
    
    const attendanceDoc = attendanceQuery.docs[0];
    const attendance = attendanceDoc.data();

    if (attendance.checkOut) return res.status(400).json({ error: 'Already checked out today' });

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Geolocation data required to verify office presence.' });
    }

    const officeLat = OFFICE_LAT;
    const officeLong = OFFICE_LONG;
    const radius = OFFICE_RADIUS;
    const distance = getDistance(parseFloat(latitude), parseFloat(longitude), officeLat, officeLong);

    if (Math.round(distance) > radius) {
      return res.status(400).json({ error: `Geofencing failure: You are out of office range for checkout (${Math.round(distance)}m). Required: ${radius}m. Your Exact GPS: ${latitude}, ${longitude}` });
    }

    const officeStartTime = '11:00';
    const officeEndTime = '20:00';
    const [endHour, endMinute] = officeEndTime.split(':').map(Number);
    const shiftEnd = now.set({ hour: endHour, minute: endMinute, second: 0, millisecond: 0 });
    if (now > shiftEnd) {
      return res.status(400).json({ error: `Check-out is only allowed before ${officeEndTime}.` });
    }

    const checkInTime = DateTime.fromISO(attendance.checkIn);
    const durationHours = now.diff(checkInTime, 'hours').hours;

    let finalStatus = attendance.status; // Keep late penalty from check-in if any

    if (finalStatus === 'Present') {
      if (durationHours < 5) {
        finalStatus = 'Absent';
      } else if (durationHours < 8) {
        finalStatus = 'Half Day';
      }
    } else if (finalStatus === 'Half Day') {
       if (durationHours < 5) {
         finalStatus = 'Absent'; // Downgrade to absent if they barely worked
       }
    }

    const photoUrl = req.file ? (req.file.path.startsWith('http') ? req.file.path : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`) : null;

    await db.collection('attendance').doc(attendanceDoc.id).update({
      checkOut: now.toISO(),
      checkOutPhoto: photoUrl,
      checkOutLocation: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
      status: finalStatus
    });

    try {
      const adminSnap = await db.collection('employees').where('role', '==', 'admin').limit(1).get();
      if (!adminSnap.empty) {
        const adminId = adminSnap.docs[0].id;
        const msgContent = `[Darwin Bot] 🔔 Automated Alert: ${req.user.name} checked out successfully at ${now.toLocaleString({ hour: '2-digit', minute: '2-digit' })} from location: https://maps.google.com/?q=${latitude},${longitude}.`;
        
        await db.collection('messages').add({
          senderId: 'system_bot',
          receiverId: adminId,
          content: msgContent,
          conversationId: ['system_bot', adminId].sort().join('_'),
          timestamp: new Date().toISOString(),
          senderName: 'Darwin Bot',
          senderRole: 'system'
        });
      }
    } catch (e) {
      console.error('Failed to send admin notification:', e);
    }

    res.json({ message: 'Checked out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin ONLY: Update attendance status
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
      // It's a virtual record. Create it.
      const parts = id.split('_');
      const employeeId = parts[1];
      const date = parts.slice(2).join('_');
      
      const newId = Date.now().toString();
      await db.collection('attendance').doc(newId).set({
        id: newId,
        employeeId,
        date,
        status,
        checkIn: null,
        checkOut: null,
        checkInLocation: null,
        checkOutLocation: null,
        adminEdited: true
      });
      return res.json({ message: 'Status updated', id: newId, status });
    } else {
      await db.collection('attendance').doc(id).update({ status, adminEdited: true });
      return res.json({ message: 'Status updated', id, status });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  const { role, id } = req.user;
  try {
    let attendance = [];
    if (role !== 'admin') {
      const snap = await db.collection('attendance').where('employeeId', '==', id).get();
      attendance = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    } else {
      const snap = await db.collection('attendance').get();
      attendance = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    }
    
    const empSnap = await db.collection('employees').get();
    const employeesMap = {};
    empSnap.docs.forEach(doc => {
      employeesMap[doc.id] = doc.data();
    });

    attendance.sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));

    const officeLat = OFFICE_LAT;
    const officeLong = OFFICE_LONG;
    const officeEndTime = '20:00';
    const [endHour, endMinute] = officeEndTime.split(':').map(Number);
    const afterOffice = DateTime.now().set({ hour: endHour, minute: endMinute, second: 0, millisecond: 0 });
    const currentTime = DateTime.now();
    const today = currentTime.toISODate();

    if (role === 'admin') {
      const allEmployeesSnap = await db.collection('employees').get();
      const presentTodayIds = new Set(attendance.filter((a) => a.date === today).map((a) => a.employeeId));
      allEmployeesSnap.docs.forEach((doc) => {
        const empId = doc.id;
        if (!presentTodayIds.has(empId) && currentTime > afterOffice) {
          attendance.push({
            id: `absent_${empId}_${today}`,
            employeeId: empId,
            date: today,
            status: 'Absent',
            checkIn: null,
            checkOut: null,
            checkInLocation: null,
            checkOutLocation: null
          });
        }
      });
    } else if (attendance.length === 0 && currentTime > afterOffice) {
      attendance.push({
        id: `absent_${id}_${today}`,
        employeeId: id,
        date: today,
        status: 'Absent',
        checkIn: null,
        checkOut: null,
        checkInLocation: null,
        checkOutLocation: null
      });
    }

    const formatted = attendance.map(a => {
      const checkInLat = a.checkInLocation?.latitude != null ? parseFloat(a.checkInLocation.latitude) : null;
      const checkInLong = a.checkInLocation?.longitude != null ? parseFloat(a.checkInLocation.longitude) : null;
      const checkOutLat = a.checkOutLocation?.latitude != null ? parseFloat(a.checkOutLocation.latitude) : null;
      const checkOutLong = a.checkOutLocation?.longitude != null ? parseFloat(a.checkOutLocation.longitude) : null;

      const checkInDistance = checkInLat != null && checkInLong != null
        ? Math.round(getDistance(checkInLat, checkInLong, officeLat, officeLong))
        : null;
      const checkOutDistance = checkOutLat != null && checkOutLong != null
        ? Math.round(getDistance(checkOutLat, checkOutLong, officeLat, officeLong))
        : null;

      const emp = employeesMap[a.employeeId] || {};

      let effectiveStatus = a.status;
      
      if (!a.checkOut && a.checkIn && !a.adminEdited) {
        const isPastDay = a.date < today;
        const isTodayAfterOffice = a.date === today && currentTime > afterOffice;
        if (isPastDay || isTodayAfterOffice) {
          effectiveStatus = 'Absent';
          // Self-heal the database record in the background to sync reports/analytics
          if (a.status !== 'Absent' && a.id && !a.id.startsWith('absent_')) {
            db.collection('attendance').doc(a.id).update({ status: 'Absent' }).catch(err => {
              console.error(`Failed to auto-update forgotten checkout status for doc ${a.id}:`, err);
            });
          }
        } else {
           // Currently checked in today and haven't checked out yet
           effectiveStatus = a.status;
        }
      }

      return {
        ...a,
        status: effectiveStatus,
        employee: { name: emp.name || 'Unknown', department: emp.department || 'Unknown' },
        checkInLocation: checkInLat != null ? { latitude: checkInLat, longitude: checkInLong } : null,
        checkOutLocation: checkOutLat != null ? { latitude: checkOutLat, longitude: checkOutLong } : null,
        checkInDistance,
        checkOutDistance,
        officeLocation: { latitude: officeLat, longitude: officeLong },
      };
    });
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
