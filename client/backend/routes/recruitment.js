const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

// Get all jobs
router.get('/jobs', authenticate, async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin creates a job
router.post('/jobs', authenticate, authorize(['admin']), async (req, res) => {
  const { title, department, description, requirements, status } = req.body;
  try {
    const newJob = await prisma.job.create({
      data: { title, department, description, requirements, status: status || 'Open' }
    });
    res.json(newJob);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin updates a job
router.patch('/jobs/:id', authenticate, authorize(['admin']), async (req, res) => {
  const { title, department, description, requirements, status } = req.body;
  try {
    const job = await prisma.job.update({
      where: { id: req.params.id },
      data: { title, department, description, requirements, status }
    });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin deletes a job
router.delete('/jobs/:id', authenticate, authorize(['admin']), async (req, res) => {
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
router.get('/referrals', authenticate, authorize(['admin']), async (req, res) => {
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
router.patch('/referrals/:id/status', authenticate, authorize(['admin']), async (req, res) => {
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
