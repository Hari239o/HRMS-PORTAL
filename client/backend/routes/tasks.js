const express = require('express');
const prisma = require('../../prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { ownerOrAdmin } = require('../middleware/rbac');
const router = express.Router();

router.post('/target', authenticate, async (req, res) => {
  const { employeeId, month, targetCount, title, description } = req.body;
  
  try {
    // Check Authorization
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      const isLeader = await prisma.team.findFirst({
        where: { 
          leaderId: req.user.id,
          members: { some: { id: employeeId } }
        }
      });
      if (!isLeader) {
        return res.status(403).json({ error: 'Access denied. You can only assign tasks to your team members.' });
      }
    }

    const existing = await prisma.target.findFirst({
      where: { employeeId, month }
    });
      
    if (existing) {
      await prisma.target.update({
        where: { id: existing.id },
        data: { 
          targetCount: targetCount || 30,
          targetRevenue: req.body.targetRevenue ? parseFloat(req.body.targetRevenue) : existing.targetRevenue,
          title: title || existing.title,
          description: description || existing.description
        }
      });
    } else {
      await prisma.target.create({
        data: {
          employeeId,
          month,
          targetCount: targetCount || 30,
          targetRevenue: req.body.targetRevenue ? parseFloat(req.body.targetRevenue) : 0,
          achievedCount: 0,
          achievedRevenue: 0,
          title,
          description
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
      // Removed target.achievedCount increment here. It will be incremented on approval.
    } else {
      const newTarget = await prisma.target.create({
        data: {
          employeeId,
          month,
          targetCount: 30, // Default count
          achievedCount: 0 // Will increment on approval
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
        approvalStatus: 'Pending',
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

router.get('/submit/pending', authenticate, authorize(['admin', 'hr', 'manager', 'post_sales']), async (req, res) => {
  try {
    const submissions = await prisma.studentSubmission.findMany({
      where: { approvalStatus: 'Pending' },
      include: {
        target: {
          include: {
            employee: { select: { id: true, name: true, email: true, teamId: true } }
          }
        }
      },
      orderBy: { date: 'asc' }
    });
    // Add employee name explicitly since it's nested
    const mapped = submissions.map(s => {
      let employeeName = 'Unknown';
      if (s.target && s.target.employee) {
        employeeName = s.target.employee.name;
      } else {
         // Fallback query if no target relation
         employeeName = 'Employee';
      }
      return {
        ...s,
        employeeName,
        date: s.date.toISOString(),
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString()
      };
    });
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/submit/:id/approve', authenticate, authorize(['admin', 'hr', 'manager', 'post_sales']), async (req, res) => {
  try {
    const submission = await prisma.studentSubmission.findUnique({ where: { id: req.params.id } });
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    if (submission.approvalStatus === 'Approved') return res.status(400).json({ error: 'Already approved' });

    await prisma.studentSubmission.update({
      where: { id: req.params.id },
      data: { approvalStatus: 'Approved' }
    });

    if (submission.targetId) {
      await prisma.target.update({
        where: { id: submission.targetId },
        data: { 
          achievedCount: { increment: 1 },
          achievedRevenue: { increment: submission.amountPaid || 0 }
        }
      });
    }

    res.json({ success: true, message: 'Transaction approved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/submit/:id/reject', authenticate, authorize(['admin', 'hr', 'manager', 'post_sales']), async (req, res) => {
  try {
    const submission = await prisma.studentSubmission.findUnique({ where: { id: req.params.id } });
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    // If it was previously approved, we need to decrement the target
    if (submission.approvalStatus === 'Approved' && submission.targetId) {
      await prisma.target.update({
        where: { id: submission.targetId },
        data: { 
          achievedCount: { decrement: 1 },
          achievedRevenue: { decrement: submission.amountPaid || 0 }
        }
      });
    }

    await prisma.studentSubmission.update({
      where: { id: req.params.id },
      data: { approvalStatus: 'Rejected' }
    });

    res.json({ success: true, message: 'Transaction rejected successfully' });
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

    // Only decrement if it was approved
    if (target && target.achievedCount > 0 && submission.approvalStatus === 'Approved') {
      await prisma.target.update({
        where: { id: target.id },
        data: { 
          achievedCount: { decrement: 1 },
          achievedRevenue: { decrement: submission.amountPaid || 0 }
        }
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
    if (paymentStatus !== undefined) {
      updates.paymentStatus = paymentStatus;
      if (paymentStatus === 'Paid') {
        updates.amountPaid = submission.totalAmount;
        updates.remainingAmount = 0;
        updates.remainingAmountDate = null;
      }
    }

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
