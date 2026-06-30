const express = require('express');
const prisma = require('../../prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { DateTime } = require('luxon');
const PDFDocument = require('pdfkit');

const router = express.Router();

router.get('/dashboard-stats', authenticate, authorize(['admin']), async (req, res) => {
  const today = DateTime.now().setZone('Asia/Kolkata').toISODate();
  try {
    const totalEmployees = await prisma.employee.count({
      where: { role: { not: 'admin' } }
    });

    const attendanceRecords = await prisma.attendance.findMany({
      where: { date: today },
      include: { employee: { select: { id: true, name: true } } }
    });
    
    let presentTodayList = [];
    let halfDaysTodayList = [];
    const attendedEmpIds = [];
    
    attendanceRecords.forEach(data => {
      const empName = data.employee?.name || 'Unknown';
      if (data.status === 'Present') {
        presentTodayList.push({ id: data.employeeId, name: empName });
        attendedEmpIds.push(data.employeeId);
      } else if (data.status === 'Half Day' || data.status === 'Late') {
        halfDaysTodayList.push({ id: data.employeeId, name: empName, status: data.status });
        attendedEmpIds.push(data.employeeId);
      }
    });

    const absentEmployees = await prisma.employee.findMany({
      where: {
        role: { not: 'admin' },
        id: { notIn: attendedEmpIds }
      },
      select: { id: true, name: true }
    });

    const absentTodayList = absentEmployees.map(emp => ({ id: emp.id, name: emp.name }));

    const leavesTodayRecords = await prisma.leave.findMany({
      where: {
        status: 'Approved',
        fromDate: { lte: new Date(`${today}T23:59:59Z`) },
        toDate: { gte: new Date(`${today}T00:00:00Z`) }
      },
      include: { employee: { select: { id: true, name: true } } }
    });
    
    const leavesTodayList = leavesTodayRecords.map(l => ({ id: l.employeeId, name: l.employee?.name || 'Unknown', type: l.type }));

    res.json({
      totalEmployees,
      presentToday: presentTodayList.length,
      halfDaysToday: halfDaysTodayList.length,
      absentToday: absentTodayList.length,
      leavesToday: leavesTodayList.length,
      presentTodayList,
      halfDaysTodayList,
      absentTodayList,
      leavesTodayList
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
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const stats = { Present: 0, 'Half Day': 0, Absent: 0 };
    attendanceRecords.forEach(doc => {
      const status = doc.status;
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
    let whereClause = { role: { not: 'admin' } };
    if (department && department !== 'All') {
      whereClause.department = department;
    }
    const employees = await prisma.employee.findMany({ where: whereClause });

    const allAttendance = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const allLeaves = await prisma.leave.findMany({
      where: { status: 'Approved' }
    });

    const report = employees.map(emp => {
      const attendance = allAttendance.filter(a => a.employeeId === emp.id);
      
      const leaves = allLeaves.filter(l => {
        if (l.employeeId !== emp.id) return false;
        const fromDate = DateTime.fromJSDate(l.fromDate).toISODate();
        const toDate = DateTime.fromJSDate(l.toDate).toISODate();
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
    const employees = await prisma.employee.findMany({
      where: { role: { not: 'admin' } }
    });
    
    const allAttendance = await prisma.attendance.findMany();
    const allLeaves = await prisma.leave.findMany({
      where: { status: 'Approved' }
    });

    const today = DateTime.now().setZone('Asia/Kolkata').toISODate();
    
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
  const now = DateTime.now().setZone('Asia/Kolkata');
  if (startDate && endDate) return { start: DateTime.fromISO(startDate).startOf('day').toJSDate(), end: DateTime.fromISO(endDate).endOf('day').toJSDate() };
  if (period === 'daily') {
    return { start: now.startOf('day').toJSDate(), end: now.endOf('day').toJSDate() };
  }
  if (period === 'weekly') {
    return { start: now.minus({ days: 6 }).startOf('day').toJSDate(), end: now.endOf('day').toJSDate() };
  }
  if (period === 'monthly') {
    return { start: now.startOf('month').toJSDate(), end: now.endOf('month').toJSDate() };
  }
  return { start: now.minus({ days: 29 }).startOf('day').toJSDate(), end: now.endOf('day').toJSDate() };
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

async function sendCSVStream(res, filename, headers, modelName, whereClause, orderBy, mapDoc, batchSize = 500) {
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  if (filename.toLowerCase().endsWith('.xls')) {
    res.type('application/vnd.ms-excel');
  } else {
    res.type('text/csv');
  }
  res.write(headers.join(',') + '\n');

  let skip = 0;
  while (true) {
    const docs = await prisma[modelName].findMany({
      where: whereClause,
      orderBy,
      take: batchSize,
      skip
    });
    if (!docs.length) break;
    for (const d of docs) {
      const rowObj = mapDoc(d);
      const line = headers.map(h => {
        const v = rowObj[h] === undefined || rowObj[h] === null ? '' : String(rowObj[h]).replace(/"/g, '""');
        return `"${v}"`;
      }).join(',');
      if (!res.write(line + '\n')) {
        await new Promise(r => res.once('drain', r));
      }
    }
    skip += batchSize;
    if (docs.length < batchSize) break;
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

router.get('/leads', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { start, end } = parseDateRange(req);
    const format = req.query.format || 'json';
    const limit = Math.min(Number(req.query.limit) || 100, 1000);
    const skip = req.query.startAfterId ? Number(req.query.startAfterId) : 0; // Simplified pagination
    const fieldsParam = req.query.fields;
    const fields = fieldsParam ? fieldsParam.split(',').map(f => f.trim()).filter(Boolean) : ['id','fullName','mobile','email','status','assignedTo','createdAt'];

    const whereClause = {
      createdAt: {
        gte: start,
        lte: end
      }
    };

    const docs = await prisma.lead.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      skip
    });

    const hasMore = docs.length > limit;
    const pageDocs = docs.slice(0, limit);

    const rows = pageDocs.map(data => {
      const base = { id: data.id, fullName: data.fullName || data.name || '', mobile: data.mobileNumber || data.mobile || '', email: data.email || '', status: data.leadStatus || data.status || '', assignedTo: data.assignedTo || '' , createdAt: data.createdAt ? data.createdAt.toISOString() : '' };
      const out = {};
      fields.forEach(f => out[f] = base[f] !== undefined ? base[f] : data[f]);
      return out;
    });

    const nextSkip = hasMore ? skip + limit : null;

    if (format === 'csv' || format === 'excel') {
      const fname = `leads_${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}.csv`;
      if (req.query.stream === 'true' || req.query.stream === '1') {
        const mapDoc = (data) => {
          const base = { id: data.id, fullName: data.fullName || data.name || '', mobile: data.mobileNumber || data.mobile || '', email: data.email || '', status: data.leadStatus || data.status || '', assignedTo: data.assignedTo || '' , createdAt: data.createdAt ? data.createdAt.toISOString() : '' };
          const out = {};
          fields.forEach(f => out[f] = base[f] !== undefined ? base[f] : data[f]);
          return out;
        };
        return sendCSVStream(res, fname, fields, 'lead', whereClause, { createdAt: 'desc' }, mapDoc);
      }
      return sendCSV(res, fname, fields, rows);
    }
    if (format === 'pdf') return sendPDF(res, `Lead Report ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`, fields, rows);
    res.json({ rows, hasMore, nextPageToken: nextSkip });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/calls', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { start, end } = parseDateRange(req);
    const format = req.query.format || 'json';
    const limit = Math.min(Number(req.query.limit) || 100, 1000);
    const skip = req.query.startAfterId ? Number(req.query.startAfterId) : 0;
    const fieldsParam = req.query.fields;
    const fields = fieldsParam ? fieldsParam.split(',').map(f=>f.trim()).filter(Boolean) : ['id','leadId','employeeId','status','notes','createdAt'];

    const whereClause = {
      createdAt: {
        gte: start,
        lte: end
      }
    };

    const docs = await prisma.callLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      skip
    });

    const hasMore = docs.length > limit;
    const pageDocs = docs.slice(0, limit);
    const rows = pageDocs.map(data => {
      const base = { id: data.id || '', leadId: data.leadId || '', employeeId: data.employeeId || '', status: data.callStatus || '', notes: data.notes || '', createdAt: data.createdAt ? data.createdAt.toISOString() : '' };
      const out = {};
      fields.forEach(f => out[f] = base[f] !== undefined ? base[f] : data[f]);
      return out;
    });
    const nextSkip = hasMore ? skip + limit : null;
    
    if (format === 'csv' || format === 'excel') {
      const fname = `calls_${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}.csv`;
      if (req.query.stream === 'true' || req.query.stream === '1') {
        const mapDoc = (data) => {
          const base = { id: data.id || '', leadId: data.leadId || '', employeeId: data.employeeId || '', status: data.callStatus || '', notes: data.notes || '', createdAt: data.createdAt ? data.createdAt.toISOString() : '' };
          const out = {};
          fields.forEach(f => out[f] = base[f] !== undefined ? base[f] : data[f]);
          return out;
        };
        return sendCSVStream(res, fname, fields, 'callLog', whereClause, { createdAt: 'desc' }, mapDoc);
      }
      return sendCSV(res, fname, fields, rows);
    }
    if (format === 'pdf') return sendPDF(res, `Call Report ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`, fields, rows);
    res.json({ rows, hasMore, nextPageToken: nextSkip });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/followups', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { start, end } = parseDateRange(req);
    const format = req.query.format || 'json';
    const limit = Math.min(Number(req.query.limit) || 100, 1000);
    const skip = req.query.startAfterId ? Number(req.query.startAfterId) : 0;
    const fieldsParam = req.query.fields;
    const fields = fieldsParam ? fieldsParam.split(',').map(f=>f.trim()).filter(Boolean) : ['id','leadId','assigned','date','time','status','createdAt'];

    const whereClause = {
      createdAt: {
        gte: start,
        lte: end
      }
    };

    const docs = await prisma.followup.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      skip
    });

    const hasMore = docs.length > limit;
    const pageDocs = docs.slice(0, limit);
    const rows = pageDocs.map(data => {
      const base = { id: data.id || '', leadId: data.leadId || '', assigned: data.assignedEmployeeName || data.assignedEmployeeId || '', date: data.followupDate || '', time: data.followupTime || '', status: data.status || '', createdAt: data.createdAt ? data.createdAt.toISOString() : '' };
      const out = {};
      fields.forEach(f => out[f] = base[f] !== undefined ? base[f] : data[f]);
      return out;
    });
    
    const nextSkip = hasMore ? skip + limit : null;
    if (format === 'csv' || format === 'excel') {
      const fname = `followups_${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}.csv`;
      if (req.query.stream === 'true' || req.query.stream === '1') {
        const mapDoc = (data) => {
          const base = { id: data.id || '', leadId: data.leadId || '', assigned: data.assignedEmployeeName || data.assignedEmployeeId || '', date: data.followupDate || '', time: data.followupTime || '', status: data.status || '', createdAt: data.createdAt ? data.createdAt.toISOString() : '' };
          const out = {};
          fields.forEach(f => out[f] = base[f] !== undefined ? base[f] : data[f]);
          return out;
        };
        return sendCSVStream(res, fname, fields, 'followup', whereClause, { createdAt: 'desc' }, mapDoc);
      }
      return sendCSV(res, fname, fields, rows);
    }
    if (format === 'pdf') return sendPDF(res, `Follow-ups ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`, fields, rows);
    res.json({ rows, hasMore, nextPageToken: nextSkip });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/employees-report', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { start, end } = parseDateRange(req);
    const format = req.query.format || 'json';
    const limit = Math.min(Number(req.query.limit) || 100, 1000);
    const skip = req.query.startAfterId ? Number(req.query.startAfterId) : 0;
    const fieldsParam = req.query.fields;
    const fields = fieldsParam ? fieldsParam.split(',').map(f=>f.trim()).filter(Boolean) : ['id','name','email','department','leads','calls','followups','revenue'];

    const pageDocs = await prisma.employee.findMany({
      orderBy: { name: 'asc' },
      take: limit + 1,
      skip
    });
    const hasMore = pageDocs.length > limit;
    if (hasMore) pageDocs.pop();

    const rows = [];
    for (const emp of pageDocs) {
      const leadsCount = await prisma.lead.count({ where: { assignedTo: emp.id, createdAt: { gte: start, lte: end } } });
      const callsCount = await prisma.callLog.count({ where: { employeeId: emp.id, createdAt: { gte: start, lte: end } } });
      const followupsCount = await prisma.followup.count({ where: { assignedEmployeeId: emp.id, createdAt: { gte: start, lte: end } } });
      const payments = await prisma.payment.findMany({ where: { createdBy: emp.id, status: 'paid', createdAt: { gte: start, lte: end } } });
      
      let revenue = 0;
      payments.forEach(p => revenue += Number(p.approvedAmount || p.amount || 0));

      const base = { id: emp.id, name: emp.name || '', email: emp.email || '', department: emp.department || '', leads: leadsCount, calls: callsCount, followups: followupsCount, revenue };
      const out = {};
      fields.forEach(f => out[f] = base[f] !== undefined ? base[f] : emp[f]);
      rows.push(out);
    }
    const nextSkip = hasMore ? skip + limit : null;
    if (format === 'csv' || format === 'excel') return sendCSV(res, `employees_${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}.csv`, fields, rows);
    if (format === 'pdf') return sendPDF(res, `Employee Report ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`, fields, rows);
    res.json({ rows, hasMore, nextPageToken: nextSkip });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/revenue', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { start, end } = parseDateRange(req);
    const format = req.query.format || 'json';
    const limit = Math.min(Number(req.query.limit) || 100, 1000);
    const skip = req.query.startAfterId ? Number(req.query.startAfterId) : 0;
    const fieldsParam = req.query.fields;
    const fields = fieldsParam ? fieldsParam.split(',').map(f=>f.trim()).filter(Boolean) : ['id','paymentId','createdBy','amount','createdAt'];

    const whereClause = { status: 'paid', createdAt: { gte: start, lte: end } };
    const pageDocs = await prisma.payment.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      skip
    });

    const hasMore = pageDocs.length > limit;
    if (hasMore) pageDocs.pop();

    const rows = pageDocs.map(d => ({ id: d.id, amount: d.approvedAmount || d.amount || 0, paymentId: d.paymentId || '', createdAt: d.createdAt ? d.createdAt.toISOString() : '', createdBy: d.createdBy || '' }));
    const nextSkip = hasMore ? skip + limit : null;
    
    if (format === 'csv' || format === 'excel') {
      const fname = `revenue_${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}.csv`;
      if (req.query.stream === 'true' || req.query.stream === '1') {
        const mapDoc = (d) => ({ id: d.id, amount: d.approvedAmount || d.amount || 0, paymentId: d.paymentId || '', createdAt: d.createdAt ? d.createdAt.toISOString() : '', createdBy: d.createdBy || '' });
        return sendCSVStream(res, fname, fields, 'payment', whereClause, { createdAt: 'desc' }, mapDoc);
      }
      return sendCSV(res, fname, fields, rows);
    }
    if (format === 'pdf') return sendPDF(res, `Revenue Report ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`, fields, rows);
    res.json({ rows, total: rows.reduce((s,r)=>s+Number(r.amount||0),0), hasMore, nextPageToken: nextSkip });
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
    const skip = req.query.startAfterId ? Number(req.query.startAfterId) : 0;
    const fieldsParam = req.query.fields;
    const fields = fieldsParam ? fieldsParam.split(',').map(f=>f.trim()).filter(Boolean) : ['id','paymentId','createdBy','amount','createdAt','status'];

    const whereClause = { status: 'paid', createdAt: { gte: start, lte: end } };
    const pageDocs = await prisma.payment.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      skip
    });

    const hasMore = pageDocs.length > limit;
    if (hasMore) pageDocs.pop();

    const rows = pageDocs.map(d => ({ id: d.id, paymentId: d.paymentId || '', createdBy: d.createdBy || '', amount: d.approvedAmount || d.amount || 0, createdAt: d.createdAt ? d.createdAt.toISOString() : '', status: d.status || '' }));
    const nextSkip = hasMore ? skip + limit : null;
    
    if (format === 'csv' || format === 'excel') {
      const fname = `payments_${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}.${format === 'excel' ? 'xls' : 'csv'}`;
      if (req.query.stream === 'true' || req.query.stream === '1') {
        const mapDoc = (d) => ({ id: d.id, paymentId: d.paymentId || '', createdBy: d.createdBy || '', amount: d.approvedAmount || d.amount || 0, createdAt: d.createdAt ? d.createdAt.toISOString() : '', status: d.status || '' });
        return sendCSVStream(res, fname, fields, 'payment', whereClause, { createdAt: 'desc' }, mapDoc);
      }
      return sendCSV(res, fname, fields, rows);
    }
    if (format === 'pdf') return sendPDF(res, `Payment Report ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`, fields, rows);
    res.json({ rows, total: rows.reduce((s,r)=>s+Number(r.amount||0),0), hasMore, nextPageToken: nextSkip });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/admissions', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { start, end } = parseDateRange(req);
    const format = req.query.format || 'json';
    const limit = Math.min(Number(req.query.limit) || 100, 1000);
    const skip = req.query.startAfterId ? Number(req.query.startAfterId) : 0;
    const fieldsParam = req.query.fields;
    const fields = fieldsParam ? fieldsParam.split(',').map(f=>f.trim()).filter(Boolean) : ['id','name','status','assignedTo','createdAt'];

    const whereClause = { leadStatus: { in: ['Registered','Converted'] }, createdAt: { gte: start, lte: end } };
    const pageDocs = await prisma.lead.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      skip
    });

    const hasMore = pageDocs.length > limit;
    if (hasMore) pageDocs.pop();

    const rows = pageDocs.map(d => ({ id: d.id, name: d.fullName || '', status: d.leadStatus || '', createdAt: d.createdAt ? d.createdAt.toISOString() : '', assignedTo: d.assignedTo || '' }));
    const nextSkip = hasMore ? skip + limit : null;
    
    if (format === 'csv' || format === 'excel') {
      const fname = `admissions_${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}.csv`;
      if (req.query.stream === 'true' || req.query.stream === '1') {
        const mapDoc = (d) => ({ id: d.id, name: d.fullName || '', status: d.leadStatus || '', createdAt: d.createdAt ? d.createdAt.toISOString() : '', assignedTo: d.assignedTo || '' });
        return sendCSVStream(res, fname, fields, 'lead', whereClause, { createdAt: 'desc' }, mapDoc);
      }
      return sendCSV(res, fname, fields, rows);
    }
    if (format === 'pdf') return sendPDF(res, `Admissions Report ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`, fields, rows);
    res.json({ rows, hasMore, nextPageToken: nextSkip });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/recent-activity', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const attendanceRecords = await prisma.attendance.findMany({
      orderBy: { checkIn: 'desc' },
      take: 10
    });
    
    const activities = await Promise.all(attendanceRecords.map(async (data) => {
      const emp = await prisma.employee.findUnique({ where: { id: data.employeeId } });
      const empName = emp ? emp.name : 'Unknown';

      return {
        name: empName,
        action: data.status,
        time: data.checkIn,
        type: 'Attendance'
      };
    }));

    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/dashboard-full', authenticate, authorize(['admin']), async (req, res) => {
  const { month, year } = req.query;
  const today = DateTime.now().setZone('Asia/Kolkata').toISODate();
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = DateTime.fromISO(startDate).plus({ months: 1 }).minus({ days: 1 }).toISODate();

  try {
    const workforce = await prisma.employee.findMany({ where: { role: { not: 'admin' } } });
    const allEmployees = await prisma.employee.findMany({ orderBy: { name: 'asc' } });
    const starPerformers = await prisma.employee.findMany({
      where: { starPerformer: { not: 'none' } },
      select: { id: true, name: true, avatar: true, starPerformer: true }
    });

    const [attendanceRecords, monthlyAttendance, recentLeaves, recentProblems] = await Promise.all([
      prisma.attendance.findMany({ where: { date: today } }),
      prisma.attendance.findMany({ where: { date: { gte: startDate, lte: endDate } } }),
      prisma.leave.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { employee: { select: { name: true } } } }),
      prisma.problem.findMany({ orderBy: { createdAt: 'desc' }, take: 10 })
    ]);

    // 1. Dashboard Stats
    let presentTodayList = [];
    let halfDaysTodayList = [];
    const attendedEmpIds = new Set();
    attendanceRecords.forEach(data => {
      const empName = workforce.find(e => e.id === data.employeeId)?.name || 'Unknown';
      if (data.status === 'Present') { presentTodayList.push({ id: data.employeeId, name: empName }); attendedEmpIds.add(data.employeeId); }
      else if (data.status === 'Half Day' || data.status === 'Late') { halfDaysTodayList.push({ id: data.employeeId, name: empName, status: data.status }); attendedEmpIds.add(data.employeeId); }
    });
    let absentTodayList = workforce.filter(emp => !attendedEmpIds.has(emp.id)).map(emp => ({ id: emp.id, name: emp.name }));
    const leavesTodayRecords = await prisma.leave.findMany({
      where: { status: 'Approved', fromDate: { lte: new Date(`${today}T23:59:59Z`) }, toDate: { gte: new Date(`${today}T00:00:00Z`) } },
      include: { employee: true }
    });
    const leavesTodayList = leavesTodayRecords.map(l => ({ id: l.employeeId, name: l.employee?.name || 'Unknown', type: l.type }));
    
    const dashboardStats = {
      totalEmployees: workforce.length, presentToday: presentTodayList.length, halfDaysToday: halfDaysTodayList.length,
      absentToday: absentTodayList.length, leavesToday: leavesTodayList.length,
      presentTodayList, halfDaysTodayList, absentTodayList, leavesTodayList
    };

    // 2. Analytics Monthly
    const analytics = { Present: 0, 'Half Day': 0, Absent: 0 };
    monthlyAttendance.forEach(doc => { if (analytics[doc.status] !== undefined) analytics[doc.status]++; });

    // 3. Recent Activity
    const activities = [
      ...recentLeaves.map(l => ({ type: 'leave', action: 'Applied for leave', name: l.employee?.name || 'Unknown', time: l.createdAt })),
      ...recentProblems.map(p => {
        const empName = allEmployees.find(e => e.id === p.employeeId)?.name || 'Unknown';
        return { type: 'problem', action: 'Reported a problem', name: empName, time: p.createdAt };
      })
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

    // 4. Formatted Employees (for allEmployees drop down)
    const formattedEmployees = allEmployees.map(emp => ({
      id: emp.id, name: emp.name, email: emp.email, role: emp.role, department: emp.department,
      avatar: emp.avatar || '', empId: emp.empId || '', designation: emp.designation || ''
    }));

    res.json({
      dashboardStats,
      analytics,
      recentActivity: activities,
      allEmployees: formattedEmployees,
      starPerformers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
