const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const prisma = require('../../prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadDocument } = require('../utils/cloudinary');
const { sendEmail } = require('../utils/email');

const router = express.Router();

router.get('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const prismaEmployees = await prisma.employee.findMany({
      orderBy: { name: 'asc' }
    });

    // TODO: Temporarily keep document/extra operations in Firebase until Prisma schema is fully updated
    const fbSnapshot = await db.collection('employees').get();
    const fbDataMap = {};
    fbSnapshot.docs.forEach(doc => {
      fbDataMap[doc.id] = doc.data();
    });

    const employees = prismaEmployees.map(emp => {
      const fb = fbDataMap[emp.id] || {};
      return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        role: emp.role,
        department: emp.department,
        avatar: fb.avatar || '',
        assets: fb.assets || '',
        weekOff: fb.weekOff || 'Sunday',
        starPerformer: fb.starPerformer || 'none',
        deviceId: fb.deviceId || null,
        joinedAt: emp.createdAt || null,
        documents: fb.documents || {},
        manager: fb.manager || '',
        hrManager: fb.hrManager || '',
        teamLeader: fb.teamLeader || '',
        empId: fb.empId || '',
        designation: fb.designation || '',
        pan: fb.pan || '',
        uan: fb.uan || '',
        bankName: fb.bankName || '',
        accountNumber: fb.accountNumber || ''
      };
    });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/star-performers', authenticate, async (req, res) => {
  try {
    // TODO: starPerformer is not in Prisma schema. Using Firebase to find IDs, then fetching core data from Prisma.
    const snapshot = await db.collection('employees')
      .where('starPerformer', 'in', ['week', 'month'])
      .get();
      
    if (snapshot.empty) return res.json([]);

    const fbDataMap = {};
    snapshot.docs.forEach(doc => {
      fbDataMap[doc.id] = doc.data();
    });

    const starIds = snapshot.docs.map(doc => doc.id);

    const prismaEmployees = await prisma.employee.findMany({
      where: { id: { in: starIds } }
    });

    const performers = prismaEmployees.map(emp => {
      const fb = fbDataMap[emp.id] || {};
      return {
        id: emp.id,
        name: emp.name,
        department: emp.department,
        starPerformer: fb.starPerformer,
        avatar: fb.avatar || ''
      };
    });
    res.json(performers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get basic directory for all employees (non-admin access)
router.get('/directory', authenticate, async (req, res) => {
  try {
    const prismaEmployees = await prisma.employee.findMany({
      orderBy: { name: 'asc' }
    });

    // TODO: Temporarily keep document operations in Firebase
    const fbSnapshot = await db.collection('employees').get();
    const fbDataMap = {};
    fbSnapshot.docs.forEach(doc => {
      fbDataMap[doc.id] = doc.data();
    });

    const directory = prismaEmployees.map(emp => {
      const fb = fbDataMap[emp.id] || {};
      return {
        id: emp.id,
        name: emp.name,
        role: emp.role,
        department: emp.department,
        avatar: fb.avatar || '',
        email: emp.email,
        weekOff: fb.weekOff || 'Sunday',
        assets: fb.assets || '',
        documents: fb.documents || {},
        empId: fb.empId || '',
        designation: fb.designation || ''
      };
    });
    res.json(directory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const prismaEmp = await prisma.employee.findUnique({
      where: { id: req.user.id }
    });
    
    if (!prismaEmp) return res.status(404).json({ error: 'User not found' });
    
    // TODO: Fetch missing fields from Firebase
    const fbDoc = await db.collection('employees').doc(req.user.id).get();
    const fbData = fbDoc.exists ? fbDoc.data() : {};

    // Resolve profile data for reporting structure
    const resolveProfile = async (id) => {
      if (!id) return null;
      try {
        const emp = await prisma.employee.findUnique({ where: { id } });
        if (emp) {
          const fb = await db.collection('employees').doc(id).get();
          const avatar = fb.exists ? fb.data().avatar : '';
          return { name: emp.name, avatar: avatar || '', email: emp.email, role: emp.role };
        }
        return null;
      } catch (e) {
        return null;
      }
    };

    const managerProfile = await resolveProfile(fbData.manager);
    const hrProfile = await resolveProfile(fbData.hrManager);
    const teamLeaderProfile = await resolveProfile(fbData.teamLeader);

    // Fetch Team Members
    let teamMembers = [];
    try {
      let fbTeamQuery;
      if (fbData.teamLeader) {
        fbTeamQuery = await db.collection('employees').where('teamLeader', '==', fbData.teamLeader).get();
      } else if (fbData.manager) {
        fbTeamQuery = await db.collection('employees').where('manager', '==', fbData.manager).get();
      } else {
        // If they are the manager/leader, fetch people reporting to them
        fbTeamQuery = await db.collection('employees').where('manager', '==', req.user.id).get();
        if (fbTeamQuery.empty) {
          fbTeamQuery = await db.collection('employees').where('teamLeader', '==', req.user.id).get();
        }
      }
      
      if (fbTeamQuery && !fbTeamQuery.empty) {
        const tIds = fbTeamQuery.docs.map(d => d.id);
        const fbTData = {};
        fbTeamQuery.docs.forEach(d => fbTData[d.id] = d.data());

        const tPrisma = await prisma.employee.findMany({ where: { id: { in: tIds } } });
        teamMembers = tPrisma.map(t => ({
          id: t.id,
          name: t.name,
          avatar: fbTData[t.id]?.avatar || '',
          role: t.role,
          email: t.email
        }));
      }
    } catch (err) {
      console.log('Error fetching team members', err);
    }

    res.json({ 
      id: prismaEmp.id, 
      name: prismaEmp.name,
      email: prismaEmp.email,
      role: prismaEmp.role,
      department: prismaEmp.department,
      createdAt: prismaEmp.createdAt,
      avatar: fbData.avatar || '',
      assets: fbData.assets || '',
      weekOff: fbData.weekOff || 'Sunday',
      manager: fbData.manager || '',
      hrManager: fbData.hrManager || '',
      teamLeader: fbData.teamLeader || '',
      empId: fbData.empId || '',
      designation: fbData.designation || '',
      pan: fbData.pan || '',
      uan: fbData.uan || '',
      bankName: fbData.bankName || '',
      accountNumber: fbData.accountNumber || '',
      documents: fbData.documents || {},
      managerProfile,
      hrProfile,
      teamLeaderProfile,
      teamMembers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  const { name, email, password, role, department, avatar, assets, weekOff, manager, hrManager, teamLeader, empId, designation, pan, uan, bankName, accountNumber } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 1. Create in Prisma
    const newEmployee = await prisma.employee.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        department
      }
    });

    // 2. Temporarily save extra fields in Firebase to preserve existing functionality
    await db.collection('employees').doc(newEmployee.id).set({
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
    });

    // Send Welcome Email
    const subject = 'Welcome to Geonixa Enterprise - Account Activation';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @media only screen and (max-width: 600px) {
            .email-container { width: 100% !important; border-radius: 0 !important; }
            .content-padding { padding: 20px !important; }
            .stack-table, .stack-table tr, .stack-table td { display: block !important; width: 100% !important; }
            .stack-table td { padding-bottom: 5px !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f6f9; padding: 20px 0;">
          <tr>
            <td align="center">
              <table class="email-container" width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin: 0 auto; border: 1px solid #e5e7eb;">
                <tr>
                  <td style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 30px 20px; text-align: center; border-bottom: 3px solid #f59e0b;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">GEONIXA ENTERPRISE</h1>
                    <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 13px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">Workforce Onboarding</p>
                  </td>
                </tr>
                <tr>
                  <td class="content-padding" style="padding: 40px;">
                    <p style="color: #1f2937; font-size: 16px; margin: 0 0 15px 0;">Dear <strong>${name}</strong>,</p>
                    <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                      We are pleased to formally welcome you to Geonixa Enterprise. This communication confirms your onboarding as <strong><span style="text-transform: capitalize;">${role.replace('_', ' ')}</span></strong> within the <strong>${department}</strong> division.
                    </p>
                    
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
                      <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">System Access Credentials</h3>
                      <table class="stack-table" width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="padding: 6px 0; color: #6b7280; font-size: 14px; width: 140px;">Authorized Email:</td>
                          <td style="padding: 6px 0; color: #111827; font-size: 14px; font-weight: 600; font-family: monospace;">${email}</td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Temporary Password:</td>
                          <td style="padding: 6px 0; color: #111827; font-size: 14px; font-weight: 600; font-family: monospace;">${password}</td>
                        </tr>
                      </table>
                      <p style="margin: 12px 0 0 0; font-size: 12px; color: #dc2626; font-style: italic;">* Security Advisory: You are required to change this temporary password immediately upon your first login.</p>
                    </div>

                    <h3 style="color: #111827; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 15px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Operational Guidelines</h3>
                    <table class="stack-table" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 25px;">
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px; width: 180px;">Official Designation:</td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 14px; font-weight: 500;"><span style="text-transform: capitalize;">${role.replace('_', ' ')}</span></td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">Department/Vertical:</td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 14px; font-weight: 500;">${department}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Standard Work Hours:</td>
                        <td style="padding: 10px 0; color: #111827; font-size: 14px; font-weight: 500;">11:00 AM – 08:00 PM (IST)</td>
                      </tr>
                    </table>

                    <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 30px 0;">
                      Please access the Geonixa HRMS portal promptly to review corporate compliance documents, complete your professional profile, and begin standard attendance logging.
                    </p>
                    
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 25px;">
                      <p style="color: #111827; margin: 0 0 5px 0; font-size: 14px; font-weight: 600;">Sincerely,</p>
                      <p style="color: #4b5563; margin: 0; font-size: 14px; line-height: 1.4;">
                        Human Resources Division<br>
                        <strong style="color: #1e3a8a;">Geonixa Enterprise</strong>
                      </p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 11px; margin: 0 0 10px 0; line-height: 1.5;">
                      CONFIDENTIALITY NOTICE: This email and any attachments are confidential and intended solely for the use of the individual to whom they are addressed. Unauthorized review, use, or distribution is prohibited.
                    </p>
                    <p style="color: #d1d5db; font-size: 11px; margin: 0;">&copy; ${new Date().getFullYear()} Geonixa Inc. All Rights Reserved.</p>
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
    res.status(500).json({ error: error.message });
  }
});

router.post('/upload-document', authenticate, uploadDocument.single('file'), async (req, res) => {
  try {
    const { docType } = req.body; // 10th, inter, btech, offerLetter, photo, signaturedOffer
    const fileUrl = req.file.path.startsWith('http') ? req.file.path : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const employeeId = req.user.id;

    if (!docType || !fileUrl) {
      return res.status(400).json({ error: 'Missing document type or file' });
    }

    const employeeRef = db.collection('employees').doc(employeeId);
    
    // TODO: Migrate document fields to Prisma
    // Use dot notation to update the specific nested field inside the documents map
    const updates = {
      [`documents.${docType}`]: fileUrl
    };

    if (docType === 'photo') {
      updates.avatar = fileUrl;
    }

    await employeeRef.update(updates);

    res.json({ success: true, message: 'Document uploaded successfully', fileUrl, docType });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticate, authorize(['admin']), async (req, res) => {
  const { name, email, role, department, avatar, assets, weekOff, manager, hrManager, teamLeader, empId, designation, pan, uan, bankName, accountNumber } = req.body;
  try {
    // 1. Update in Prisma
    await prisma.employee.update({
      where: { id: req.params.id },
      data: { name, email, role, department }
    });

    // 2. Temporarily update extra fields in Firebase
    await db.collection('employees').doc(req.params.id).update({
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
    });
    res.json({ message: 'Employee updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin resetting an employee's password
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
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    await prisma.employee.delete({
      where: { id: req.params.id }
    });
    await db.collection('employees').doc(req.params.id).delete();
    res.json({ message: 'Employee deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/reset-device', authenticate, authorize(['admin']), async (req, res) => {
  try {
    await db.collection('employees').doc(req.params.id).update({ deviceId: null });
    res.json({ success: true, message: 'Hardware lock cleared.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/badge', authenticate, authorize(['admin']), async (req, res) => {
  const { starPerformer } = req.body; // 'week', 'month', or 'none'
  try {
    await db.collection('employees').doc(req.params.id).update({ starPerformer: starPerformer || 'none' });
    res.json({ success: true, message: 'Recognition level adjusted.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/send-notice', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const emp = await prisma.employee.findUnique({
      where: { id: req.params.id }
    });
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emp.email,
      subject: 'URGENT: Notice Period & Asset Recovery - Geonixa Technologies',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #e2e8f0; padding: 20px;">
          <h2 style="color: #4f46e5;">Official Notice Period Reminder</h2>
          <p>Dear ${emp.name},</p>
          <p>It has been observed that you have ceased reporting to work without formal notification or completion of the standard notice period as per your employment contract.</p>
          <p><strong>Immediate Actions Required:</strong></p>
          <ul>
            <li>Formalize your resignation through the HR portal.</li>
            <li><strong>Asset Recovery:</strong> Return the company-issued SIM cards and any other hardware within 48 hours.</li>
            <li>Complete the handover of pending tasks.</li>
          </ul>
          <p style="color: #dc2626; font-weight: bold;">Note: Failure to comply will result in the withholding of your experience certificate and full-and-final settlement.</p>
          <p>Regards,<br>HR Operations<br>Geonixa Technologies</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Professional notice sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MNC Professional Warning Letter
router.post('/:id/send-warning', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const emp = await prisma.employee.findUnique({
      where: { id: req.params.id }
    });
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emp.email,
      subject: 'STRICT WARNING: Unauthorized Absence - Geonixa Technologies',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #e2e8f0; padding: 20px;">
          <h2 style="color: #dc2626;">First Formal Warning</h2>
          <p>Dear ${emp.name},</p>
          <p>This is a formal warning regarding your unauthorized absence from duties. You have failed to provide a valid medical certificate or prior approval for your recent absence.</p>
          <p>Unauthorized absence is a violation of the company code of conduct and is subject to disciplinary action, including possible termination of employment.</p>
          <p>Please report to the HR office immediately to explain your absence.</p>
          <p>Regards,<br>HR Operations<br>Geonixa Technologies</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Warning letter sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
