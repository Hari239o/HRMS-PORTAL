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

// GET my team (as leader or member)
router.get('/my-team', authenticate, async (req, res) => {
  try {
    const employeeId = req.user.id;
    // First, see if they are a leader of any team
    let team = await prisma.team.findFirst({
      where: { leaderId: employeeId },
      include: {
        leader: { select: { id: true, name: true, email: true, avatar: true } },
        members: { select: { id: true, name: true, email: true, role: true, department: true, avatar: true } }
      }
    });

    // If not a leader, see if they are a member of a team
    if (!team) {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: {
          team: {
            include: {
              leader: { select: { id: true, name: true, email: true, avatar: true } },
              members: { select: { id: true, name: true, email: true, role: true, department: true, avatar: true } }
            }
          }
        }
      });
      team = employee?.team;
    }

    if (!team) {
      return res.json({ hasTeam: false });
    }

    // Calculate achieved team revenue for the current month
    const month = new Date().toISOString().substring(0, 7);
    const memberIds = team.members.map(m => m.id);
    if (team.leaderId) {
      memberIds.push(team.leaderId);
    }
    const targets = await prisma.target.findMany({
      where: {
        employeeId: { in: memberIds },
        month: month
      }
    });

    team.members = team.members.map(member => {
      const memberTarget = targets.find(t => t.employeeId === member.id);
      return {
        ...member,
        target: memberTarget || null
      };
    });

    const achievedTeamRevenue = targets.reduce((sum, target) => sum + (target.achievedRevenue || 0), 0);
    const achievedTeamCount = targets.reduce((sum, target) => sum + (target.achievedCount || 0), 0);

    res.json({ hasTeam: true, isLeader: team.leaderId === employeeId, team: { ...team, achievedTeamRevenue, achievedTeamCount } });
  } catch (error) {
    console.error('Error fetching my team:', error);
    res.status(500).json({ error: error.message });
  }
});

// CREATE a new team
router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  const { name, targetRevenue, leaderId, memberIds, color, image } = req.body;
  try {
    const newTeam = await prisma.team.create({
      data: {
        name,
        color: color || '#4f46e5',
        image: image || '',
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
  const { name, targetRevenue, leaderId, memberIds, color, image } = req.body;
  try {
    const team = await prisma.team.update({
      where: { id: req.params.id },
      data: {
        name,
        color: color || '#4f46e5',
        image: image || '',
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
