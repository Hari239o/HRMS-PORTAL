const express = require('express');
const { db } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// GET all resignations (Admin sees all, employee sees their own)
router.get('/', authenticate, async (req, res) => {
  try {
    let query = db.collection('resignations');
    
    if (req.user.role !== 'admin') {
      query = query.where('employeeId', '==', req.user.id);
    }
    
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const resignations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // If admin, attach employee names
    if (req.user.role === 'admin') {
      const empSnap = await db.collection('employees').get();
      const employeesMap = {};
      empSnap.docs.forEach(doc => { employeesMap[doc.id] = doc.data(); });
      
      const enriched = resignations.map(r => ({
        ...r,
        employeeName: employeesMap[r.employeeId]?.name || 'Unknown',
        employeeEmail: employeesMap[r.employeeId]?.email || 'Unknown',
        department: employeesMap[r.employeeId]?.department || 'Unknown'
      }));
      return res.json(enriched);
    }

    res.json(resignations);
  } catch (error) {
    console.error('Error fetching resignations:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST submit a resignation
router.post('/', authenticate, async (req, res) => {
  const { reason, requestedLWD, primaryReason, personalEmail } = req.body;
  if (!reason) return res.status(400).json({ error: 'Reason is required' });

  try {
    // Check if they already have an active resignation
    const existingSnap = await db.collection('resignations')
      .where('employeeId', '==', req.user.id)
      .where('status', 'in', ['Pending', 'Approved', 'Serving Notice'])
      .get();
      
    if (!existingSnap.empty) {
      return res.status(400).json({ error: 'You already have an active resignation request.' });
    }

    const newResignation = {
      employeeId: req.user.id,
      reason,
      primaryReason: primaryReason || 'Other',
      personalEmail: personalEmail || '',
      requestedLWD: requestedLWD || null,
      officialLWD: null,
      status: 'Pending',
      eligibleForRehire: true,
      noticeWaived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await db.collection('resignations').add(newResignation);
    res.status(201).json({ id: docRef.id, ...newResignation });
  } catch (error) {
    console.error('Error submitting resignation:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH update resignation status (Admin only)
router.patch('/:id', authenticate, authorize(['admin']), async (req, res) => {
  const { status, officialLWD, adminRemarks, eligibleForRehire, noticeWaived } = req.body;
  const { id } = req.params;

  try {
    const docRef = db.collection('resignations').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'Resignation record not found' });

    const updateData = {
      status,
      updatedAt: new Date().toISOString()
    };
    if (officialLWD !== undefined) updateData.officialLWD = officialLWD;
    if (adminRemarks !== undefined) updateData.adminRemarks = adminRemarks;
    if (eligibleForRehire !== undefined) updateData.eligibleForRehire = eligibleForRehire;
    if (noticeWaived !== undefined) updateData.noticeWaived = noticeWaived;

    await docRef.update(updateData);
    
    // Optionally: if status is 'Offboarded', update employee role to 'ex_employee' or disable login
    // This is a business rule decision.

    res.json({ message: 'Resignation updated successfully', ...updateData });
  } catch (error) {
    console.error('Error updating resignation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Employee withdraw resignation
router.patch('/:id/withdraw', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const docRef = db.collection('resignations').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'Resignation record not found' });
    
    if (doc.data().employeeId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to withdraw this request' });
    }

    if (doc.data().status !== 'Pending') {
      return res.status(400).json({ error: 'Only pending requests can be withdrawn' });
    }

    await docRef.update({
      status: 'Withdrawn',
      updatedAt: new Date().toISOString()
    });

    res.json({ message: 'Resignation withdrawn successfully' });
  } catch (error) {
    console.error('Error withdrawing resignation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Employee delete resignation
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const docRef = db.collection('resignations').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'Resignation record not found' });
    
    if (doc.data().employeeId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this request' });
    }

    if (doc.data().status !== 'Pending' && doc.data().status !== 'Withdrawn') {
      return res.status(400).json({ error: 'Cannot delete processed requests' });
    }

    await docRef.delete();
    res.json({ message: 'Resignation deleted successfully' });
  } catch (error) {
    console.error('Error deleting resignation:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
