const express = require('express');
const prisma = require('../../prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadDocument } = require('../utils/cloudinary');
const router = express.Router();

router.post('/', authenticate, uploadDocument.single('document'), async (req, res) => {
  const { category, title, description, priority = 'Medium' } = req.body;
  try {
    let documentUrl = null;
    if (req.file) {
      documentUrl = req.file.path.startsWith('http') ? req.file.path : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
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

    const formatted = problems.map(p => {
      const emp = employeesMap[p.employeeId] || {};
      return {
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
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
    await prisma.problem.update({
      where: { id: req.params.id },
      data: updateData
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

    res.json({ message: 'Comment added', comment: newComment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
