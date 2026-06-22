const express = require('express');
const { db } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

router.post('/', authenticate, async (req, res) => {
  const { category, title, description, priority = 'Medium' } = req.body;
  try {
    const id = Date.now().toString();
    await db.collection('problems').doc(id).set({
      id,
      employeeId: req.user.id,
      category,
      title,
      description,
      priority,
      status: 'Pending',
      createdAt: new Date().toISOString()
    });

    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    let problems = [];
    if (req.user.role !== 'admin') {
      const snap = await db.collection('problems').where('employeeId', '==', req.user.id).get();
      problems = snap.docs.map(doc => doc.data());
    } else {
      const snap = await db.collection('problems').get();
      problems = snap.docs.map(doc => doc.data());
    }

    problems.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const empSnap = await db.collection('employees').get();
    const employeesMap = {};
    empSnap.docs.forEach(doc => {
      employeesMap[doc.id] = doc.data();
    });

    const formatted = problems.map(p => {
      const emp = employeesMap[p.employeeId] || {};
      return {
        ...p,
        employee: { name: emp.name || 'Unknown', department: emp.department || 'Unknown' }
      };
    });
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/status', authenticate, authorize(['admin']), async (req, res) => {
  const { status, resolutionNotes } = req.body;
  try {
    const updateData = { status };
    if (resolutionNotes) {
      updateData.resolutionNotes = resolutionNotes;
    }
    await db.collection('problems').doc(req.params.id).update(updateData);
    res.json({ message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/comments', authenticate, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Comment text is required' });
  try {
    const docRef = db.collection('problems').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'Problem not found' });
    
    const empDoc = await db.collection('employees').doc(req.user.id).get();
    const empName = empDoc.exists ? empDoc.data().name : 'Unknown';

    const newComment = {
      id: Date.now().toString(),
      text,
      senderId: req.user.id,
      senderName: empName,
      senderRole: req.user.role,
      createdAt: new Date().toISOString()
    };
    
    const comments = doc.data().comments || [];
    comments.push(newComment);
    
    await docRef.update({ comments });
    res.json({ message: 'Comment added', comment: newComment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
