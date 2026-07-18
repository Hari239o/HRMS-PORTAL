const express = require('express');
const prisma = require('../../prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../utils/uploadMiddleware');
const { uploadStreamToGCS, generateSignedUrl } = require('../utils/gcs');
const router = express.Router();

router.post('/', authenticate, upload.single('document'), async (req, res) => {
  const { category, title, description, priority = 'Medium' } = req.body;
  try {
    let documentUrl = null;
    let gcsPath = null;
    if (req.file) {
      gcsPath = await uploadStreamToGCS(req.file, 'problem_documents');
      documentUrl = gcsPath;
    }

    const problem = await prisma.problem.create({
      data: {
        employeeId: req.user.id,
        category,
        title,
        description,
        priority,
        status: 'Pending',
        documentUrl,
        comments: []
      }
    });

    if (gcsPath) {
      await prisma.fileMetadata.create({
        data: {
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          gcsPath: gcsPath,
          uploadedBy: req.user.id,
          entityType: 'Problem',
          entityId: problem.id
        }
      });
    }

    // Notify admins about new issue
    try {
      const admins = await prisma.employee.findMany({ where: { role: 'admin' } });
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: 'New Helpdesk Issue',
            message: `Hey Admin! 👋 There's a new task waiting for you at Geonixa. ${req.user.name || 'An employee'} just raised a Helpdesk Issue (${title}). Could you take a look?`,
            type: 'problem_creation',
            data: { problemId: problem.id }
          }
        });
      }
    } catch (err) {
      console.error('Failed to notify admins of new problem:', err);
    }

    res.json({ id: problem.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    let whereClause = {};
    if (req.user.role !== 'admin') {
      whereClause.employeeId = req.user.id;
    }

    const problems = await prisma.problem.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    const employees = await prisma.employee.findMany();
    const employeesMap = {};
    employees.forEach(emp => {
      employeesMap[emp.id] = emp;
    });

    const formatted = await Promise.all(problems.map(async p => {
      const emp = employeesMap[p.employeeId] || {};
      return {
        ...p,
        documentUrl: p.documentUrl ? await generateSignedUrl(p.documentUrl, 60) : null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        employee: { name: emp.name || 'Unknown', department: emp.department || 'Unknown', empId: emp.empId || 'UNKN' }
      };
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/status', authenticate, authorize(['admin', 'hr']), async (req, res) => {
  const { status, resolutionNotes } = req.body;
  try {
    const updateData = { status };
    if (resolutionNotes) {
      updateData.resolutionNotes = resolutionNotes;
    }
    const updatedProblem = await prisma.problem.update({
      where: { id: req.params.id },
      data: updateData
    });
    
    // Notify employee about status update
    await prisma.notification.create({
      data: {
        userId: updatedProblem.employeeId,
        title: 'Issue Status Updated',
        message: `Hey there! Your Helpdesk Issue has been updated to ${status} by Geonixa Admin.${resolutionNotes ? ' Notes: ' + resolutionNotes : ''}`,
        type: 'problem_status',
        data: { problemId: updatedProblem.id, status }
      }
    });

    res.json({ message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/comments', authenticate, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Comment text is required' });
  try {
    const problem = await prisma.problem.findUnique({ where: { id: req.params.id } });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });
    
    const emp = await prisma.employee.findUnique({ where: { id: req.user.id } });
    const empName = emp ? emp.name : 'Unknown';

    const newComment = {
      id: Date.now().toString(),
      text,
      senderId: req.user.id,
      senderName: empName,
      senderRole: req.user.role,
      createdAt: new Date().toISOString()
    };
    
    const currentComments = problem.comments && Array.isArray(problem.comments) ? problem.comments : [];
    currentComments.push(newComment);
    
    await prisma.problem.update({
      where: { id: req.params.id },
      data: { comments: currentComments }
    });

    // Notify the other party
    if (req.user.role === 'admin') {
      await prisma.notification.create({
        data: {
          userId: problem.employeeId,
          title: 'New Reply on Issue',
          message: `Hey there! Geonixa Admin just replied to your Helpdesk Issue.`,
          type: 'problem_comment',
          data: { problemId: problem.id }
        }
      });
    } else {
      const admins = await prisma.employee.findMany({ where: { role: 'admin' } });
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: 'New Reply on Issue',
            message: `${empName} just replied to their Helpdesk Issue.`,
            type: 'problem_comment',
            data: { problemId: problem.id }
          }
        });
      }
    }

    res.json({ message: 'Comment added', comment: newComment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
