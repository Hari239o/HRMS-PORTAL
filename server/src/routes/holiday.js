const express = require('express');
const { db } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  const { name, date, type } = req.body;
  try {
    const id = Date.now().toString();
    await db.collection('holiday').doc(id).set({
      id,
      name,
      date,
      type
    });
    res.status(201).json({ id, name, date, type });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const snap = await db.collection('holiday').orderBy('date', 'asc').get();
    const holidays = snap.docs.map(doc => doc.data());
    res.json(holidays);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    await db.collection('holiday').doc(req.params.id).delete();
    res.json({ message: 'Holiday deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
