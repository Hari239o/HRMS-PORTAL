const express = require('express');
const { db } = require('../db');
const { authenticate } = require('../middleware/auth');
const { permitRoles } = require('../middleware/rbac');

const router = express.Router();

// Get settings
router.get('/', authenticate, async (req, res) => {
  try {
    const doc = await db.collection('settings').doc('general').get();
    if (!doc.exists) {
      // Return defaults if not set
      return res.json({
        officeStartTime: '11:00',
        officeEndTime: '20:00'
      });
    }
    res.json(doc.data());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update settings (Admin only)
router.post('/', authenticate, permitRoles(['admin']), async (req, res) => {

  const { officeStartTime, officeEndTime } = req.body;
  try {
    await db.collection('settings').doc('general').set({
      officeStartTime: officeStartTime || '11:00',
      officeEndTime: officeEndTime || '20:00',
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
