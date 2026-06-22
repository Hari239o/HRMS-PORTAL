const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

const hasMultiDeviceAccess = (role) => {
  return role === 'admin';
};

const requiresDeviceLock = (role) => {
  return !hasMultiDeviceAccess(role);
};

// Seed admin users
(async () => {
  try {
    const admins = [
      {
        email: 'harikishoreddy9908@gmail.com',
        pass: 'Hari@9908',
        name: 'Harikishore Reddy',
        id: 'admin-hari'
      },
      {
        email: 'Admin@geonixa.com',
        pass: 'GEO@2026',
        name: 'Geonixa Admin',
        id: 'admin-geonixa'
      }
    ];

    for (const admin of admins) {
      const hashedPassword = await bcrypt.hash(admin.pass, 10);
      const snapshot = await db.collection('employees').where('email', '==', admin.email).get();
      
      if (snapshot.empty) {
        await db.collection('employees').doc(admin.id).set({
          name: admin.name,
          email: admin.email,
          password: hashedPassword,
          role: 'admin',
          department: 'HR'
        });
        console.log('✅ Admin account created:', admin.email);
      } else {
        // Force update password and role for this specific user
        const docId = snapshot.docs[0].id;
        await db.collection('employees').doc(docId).update({
          password: hashedPassword,
          role: 'admin'
        });
        console.log('✅ Admin account updated:', admin.email);
      }
    }
  } catch (err) {
    console.error('Error seeding admins:', err.message);
  }
})();

router.post('/register', async (req, res) => {
  const { name, email, password, department, avatar, role: requestedRole } = req.body;
  try {
    const snapshot = await db.collection('employees').where('email', '==', email).get();
    if (!snapshot.empty) return res.status(400).json({ error: 'Email already exists' });

    const allEmployees = await db.collection('employees').limit(1).get();
    const availableRoles = ['admin', 'manager', 'employee', 'student'];
    let role = availableRoles.includes(requestedRole) ? requestedRole : (allEmployees.empty ? 'admin' : 'employee');
    if (role === 'admin' && !allEmployees.empty) {
      role = 'employee';
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = Date.now().toString();
    const defaultWeekOff = 'Sunday';
    
    const { sendEmail } = require('../utils/email');
    await db.collection('employees').doc(id).set({
      name,
      email,
      password: hashedPassword,
      role,
      department: department || (role === 'student' ? 'Students' : 'HR'),
      avatar: avatar || '',
      weekOff: defaultWeekOff
    });

    if (role === 'student') {
      await db.collection('students').doc(id).set({
        id,
        full_name: name,
        email,
        program: '',
        enrollment_id: '',
        status: 'active',
        documents: {},
        certificates: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Send Welcome Onboarding Email
    const emailHtml = `
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
                    <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 13px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">Workforce Portal Activation</p>
                  </td>
                </tr>
                <tr>
                  <td class="content-padding" style="padding: 40px;">
                    <p style="color: #1f2937; font-size: 16px; margin: 0 0 15px 0;">Dear <strong>${name}</strong>,</p>
                    <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                      Welcome to the Geonixa Enterprise workforce team! This communication confirms that your workforce account has been successfully initialized. You are now authorized to access the corporate systems.
                    </p>
                    
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
                      <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">System Access Coordinates</h3>
                      <table class="stack-table" width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="padding: 6px 0; color: #6b7280; font-size: 14px; width: 140px;">Username/Email:</td>
                          <td style="padding: 6px 0; color: #111827; font-size: 14px; font-weight: 600; font-family: monospace;">${email}</td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Department:</td>
                          <td style="padding: 6px 0; color: #111827; font-size: 14px; font-weight: 600;">${department}</td>
                        </tr>
                      </table>
                    </div>

                    <h3 style="color: #111827; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 15px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Operational Parameters</h3>
                    <table class="stack-table" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 25px;">
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px; width: 180px;">Official Standard Hours:</td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 14px; font-weight: 500;">11:00 AM – 08:00 PM (IST)</td>
                      </tr>
                    </table>

                    <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 30px 0;">
                      You are requested to access the Geonixa HRMS portal to complete your biometrics registration, review pending compliance documents, and initiate standard daily attendance logs.
                    </p>
                    
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 25px;">
                      <p style="color: #111827; margin: 0 0 5px 0; font-size: 14px; font-weight: 600;">Warm regards,</p>
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
    await sendEmail(email, 'Welcome to Geonixa Workforce Network - Account Activated', emailHtml);

    res.status(201).json({ 
      message: 'User registered', 
      user: { id, name, role, email, department, avatar },
      token: jwt.sign({ id, role, name }, process.env.JWT_SECRET, { expiresIn: '24h' })
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password, deviceId } = req.body;
  try {
    const snapshot = await db.collection('employees').where('email', '==', email).get();
    if (snapshot.empty) return res.status(400).json({ error: 'Invalid email or password' });

    const doc = snapshot.docs[0];
    const employee = { id: doc.id, ...doc.data() };

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });

    const enforceDeviceLock = requiresDeviceLock(employee.role);

    if (enforceDeviceLock) {
      if (!deviceId) {
        return res.status(400).json({ error: 'Device identifier required for secure login.' });
      }

      if (!employee.deviceId) {
        await db.collection('employees').doc(employee.id).update({ deviceId });
        employee.deviceId = deviceId;
      } else if (employee.deviceId !== deviceId) {
        return res.status(403).json({ error: 'This account is linked to another registered device. Contact HR or Admin to reset device pairing.' });
      }
    }

    const token = jwt.sign(
      { id: employee.id, role: employee.role, name: employee.name, deviceId: employee.deviceId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token, 
      user: { id: employee.id, name: employee.name, role: employee.role, department: employee.department, email: employee.email } 
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error.message?.includes('RESOURCE_EXHAUSTED')) {
      return res.status(503).json({
        error: 'Firestore quota exceeded. Please check Firebase billing or use the local emulator for development.'
      });
    }
    res.status(500).json({ error: error.message });
  }
});

// User self-service change password
router.put('/change-password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const doc = await db.collection('employees').doc(req.user.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'User not found' });
    
    const employee = doc.data();
    const isMatch = await bcrypt.compare(currentPassword, employee.password);
    
    if (!isMatch) return res.status(400).json({ error: 'Incorrect current password' });
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.collection('employees').doc(req.user.id).update({ password: hashedPassword });
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
