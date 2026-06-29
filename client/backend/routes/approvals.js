const express = require('express');
const prisma = require('../../prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { ownerOrAdmin } = require('../middleware/rbac');

async function createNotification({ userId, title, message, type, data }) {
  await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      data: data || {},
      read: false
    }
  });
}

const router = express.Router();

async function createAuditLog({ requestId, event, performedBy, performedByName, performedByRole, details = {} }) {
  const payload = await prisma.approvalAuditLog.create({
    data: {
      requestId,
      event,
      performedBy: performedBy || 'system',
      performedByName: performedByName || 'System',
      performedByRole: performedByRole || 'system',
      details
    }
  });
  return payload;
}

function createTimelineEvent(action, user, comment = null, details = {}) {
  return {
    type: comment ? 'comment' : 'status',
    action,
    actorId: user.id,
    actorName: user.name || user.email || 'Unknown',
    actorRole: user.role || 'employee',
    comment: comment || null,
    details,
    createdAt: new Date().toISOString(),
  };
}

async function getAdmins() {
  return await prisma.employee.findMany({ where: { role: 'admin' } });
}

router.post('/', authenticate, async (req, res) => {
  try {
    const { type, title, description, requestedAmount, relatedEntity, relatedId, details } = req.body;

    if (!type || !title) {
      return res.status(400).json({ error: 'Request type and title are required' });
    }

    if (type === 'missed_checkout') {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const requestsThisMonth = await prisma.approval.count({
        where: {
          type: 'missed_checkout',
          requestedBy: req.user.id,
          createdAt: {
            gte: firstDayOfMonth
          }
        }
      });
      if (requestsThisMonth >= 4) {
        return res.status(403).json({ error: 'You have exceeded the maximum of 4 missed checkout requests per month.' });
      }
    }

    const emp = await prisma.employee.findUnique({ where: { id: req.user.id } }) || { name: req.user.name, email: req.user.email };

    const initialTimelineEvent = createTimelineEvent('created', { id: req.user.id, name: emp.name || req.user.name, role: req.user.role }, null, {
      type,
      title,
      requestedAmount: requestedAmount ? Number(requestedAmount) : null,
    });

    const request = await prisma.approval.create({
      data: {
        type,
        title,
        description: description || '',
        requestedAmount: requestedAmount ? Number(requestedAmount) : null,
        relatedEntity: relatedEntity || null,
        relatedId: relatedId || null,
        details: details || {},
        requestedBy: req.user.id,
        requestedByName: emp.name || req.user.name || '',
        requestedByEmail: emp.email || req.user.email || '',
        requestedByRole: req.user.role,
        status: 'pending',
        timeline: [initialTimelineEvent]
      }
    });

    await createAuditLog({ requestId: request.id, event: 'created', performedBy: req.user.id, performedByName: emp.name, performedByRole: req.user.role, details: { type, title, requestedAmount: request.requestedAmount } });

    const admins = await getAdmins();
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        title: 'Approval request submitted',
        message: `${emp.name || 'An employee'} submitted a ${type.replace('_', ' ')} request.`,
        type: 'approval',
        data: { requestId: request.id, requestType: type },
      });
    }

    res.json({ request });
  } catch (err) {
    console.error('Approval request creation failed:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const { status, type } = req.query;
    
    let whereClause = {};
    if (req.user.role !== 'admin') {
      whereClause.requestedBy = req.user.id;
    }
    if (status) {
      whereClause.status = status;
    }
    if (type) {
      whereClause.type = type;
    }

    const requests = await prisma.approval.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ requests });
  } catch (err) {
    console.error('Fetching approval requests failed:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, ownerOrAdmin(async (req) => {
  const prisma = require('../../prisma/client');
  const doc = await prisma.approval.findUnique({ where: { id: req.params.id } });
  return doc ? doc.requestedBy : null;
}), async (req, res) => {
  try {
    const request = await prisma.approval.findUnique({ where: { id: req.params.id } });
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json({ request });
  } catch (err) {
    console.error('Fetching request failed:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/comment', authenticate, ownerOrAdmin(async (req) => {
  const prisma = require('../../prisma/client');
  const doc = await prisma.approval.findUnique({ where: { id: req.params.id } });
  return doc ? doc.requestedBy : null;
}), async (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment || !comment.toString().trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const request = await prisma.approval.findUnique({ where: { id: req.params.id } });
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const actor = { id: req.user.id, name: req.user.name || req.user.email, role: req.user.role };
    const entry = createTimelineEvent('commented', actor, comment, {});
    
    const currentTimeline = request.timeline && Array.isArray(request.timeline) ? request.timeline : [];
    const updatedTimeline = [...currentTimeline, entry];

    const updatedRequest = await prisma.approval.update({
      where: { id: req.params.id },
      data: {
        timeline: updatedTimeline,
        lastActionAt: new Date()
      }
    });

    await createAuditLog({ requestId: request.id, event: 'comment_added', performedBy: req.user.id, performedByName: actor.name, performedByRole: actor.role, details: { comment } });

    if (req.user.role === 'admin') {
      await createNotification({
        userId: request.requestedBy,
        title: 'Approval request updated',
        message: `Admin commented on your request: ${comment.slice(0, 80)}`,
        type: 'approval',
        data: { requestId: request.id, requestType: request.type },
      });
    } else {
      const admins = await getAdmins();
      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          title: 'Comment added to approval request',
          message: `${actor.name} commented on a ${request.type.replace('_', ' ')} request.`,
          type: 'approval',
          data: { requestId: request.id, requestType: request.type },
        });
      }
    }

    res.json({ request: updatedRequest });
  } catch (err) {
    console.error('Adding comment failed:', err);
    res.status(500).json({ error: err.message });
  }
});

