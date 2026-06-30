const express = require('express');
const prisma = require('../../prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/messages
// Get all messages for the current user
router.get('/', authenticate, async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: {
        receiverId: req.user.id
      },
      orderBy: {
        timestamp: 'desc'
      }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/messages
// Send a message
router.post('/', authenticate, async (req, res) => {
  const { receiverId, content, conversationId } = req.body;
  if (!receiverId || !content) {
    return res.status(400).json({ error: 'Receiver ID and content are required' });
  }

  try {
    const message = await prisma.message.create({
      data: {
        senderId: req.user.id,
        receiverId: receiverId,
        content: content,
        conversationId: conversationId || 'general',
        senderName: req.user.name,
        senderRole: req.user.role
      }
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
