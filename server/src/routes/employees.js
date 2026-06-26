const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../../prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadDocument } = require('../utils/cloudinary');
const { sendEmail } = require('../utils/email');

const router = express.Router();

router.get('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { name: 'asc' }
    });

    const formattedEmployees = employees.map(emp => ({
      ...emp,
      joinedAt: emp.createdAt,
      avatar: emp.avatar || '',
      assets: emp.assets || '',
      weekOff: emp.weekOff || 'Sunday',
      starPerformer: emp.starPerformer || 'none',
      deviceId: emp.deviceId || null,
      documents: typeof emp.documents === 'string' ? JSON.parse(emp.documents) : (emp.documents || {}),
      manager: emp.manager || '',
      hrManager: emp.hrManager || '',
      teamLeader: emp.teamLeader || '',
      empId: emp.empId || '',
      designation: emp.designation || '',
      pan: emp.pan || '',
      uan: emp.uan || '',
      bankName: emp.bankName || '',
      accountNumber: emp.accountNumber || ''
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

    res.json(performers.map(emp => ({
      id: emp.id,
      name: emp.name,
      department: emp.department,
      starPerformer: emp.starPerformer,
      avatar: emp.avatar || ''
    })));
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

    const directory = employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      role: emp.role,
      department: emp.department,
      avatar: emp.avatar || '',
      email: emp.email,
      weekOff: emp.weekOff || 'Sunday',
      assets: emp.assets || '',
      documents: typeof emp.documents === 'string' ? JSON.parse(emp.documents) : (emp.documents || {}),
      empId: emp.empId || '',
      designation: emp.designation || ''
    }));

    res.json(directory);
  } catch (error) {
    console.error('Error fetching directory:', error);
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
          return { name: profile.name, avatar: profile.avatar || '', email: profile.email, role: profile.role };
        }
        return null;
      } catch (e) {
        return null;
      }
    };

    const managerProfile = await resolveProfile(emp.manager);
    const hrProfile = await resolveProfile(emp.hrManager);
    const teamLeaderProfile = await resolveProfile(emp.teamLeader);

    // Fetch Team Members
    let teamMembers = [];
    try {
      let teamQuery = {};
      if (emp.teamLeader) {
        teamQuery = { teamLeader: emp.teamLeader };
      } else if (emp.manager) {
        teamQuery = { manager: emp.manager };
      } else {
        // If they are the manager/leader
        teamQuery = { OR: [{ manager: req.user.id }, { teamLeader: req.user.id }] };
      }
      
      const tPrisma = await prisma.employee.findMany({ where: teamQuery });
      teamMembers = tPrisma.map(t => ({
        id: t.id,
        name: t.name,
        avatar: t.avatar || '',
        role: t.role,
        email: t.email
      }));
    } catch (err) {
      console.log('Error fetching team members', err);
    }

    res.json({ 
      ...emp,
      avatar: emp.avatar || '',
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
      documents: typeof emp.documents === 'string' ? JSON.parse(emp.documents) : (emp.documents || {}),
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

router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  const { name, email, password, role, department, avatar, assets, weekOff, manager, hrManager, teamLeader, empId, designation, pan, uan, bankName, accountNumber } = req.body;
  try {
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
                      <p>Authorized Email: ${email}</p>
                      <p>Temporary Password: ${password}</p>
                      <p style="color: #dc2626; font-size: 12px;">* Change this temporary password immediately upon your first login.</p>
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

router.post('/upload-document', authenticate, uploadDocument.single('file'), async (req, res) => {
  try {
    const { docType } = req.body; 
    const fileUrl = req.file.path.startsWith('http') ? req.file.path : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const employeeId = req.user.id;

    if (!docType || !fileUrl) {
      return res.status(400).json({ error: 'Missing document type or file' });
    }

    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    let documents = typeof emp.documents === 'string' ? JSON.parse(emp.documents) : (emp.documents || {});
    documents[docType] = fileUrl;

    const dataToUpdate = { documents };
    if (docType === 'photo') {
      dataToUpdate.avatar = fileUrl;
    }

    await prisma.employee.update({
      where: { id: employeeId },
      data: dataToUpdate
    });

    res.json({ success: true, message: 'Document uploaded successfully', fileUrl, docType });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticate, authorize(['admin']), async (req, res) => {
  const { name, email, role, department, avatar, assets, weekOff, manager, hrManager, teamLeader, empId, designation, pan, uan, bankName, accountNumber } = req.body;
  try {
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

router.put('/:id/reset-password', authenticate, authorize(['admin']), async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ error: 'New password is required' });
  
  try {
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

router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    await prisma.$transaction([
      prisma.employee.delete({
        where: { id: req.params.id }
      })
    ]);
    res.json({ message: 'Employee deleted' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/reset-device', authenticate, authorize(['admin']), async (req, res) => {
  try {
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

router.patch('/:id/badge', authenticate, authorize(['admin']), async (req, res) => {
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

router.post('/:id/send-notice', authenticate, authorize(['admin']), async (req, res) => {
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

router.post('/:id/send-warning', authenticate, authorize(['admin']), async (req, res) => {
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
