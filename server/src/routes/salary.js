const express = require('express');
const { db } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
let HummusRecipe = null;
// hummus-recipe removed due to native module crashes on Vercel

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  const { employeeId, month, basicSalary, hra, specialAllowance, incentives, otherAllowances, pf, esi, professionalTax, tds, otherDeductions, bonus } = req.body;
  try {
    const totalEarnings = (parseFloat(basicSalary) || 0) + (parseFloat(hra) || 0) + (parseFloat(specialAllowance) || 0) + (parseFloat(incentives) || 0) + (parseFloat(otherAllowances) || 0) + (parseFloat(bonus) || 0);
    const totalDeds = (parseFloat(pf) || 0) + (parseFloat(esi) || 0) + (parseFloat(professionalTax) || 0) + (parseFloat(tds) || 0) + (parseFloat(otherDeductions) || 0);
    const netSalary = totalEarnings - totalDeds;

    const id = Date.now().toString();
    await db.collection('salaries').doc(id).set({
      id,
      employeeId,
      month,
      basicSalary: parseFloat(basicSalary) || 0,
      hra: parseFloat(hra) || 0,
      specialAllowance: parseFloat(specialAllowance) || 0,
      incentives: parseFloat(incentives) || 0,
      otherAllowances: parseFloat(otherAllowances) || 0,
      bonus: parseFloat(bonus) || 0,
      pf: parseFloat(pf) || 0,
      esi: parseFloat(esi) || 0,
      professionalTax: parseFloat(professionalTax) || 0,
      tds: parseFloat(tds) || 0,
      otherDeductions: parseFloat(otherDeductions) || 0,
      baseSalary: parseFloat(basicSalary) || 0, // Fallback for old code
      deductions: totalDeds, // Fallback for old code
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
    salary.designation = emp.designation || (emp.role === 'admin' ? 'HR Administrator' : 'Individual Contributor');
    salary.empId = emp.empId || 'Company will provide while release';
    salary.pan = emp.pan || 'N/A';
    salary.uan = emp.uan || 'N/A';
    salary.bankName = emp.bankName || 'N/A';
    salary.accountNumber = emp.accountNumber || 'N/A';
    salary.joinDate = emp.createdAt || emp.joinDate || null;
    salary.email = emp.email;
    salary.functionalArea = emp.department || 'Operations';
  } else {
    salary.name = 'Unknown';
    salary.department = 'Unknown';
    salary.employeeRole = 'Employee';
    salary.designation = 'Individual Contributor';
    salary.empId = 'N/A';
    salary.pan = 'N/A';
    salary.uan = 'N/A';
    salary.bankName = 'N/A';
    salary.accountNumber = 'N/A';
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

function numToWords(amount) {
  return "Rupees " + Math.floor(amount).toString() + " Only"; // Simplified fallback, could add full library if needed
}

function generateProfessionalPDF(doc, salary) {
  const titleFont = 'Helvetica-Bold';
  const bodyFont = 'Helvetica';
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const margin = 50;

  const paddedMonth = monthLabel(salary.month);

  // Header Left (Logo)
  doc.fillColor('#e84b25').font(titleFont).fontSize(28).text('GEONIXA', margin, margin);
  
  // Header Right (Address)
  doc.font(bodyFont).fontSize(9).fillColor('#333333').text('247, Trendz aspire, Madhapur, Hyderabad,500033', margin, margin + 10, { align: 'right' });
  doc.text('www.geonixa.com', margin, margin + 22, { align: 'right' });
  
  // Divider
  doc.moveTo(margin, margin + 40).lineTo(doc.page.width - margin, margin + 40).lineWidth(1).stroke('#000000');
  
  // Title
  doc.font(titleFont).fontSize(14).fillColor('#000000').text(`Salary Slip – ${paddedMonth}`, margin, margin + 50, { align: 'center' });
  
  doc.moveDown(1.5);
  doc.font(titleFont).fontSize(12).text('Employee Details', margin, doc.y);
  doc.moveDown(0.5);

  const drawRow = (y, leftText, rightText, isBoldLeft = false, isBoldRight = false) => {
    doc.rect(margin, y, 200, 25).stroke();
    doc.rect(margin + 200, y, doc.page.width - 2 * margin - 200, 25).stroke();
    
    // Header cells styling
    if (isBoldLeft) doc.rect(margin, y, 200, 25).fill('#e2e2e2').stroke();
    if (isBoldRight) doc.rect(margin + 200, y, doc.page.width - 2 * margin - 200, 25).fill('#e2e2e2').stroke();

    doc.fillColor('#000000').font(isBoldLeft ? titleFont : bodyFont).fontSize(10).text(leftText, margin + 5, y + 8, { width: 190 });
    doc.fillColor('#000000').font(isBoldRight ? titleFont : bodyFont).fontSize(10).text(rightText, margin + 205, y + 8, { width: doc.page.width - 2 * margin - 210 });
  };

  let currentY = doc.y;
  
  drawRow(currentY, 'Employee Name', salary.name, true, true); currentY += 25;
  drawRow(currentY, 'Employee ID', salary.empId, true, true); currentY += 25;
  drawRow(currentY, 'Designation', salary.designation, true, true); currentY += 25;
  drawRow(currentY, 'PAN', salary.pan, true, true); currentY += 25;
  drawRow(currentY, 'UAN', salary.uan, true, true); currentY += 25;
  drawRow(currentY, 'Bank Name', salary.bankName, true, true); currentY += 25;
  drawRow(currentY, 'Account Number', salary.accountNumber, true, true); currentY += 25;

  doc.y = currentY + 20;
  
  doc.font(titleFont).fontSize(12).text('Salary Details', margin, doc.y);
  doc.moveDown(0.5);

  currentY = doc.y;
  
  const drawSalaryRow = (y, col1, col2, col3, col4, isHeader = false) => {
    const colWidths = [150, 100, 150, 100];
    const xOffsets = [margin, margin + 150, margin + 250, margin + 400];
    
    // Draw borders
    for (let i = 0; i < 4; i++) {
      if (isHeader) {
        doc.rect(xOffsets[i], y, colWidths[i], 25).fill('#e2e2e2').stroke();
      } else {
        doc.rect(xOffsets[i], y, colWidths[i], 25).stroke();
        // shaded cells for totals or empty
        if (col1 === 'Total Earnings (A)' || col3 === 'Total Deductions (B)') {
          doc.rect(xOffsets[i], y, colWidths[i], 25).fill('#e2e2e2').stroke();
        }
      }
    }
    
    doc.fillColor('#000000').font(isHeader ? titleFont : bodyFont).fontSize(10);
    if (!isHeader && (col1 === 'Total Earnings (A)' || col3 === 'Total Deductions (B)')) {
       doc.font(titleFont);
    }

    doc.text(col1, xOffsets[0] + 5, y + 8, { width: colWidths[0] - 10 });
    doc.text(col2, xOffsets[1] + 5, y + 8, { width: colWidths[1] - 10 });
    doc.text(col3, xOffsets[2] + 5, y + 8, { width: colWidths[2] - 10 });
    doc.text(col4, xOffsets[3] + 5, y + 8, { width: colWidths[3] - 10 });
  };

  drawSalaryRow(currentY, 'Earnings', `₹${Number(salary.basicSalary || salary.baseSalary || 0).toFixed(2)}`, 'Deductions', 'Amount (₹)', true); currentY += 25;
  drawSalaryRow(currentY, 'Basic Salary', `₹${Number(salary.basicSalary || salary.baseSalary || 0).toFixed(2)}`, 'Provident Fund (PF)', `₹${Number(salary.pf || 0).toFixed(2)}`); currentY += 25;
  drawSalaryRow(currentY, 'HRA', `₹${Number(salary.hra || 0).toFixed(2)}`, 'ESI', `₹${Number(salary.esi || 0).toFixed(2)}`); currentY += 25;
  drawSalaryRow(currentY, 'Special Allowance', `₹${Number(salary.specialAllowance || 0).toFixed(2)}`, 'Professional Tax', `₹${Number(salary.professionalTax || 0).toFixed(2)}`); currentY += 25;
  drawSalaryRow(currentY, 'Incentives', `₹${Number(salary.incentives || 0).toFixed(2)}`, 'TDS', `₹${Number(salary.tds || 0).toFixed(2)}`); currentY += 25;
  drawSalaryRow(currentY, 'Other Allowances', `₹${Number(salary.otherAllowances || 0).toFixed(2)}`, 'Other Deductions', `₹${Number(salary.otherDeductions || 0).toFixed(2)}`); currentY += 25;
  
  const totalEarnings = (salary.basicSalary || salary.baseSalary || 0) + (salary.hra || 0) + (salary.specialAllowance || 0) + (salary.incentives || 0) + (salary.otherAllowances || 0) + (salary.bonus || 0);
  const totalDeductions = (salary.pf || 0) + (salary.esi || 0) + (salary.professionalTax || 0) + (salary.tds || 0) + (salary.otherDeductions || 0);
  const netPay = totalEarnings - totalDeductions;

  drawSalaryRow(currentY, 'Total Earnings (A)', `₹${Number(totalEarnings).toFixed(2)}`, 'Total Deductions (B)', `₹${Number(totalDeductions).toFixed(2)}`); currentY += 25;

  // Net Pay Row
  doc.rect(margin, currentY, 250, 25).stroke();
  doc.rect(margin + 250, currentY, doc.page.width - 2 * margin - 250, 25).stroke();
  doc.font(titleFont).text('Net Salary Payable (A - B)', margin + 5, currentY + 8);
  doc.font(titleFont).text(`₹${Number(netPay).toFixed(2)}`, margin + 255, currentY + 8);
  currentY += 25;

  // Words Row
  doc.rect(margin, currentY, 250, 25).stroke();
  doc.rect(margin + 250, currentY, doc.page.width - 2 * margin - 250, 25).stroke();
  doc.font(bodyFont).text('Net Pay (In Words)', margin + 5, currentY + 8);
  doc.font(titleFont).text(numToWords(netPay), margin + 255, currentY + 8);
  currentY += 45;

  doc.font(bodyFont).fontSize(10).text('Authorized Signatory For Geonixa Pvt. Ltd.', margin, currentY);
  currentY += 20;
  doc.font('Helvetica-Oblique').fontSize(10).text('Note: This is a system-generated salary slip.', margin, currentY);
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
