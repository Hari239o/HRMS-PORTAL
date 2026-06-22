const express = require('express');
const { db } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const { ownerOrAdmin } = require('../middleware/rbac');
async function createNotification({ userId, title, message, type, data }) {
  const notificationId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  await db.collection('notifications').doc(notificationId).set({
    id: notificationId,
    userId,
    title,
    message,
    type,
    data: data || {},
    read: false,
    createdAt: new Date().toISOString()
  });
}
const router = express.Router();

const APPROVAL_COLLECTION = 'approval_requests';
const APPROVAL_AUDIT_COLLECTION = 'approval_audit_logs';

const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

async function createAuditLog({ requestId, event, performedBy, performedByName, performedByRole, details = {} }) {
  const id = generateId('audit');
  const payload = {
    id,
    requestId,
    event,
    performedBy: performedBy || 'system',
    performedByName: performedByName || 'System',
    performedByRole: performedByRole || 'system',
    details,
    createdAt: new Date().toISOString(),
  };
  await db.collection(APPROVAL_AUDIT_COLLECTION).doc(id).set(payload);
  return payload;
}

function createTimelineEvent(action, user, comment = null, details = {}) {
  return {
    id: generateId('timeline'),
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

async function getAdminIds() {
  const snapshot = await db.collection('employees').where('role', '==', 'admin').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

router.post('/', authenticate, async (req, res) => {
  try {
    const { type, title, description, requestedAmount, relatedEntity, relatedId, details } = req.body;

    if (!type || !title) {
      return res.status(400).json({ error: 'Request type and title are required' });
    }

    const empDoc = await db.collection('employees').doc(req.user.id).get();
    const emp = empDoc.exists ? empDoc.data() : { name: req.user.name || '', email: req.user.email || '' };

    const requestId = generateId('apr');
    const request = {
      id: requestId,
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
      timeline: [
        createTimelineEvent('created', { id: req.user.id, name: emp.name || req.user.name, role: req.user.role }, null, {
          type,
          title,
          requestedAmount: requestedAmount ? Number(requestedAmount) : null,
        }),
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActionAt: new Date().toISOString(),
    };

    await db.collection(APPROVAL_COLLECTION).doc(requestId).set(request);
    await createAuditLog({ requestId, event: 'created', performedBy: req.user.id, performedByName: emp.name, performedByRole: req.user.role, details: { type, title, requestedAmount: request.requestedAmount } });

    const admins = await getAdminIds();
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        title: 'Approval request submitted',
        message: `${emp.name || 'An employee'} submitted a ${type.replace('_', ' ')} request.`,
        type: 'approval',
        data: { requestId, requestType: type },
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
    let query = db.collection(APPROVAL_COLLECTION).orderBy('createdAt', 'desc');

    if (req.user.role !== 'admin') {
      query = db.collection(APPROVAL_COLLECTION).where('requestedBy', '==', req.user.id).orderBy('createdAt', 'desc');
    }

    const snapshot = await query.get();
    let requests = snapshot.docs.map((doc) => doc.data());
    if (status) {
      requests = requests.filter((request) => request.status === status);
    }
    if (type) {
      requests = requests.filter((request) => request.type === type);
    }

    res.json({ requests });
  } catch (err) {
    console.error('Fetching approval requests failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// Allow owner (requester) or admin to view a specific approval request
router.get('/:id', authenticate, ownerOrAdmin(async (req) => {
  const requestDoc = await db.collection(APPROVAL_COLLECTION).doc(req.params.id).get();
  return requestDoc.exists ? requestDoc.data().requestedBy : null;
}), async (req, res) => {
  try {
    const requestId = req.params.id;
    const requestDoc = await db.collection(APPROVAL_COLLECTION).doc(requestId).get();
    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requestDoc.data();
    // ownerOrAdmin middleware enforces access

    res.json({ request });
  } catch (err) {
    console.error('Fetching request failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// Allow owner (requester) or admin to comment
router.post('/:id/comment', authenticate, ownerOrAdmin(async (req) => {
  const requestDoc = await db.collection(APPROVAL_COLLECTION).doc(req.params.id).get();
  return requestDoc.exists ? requestDoc.data().requestedBy : null;
}), async (req, res) => {
  try {
    const requestId = req.params.id;
    const { comment } = req.body;
    if (!comment || !comment.toString().trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const requestRef = db.collection(APPROVAL_COLLECTION).doc(requestId);
    const requestDoc = await requestRef.get();
    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requestDoc.data();
    // ownerOrAdmin middleware enforces access

    const actor = { id: req.user.id, name: req.user.name || req.user.email, role: req.user.role };
    const entry = createTimelineEvent('commented', actor, comment, {});
    const updatedTimeline = [...(request.timeline || []), entry];
    const updatedRequest = {
      ...request,
      timeline: updatedTimeline,
      updatedAt: new Date().toISOString(),
      lastActionAt: new Date().toISOString(),
    };

    await requestRef.update(updatedRequest);
    await createAuditLog({ requestId, event: 'comment_added', performedBy: req.user.id, performedByName: actor.name, performedByRole: actor.role, details: { comment } });

    if (req.user.role === 'admin') {
      await createNotification({
        userId: request.requestedBy,
        title: 'Approval request updated',
        message: `Admin commented on your request: ${comment.slice(0, 80)}`,
        type: 'approval',
        data: { requestId, requestType: request.type },
      });
    } else {
      const admins = await getAdminIds();
      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          title: 'Comment added to approval request',
          message: `${actor.name} commented on a ${request.type.replace('_', ' ')} request.`,
          type: 'approval',
          data: { requestId, requestType: request.type },
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
  const requestRef = db.collection(APPROVAL_COLLECTION).doc(requestId);
  const requestDoc = await requestRef.get();
  if (!requestDoc.exists) {
    throw new Error('Request not found');
  }

  const request = requestDoc.data();
  const actor = { id: performedBy, name: performedByName, role: performedByRole };
  const timelineEntry = createTimelineEvent(status, actor, details.reason || null, details);
  const updatedRequest = {
    ...request,
    status,
    timeline: [...(request.timeline || []), timelineEntry],
    updatedAt: new Date().toISOString(),
    lastActionAt: new Date().toISOString(),
  };

  if (details.approvedAmount !== undefined) {
    updatedRequest.approvedAmount = Number(details.approvedAmount);
  }

  if (details.reason) {
    updatedRequest.actionReason = details.reason;
  }

  await requestRef.update(updatedRequest);
  await createAuditLog({ requestId, event: status, performedBy, performedByName, performedByRole, details });
  return updatedRequest;
}

router.post('/:id/approve', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { approvedAmount, note } = req.body;
    const requestId = req.params.id;
    const updatedRequest = await updateRequestStatus(requestId, 'approved', req.user.id, req.user.name, req.user.role, {
      approvedAmount: approvedAmount ? Number(approvedAmount) : undefined,
      reason: note || null,
    });

    const request = await db.collection(APPROVAL_COLLECTION).doc(requestId).get().then((doc) => doc.data());
    await createNotification({
      userId: request.requestedBy,
      title: 'Approval request approved',
      message: `Your ${request.type.replace('_', ' ')} request has been approved.`,
      type: 'approval',
      data: { requestId, requestType: request.type },
    });

    res.json({ request: updatedRequest });
  } catch (err) {
    console.error('Approving request failed:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/reject', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.toString().trim()) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const requestId = req.params.id;
    const updatedRequest = await updateRequestStatus(requestId, 'rejected', req.user.id, req.user.name, req.user.role, { reason });
    const request = await db.collection(APPROVAL_COLLECTION).doc(requestId).get().then((doc) => doc.data());

    await createNotification({
      userId: request.requestedBy,
      title: 'Approval request rejected',
      message: `Your ${request.type.replace('_', ' ')} request was rejected: ${reason}`,
      type: 'approval',
      data: { requestId, requestType: request.type },
    });

    res.json({ request: updatedRequest });
  } catch (err) {
    console.error('Rejecting request failed:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/request-changes', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.toString().trim()) {
      return res.status(400).json({ error: 'Change request reason is required' });
    }

    const requestId = req.params.id;
    const updatedRequest = await updateRequestStatus(requestId, 'changes_requested', req.user.id, req.user.name, req.user.role, { reason });
    const request = await db.collection(APPROVAL_COLLECTION).doc(requestId).get().then((doc) => doc.data());

    await createNotification({
      userId: request.requestedBy,
      title: 'Changes requested',
      message: `More information is required for your ${request.type.replace('_', ' ')} request.`,
      type: 'approval',
      data: { requestId, requestType: request.type },
    });

    res.json({ request: updatedRequest });
  } catch (err) {
    console.error('Requesting changes failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// Allow owner (requester) or admin to cancel
router.post('/:id/cancel', authenticate, ownerOrAdmin(async (req) => {
  const requestDoc = await db.collection(APPROVAL_COLLECTION).doc(req.params.id).get();
  return requestDoc.exists ? requestDoc.data().requestedBy : null;
}), async (req, res) => {
  try {
    const requestId = req.params.id;
    const requestDoc = await db.collection(APPROVAL_COLLECTION).doc(requestId).get();
    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requestDoc.data();
    // ownerOrAdmin middleware enforces access

    if (request.status !== 'pending' && request.status !== 'changes_requested') {
      return res.status(400).json({ error: 'Only pending or change-requested requests can be cancelled' });
    }

    const updatedRequest = await updateRequestStatus(requestId, 'cancelled', req.user.id, req.user.name, req.user.role, { reason: 'Cancelled by user' });

    await createNotification({
      userId: request.requestedBy,
      title: 'Approval request cancelled',
      message: `Your ${request.type.replace('_', ' ')} request was cancelled.`, 
      type: 'approval',
      data: { requestId, requestType: request.type },
    });

    res.json({ request: updatedRequest });
  } catch (err) {
    console.error('Cancelling request failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// Allow owner (requester) or admin to view audit logs
router.get('/:id/audit', authenticate, ownerOrAdmin(async (req) => {
  const requestDoc = await db.collection(APPROVAL_COLLECTION).doc(req.params.id).get();
  return requestDoc.exists ? requestDoc.data().requestedBy : null;
}), async (req, res) => {
  try {
    const requestId = req.params.id;
    const requestDoc = await db.collection(APPROVAL_COLLECTION).doc(requestId).get();
    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requestDoc.data();
    // ownerOrAdmin middleware enforces access

    const snap = await db.collection(APPROVAL_AUDIT_COLLECTION)
      .where('requestId', '==', requestId)
      .orderBy('createdAt', 'desc')
      .get();

    const auditLogs = snap.docs.map((doc) => doc.data());
    res.json({ auditLogs });
  } catch (err) {
    console.error('Fetching audit logs failed:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
