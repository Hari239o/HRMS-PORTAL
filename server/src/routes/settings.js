const express = require('express');
const prisma = require('../../prisma/client');
const { authenticate } = require('../middleware/auth');
const { permitRoles } = require('../middleware/rbac');

const router = express.Router();

// Get settings
router.get('/', authenticate, async (req, res) => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'general' }
    });

    if (!setting) {
      return res.json({
        officeStartTime: '11:00',
        officeEndTime: '20:00'
      });
    }
    res.json(setting.value);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update settings (Admin only)
router.post('/', authenticate, permitRoles(['admin']), async (req, res) => {
  const { officeStartTime, officeEndTime } = req.body;
  
  const newValue = {
    officeStartTime: officeStartTime || '11:00',
    officeEndTime: officeEndTime || '20:00'
  };

  try {
    await prisma.setting.upsert({
      where: { key: 'general' },
      update: { value: newValue },
      create: {
        key: 'general',
        value: newValue
      }
    });
    
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
