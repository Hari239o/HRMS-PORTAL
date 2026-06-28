const express = require('express');
const prisma = require('../../prisma/client');
const { authenticate } = require('../middleware/auth');
const { permitRoles } = require('../middleware/rbac');
const upload = require('../utils/uploadMiddleware');
const { uploadStreamToGCS, generateSignedUrl } = require('../utils/gcs');

const router = express.Router();

// Get settings
router.get('/', authenticate, async (req, res) => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'general' }
    });

    let value = setting ? setting.value : {
      officeStartTime: '11:00',
      officeEndTime: '20:00',
      companyLogo: null
    };

    if (value.companyLogo) {
      value.companyLogoUrl = await generateSignedUrl(value.companyLogo, 60);
    }

    res.json(value);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update settings (Admin only)
router.post('/', authenticate, permitRoles(['admin']), async (req, res) => {
  const { officeStartTime, officeEndTime, companyLogo } = req.body;
  
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'general' } });
    const currentValue = setting ? setting.value : {};

    const newValue = {
      officeStartTime: officeStartTime || currentValue.officeStartTime || '11:00',
      officeEndTime: officeEndTime || currentValue.officeEndTime || '20:00',
      companyLogo: companyLogo || currentValue.companyLogo || null
    };

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

// Upload Company Logo
router.post('/logo', authenticate, permitRoles(['admin']), upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const gcsPath = await uploadStreamToGCS(req.file, 'company_assets');

    // Track metadata
    await prisma.fileMetadata.create({
      data: {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        gcsPath: gcsPath,
        uploadedBy: req.user.id,
        entityType: 'Setting',
        entityId: 'general'
      }
    });

    const setting = await prisma.setting.findUnique({ where: { key: 'general' } });
    const currentValue = setting ? setting.value : { officeStartTime: '11:00', officeEndTime: '20:00' };

    currentValue.companyLogo = gcsPath;

    await prisma.setting.upsert({
      where: { key: 'general' },
      update: { value: currentValue },
      create: {
        key: 'general',
        value: currentValue
      }
    });

    const publicUrl = await generateSignedUrl(gcsPath, 60);

    res.json({ message: 'Logo uploaded successfully', logoUrl: publicUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
