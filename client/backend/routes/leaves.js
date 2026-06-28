const express = require('express');
const prisma = require('../../prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');
const upload = require('../utils/uploadMiddleware');
const { uploadStreamToGCS, generateSignedUrl } = require('../utils/gcs');
const router = express.Router();

router.post('/', authenticate, upload.single('document'), async (req, res) => {
  const { type, fromDate, toDate, reason, halfDay } = req.body;
  try {
    let documentUrl = null;
    let gcsPath = null;
    if (req.file) {
      gcsPath = await uploadStreamToGCS(req.file, 'leave_documents');
      documentUrl = gcsPath;
    }

    const newLeave = await prisma.leave.create({
      data: {
        employeeId: req.user.id,
        type,
        fromDate: new Date(fromDate),
        toDate: new Date(toDate),
        reason,
        documentUrl,
        halfDay: halfDay === 'true' || halfDay === true,
        status: 'Pending'
      }
    });

    if (gcsPath) {
      await prisma.fileMetadata.create({
        data: {
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          gcsPath: gcsPath,
          uploadedBy: req.user.id,
          entityType: 'Leave',
          entityId: newLeave.id
        }
      });
    }

    // Notify HR about the new leave request
    try {
      const emp = await prisma.employee.findUnique({ where: { id: req.user.id } });
      const empName = emp ? emp.name : req.user.name || 'Employee';
      const empEmail = emp ? emp.email : req.user.email || '';
      
      const hrEmail = process.env.HR_EMAIL || process.env.EMAIL_USER;
      const subject = `Leave Request: ${empName} (${type})`;
      const html = `
        <p>New leave request submitted:</p>
        <ul>
          <li><strong>Employee:</strong> ${empName} (${empEmail || 'N/A'})</li>
          <li><strong>Type:</strong> ${type}</li>
          <li><strong>From:</strong> ${fromDate}</li>
          <li><strong>To:</strong> ${toDate}</li>
          <li><strong>Reason:</strong> ${reason}</li>
        </ul>
      `;
      if (hrEmail) {
        await sendEmail(hrEmail, subject, html, [], {
          from: `"${empName} via Geonixa" <${process.env.EMAIL_USER || 'your_email@gmail.com'}>`,
          replyTo: empEmail
        });
      }
    } catch (e) {
      console.error('Failed sending HR notification for leave apply:', e.message || e);
    }

    res.json({ id: newLeave.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    let leaves = [];
    if (req.user.role !== 'admin') {
      leaves = await prisma.leave.findMany({
        where: { employeeId: req.user.id },
        include: { employee: true },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      leaves = await prisma.leave.findMany({
        include: { employee: true },
        orderBy: { createdAt: 'desc' }
      });
    }

    const formatted = await Promise.all(leaves.map(async l => {
      const emp = l.employee || {};
      return {
        ...l,
        documentUrl: l.documentUrl ? await generateSignedUrl(l.documentUrl, 60) : null,
        fromDate: l.fromDate.toISOString().split('T')[0], // format back for frontend
        toDate: l.toDate.toISOString().split('T')[0],
        employee: { name: emp.name || 'Unknown', department: emp.department || 'Unknown' }
      };
    }));
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
    await prisma.leave.update({
      where: { id: req.params.id },
      data: updateData
    });
    res.json({ message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
