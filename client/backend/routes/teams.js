const express = require('express');
const prisma = require('../../prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// GET all teams
router.get('/', authenticate, async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        leader: { select: { id: true, name: true, email: true } },
        members: { select: { id: true, name: true, email: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE a new team
router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  const { name, targetRevenue, leaderId, memberIds } = req.body;
  try {
    const newTeam = await prisma.team.create({
      data: {
        name,
        targetRevenue: parseFloat(targetRevenue) || 0,
        leader: { connect: { id: leaderId } },
        members: {
          connect: (memberIds || []).map(id => ({ id }))
        }
      }
    });
    res.json({ success: true, team: newTeam });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE a team
router.put('/:id', authenticate, authorize(['admin']), async (req, res) => {
  const { name, targetRevenue, leaderId, memberIds } = req.body;
  try {
    const team = await prisma.team.update({
      where: { id: req.params.id },
      data: {
        name,
        targetRevenue: parseFloat(targetRevenue) || 0,
        leader: { connect: { id: leaderId } },
        members: {
          set: [], // Clear existing relations
          connect: (memberIds || []).map(id => ({ id })) // Reconnect
        }
      }
    });
    res.json({ success: true, team });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a team
router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    await prisma.team.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true, message: 'Team deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
