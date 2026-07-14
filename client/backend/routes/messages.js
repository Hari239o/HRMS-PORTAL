const express = require('express');
const prisma = require('../../prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { triggerNotification } = require('../utils/knock');

const router = express.Router();

// GET /api/messages/conversations
// Get all unique conversations (Admin/HR only)
router.get('/conversations', authenticate, authorize(['admin', 'hr']), async (req, res) => {
  try {
    // Get distinct conversationIds
    const distinctConversations = await prisma.message.findMany({
      distinct: ['conversationId'],
      orderBy: {
        timestamp: 'desc'
      },
      select: {
        conversationId: true
      }
    });

    const conversations = [];

    for (const item of distinctConversations) {
      const employeeId = item.conversationId;
      if (!employeeId || employeeId === 'general') continue;

      // Fetch employee info
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          department: true
        }
      });

      if (!employee) continue;

      // Get latest message in this conversation
      const latestMessage = await prisma.message.findFirst({
        where: { conversationId: employeeId },
        orderBy: { timestamp: 'desc' }
      });

      conversations.push({
        employee,
        latestMessage
      });
    }

    // Sort by latest message timestamp descending
    conversations.sort((a, b) => {
      const tA = a.latestMessage ? new Date(a.latestMessage.timestamp) : 0;
      const tB = b.latestMessage ? new Date(b.latestMessage.timestamp) : 0;
      return tB - tA;
    });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/messages/:conversationId
// Get all messages for a specific conversation
router.get('/:conversationId', authenticate, async (req, res) => {
  const { conversationId } = req.params;

  // Employees can only access their own conversation
  if (req.user.role !== 'admin' && req.user.role !== 'hr' && req.user.id !== conversationId) {
    return res.status(403).json({ error: 'Access denied. You can only view your own support conversation.' });
  }

  try {
    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversationId
      },
      orderBy: {
        timestamp: 'asc'
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
  if (!content) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  const senderId = req.user.id;
  const isSenderAdminOrHr = req.user.role === 'admin' || req.user.role === 'hr';
  
  // If conversationId is not provided:
  // - If employee sends, conversationId is their own ID
  // - If Admin/HR sends, conversationId is the receiver's ID (which is the employee ID)
  const finalConversationId = conversationId || (isSenderAdminOrHr ? receiverId : senderId);

  if (!finalConversationId) {
    return res.status(400).json({ error: 'Receiver ID or Conversation ID is required' });
  }

  try {
    // Resolve receiver
    let finalReceiverId = receiverId;
    if (!finalReceiverId) {
      if (!isSenderAdminOrHr) {
        // Employee sending to support. We can set receiverId to 'support' or keep it empty, 
        // but we will target admins/hr for notifications.
        finalReceiverId = 'support';
      } else {
        // Admin sending to employee
        finalReceiverId = finalConversationId;
      }
    }

    const message = await prisma.message.create({
      data: {
        senderId: senderId,
        receiverId: finalReceiverId,
        content: content,
        conversationId: finalConversationId,
        senderName: req.user.name,
        senderRole: req.user.role
      }
    });

    // Trigger Notification(s)
    const title = `New message from ${req.user.name}`;
    const truncatedContent = content.length > 60 ? content.substring(0, 60) + '...' : content;

    if (finalReceiverId === 'support') {
      // Notify all admins and HRs
      const supportStaff = await prisma.employee.findMany({
        where: {
          role: { in: ['admin', 'hr'] }
        }
      });

      for (const staff of supportStaff) {
        if (staff.id === senderId) continue; // don't notify self

        // Save DB Notification
        await prisma.notification.create({
          data: {
            userId: staff.id,
            title: title,
            message: truncatedContent,
            type: 'chat_message',
            data: { conversationId: finalConversationId }
          }
        });

        // Trigger Knock if available
        try {
          await triggerNotification('new-message', staff.id, {
            senderName: req.user.name,
            content: truncatedContent,
            conversationId: finalConversationId
          });
        } catch (err) {
          console.warn('Knock failed:', err.message);
        }
      }
    } else {
      // Notify the specific recipient
      if (finalReceiverId !== senderId) {
        // Save DB Notification
        await prisma.notification.create({
          data: {
            userId: finalReceiverId,
            title: title,
            message: truncatedContent,
            type: 'chat_message',
            data: { conversationId: finalConversationId }
          }
        });

        // Trigger Knock if available
        try {
          await triggerNotification('new-message', finalReceiverId, {
            senderName: req.user.name,
            content: truncatedContent,
            conversationId: finalConversationId
          });
        } catch (err) {
          console.warn('Knock failed:', err.message);
        }
      }
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

