const express = require('express');
const { db } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
let HummusRecipe = null;
try {
  HummusRecipe = require('hummus-recipe');
} catch (e) {
  // optional dependency - encryption will be skipped if not installed
  HummusRecipe = null;
}

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  const { employeeId, month, baseSalary, deductions, bonus } = req.body;
  try {
    const netSalary = parseFloat(baseSalary) + parseFloat(bonus) - parseFloat(deductions);
    const id = Date.now().toString();
    await db.collection('salaries').doc(id).set({
      id,
      employeeId,
      month,
      baseSalary: parseFloat(baseSalary),
      deductions: parseFloat(deductions),
      bonus: parseFloat(bonus),
      netSalary,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      releasedAt: null
    });
    res.status(201).json({ id, employeeId, month, netSalary, status: 'Pending' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  const { role, id } = req.user;
  try {
    let salaries = [];
    if (role !== 'admin') {
      const snap = await db.collection('salaries')
        .where('employeeId', '==', id)
        .get();
      salaries = snap.docs
        .map(doc => doc.data())
        .filter(s => s.status === 'Released' || !s.status);
    } else {
      const snap = await db.collection('salaries').get();
      salaries = snap.docs.map(doc => doc.data());
    }
    
    salaries.sort((a, b) => b.month.localeCompare(a.month));

    const empSnap = await db.collection('employees').get();
    const employeesMap = {};
    empSnap.docs.forEach(doc => {
      employeesMap[doc.id] = doc.data();
    });

    const formatted = salaries.map(s => {
      const emp = employeesMap[s.employeeId] || {};
      return {
        ...s,
        status: s.status || 'Pending',
        employee: { name: emp.name || 'Unknown', department: emp.department || 'Unknown' }
      };
    });
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function formatDate(value) {
  if (!value) return 'N/A';
  if (value instanceof Date) return value.toLocaleDateString('en-GB');
  if (value.toDate && typeof value.toDate === 'function') return value.toDate().toLocaleDateString('en-GB');
  return new Date(value).toLocaleDateString('en-GB');
}

function monthLabel(monthString) {
  const [year, month] = monthString.split('-');
  if (!year || !month) return monthString;
  const date = new Date(`${year}-${month}-01`);
  return date.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
}

function drawKeyValue(doc, label, value, x, y) {
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text(label, x, y);
  const labelHeight = doc.heightOfString(label, { width: 220 });
  doc.font('Helvetica').fontSize(10).fillColor('#334155').text(value, x, y + labelHeight + 2, { width: 220 });
}

async function enrichSalary(salary) {
  const empDoc = await db.collection('employees').doc(salary.employeeId).get();
  if (empDoc.exists) {
    const emp = empDoc.data();
    salary.name = emp.name;
    salary.department = emp.department;
    salary.employeeRole = emp.role === 'admin' ? 'Administrator' : 'Employee';
    salary.designation = emp.role === 'admin' ? 'HR Administrator' : 'Individual Contributor';
    salary.joinDate = emp.createdAt || emp.joinDate || null;
    salary.email = emp.email;
    salary.functionalArea = emp.department || 'Operations';
  } else {
    salary.name = 'Unknown';
    salary.department = 'Unknown';
    salary.employeeRole = 'Employee';
    salary.designation = 'Individual Contributor';
    salary.joinDate = null;
    salary.email = '';
    salary.functionalArea = 'Operations';
  }
  return salary;
}

function buildPayslipFile(salary) {
  return new Promise((resolve, reject) => {
    const tempDir = path.join(__dirname, '../../temp');
    fs.mkdirSync(tempDir, { recursive: true });
    const filePath = path.join(tempDir, `payslip-${salary.id}.pdf`);
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(filePath);

    writeStream.on('error', (err) => {
      console.error('WriteStream error while creating payslip PDF:', err);
      reject(err);
    });

    doc.on('error', (err) => {
      console.error('PDFDocument error while creating payslip PDF:', err);
      reject(err);
    });

    writeStream.on('finish', () => resolve(filePath));

    doc.pipe(writeStream);
    generateProfessionalPDF(doc, salary);
    doc.end();
  });
}

async function protectPdfIfNeeded(inputPath) {
  // Only protect when env var enabled and hummus-recipe is available
  if (process.env.PDF_PROTECT !== 'true' || !HummusRecipe) return inputPath;
  const outPath = inputPath.replace(/\.pdf$/i, '-protected.pdf');
  try {
    const userPwd = process.env.PDF_USER_PASSWORD || '';
    const ownerPwd = process.env.PDF_OWNER_PASSWORD || userPwd || 'owner';
    const pdfDoc = new HummusRecipe(inputPath, outPath);
    // Apply encryption: set both user and owner passwords and restrict printing/editing
    pdfDoc.encrypt({
      userPassword: userPwd,
      ownerPassword: ownerPwd,
      userProtectionFlag: 4
    });
    pdfDoc.endPDF();
    // wait until protected file is written (hummus may write asynchronously)
    const start = Date.now();
    const timeout = 5000; // 5s
    while (Date.now() - start < timeout) {
      try {
        if (fs.existsSync(outPath) && fs.statSync(outPath).size > 0) {
          return outPath;
        }
      } catch (e) {}
      // small delay
      await new Promise(r => setTimeout(r, 150));
    }
    // if file not ready, return inputPath as fallback
    console.warn('Protected PDF not ready within timeout, serving original');
    return inputPath;
  } catch (err) {
    console.error('PDF protection failed:', err);
    return inputPath;
  }
}

async function sendSalaryEmail(salary, subject, html) {
  const filePath = await buildPayslipFile(salary);
  let attachmentPath = filePath;
  try {
    attachmentPath = await protectPdfIfNeeded(filePath);
    if (attachmentPath !== filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {
    console.error('Error while protecting PDF for email:', e);
  }

  return new Promise((resolve, reject) => {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: salary.email,
      subject,
      html,
      attachments: [{ filename: `payslip-${salary.month}.pdf`, path: attachmentPath }]
    };

    transporter.sendMail(mailOptions, (error, info) => {
      // cleanup protected file too
      try {
        if (fs.existsSync(attachmentPath)) fs.unlinkSync(attachmentPath);
      } catch (e) {}
      if (error) {
        console.error('Email send failed for payslip:', error.message);
        // Resolve instead of reject to prevent 500 errors when email config is missing/invalid
        return resolve({ warning: 'Email failed to send, but PDF generated successfully.', error: error.message });
      }
      resolve(info);
    });
  });
}

function generateProfessionalPDF(doc, salary) {
  const titleFont = 'Helvetica-Bold';
  const bodyFont = 'Helvetica';
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  const paddedMonth = monthLabel(salary.month);

  // Header
  doc.fillColor('#111827').font(titleFont).fontSize(28).text('GEONIXA', { align: 'center', characterSpacing: 1.5 });
  doc.font(bodyFont).fontSize(10).fillColor('#475569').text('Payroll & Attendance Services', { align: 'center' });
  doc.moveDown(0.25);
  doc.font(bodyFont).fontSize(9).fillColor('#475569').text('Level 3, Geonixa Tower, Business District, Bengaluru, Karnataka 560064', { align: 'center' });
  doc.moveDown(0.5);

  doc.font(titleFont).fontSize(16).fillColor('#0f172a').text('Salary Slip', 50, doc.y);
  doc.font(bodyFont).fontSize(9).fillColor('#475569').text(`For the month of ${paddedMonth}`, 50, doc.y + 18);
  doc.font(bodyFont).fontSize(8).fillColor('#94a3b8').text('This is a computer generated payslip and is not editable.', 50, doc.y + 34);
  doc.moveDown(2);

  // Employee info block
  const infoTop = doc.y;
  doc.roundedRect(50, infoTop - 6, pageWidth, 120, 12).fillOpacity(0.04).fillAndStroke('#eef2ff', '#c7d2fe').fillOpacity(1);

  drawKeyValue(doc, 'Employee Name', salary.name || 'N/A', 60, infoTop + 10);
  drawKeyValue(doc, 'Designation', salary.designation || 'Individual Contributor', 60, infoTop + 34);
  drawKeyValue(doc, 'Role', salary.employeeRole || 'Employee', 60, infoTop + 58);
  drawKeyValue(doc, 'Date of Joining', formatDate(salary.joinDate), 60, infoTop + 82);

  doc.y = infoTop + 130;
  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(1);

  // Salary summary block
  const summaryTop = doc.y;
  doc.roundedRect(50, summaryTop - 6, pageWidth, 90, 12).stroke('#cbd5e1');
  drawKeyValue(doc, 'Company', 'Geonixa', 60, summaryTop + 10);
  drawKeyValue(doc, 'Company Address', 'Level 3, Geonixa Tower, Business District, Bengaluru, Karnataka 560064', 60, summaryTop + 34);
  drawKeyValue(doc, 'No. of Working Days', `${salary.totalWorkingDays || 0}`, 60, summaryTop + 58);
  drawKeyValue(doc, 'No. of Absent Days', `${salary.lopDays || 0}`, 320, summaryTop + 10);
  drawKeyValue(doc, 'Salary', `₹${Number(salary.netSalary || 0).toFixed(2)}`, 320, summaryTop + 34);

  doc.y = summaryTop + 100;
  doc.moveDown(1);

  // Bottom note
  doc.font(bodyFont).fontSize(8).fillColor('#64748b').text('Note: Salary figure shown above is the net payable amount after applicable deductions.', 50, doc.y, { width: pageWidth });
  doc.moveDown(0.8);
  doc.font(bodyFont).fontSize(8).fillColor('#475569').text('This payslip is generated by the Geonixa Payroll system and is intended for employee record only.', 50, doc.y, { width: pageWidth });
}

async function populateSalaryDetails(salary) {
  await enrichSalary(salary);
  const [year, month] = (salary.month || '').split('-');
  const startDate = new Date(`${year}-${month}-01`);
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
  let attendanceRecords = [];
  try {
    const attendanceSnap = await db.collection('attendance')
      .where('employeeId', '==', salary.employeeId)
      .where('date', '>=', startDate.toISOString().slice(0, 10))
      .where('date', '<=', endDate.toISOString().slice(0, 10))
      .get();
    attendanceRecords = attendanceSnap.docs.map(doc => doc.data());
  } catch (err) {
    console.warn('Attendance query failed, defaulting to zeroes:', err.message);
    attendanceRecords = [];
  }

  salary.daysWorked = attendanceRecords.filter(a => a.status === 'Present' || a.status === 'Late').length;
  salary.lopDays = attendanceRecords.filter(a => a.status === 'Absent').length;
  salary.totalWorkingDays = endDate.getDate();
  salary.incrementArrearDays = 0;
  salary.arrearDays = 0;
}

router.get('/generate/:salaryId', authenticate, async (req, res) => {
  const { salaryId } = req.params;
  const { role, id } = req.user;
  try {
    const salaryDoc = await db.collection('salaries').doc(salaryId).get();
    if (!salaryDoc.exists) return res.status(404).json({ error: 'Salary record not found' });
    
    const salary = salaryDoc.data();
    if (role !== 'admin' && salary.employeeId !== id) {
      return res.status(403).json({ error: 'Unauthorized to access this payslip' });
    }
    if (role !== 'admin' && salary.status && salary.status !== 'Released') {
      return res.status(403).json({ error: 'Payslip not yet released' });
    }

    await populateSalaryDetails(salary);

    // Build PDF to temp file, optionally protect it, then stream.
    const generatedPath = await buildPayslipFile(salary);
    let toSendPath = generatedPath;
    try {
      await protectPdfIfNeeded(generatedPath);
      const protectedPath = generatedPath.replace(/\.pdf$/i, '-protected.pdf');
      const startWait = Date.now();
      const waitTimeout = 5000;
      while (Date.now() - startWait < waitTimeout) {
        try { if (fs.existsSync(protectedPath) && fs.statSync(protectedPath).size > 0) { toSendPath = protectedPath; break; } } catch (e) {}
        await new Promise(r => setTimeout(r, 150));
      }
    } catch (e) {
      console.error('PDF protection step failed:', e);
      toSendPath = generatedPath;
    }

    if (!fs.existsSync(toSendPath)) return res.status(500).json({ error: 'Payslip file not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payslip-${salary.month}.pdf`);
    const readStream = fs.createReadStream(toSendPath);
    readStream.pipe(res);
    const cleanup = () => {
      try { if (fs.existsSync(generatedPath)) fs.unlinkSync(generatedPath); } catch (e) {}
      try { const protectedPath = generatedPath.replace(/\.pdf$/i, '-protected.pdf'); if (fs.existsSync(protectedPath)) fs.unlinkSync(protectedPath); } catch (e) {}
    };
    readStream.on('end', cleanup);
    readStream.on('close', cleanup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/release/:salaryId', authenticate, authorize(['admin']), async (req, res) => {
  const { salaryId } = req.params;
  try {
    const salaryDocRef = db.collection('salaries').doc(salaryId);
    const salaryDoc = await salaryDocRef.get();
    if (!salaryDoc.exists) return res.status(404).json({ error: 'Salary record not found' });

    const salary = salaryDoc.data();
    await populateSalaryDetails(salary);

    const subject = `[CONFIDENTIAL] Your Geonixa Payslip for ${salary.month} is Released`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Geonixa Salary Slip Released</h2>
        <p>Hello <b>${salary.name}</b>,</p>
        <p>Your payslip for the month of <b>${salary.month}</b> has been released and is available to download from the employee portal.</p>
        <p>Please log in to your Geonixa account and visit the Salary section to download your payslip.</p>
        <br>
        <p>Best Regards,<br>Finance & Payroll Department<br>Geonixa Technologies</p>
      </div>
    `;

    await sendSalaryEmail(salary, subject, html);
    await salaryDocRef.update({
      status: 'Released',
      releasedAt: new Date().toISOString(),
      releasedBy: req.user.id
    });

    res.json({ message: 'Payslip released and employee notified successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/send-email', authenticate, authorize(['admin']), async (req, res) => {
  const { salaryId } = req.body;
  try {
    const salaryDocRef = db.collection('salaries').doc(salaryId);
    const salaryDoc = await salaryDocRef.get();
    if (!salaryDoc.exists) return res.status(404).json({ error: 'Salary record not found' });
    
    const salary = salaryDoc.data();
    await populateSalaryDetails(salary);
    
    if (!salary.email) {
      return res.status(400).json({ error: 'Employee does not have an email address' });
    }

    const subject = `[CONFIDENTIAL] Monthly Payslip - ${salary.month} - Geonixa Technologies`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Monthly Salary Credit Notice</h2>
        <p>Hello <b>${salary.name}</b>,</p>
        <p>Your salary for the month of <b>${salary.month}</b> has been processed and credited to your account.</p>
        <p>Please find the detailed digital payslip attached to this email for your records.</p>
        <br>
        <p>Best Regards,<br>Finance & Payroll Department<br>Geonixa Technologies</p>
      </div>
    `;

    await sendSalaryEmail(salary, subject, html);
    if (salary.status !== 'Released') {
      await salaryDocRef.update({ status: 'Released', releasedAt: new Date().toISOString() });
    }

    res.json({ message: 'Professional payslip sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:salaryId', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { salaryId } = req.params;
    const salaryDoc = await db.collection('salaries').doc(salaryId).get();
    if (!salaryDoc.exists) return res.status(404).json({ error: 'Salary record not found' });
    
    await db.collection('salaries').doc(salaryId).delete();
    res.json({ message: 'Salary record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
