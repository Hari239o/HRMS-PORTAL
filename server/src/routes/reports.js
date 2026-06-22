const express = require('express');
const { db } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const { DateTime } = require('luxon');

const router = express.Router();
const PDFDocument = require('pdfkit');

router.get('/dashboard-stats', authenticate, authorize(['admin']), async (req, res) => {
  const today = DateTime.now().toISODate();
  try {
    const empSnap = await db.collection('employees').get();
    
    // Filter out the main admin from being counted in workforce stats
    const workforce = empSnap.docs.filter(doc => doc.data().role !== 'admin');
    const totalEmployees = workforce.length;

    const attendanceSnap = await db.collection('attendance').where('date', '==', today).get();
    
    let presentToday = 0;
    let halfDaysToday = 0;
    const attendedEmpIds = new Set();
    
    attendanceSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.status === 'Present') {
        presentToday++;
        attendedEmpIds.add(data.employeeId);
      } else if (data.status === 'Half Day' || data.status === 'Late') {
        halfDaysToday++;
        attendedEmpIds.add(data.employeeId);
      }
      // If status === 'Absent', we purposefully DO NOT add them to attendedEmpIds 
      // so they correctly get counted in the absentToday loop below.
    });

    let absentToday = 0;
    workforce.forEach(doc => {
      if (!attendedEmpIds.has(doc.id)) {
        absentToday++;
      }
    });

    const leavesSnap = await db.collection('leaves').where('status', '==', 'Approved').get();
    let leavesToday = 0;
    leavesSnap.docs.forEach(doc => {
      const leave = doc.data();
      const fromDate = DateTime.fromISO(leave.fromDate).toISODate();
      const toDate = DateTime.fromISO(leave.toDate).toISODate();
      if (today >= fromDate && today <= toDate) {
        leavesToday++;
      }
    });

    res.json({
      totalEmployees,
      presentToday,
      halfDaysToday,
      absentToday,
      leavesToday
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/analytics/monthly', authenticate, authorize(['admin']), async (req, res) => {
  const { month, year } = req.query;
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = DateTime.fromISO(startDate).plus({ months: 1 }).minus({ days: 1 }).toISODate();

  try {
    const attendanceSnap = await db.collection('attendance')
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .get();

    const stats = { Present: 0, 'Half Day': 0, Absent: 0 };
    attendanceSnap.docs.forEach(doc => {
      const status = doc.data().status;
      if (stats[status] !== undefined) {
        stats[status]++;
      }
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/monthly', authenticate, authorize(['admin']), async (req, res) => {
    const { month, year, department } = req.query;
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = DateTime.fromISO(startDate).plus({ months: 1 }).minus({ days: 1 }).toISODate();

  try {
    const empSnap = await db.collection('employees').get();
    let employees = empSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(emp => emp.role !== 'admin');
      
    if (department && department !== 'All') {
      employees = employees.filter(emp => emp.department === department);
    }

    const attSnap = await db.collection('attendance')
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .get();
    const allAttendance = attSnap.docs.map(d => d.data());

    const leaveSnap = await db.collection('leaves').where('status', '==', 'Approved').get();
    const allLeaves = leaveSnap.docs.map(d => d.data());

    const report = employees.map(emp => {
      const attendance = allAttendance.filter(a => a.employeeId === emp.id);
      
      const leaves = allLeaves.filter(l => {
        if (l.employeeId !== emp.id) return false;
        const fromDate = DateTime.fromISO(l.fromDate).toISODate();
        const toDate = DateTime.fromISO(l.toDate).toISODate();
        return (fromDate >= startDate && fromDate <= endDate) || (toDate >= startDate && toDate <= endDate);
      });

      return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        department: emp.department,
        attendance,
        leaves
      };
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/export', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const empSnap = await db.collection('employees').get();
    const employees = empSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(emp => emp.role !== 'admin');
    
    const attSnap = await db.collection('attendance').get();
    const allAttendance = attSnap.docs.map(d => d.data());

    const leaveSnap = await db.collection('leaves').where('status', '==', 'Approved').get();
    const allLeaves = leaveSnap.docs.map(d => d.data());

    const today = DateTime.now().toISODate();
    
    let csv = 'Employee Name,Email,Department,Present Days,Half Days,Leaves Approved\n';
    
    for (const emp of employees) {
      let presentCount = 0;
      let halfDayCount = 0;
      allAttendance.forEach(a => {
        if (a.employeeId === emp.id) {
          if (a.status === 'Present') presentCount++;
          if (a.status === 'Half Day') halfDayCount++;
        }
      });

      let leaveCount = 0;
      allLeaves.forEach(l => {
        if (l.employeeId === emp.id) leaveCount++;
      });

      csv += `"${emp.name}",${emp.email},"${emp.department}",${presentCount},${halfDayCount},${leaveCount}\n`;
    }

    res.setHeader('Content-Disposition', `attachment; filename="geonixa_master_log_${today}.csv"`);
    res.type('text/csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function parseDateRange(req) {
  const { startDate, endDate, period } = req.query;
  const now = DateTime.now();
  if (startDate && endDate) return { start: DateTime.fromISO(startDate).toISODate(), end: DateTime.fromISO(endDate).toISODate() };
  if (period === 'daily') {
    const d = now.toISODate();
    return { start: d, end: d };
  }
  if (period === 'weekly') {
    const end = now.toISODate();
    const start = now.minus({ days: 6 }).toISODate();
    return { start, end };
  }
  if (period === 'monthly') {
    const start = now.startOf('month').toISODate();
    const end = now.endOf('month').toISODate();
    return { start, end };
  }
  // default last 30 days
  return { start: now.minus({ days: 29 }).toISODate(), end: now.toISODate() };
}

async function sendCSV(res, filename, headers, rows) {
  let csv = headers.join(',') + '\n';
  rows.forEach(r => {
    const line = headers.map(h => {
      const v = r[h] === undefined || r[h] === null ? '' : String(r[h]).replace(/"/g, '""');
      return `"${v}"`;
    }).join(',');
    csv += line + '\n';
  });
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  if (filename.toLowerCase().endsWith('.xls')) {
    res.type('application/vnd.ms-excel');
  } else {
    res.type('text/csv');
  }
  res.send(csv);
}

async function sendCSVStream(res, filename, headers, baseQueryFactory, mapDoc, batchSize = 500) {
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  if (filename.toLowerCase().endsWith('.xls')) {
    res.type('application/vnd.ms-excel');
  } else {
    res.type('text/csv');
  }
  res.write(headers.join(',') + '\n');

  let lastDoc = null;
  while (true) {
    let q = baseQueryFactory().limit(batchSize);
    if (lastDoc) q = q.startAfter(lastDoc);
    const snap = await q.get();
    if (!snap.size) break;
    for (const d of snap.docs) {
      const rowObj = mapDoc(d);
      const line = headers.map(h => {
        const v = rowObj[h] === undefined || rowObj[h] === null ? '' : String(rowObj[h]).replace(/"/g, '""');
        return `"${v}"`;
      }).join(',');
      if (!res.write(line + '\n')) {
        await new Promise(r => res.once('drain', r));
      }
    }
    lastDoc = snap.docs[snap.docs.length - 1];
    if (snap.size < batchSize) break;
  }
  res.end();
}

async function sendPDF(res, title, headers, rows) {
  const doc = new PDFDocument({ size: 'A4', margin: 30 });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  doc.on('end', () => {
    const result = Buffer.concat(chunks);
    res.setHeader('Content-Disposition', `attachment; filename="${title}.pdf"`);
    res.type('application/pdf');
    res.send(result);
  });
  doc.fontSize(16).text(title, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10);
  const tableTop = doc.y;
  const colWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right) / Math.max(1, headers.length);
  // header
  headers.forEach((h, i) => {
    doc.text(h, doc.page.margins.left + i * colWidth, tableTop, { width: colWidth, continued: i !== headers.length - 1 });
  });
  doc.moveDown(0.5);
  rows.forEach(r => {
    headers.forEach((h, i) => {
      const text = r[h] === undefined || r[h] === null ? '' : String(r[h]);
      doc.text(text, doc.page.margins.left + i * colWidth, doc.y, { width: colWidth, continued: i !== headers.length - 1 });
    });
    doc.moveDown(0.2);
  });
  doc.end();
}

// Generic lead report
router.get('/leads', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { start, end } = parseDateRange(req);
    const format = req.query.format || 'json';
    const limit = Math.min(Number(req.query.limit) || 100, 1000);
    const startAfterId = req.query.startAfterId;
    const fieldsParam = req.query.fields; // comma separated field keys
    const fields = fieldsParam ? fieldsParam.split(',').map(f => f.trim()).filter(Boolean) : ['id','fullName','mobile','email','status','assignedTo','createdAt'];

    let query = db.collection('leads')
      .where('createdAt', '>=', start)
      .where('createdAt', '<=', end + 'T23:59:59.999Z')
      .orderBy('createdAt', 'desc')
      .limit(limit + 1);

    if (startAfterId) {
      const startDoc = await db.collection('leads').doc(startAfterId).get();
      if (startDoc.exists) query = query.startAfter(startDoc);
    }

    const snap = await query.get();
    const docs = snap.docs;
    const hasMore = docs.length > limit;
    const pageDocs = docs.slice(0, limit);

    const rows = pageDocs.map(d => {
      const data = d.data();
      const base = { id: d.id, fullName: data.fullName || data.name || '', mobile: data.mobileNumber || data.mobile || '', email: data.email || '', status: data.leadStatus || data.status || '', assignedTo: data.assignedTo || '' , createdAt: data.createdAt || '' };
      const out = {};
      fields.forEach(f => out[f] = base[f] !== undefined ? base[f] : data[f]);
      return out;
    });

    const lastId = pageDocs.length ? pageDocs[pageDocs.length-1].id : null;

    if (format === 'csv' || format === 'excel') {
      const fname = `leads_${start}_${end}.csv`;
      if (req.query.stream === 'true' || req.query.stream === '1') {
        const baseQueryFactory = () => db.collection('leads')
          .where('createdAt', '>=', start)
          .where('createdAt', '<=', end + 'T23:59:59.999Z')
          .orderBy('createdAt', 'desc');
        const mapDoc = (d) => {
          const data = d.data();
          const base = { id: d.id, fullName: data.fullName || data.name || '', mobile: data.mobileNumber || data.mobile || '', email: data.email || '', status: data.leadStatus || data.status || '', assignedTo: data.assignedTo || '' , createdAt: data.createdAt || '' };
          const out = {};
          fields.forEach(f => out[f] = base[f] !== undefined ? base[f] : data[f]);
          return out;
        };
        return sendCSVStream(res, fname, fields, baseQueryFactory, mapDoc);
      }
      return sendCSV(res, fname, fields, rows);
    }
    if (format === 'pdf') return sendPDF(res, `Lead Report ${start} to ${end}`, fields, rows);
    res.json({ rows, hasMore, nextPageToken: hasMore ? lastId : null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Call report
router.get('/calls', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { start, end } = parseDateRange(req);
    const format = req.query.format || 'json';
    const limit = Math.min(Number(req.query.limit) || 100, 1000);
    const startAfterId = req.query.startAfterId;
    const fieldsParam = req.query.fields;
    const fields = fieldsParam ? fieldsParam.split(',').map(f=>f.trim()).filter(Boolean) : ['id','leadId','employeeId','status','notes','createdAt'];

    let query = db.collection('call_logs')
      .where('createdAt', '>=', start)
      .where('createdAt', '<=', end + 'T23:59:59.999Z')
      .orderBy('createdAt', 'desc')
      .limit(limit + 1);
    if (startAfterId) {
      const startDoc = await db.collection('call_logs').doc(startAfterId).get();
      if (startDoc.exists) query = query.startAfter(startDoc);
    }
    const snap = await query.get();
    const docs = snap.docs;
    const hasMore = docs.length > limit;
    const pageDocs = docs.slice(0, limit);
    const rows = pageDocs.map(d => {
      const data = d.data();
      const base = { id: data.id || '', leadId: data.leadId || '', employeeId: data.employeeId || '', status: data.callStatus || '', notes: data.notes || '', createdAt: data.createdAt || '' };
      const out = {};
      fields.forEach(f => out[f] = base[f] !== undefined ? base[f] : data[f]);
      return out;
    });
    const lastId = pageDocs.length ? pageDocs[pageDocs.length-1].id : null;
    if (format === 'csv' || format === 'excel') {
      const fname = `calls_${start}_${end}.csv`;
      if (req.query.stream === 'true' || req.query.stream === '1') {
        const baseQueryFactory = () => db.collection('call_logs')
          .where('createdAt', '>=', start)
          .where('createdAt', '<=', end + 'T23:59:59.999Z')
          .orderBy('createdAt', 'desc');
        const mapDoc = (d) => {
          const data = d.data();
          const base = { id: data.id || '', leadId: data.leadId || '', employeeId: data.employeeId || '', status: data.callStatus || '', notes: data.notes || '', createdAt: data.createdAt || '' };
          const out = {};
          fields.forEach(f => out[f] = base[f] !== undefined ? base[f] : data[f]);
          return out;
        };
        return sendCSVStream(res, fname, fields, baseQueryFactory, mapDoc);
      }
      return sendCSV(res, `calls_${start}_${end}.csv`, fields, rows);
    }
    if (format === 'pdf') return sendPDF(res, `Call Report ${start} to ${end}`, fields, rows);
    res.json({ rows, hasMore, nextPageToken: hasMore ? lastId : null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Follow-up report
router.get('/followups', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { start, end } = parseDateRange(req);
    const format = req.query.format || 'json';
    const limit = Math.min(Number(req.query.limit) || 100, 1000);
    const startAfterId = req.query.startAfterId;
    const fieldsParam = req.query.fields;
    const fields = fieldsParam ? fieldsParam.split(',').map(f=>f.trim()).filter(Boolean) : ['id','leadId','assigned','date','time','status','createdAt'];

    let query = db.collection('followups')
      .where('createdAt', '>=', start)
      .where('createdAt', '<=', end + 'T23:59:59.999Z')
      .orderBy('createdAt', 'desc')
      .limit(limit + 1);
    if (startAfterId) {
      const startDoc = await db.collection('followups').doc(startAfterId).get();
      if (startDoc.exists) query = query.startAfter(startDoc);
    }
    const snap = await query.get();
    const docs = snap.docs;
    const hasMore = docs.length > limit;
    const pageDocs = docs.slice(0, limit);
    const rows = pageDocs.map(d => {
      const data = d.data();
      const base = { id: data.id || '', leadId: data.leadId || '', assigned: data.assignedEmployeeName || data.assignedEmployeeId || '', date: data.followupDate || '', time: data.followupTime || '', status: data.status || '', createdAt: data.createdAt || '' };
      const out = {};
      fields.forEach(f => out[f] = base[f] !== undefined ? base[f] : data[f]);
      return out;
    });
    const lastId = pageDocs.length ? pageDocs[pageDocs.length-1].id : null;
    if (format === 'csv' || format === 'excel') {
      const fname = `followups_${start}_${end}.csv`;
      if (req.query.stream === 'true' || req.query.stream === '1') {
        const baseQueryFactory = () => db.collection('followups')
          .where('createdAt', '>=', start)
          .where('createdAt', '<=', end + 'T23:59:59.999Z')
          .orderBy('createdAt', 'desc');
        const mapDoc = (d) => {
          const data = d.data();
          const base = { id: data.id || '', leadId: data.leadId || '', assigned: data.assignedEmployeeName || data.assignedEmployeeId || '', date: data.followupDate || '', time: data.followupTime || '', status: data.status || '', createdAt: data.createdAt || '' };
          const out = {};
          fields.forEach(f => out[f] = base[f] !== undefined ? base[f] : data[f]);
          return out;
        };
        return sendCSVStream(res, fname, fields, baseQueryFactory, mapDoc);
      }
      return sendCSV(res, `followups_${start}_${end}.csv`, fields, rows);
    }
    if (format === 'pdf') return sendPDF(res, `Follow-ups ${start} to ${end}`, fields, rows);
    res.json({ rows, hasMore, nextPageToken: hasMore ? lastId : null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Employee report: employees with counts of leads, calls, followups, revenue
router.get('/employees-report', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { start, end } = parseDateRange(req);
    const format = req.query.format || 'json';
    const limit = Math.min(Number(req.query.limit) || 100, 1000);
    const startAfterId = req.query.startAfterId;
    const fieldsParam = req.query.fields;
    const fields = fieldsParam ? fieldsParam.split(',').map(f=>f.trim()).filter(Boolean) : ['id','name','email','department','leads','calls','followups','revenue'];

    let empQuery = db.collection('employees').orderBy('name').limit(limit + 1);
    if (startAfterId) {
      const startDoc = await db.collection('employees').doc(startAfterId).get();
      if (startDoc.exists) empQuery = empQuery.startAfter(startDoc);
    }
    const empSnap = await empQuery.get();
    const docs = empSnap.docs;
    const hasMore = docs.length > limit;
    const pageDocs = docs.slice(0, limit);

    const rows = [];
    for (const d of pageDocs) {
      const emp = { id: d.id, ...d.data() };
      const leadsSnap = await db.collection('leads').where('assignedTo', '==', emp.id).where('createdAt', '>=', start).where('createdAt', '<=', end + 'T23:59:59.999Z').get();
      const callsSnap = await db.collection('call_logs').where('employeeId', '==', emp.id).where('createdAt', '>=', start).where('createdAt', '<=', end + 'T23:59:59.999Z').get();
      const followupsSnap = await db.collection('followups').where('assignedEmployeeId', '==', emp.id).where('createdAt', '>=', start).where('createdAt', '<=', end + 'T23:59:59.999Z').get();
      const paymentsSnap = await db.collection('payments').where('createdBy', '==', emp.id).where('status', '==', 'paid').where('createdAt', '>=', start).where('createdAt', '<=', end + 'T23:59:59.999Z').get();
      let revenue = 0;
      paymentsSnap.docs.forEach(p => revenue += Number(p.data().approvedAmount || p.data().amount || 0));

      const base = { id: emp.id, name: emp.name || '', email: emp.email || '', department: emp.department || '', leads: leadsSnap.size, calls: callsSnap.size, followups: followupsSnap.size, revenue };
      const out = {};
      fields.forEach(f => out[f] = base[f] !== undefined ? base[f] : emp[f]);
      rows.push(out);
    }
    const lastId = pageDocs.length ? pageDocs[pageDocs.length-1].id : null;
    if (format === 'csv' || format === 'excel') return sendCSV(res, `employees_${start}_${end}.csv`, fields, rows);
    if (format === 'pdf') return sendPDF(res, `Employee Report ${start} to ${end}`, fields, rows);
    res.json({ rows, hasMore, nextPageToken: hasMore ? lastId : null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Revenue report
router.get('/revenue', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { start, end } = parseDateRange(req);
    const format = req.query.format || 'json';
    const limit = Math.min(Number(req.query.limit) || 100, 1000);
    const startAfterId = req.query.startAfterId;
    const fieldsParam = req.query.fields;
    const fields = fieldsParam ? fieldsParam.split(',').map(f=>f.trim()).filter(Boolean) : ['id','paymentId','createdBy','amount','createdAt'];

    let query = db.collection('payments').where('status', '==', 'paid').where('createdAt', '>=', start).where('createdAt', '<=', end + 'T23:59:59.999Z').orderBy('createdAt','desc').limit(limit+1);
    if (startAfterId) {
      const startDoc = await db.collection('payments').doc(startAfterId).get();
      if (startDoc.exists) query = query.startAfter(startDoc);
    }
    const snap = await query.get();
    const docs = snap.docs;
    const hasMore = docs.length > limit;
    const pageDocs = docs.slice(0, limit);
    const rows = pageDocs.map(d => ({ id: d.id, amount: d.data().approvedAmount || d.data().amount || 0, paymentId: d.data().paymentId || '', createdAt: d.data().createdAt || '', createdBy: d.data().createdBy || '' }));
    const lastId = pageDocs.length ? pageDocs[pageDocs.length-1].id : null;
    if (format === 'csv' || format === 'excel') {
      const fname = `revenue_${start}_${end}.csv`;
      if (req.query.stream === 'true' || req.query.stream === '1') {
        const baseQueryFactory = () => db.collection('payments')
          .where('status', '==', 'paid')
          .where('createdAt', '>=', start)
          .where('createdAt', '<=', end + 'T23:59:59.999Z')
          .orderBy('createdAt','desc');
        const mapDoc = (d) => ({ id: d.id, amount: d.data().approvedAmount || d.data().amount || 0, paymentId: d.data().paymentId || '', createdAt: d.data().createdAt || '', createdBy: d.data().createdBy || '' });
        return sendCSVStream(res, fname, fields, baseQueryFactory, mapDoc);
      }
      return sendCSV(res, `revenue_${start}_${end}.csv`, fields, rows);
    }
    if (format === 'pdf') return sendPDF(res, `Revenue Report ${start} to ${end}`, fields, rows);
    res.json({ rows, total: rows.reduce((s,r)=>s+Number(r.amount||0),0), hasMore, nextPageToken: hasMore ? lastId : null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/payments', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { start, end } = parseDateRange(req);
    const format = req.query.format || 'json';
    const limit = Math.min(Number(req.query.limit) || 100, 1000);
    const startAfterId = req.query.startAfterId;
    const fieldsParam = req.query.fields;
    const fields = fieldsParam ? fieldsParam.split(',').map(f=>f.trim()).filter(Boolean) : ['id','paymentId','createdBy','amount','createdAt','status'];

    let query = db.collection('payments').where('status', '==', 'paid').where('createdAt', '>=', start).where('createdAt', '<=', end + 'T23:59:59.999Z').orderBy('createdAt','desc').limit(limit+1);
    if (startAfterId) {
      const startDoc = await db.collection('payments').doc(startAfterId).get();
      if (startDoc.exists) query = query.startAfter(startDoc);
    }
    const snap = await query.get();
    const docs = snap.docs;
    const hasMore = docs.length > limit;
    const pageDocs = docs.slice(0, limit);
    const rows = pageDocs.map(d => ({ id: d.id, paymentId: d.data().paymentId || '', createdBy: d.data().createdBy || '', amount: d.data().approvedAmount || d.data().amount || 0, createdAt: d.data().createdAt || '', status: d.data().status || '' }));
    const lastId = pageDocs.length ? pageDocs[pageDocs.length-1].id : null;
    if (format === 'csv' || format === 'excel') {
      const fname = `payments_${start}_${end}.${format === 'excel' ? 'xls' : 'csv'}`;
      if (req.query.stream === 'true' || req.query.stream === '1') {
        const baseQueryFactory = () => db.collection('payments')
          .where('status', '==', 'paid')
          .where('createdAt', '>=', start)
          .where('createdAt', '<=', end + 'T23:59:59.999Z')
          .orderBy('createdAt','desc');
        const mapDoc = (d) => ({ id: d.id, paymentId: d.data().paymentId || '', createdBy: d.data().createdBy || '', amount: d.data().approvedAmount || d.data().amount || 0, createdAt: d.data().createdAt || '', status: d.data().status || '' });
        return sendCSVStream(res, fname, fields, baseQueryFactory, mapDoc);
      }
      return sendCSV(res, `payments_${start}_${end}.csv`, fields, rows);
    }
    if (format === 'pdf') return sendPDF(res, `Payment Report ${start} to ${end}`, fields, rows);
    res.json({ rows, total: rows.reduce((s,r)=>s+Number(r.amount||0),0), hasMore, nextPageToken: hasMore ? lastId : null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Admission report: leads converted/registered in period
router.get('/admissions', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { start, end } = parseDateRange(req);
    const format = req.query.format || 'json';
    const limit = Math.min(Number(req.query.limit) || 100, 1000);
    const startAfterId = req.query.startAfterId;
    const fieldsParam = req.query.fields;
    const fields = fieldsParam ? fieldsParam.split(',').map(f=>f.trim()).filter(Boolean) : ['id','name','status','assignedTo','createdAt'];

    let query = db.collection('leads').where('leadStatus', 'in', ['Registered','Converted']).where('createdAt', '>=', start).where('createdAt', '<=', end + 'T23:59:59.999Z').orderBy('createdAt','desc').limit(limit+1);
    if (startAfterId) {
      const startDoc = await db.collection('leads').doc(startAfterId).get();
      if (startDoc.exists) query = query.startAfter(startDoc);
    }
    const snap = await query.get();
    const docs = snap.docs;
    const hasMore = docs.length > limit;
    const pageDocs = docs.slice(0, limit);
    const rows = pageDocs.map(d => ({ id: d.id, name: d.data().fullName || '', status: d.data().leadStatus || '', createdAt: d.data().createdAt || '', assignedTo: d.data().assignedTo || '' }));
    const lastId = pageDocs.length ? pageDocs[pageDocs.length-1].id : null;
    if (format === 'csv' || format === 'excel') {
      const fname = `admissions_${start}_${end}.csv`;
      if (req.query.stream === 'true' || req.query.stream === '1') {
        const baseQueryFactory = () => db.collection('leads').where('leadStatus', 'in', ['Registered','Converted']).where('createdAt', '>=', start).where('createdAt', '<=', end + 'T23:59:59.999Z').orderBy('createdAt','desc');
        const mapDoc = (d) => ({ id: d.id, name: d.data().fullName || '', status: d.data().leadStatus || '', createdAt: d.data().createdAt || '', assignedTo: d.data().assignedTo || '' });
        return sendCSVStream(res, fname, fields, baseQueryFactory, mapDoc);
      }
      return sendCSV(res, `admissions_${start}_${end}.csv`, fields, rows);
    }
    if (format === 'pdf') return sendPDF(res, `Admissions Report ${start} to ${end}`, fields, rows);
    res.json({ rows, hasMore, nextPageToken: hasMore ? lastId : null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/recent-activity', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const attSnap = await db.collection('attendance').orderBy('checkIn', 'desc').limit(10).get();
    const activities = [];

    for (const doc of attSnap.docs) {
      const data = doc.data();
      const empDoc = await db.collection('employees').doc(data.employeeId).get();
      const empName = empDoc.exists ? empDoc.data().name : 'Unknown';

      activities.push({
        name: empName,
        action: data.status,
        time: data.checkIn,
        type: 'Attendance'
      });
    }

    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


