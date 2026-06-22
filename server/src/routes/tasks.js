const express = require('express');
const { db } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const { ownerOrAdmin } = require('../middleware/rbac');
const router = express.Router();

// 1. Admin configures target (e.g., 30) for an employee
router.post('/target', authenticate, authorize(['admin']), async (req, res) => {
  const { employeeId, month, targetCount } = req.body;
  try {
    const existingSnap = await db.collection('targets')
      .where('employeeId', '==', employeeId)
      .where('month', '==', month)
      .get();
      
    if (!existingSnap.empty) {
      await db.collection('targets').doc(existingSnap.docs[0].id).update({ 
        targetCount: targetCount || 30 
      });
    } else {
      const id = Date.now().toString();
      await db.collection('targets').doc(id).set({
        id,
        employeeId,
        month,
        targetCount: targetCount || 30,
        achievedCount: 0
      });
    }
    res.json({ success: true, message: 'Workforce target saved.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Employee enters student records
router.post('/submit', authenticate, async (req, res) => {
  const { studentName, domain, collegeName, mailId, phoneNumber, totalAmount, amountPaid, remainingAmount, remainingAmountDate } = req.body;
  const employeeId = req.user.id;
  const month = new Date().toISOString().substring(0, 7); // YYYY-MM
  const id = Date.now().toString();

  try {
    // Save submission
    await db.collection('student_submissions').doc(id).set({
      id,
      employeeId,
      studentName,
      domain: domain || '',
      collegeName: collegeName || '',
      mailId: mailId || '',
      phoneNumber: phoneNumber || '',
      totalAmount: totalAmount || 0,
      amountPaid: amountPaid || 0,
      remainingAmount: remainingAmount || 0,
      remainingAmountDate: remainingAmountDate || '',
      date: new Date().toISOString()
    });

    // Increment target achievements
    const targetSnap = await db.collection('targets')
      .where('employeeId', '==', employeeId)
      .where('month', '==', month)
      .get();

    if (!targetSnap.empty) {
      const doc = targetSnap.docs[0];
      const newAchievedCount = (doc.data().achievedCount || 0) + 1;
      await db.collection('targets').doc(doc.id).update({ achievedCount: newAchievedCount });
    } else {
      const targetId = (Date.now() + 1).toString();
      await db.collection('targets').doc(targetId).set({
        id: targetId,
        employeeId,
        month,
        targetCount: 30,
        achievedCount: 1
      });
    }

    res.json({ success: true, message: 'Student metric recorded successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Performance summary
router.get('/performance', authenticate, async (req, res) => {
  const employeeId = req.query.employeeId || req.user.id;
  const month = req.query.month || new Date().toISOString().substring(0, 7);

  try {
    const targetSnap = await db.collection('targets')
      .where('employeeId', '==', employeeId)
      .where('month', '==', month)
      .get();
      
    let target = null;
    if (!targetSnap.empty) {
      target = targetSnap.docs[0].data();
    }

    const subSnap = await db.collection('student_submissions')
      .where('employeeId', '==', employeeId)
      .get();
      
    let submissions = subSnap.docs.map(doc => doc.data());
    submissions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json({
      target: target || { targetCount: 30, achievedCount: 0 },
      submissions: submissions || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Delete a submission
router.delete('/submit/:id', authenticate, ownerOrAdmin(async (req) => {
  const doc = await db.collection('student_submissions').doc(req.params.id).get();
  return doc.exists ? doc.data().employeeId : null;
}), async (req, res) => {
  try {
    const docRef = db.collection('student_submissions').doc(req.params.id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const data = doc.data();
    
    // ownerOrAdmin middleware enforces access

    const month = new Date(data.date).toISOString().substring(0, 7);
    
    // Delete the submission
    await docRef.delete();

    // Decrement the target achievement
    const targetSnap = await db.collection('targets')
      .where('employeeId', '==', data.employeeId)
      .where('month', '==', month)
      .get();

    if (!targetSnap.empty) {
      const targetDoc = targetSnap.docs[0];
      const newAchievedCount = Math.max((targetDoc.data().achievedCount || 1) - 1, 0);
      await db.collection('targets').doc(targetDoc.id).update({ achievedCount: newAchievedCount });
    }

    res.json({ success: true, message: 'Submission deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Update submission status (Call / Payment)
router.patch('/submit/:id/status', authenticate, ownerOrAdmin(async (req) => {
  const doc = await db.collection('student_submissions').doc(req.params.id).get();
  return doc.exists ? doc.data().employeeId : null;
}), async (req, res) => {
  const { callStatus, paymentStatus } = req.body;
  try {
    const docRef = db.collection('student_submissions').doc(req.params.id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const data = doc.data();
    
    // ownerOrAdmin middleware enforces access

    const updates = {};
    if (callStatus !== undefined) updates.callStatus = callStatus;
    if (paymentStatus !== undefined) updates.paymentStatus = paymentStatus;

    await docRef.update(updates);

    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
