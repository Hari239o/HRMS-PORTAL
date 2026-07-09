const express = require('express');
const prisma = require('../../prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    let whereClause = {};
    if (req.user.role !== 'admin') {
      whereClause.employeeId = req.user.id;
    }
    
    const records = await prisma.resignation.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    if (req.user.role === 'admin') {
      const employees = await prisma.employee.findMany();
      const employeesMap = {};
      employees.forEach(emp => { employeesMap[emp.id] = emp; });
      
      const enriched = records.map(r => ({
        ...r,
        requestedLWD: r.requestedLWD ? r.requestedLWD.toISOString() : null,
        officialLWD: r.officialLWD ? r.officialLWD.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        employeeName: employeesMap[r.employeeId]?.name || 'Unknown',
        employeeEmail: employeesMap[r.employeeId]?.email || 'Unknown',
        department: employeesMap[r.employeeId]?.department || 'Unknown'
      }));
      return res.json(enriched);
    }

    const formatted = records.map(r => ({
      ...r,
      requestedLWD: r.requestedLWD ? r.requestedLWD.toISOString() : null,
      officialLWD: r.officialLWD ? r.officialLWD.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error('Error fetching resignations:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  const { reason, requestedLWD, primaryReason, personalEmail } = req.body;
  if (!reason) return res.status(400).json({ error: 'Reason is required' });

  try {
    const existing = await prisma.resignation.findFirst({
      where: {
        employeeId: req.user.id,
        status: { in: ['Pending', 'Approved', 'Serving Notice'] }
      }
    });
      
    if (existing) {
      return res.status(400).json({ error: 'You already have an active resignation request.' });
    }

    const newResignation = await prisma.resignation.create({
      data: {
        employeeId: req.user.id,
        reason,
        primaryReason: primaryReason || 'Other',
        personalEmail: personalEmail || '',
        requestedLWD: requestedLWD ? new Date(requestedLWD) : null,
        status: 'Pending',
        eligibleForRehire: true,
        noticeWaived: false
      }
    });

    res.status(201).json({ id: newResignation.id, ...newResignation });

    // Notify admins about new resignation
    try {
      const admins = await prisma.employee.findMany({ where: { role: 'admin' } });
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: 'Resignation Submitted',
            message: `Hey Admin! 🚨 Action Required: ${req.user.name || 'An employee'} has just submitted a resignation request.`,
            type: 'resignation_creation',
            data: { resignationId: newResignation.id }
          }
        });
      }
    } catch (err) {
      console.error('Failed to notify admins of resignation:', err);
    }
  } catch (error) {
    console.error('Error submitting resignation:', error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', authenticate, authorize(['admin', 'hr']), async (req, res) => {
  const { status, officialLWD, adminRemarks, eligibleForRehire, noticeWaived } = req.body;
  const { id } = req.params;

  try {
    const resignation = await prisma.resignation.findUnique({ where: { id } });
    if (!resignation) return res.status(404).json({ error: 'Resignation record not found' });

    const updateData = { status };
    if (officialLWD !== undefined) updateData.officialLWD = officialLWD ? new Date(officialLWD) : null;
    if (adminRemarks !== undefined) updateData.adminRemarks = adminRemarks;
    if (eligibleForRehire !== undefined) updateData.eligibleForRehire = eligibleForRehire;
    if (noticeWaived !== undefined) updateData.noticeWaived = noticeWaived;

    const updatedResignation = await prisma.resignation.update({
      where: { id },
      data: updateData
    });

    // Notify employee about status update
    await prisma.notification.create({
      data: {
        userId: updatedResignation.employeeId,
        title: 'Resignation Status Updated',
        message: `Hey there, your resignation request status has been updated to ${status}.${adminRemarks ? ' Remarks: ' + adminRemarks : ''}`,
        type: 'resignation_status',
        data: { resignationId: id, status }
      }
    });

    res.json({ message: 'Resignation updated successfully', ...updateData });
  } catch (error) {
    console.error('Error updating resignation:', error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/withdraw', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const resignation = await prisma.resignation.findUnique({ where: { id } });
    if (!resignation) return res.status(404).json({ error: 'Resignation record not found' });
    
    if (resignation.employeeId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to withdraw this request' });
    }

    if (resignation.status !== 'Pending') {
      return res.status(400).json({ error: 'Only pending requests can be withdrawn' });
    }

    await prisma.resignation.update({
      where: { id },
      data: { status: 'Withdrawn' }
    });

    // Notify admins about withdrawal
    try {
      const admins = await prisma.employee.findMany({ where: { role: 'admin' } });
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: 'Resignation Withdrawn',
            message: `Hey Admin! Good news, ${req.user.name || 'An employee'} just withdrew their resignation request.`,
            type: 'resignation_withdrawn',
            data: { resignationId: id }
          }
        });
      }
    } catch (err) {
      console.error('Failed to notify admins of withdrawal:', err);
    }

    res.json({ message: 'Resignation withdrawn successfully' });
  } catch (error) {
    console.error('Error withdrawing resignation:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const resignation = await prisma.resignation.findUnique({ where: { id } });
    if (!resignation) return res.status(404).json({ error: 'Resignation record not found' });
    
    if (resignation.employeeId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this request' });
    }

    if (resignation.status !== 'Pending' && resignation.status !== 'Withdrawn') {
      return res.status(400).json({ error: 'Cannot delete processed requests' });
    }

    await prisma.resignation.delete({ where: { id } });
    res.json({ message: 'Resignation deleted successfully' });
  } catch (error) {
    console.error('Error deleting resignation:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