async function updateRequestStatus(requestId, status, performedBy, performedByName, performedByRole, details = {}) {
  const request = await prisma.approval.findUnique({ where: { id: requestId } });
  if (!request) {
    throw new Error('Request not found');
  }

  const actor = { id: performedBy, name: performedByName, role: performedByRole };
  const timelineEntry = createTimelineEvent(status, actor, details.reason || null, details);
  
  const currentTimeline = request.timeline && Array.isArray(request.timeline) ? request.timeline : [];

  const updateData = {
    status,
    timeline: [...currentTimeline, timelineEntry],
    lastActionAt: new Date()
  };

  if (details.approvedAmount !== undefined) {
    updateData.approvedAmount = Number(details.approvedAmount);
  }
  if (details.reason) {
    updateData.actionReason = details.reason;
  }

  const updatedRequest = await prisma.approval.update({
    where: { id: requestId },
    data: updateData
  });

  await createAuditLog({ requestId, event: status, performedBy, performedByName, performedByRole, details });
  return updatedRequest;
}

router.post('/:id/approve', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { approvedAmount, note } = req.body;
    const updatedRequest = await updateRequestStatus(req.params.id, 'approved', req.user.id, req.user.name, req.user.role, {
      approvedAmount: approvedAmount ? Number(approvedAmount) : undefined,
      reason: note || null,
    });

    await createNotification({
      userId: updatedRequest.requestedBy,
      title: 'Approval request approved',
      message: `Your ${updatedRequest.type.replace('_', ' ')} request has been approved.`,
      type: 'approval',
      data: { requestId: updatedRequest.id, requestType: updatedRequest.type },
    });

    res.json({ request: updatedRequest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/reject', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.toString().trim()) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const updatedRequest = await updateRequestStatus(req.params.id, 'rejected', req.user.id, req.user.name, req.user.role, { reason });
    
    await createNotification({
      userId: updatedRequest.requestedBy,
      title: 'Approval request rejected',
      message: `Your ${updatedRequest.type.replace('_', ' ')} request was rejected: ${reason}`,
      type: 'approval',
      data: { requestId: updatedRequest.id, requestType: updatedRequest.type },
    });

    res.json({ request: updatedRequest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/request-changes', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.toString().trim()) {
      return res.status(400).json({ error: 'Change request reason is required' });
    }

    const updatedRequest = await updateRequestStatus(req.params.id, 'changes_requested', req.user.id, req.user.name, req.user.role, { reason });

    await createNotification({
      userId: updatedRequest.requestedBy,
      title: 'Changes requested',
      message: `More information is required for your ${updatedRequest.type.replace('_', ' ')} request.`,
      type: 'approval',
      data: { requestId: updatedRequest.id, requestType: updatedRequest.type },
    });

    res.json({ request: updatedRequest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/cancel', authenticate, ownerOrAdmin(async (req) => {
  const prisma = require('../../prisma/client');
  const doc = await prisma.approval.findUnique({ where: { id: req.params.id } });
  return doc ? doc.requestedBy : null;
}), async (req, res) => {
  try {
    const request = await prisma.approval.findUnique({ where: { id: req.params.id } });
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'pending' && request.status !== 'changes_requested') {
      return res.status(400).json({ error: 'Only pending or change-requested requests can be cancelled' });
    }

    const updatedRequest = await updateRequestStatus(req.params.id, 'cancelled', req.user.id, req.user.name, req.user.role, { reason: 'Cancelled by user' });

    await createNotification({
      userId: request.requestedBy,
      title: 'Approval request cancelled',
      message: `Your ${request.type.replace('_', ' ')} request was cancelled.`, 
      type: 'approval',
      data: { requestId: request.id, requestType: request.type },
    });

    res.json({ request: updatedRequest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/audit', authenticate, ownerOrAdmin(async (req) => {
  const prisma = require('../../prisma/client');
  const doc = await prisma.approval.findUnique({ where: { id: req.params.id } });
  return doc ? doc.requestedBy : null;
}), async (req, res) => {
  try {
    const request = await prisma.approval.findUnique({ where: { id: req.params.id } });
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const auditLogs = await prisma.approvalAuditLog.findMany({
      where: { requestId: req.params.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ auditLogs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
