const express = require('express');
const prisma = require('../../prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { ownerOrAdmin } = require('../middleware/rbac');
const router = express.Router();

router.post('/target', authenticate, authorize(['admin']), async (req, res) => {
  const { employeeId, month, targetCount } = req.body;
  try {
    const existing = await prisma.target.findFirst({
      where: { employeeId, month }
    });
      
    if (existing) {
      await prisma.target.update({
        where: { id: existing.id },
        data: { targetCount: targetCount || 30 }
      });
    } else {
      await prisma.target.create({
        data: {
          employeeId,
          month,
          targetCount: targetCount || 30,
          achievedCount: 0
        }
      });
    }
    res.json({ success: true, message: 'Workforce target saved.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/submit', authenticate, async (req, res) => {
  const { studentName, domain, collegeName, mailId, phoneNumber, totalAmount, amountPaid, remainingAmount, remainingAmountDate } = req.body;
  const employeeId = req.user.id;
  const month = new Date().toISOString().substring(0, 7); 

  try {
    const target = await prisma.target.findFirst({
      where: { employeeId, month }
    });

    let targetId = null;
    if (target) {
      targetId = target.id;
      await prisma.target.update({
        where: { id: target.id },
        data: { achievedCount: { increment: 1 } }
      });
    } else {
      const newTarget = await prisma.target.create({
        data: {
          employeeId,
          month,
          targetCount: 30,
          achievedCount: 1
        }
      });
      targetId = newTarget.id;
    }

    await prisma.studentSubmission.create({
      data: {
        employeeId,
        targetId,
        studentName,
        domain: domain || '',
        collegeName: collegeName || '',
        mailId: mailId || '',
        phoneNumber: phoneNumber || '',
        totalAmount: parseFloat(totalAmount) || 0,
        amountPaid: parseFloat(amountPaid) || 0,
        remainingAmount: parseFloat(remainingAmount) || 0,
        remainingAmountDate: remainingAmountDate || '',
        date: new Date()
      }
    });

    res.json({ success: true, message: 'Student metric recorded successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/performance', authenticate, async (req, res) => {
  const employeeId = req.query.employeeId || req.user.id;
  const month = req.query.month || new Date().toISOString().substring(0, 7);

  try {
    const target = await prisma.target.findFirst({
      where: { employeeId, month }
    });

    const submissions = await prisma.studentSubmission.findMany({
      where: { employeeId },
      orderBy: { date: 'desc' }
    });
    
    res.json({
      target: target || { targetCount: 30, achievedCount: 0 },
      submissions: submissions.map(s => ({
        ...s,
        date: s.date.toISOString(),
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString()
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/submit/:id', authenticate, ownerOrAdmin(async (req) => {
  const prisma = require('../../prisma/client');
  const doc = await prisma.studentSubmission.findUnique({ where: { id: req.params.id } });
  return doc ? doc.employeeId : null;
}), async (req, res) => {
  try {
    const submission = await prisma.studentSubmission.findUnique({ where: { id: req.params.id } });
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const month = submission.date.toISOString().substring(0, 7);
    
    await prisma.studentSubmission.delete({ where: { id: req.params.id } });

    const target = await prisma.target.findFirst({
      where: { employeeId: submission.employeeId, month }
    });

    if (target && target.achievedCount > 0) {
      await prisma.target.update({
        where: { id: target.id },
        data: { achievedCount: { decrement: 1 } }
      });
    }

    res.json({ success: true, message: 'Submission deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/submit/:id/status', authenticate, ownerOrAdmin(async (req) => {
  const prisma = require('../../prisma/client');
  const doc = await prisma.studentSubmission.findUnique({ where: { id: req.params.id } });
  return doc ? doc.employeeId : null;
}), async (req, res) => {
  const { callStatus, paymentStatus } = req.body;
  try {
    const submission = await prisma.studentSubmission.findUnique({ where: { id: req.params.id } });
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const updates = {};
    if (callStatus !== undefined) updates.callStatus = callStatus;
    if (paymentStatus !== undefined) updates.paymentStatus = paymentStatus;

    await prisma.studentSubmission.update({
      where: { id: req.params.id },
      data: updates
    });

    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
