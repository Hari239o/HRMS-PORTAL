const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../utils/uploadMiddleware');
const { uploadStreamToGCS, generateSignedUrl } = require('../utils/gcs');

// Get all jobs
router.get('/jobs', authenticate, async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' }
    });
    const formattedJobs = await Promise.all(jobs.map(async job => {
      return {
        ...job,
        jdUrl: job.jdUrl ? await generateSignedUrl(job.jdUrl, 60 * 24) : null
      };
    }));
    res.json(formattedJobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin creates a job
router.post('/jobs', authenticate, authorize(['admin', 'hr']), upload.single('jdFile'), async (req, res) => {
  const { title, department, description, requirements, salary, location, status } = req.body;
  try {
    let jdUrl = null;
    let gcsPath = null;
    if (req.file) {
      gcsPath = await uploadStreamToGCS(req.file, 'job_descriptions');
      jdUrl = gcsPath;
    }

    const newJob = await prisma.job.create({
      data: { title, department, description, requirements, salary, location, jdUrl, status: status || 'Open' }
    });
    
    if (gcsPath) {
      await prisma.fileMetadata.create({
        data: {
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          gcsPath: gcsPath,
          uploadedBy: req.user.id,
          entityType: 'Job',
          entityId: newJob.id
        }
      });
    }
    
    res.json(newJob);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin updates a job
router.patch('/jobs/:id', authenticate, authorize(['admin', 'hr']), async (req, res) => {
  const { title, department, description, requirements, salary, location, jdUrl, status } = req.body;
  try {
    const job = await prisma.job.update({
      where: { id: req.params.id },
      data: { title, department, description, requirements, salary, location, jdUrl, status }
    });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin deletes a job
router.delete('/jobs/:id', authenticate, authorize(['admin', 'hr']), async (req, res) => {
  try {
    await prisma.jobReferral.deleteMany({ where: { jobId: req.params.id } });
    await prisma.job.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Job deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Employee refers someone
router.post('/referrals', authenticate, async (req, res) => {
  const { jobId, candidateName, candidateEmail, candidatePhone, resumeUrl } = req.body;
  const employeeId = req.user.id;
  try {
    const referral = await prisma.jobReferral.create({
      data: {
        jobId,
        employeeId,
        candidateName,
        candidateEmail,
        candidatePhone,
        resumeUrl
      }
    });
    res.json(referral);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin gets all referrals
router.get('/referrals', authenticate, authorize(['admin', 'hr']), async (req, res) => {
  try {
    const referrals = await prisma.jobReferral.findMany({
      include: {
        job: true,
        employee: {
          select: { id: true, name: true, empId: true, department: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(referrals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin updates referral status
router.patch('/referrals/:id/status', authenticate, authorize(['admin', 'hr']), async (req, res) => {
  const { status } = req.body;
  try {
    const referral = await prisma.jobReferral.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json(referral);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
