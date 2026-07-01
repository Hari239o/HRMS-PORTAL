const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../../prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../utils/uploadMiddleware');
const { uploadStreamToGCS, generateSignedUrl } = require('../utils/gcs');
const { sendEmail } = require('../utils/email');

const router = express.Router();

router.get('/', authenticate, authorize(['admin', 'hr']), async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { name: 'asc' }
    });

    const formattedEmployees = await Promise.all(employees.map(async (emp) => {
      let docs = typeof emp.documents === 'string' ? JSON.parse(emp.documents) : (emp.documents || {});
      // Note: We no longer sign documents here for performance. They are fetched on demand.
      return {
        ...emp,
        joinedAt: emp.createdAt,
        avatar: emp.avatar ? await generateSignedUrl(emp.avatar, 60 * 24 * 7) : '',
        assets: emp.assets || '',
        weekOff: emp.weekOff || 'Sunday',
        starPerformer: emp.starPerformer || 'none',
        deviceId: emp.deviceId || null,
        documents: docs,
        manager: emp.manager || '',
        hrManager: emp.hrManager || '',
        teamLeader: emp.teamLeader || '',
        empId: emp.empId || '',
        designation: emp.designation || '',
        pan: emp.pan || '',
        uan: emp.uan || '',
        bankName: emp.bankName || '',
        accountNumber: emp.accountNumber || ''
      };
    }));

    res.json(formattedEmployees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/star-performers', authenticate, async (req, res) => {
  try {
    const performers = await prisma.employee.findMany({
      where: { starPerformer: { in: ['week', 'month'] } }
    });

    const formattedPerformers = await Promise.all(performers.map(async emp => ({
      id: emp.id,
      name: emp.name,
      department: emp.department,
      starPerformer: emp.starPerformer,
      avatar: emp.avatar ? await generateSignedUrl(emp.avatar, 60 * 24 * 7) : ''
    })));

    res.json(formattedPerformers);
  } catch (error) {
    console.error('Error fetching star performers:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/directory', authenticate, async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { name: 'asc' }
    });

    const directory = await Promise.all(employees.map(async emp => {
      let docs = typeof emp.documents === 'string' ? JSON.parse(emp.documents) : (emp.documents || {});
      // Note: Documents are not signed here for performance.
      return {
        id: emp.id,
        name: emp.name,
        role: emp.role,
        department: emp.department,
        avatar: emp.avatar ? await generateSignedUrl(emp.avatar, 60 * 24 * 7) : '',
        email: emp.email,
        weekOff: emp.weekOff || 'Sunday',
        assets: emp.assets || '',
        documents: docs,
        empId: emp.empId || '',
        designation: emp.designation || ''
      };
    }));

    res.json(directory);
  } catch (error) {
    console.error('Error fetching directory:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/documents', authenticate, async (req, res) => {
  try {
    const emp = await prisma.employee.findUnique({
      where: { id: req.params.id }
    });
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    
    let docs = typeof emp.documents === 'string' ? JSON.parse(emp.documents) : (emp.documents || {});
    for (const [key, value] of Object.entries(docs)) {
      docs[key] = await generateSignedUrl(value, 60);
    }
    res.json(docs);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/org-structure', authenticate, async (req, res) => {
  try {
    const emp = await prisma.employee.findUnique({
      where: { id: req.params.id }
    });
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const resolveProfile = async (id) => {
      if (!id) return null;
      try {
        const profile = await prisma.employee.findUnique({ where: { id } });
        if (profile) {
          return { name: profile.name, avatar: profile.avatar ? await generateSignedUrl(profile.avatar, 60 * 24 * 7) : '', email: profile.email, role: profile.role, department: profile.department };
        }
        return null;
      } catch (e) {
        return null;
      }
    };

    const [managerProfile, hrProfile, teamLeaderProfile] = await Promise.all([
      resolveProfile(emp.manager),
      resolveProfile(emp.hrManager),
      resolveProfile(emp.teamLeader)
    ]);

    let teamMembers = [];
    try {
      const targetId = req.params.id;
      const teamQuery = { OR: [{ manager: targetId }, { teamLeader: targetId }] };
      
      const tPrisma = await prisma.employee.findMany({ where: teamQuery });
      teamMembers = await Promise.all(tPrisma.map(async t => ({
        id: t.id,
        name: t.name,
        avatar: t.avatar ? await generateSignedUrl(t.avatar, 60) : '',
        role: t.role,
        email: t.email,
        designation: t.designation || ''
      })));
    } catch (err) {
      console.log('Error fetching team members', err);
    }

    res.json({
      id: emp.id,
      name: emp.name,
      avatar: emp.avatar ? await generateSignedUrl(emp.avatar, 60 * 24 * 7) : '',
      role: emp.role,
      designation: emp.designation || '',
      department: emp.department || '',
      managerProfile,
      hrProfile,
      teamLeaderProfile,
      teamMembers
    });
  } catch (error) {
    console.error('Error fetching org structure:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const emp = await prisma.employee.findUnique({
      where: { id: req.user.id }
    });
    
    if (!emp) return res.status(404).json({ error: 'User not found' });

    const resolveProfile = async (id) => {
      if (!id) return null;
      try {
        const profile = await prisma.employee.findUnique({ where: { id } });
        if (profile) {
          return { name: profile.name, avatar: profile.avatar ? await generateSignedUrl(profile.avatar, 60 * 24 * 7) : '', email: profile.email, role: profile.role };
        }
        return null;
      } catch (e) {
        return null;
      }
    };

    const [managerProfile, hrProfile, teamLeaderProfile] = await Promise.all([
      resolveProfile(emp.manager),
      resolveProfile(emp.hrManager),
      resolveProfile(emp.teamLeader)
    ]);

    // Fetch Team Members
    let teamMembers = [];
    try {
      const targetId = req.user.id;
      const teamQuery = { OR: [{ manager: targetId }, { teamLeader: targetId }] };
      
      const tPrisma = await prisma.employee.findMany({ where: teamQuery });
      teamMembers = await Promise.all(tPrisma.map(async t => ({
        id: t.id,
        name: t.name,
        avatar: t.avatar ? await generateSignedUrl(t.avatar, 60) : '',
        role: t.role,
        email: t.email
      })));
    } catch (err) {
      console.log('Error fetching team members', err);
    }

    let docs = typeof emp.documents === 'string' ? JSON.parse(emp.documents) : (emp.documents || {});
    await Promise.all(
      Object.entries(docs).map(async ([key, value]) => {
        docs[key] = await generateSignedUrl(value, 60);
      })
    );

    res.json({ 
      ...emp,
      avatar: emp.avatar ? await generateSignedUrl(emp.avatar, 60 * 24 * 7) : '',
      assets: emp.assets || '',
      weekOff: emp.weekOff || 'Sunday',
      manager: emp.manager || '',
      hrManager: emp.hrManager || '',
      teamLeader: emp.teamLeader || '',
      empId: emp.empId || '',
      designation: emp.designation || '',
      pan: emp.pan || '',
      uan: emp.uan || '',
      bankName: emp.bankName || '',
      accountNumber: emp.accountNumber || '',
      documents: docs,
      managerProfile,
      hrProfile,
      teamLeaderProfile,
      teamMembers
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, authorize(['admin', 'hr']), async (req, res) => {
  const { name, email, password, role, department, avatar, assets, weekOff, manager, hrManager, teamLeader, empId, designation, pan, uan, bankName, accountNumber } = req.body;
  try {
    const isSuperAdmin = req.user.role === 'admin' || req.user.email === 'harikishorereddy9908@gmail.com';
    if (req.user.role === 'hr' && !isSuperAdmin && (role === 'admin' || role === 'hr')) {
      return res.status(403).json({ error: 'HR cannot create Admin or HR accounts.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    await prisma.employee.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        department,
        avatar: avatar || '', 
        assets: assets || '', 
        weekOff: weekOff || 'Sunday',
        manager: manager || '',
        hrManager: hrManager || '',
        teamLeader: teamLeader || '',
        empId: empId || '',
        designation: designation || '',
        pan: pan || '',
        uan: uan || '',
        bankName: bankName || '',
        accountNumber: accountNumber || '',
        documents: {}
      }
    });

    const subject = 'Welcome to Geonixa Enterprise - Account Activation';
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
                <tr>
                  <td style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 30px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">GEONIXA ENTERPRISE</h1>
                    <p style="color: #bfdbfe; margin: 8px 0 0 0;">Workforce Onboarding</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <p>Dear <strong>${name}</strong>,</p>
                    <p>We are pleased to welcome you to Geonixa Enterprise. This confirms your onboarding as <strong>${role.replace('_', ' ')}</strong> in <strong>${department}</strong>.</p>
                    
                    <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 20px; margin-bottom: 30px;">
                      <h3>System Access Credentials</h3>
                      <p><strong>Employee ID:</strong> ${empId || 'Will be assigned'}</p>
                      <p><strong>Authorized Email:</strong> ${email}</p>
                      <p><strong>Temporary Password:</strong> ${password}</p>
                      <br/>
                      <p>Please log in to the HR Portal to access your dashboard.</p>
                      <p style="color: #dc2626; font-size: 12px; margin-top: 15px;">* IMPORTANT: Change this temporary password immediately upon your first login using the Settings menu.</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
    await sendEmail(email, subject, html);

    res.json({ message: 'Employee added' });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/upload-document', authenticate, upload.single('file'), async (req, res) => {
  try {
    const { docType } = req.body; 
    let employeeId = req.user.id;

    // Allow admins to upload for other employees
    if (req.user.role === 'admin' && req.body.employeeId) {
      employeeId = req.body.employeeId;
    }

    if (!docType || !req.file) {
      return res.status(400).json({ error: 'Missing document type or file' });
    }

    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    // Stream the file directly to Google Cloud Storage
    const gcsPath = await uploadStreamToGCS(req.file, 'employee_documents');

    // Track metadata
    await prisma.fileMetadata.create({
      data: {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        gcsPath: gcsPath,
        uploadedBy: employeeId,
        entityType: 'Employee',
        entityId: employeeId
      }
    });

    let documents = typeof emp.documents === 'string' ? JSON.parse(emp.documents) : (emp.documents || {});
    documents[docType] = gcsPath;

    const dataToUpdate = { documents };
    if (docType === 'photo') {
      dataToUpdate.avatar = gcsPath;
    }

    await prisma.employee.update({
      where: { id: employeeId },
      data: dataToUpdate
    });

    const publicUrl = await generateSignedUrl(gcsPath, 60);

    res.json({ success: true, message: 'Document uploaded successfully', fileUrl: publicUrl, docType });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticate, authorize(['admin', 'hr']), async (req, res) => {
  const { name, email, role, department, avatar, assets, weekOff, manager, hrManager, teamLeader, empId, designation, pan, uan, bankName, accountNumber } = req.body;
  try {
    const empToUpdate = await prisma.employee.findUnique({ where: { id: req.params.id } });
    if (empToUpdate) {
      const isSuperAdmin = req.user.role === 'admin' || req.user.email === 'harikishorereddy9908@gmail.com';
      if (req.user.role === 'hr' && !isSuperAdmin) {
        if (empToUpdate.role === 'admin' || empToUpdate.role === 'hr') {
          return res.status(403).json({ error: 'HR cannot modify Admin or HR accounts.' });
        }
        if (role === 'admin' || role === 'hr') {
          return res.status(403).json({ error: 'HR cannot assign Admin or HR roles.' });
        }
      }

      if (empToUpdate.email === 'harikishorereddy9908@gmail.com' && req.user.email !== 'harikishorereddy9908@gmail.com') {
        return res.status(403).json({ error: 'Super Admin account cannot be modified by others.' });
      }
      if (empToUpdate.email === 'admin@geonixa.com' && req.user.email !== 'harikishorereddy9908@gmail.com' && req.user.email !== 'admin@geonixa.com') {
        return res.status(403).json({ error: 'Permanent Admin account cannot be modified by others.' });
      }
    }

    await prisma.employee.update({
      where: { id: req.params.id },
      data: { 
        name, email, role, department, 
        avatar: avatar || '', 
        assets: assets || '', 
        weekOff: weekOff || 'Sunday',
        manager: manager || '',
        hrManager: hrManager || '',
        teamLeader: teamLeader || '',
        empId: empId || '',
        designation: designation || '',
        pan: pan || '',
        uan: uan || '',
        bankName: bankName || '',
        accountNumber: accountNumber || ''
      }
    });
    res.json({ message: 'Employee updated' });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/reset-password', authenticate, authorize(['admin', 'hr']), async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ error: 'New password is required' });
  
  try {
    const empToUpdate = await prisma.employee.findUnique({ where: { id: req.params.id } });
    if (empToUpdate) {
      const isSuperAdmin = req.user.role === 'admin' || req.user.email === 'harikishorereddy9908@gmail.com';
      if (req.user.role === 'hr' && !isSuperAdmin && (empToUpdate.role === 'admin' || empToUpdate.role === 'hr')) {
        return res.status(403).json({ error: 'HR cannot reset passwords for Admin or HR accounts.' });
      }

      if (empToUpdate.email === 'harikishorereddy9908@gmail.com' && req.user.email !== 'harikishorereddy9908@gmail.com') {
        return res.status(403).json({ error: 'Super Admin password cannot be reset by others.' });
      }
      if (empToUpdate.email === 'admin@geonixa.com' && req.user.email !== 'harikishorereddy9908@gmail.com' && req.user.email !== 'admin@geonixa.com') {
        return res.status(403).json({ error: 'Permanent Admin password cannot be reset by others.' });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.employee.update({
      where: { id: req.params.id },
      data: { password: hashedPassword }
    });
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, authorize(['admin', 'hr']), async (req, res) => {
  try {
    const empToDelete = await prisma.employee.findUnique({ where: { id: req.params.id } });
    if (empToDelete) {
      const isSuperAdmin = req.user.role === 'admin' || req.user.email === 'harikishorereddy9908@gmail.com';
      if (req.user.role === 'hr' && !isSuperAdmin && (empToDelete.role === 'admin' || empToDelete.role === 'hr')) {
        return res.status(403).json({ error: 'HR cannot delete Admin or HR accounts.' });
      }

      if (empToDelete.email === 'harikishorereddy9908@gmail.com') {
        return res.status(403).json({ error: 'Super Admin account is permanent and cannot be deleted.' });
      }
      if (empToDelete.email === 'admin@geonixa.com') {
        return res.status(403).json({ error: 'Admin account is permanent and cannot be deleted.' });
      }
    }

    // Delete related records manually to avoid transaction/connection-pool issues
    // Wrap in try-catch because some tables might not exist in the production database yet
    const safeDelete = async (promise) => {
      try { await promise; } catch (e) { /* ignore missing tables */ }
    };

    await safeDelete(prisma.attendance.deleteMany({ where: { employeeId: req.params.id } }));
    await safeDelete(prisma.leave.deleteMany({ where: { employeeId: req.params.id } }));
    await safeDelete(prisma.salary.deleteMany({ where: { employeeId: req.params.id } }));
    await safeDelete(prisma.jobReferral.deleteMany({ where: { employeeId: req.params.id } }));
    await safeDelete(prisma.resignation.deleteMany({ where: { employeeId: req.params.id } }));
    await safeDelete(prisma.problem.deleteMany({ where: { employeeId: req.params.id } }));
    await safeDelete(prisma.callLog.deleteMany({ where: { employeeId: req.params.id } }));
    await safeDelete(prisma.followup.deleteMany({ where: { assignedEmployeeId: req.params.id } }));
    await safeDelete(prisma.target.deleteMany({ where: { employeeId: req.params.id } }));
    
    // Finally delete the employee
    await prisma.employee.delete({ where: { id: req.params.id } });
    
    res.json({ message: 'Employee deleted' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/reset-device', authenticate, authorize(['admin', 'hr']), async (req, res) => {
  try {
    const empToUpdate = await prisma.employee.findUnique({ where: { id: req.params.id } });
    if (empToUpdate) {
      const isSuperAdmin = req.user.role === 'admin' || req.user.email === 'harikishorereddy9908@gmail.com';
      if (req.user.role === 'hr' && !isSuperAdmin && (empToUpdate.role === 'admin' || empToUpdate.role === 'hr')) {
        return res.status(403).json({ error: 'HR cannot reset device IDs for Admin or HR accounts.' });
      }

      if (empToUpdate.email === 'harikishorereddy9908@gmail.com' && req.user.email !== 'harikishorereddy9908@gmail.com') {
        return res.status(403).json({ error: 'Super Admin device cannot be reset by others.' });
      }
    }

    await prisma.employee.update({
      where: { id: req.params.id },
      data: { deviceId: null }
    });
    res.json({ success: true, message: 'Hardware lock cleared.' });
  } catch (error) {
    console.error('Error resetting device:', error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/badge', authenticate, authorize(['admin', 'hr']), async (req, res) => {
  const { starPerformer } = req.body;
  try {
    await prisma.employee.update({
      where: { id: req.params.id },
      data: { starPerformer: starPerformer || 'none' }
    });
    res.json({ success: true, message: 'Recognition level adjusted.' });
  } catch (error) {
    console.error('Error adjusting badge:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/send-notice', authenticate, authorize(['admin', 'hr']), async (req, res) => {
  try {
    const emp = await prisma.employee.findUnique({
      where: { id: req.params.id }
    });
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const subject = 'URGENT: Notice Period & Asset Recovery - Geonixa Technologies';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #e2e8f0; padding: 20px;">
        <h2 style="color: #4f46e5;">Official Notice Period Reminder</h2>
        <p>Dear ${emp.name},</p>
        <p>It has been observed that you have ceased reporting to work without formal notification.</p>
        <p><strong>Immediate Actions Required:</strong></p>
        <ul>
          <li>Formalize your resignation through the HR portal.</li>
          <li><strong>Asset Recovery:</strong> Return the company-issued assets within 48 hours.</li>
          <li>Complete the handover of pending tasks.</li>
        </ul>
        <p style="color: #dc2626; font-weight: bold;">Note: Failure to comply will result in the withholding of your experience certificate.</p>
      </div>
    `;

    await sendEmail(emp.email, subject, html);
    res.json({ message: 'Professional notice sent' });
  } catch (error) {
    console.error('Error sending notice:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/send-warning', authenticate, authorize(['admin', 'hr']), async (req, res) => {
  try {
    const emp = await prisma.employee.findUnique({
      where: { id: req.params.id }
    });
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const subject = 'STRICT WARNING: Unauthorized Absence - Geonixa Technologies';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #e2e8f0; padding: 20px;">
        <h2 style="color: #dc2626;">First Formal Warning</h2>
        <p>Dear ${emp.name},</p>
        <p>This is a formal warning regarding your unauthorized absence from duties.</p>
        <p>Please report to the HR office immediately to explain your absence.</p>
      </div>
    `;

    await sendEmail(emp.email, subject, html);
    res.json({ message: 'Warning letter sent' });
  } catch (error) {
    console.error('Error sending warning:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
