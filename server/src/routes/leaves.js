const express = require('express');
const { db } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');
const { uploadDocument } = require('../utils/cloudinary');
const router = express.Router();

router.post('/', authenticate, uploadDocument.single('document'), async (req, res) => {
  const { type, fromDate, toDate, reason, halfDay } = req.body;
  try {
    let documentUrl = null;
    if (req.file) {
      documentUrl = req.file.path.startsWith('http') ? req.file.path : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    const id = Date.now().toString();
    await db.collection('leaves').doc(id).set({
      id,
      employeeId: req.user.id,
      type,
      fromDate,
      toDate,
      reason,
      documentUrl,
      halfDay: halfDay === 'true' || halfDay === true,
      status: 'Pending',
      createdAt: new Date().toISOString()
    });

    // Notify HR about the new leave request
    try {
      const empSnap = await db.collection('employees').doc(req.user.id).get();
      const emp = empSnap.exists ? empSnap.data() : { name: req.user.name || 'Employee', email: req.user.email || '' };
      const hrEmail = process.env.HR_EMAIL || process.env.EMAIL_USER;
      const subject = `Leave Request: ${emp.name} (${type})`;
      const html = `
        <p>New leave request submitted:</p>
        <ul>
          <li><strong>Employee:</strong> ${emp.name} (${emp.email || req.user.email || 'N/A'})</li>
          <li><strong>Type:</strong> ${type}</li>
          <li><strong>From:</strong> ${fromDate}</li>
          <li><strong>To:</strong> ${toDate}</li>
          <li><strong>Reason:</strong> ${reason}</li>
        </ul>
      `;
      if (hrEmail) {
        const employeeEmail = emp.email || req.user.email;
        await sendEmail(hrEmail, subject, html, [], {
          from: `"${emp.name} via Geonixa" <${process.env.EMAIL_USER || 'your_email@gmail.com'}>`,
          replyTo: employeeEmail
        });
      }
    } catch (e) {
      console.error('Failed sending HR notification for leave apply:', e.message || e);
    }

    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    let leaves = [];
    if (req.user.role !== 'admin') {
      const snap = await db.collection('leaves').where('employeeId', '==', req.user.id).get();
      leaves = snap.docs.map(doc => doc.data());
    } else {
      const snap = await db.collection('leaves').get();
      leaves = snap.docs.map(doc => doc.data());
    }

    leaves.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const empSnap = await db.collection('employees').get();
    const employeesMap = {};
    empSnap.docs.forEach(doc => {
      employeesMap[doc.id] = doc.data();
    });

    const formatted = leaves.map(l => {
      const emp = employeesMap[l.employeeId] || {};
      return {
        ...l,
        employee: { name: emp.name || 'Unknown', department: emp.department || 'Unknown' }
      };
    });
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/status', authenticate, authorize(['admin']), async (req, res) => {
  const { status, adminComment } = req.body;
  try {
    const updateData = { status };
    if (adminComment) {
      updateData.adminComment = adminComment;
    }
    await db.collection('leaves').doc(req.params.id).update(updateData);
    res.json({ message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
