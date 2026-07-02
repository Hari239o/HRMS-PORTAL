const fs = require('fs');
const file = 'client/backend/routes/tasks.js';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('uploadMiddleware')) {
  content = `const upload = require('../utils/uploadMiddleware');\nconst { uploadStreamToGCS } = require('../utils/gcs');\n` + content;
}

const oldRoute = `router.post('/submit', authenticate, async (req, res) => {
  const { studentName, domain, collegeName, mailId, phoneNumber, totalAmount, amountPaid, remainingAmount, remainingAmountDate } = req.body;`;

const newRoute = `router.post('/submit', authenticate, upload.single('file'), async (req, res) => {
  const { studentName, domain, collegeName, mailId, phoneNumber, totalAmount, amountPaid, remainingAmount, remainingAmountDate, courseType, courseDuration } = req.body;
  let fileUrl = null;
  if (req.file) {
    try {
      fileUrl = await uploadStreamToGCS(req.file, 'submissions');
    } catch (error) {
      console.error('File upload failed', error);
    }
  }`;

if (content.includes(oldRoute)) {
  content = content.replace(oldRoute, newRoute);
}

const oldCreate = `await prisma.studentSubmission.create({
      data: {
        employeeId,
        targetId,
        studentName,
        domain: domain || '',
        collegeName: collegeName || '',
        mailId: mailId || '',
        phoneNumber: phoneNumber || '',
        totalAmount: parseFloat(totalAmount) || 0,
        amountPaid: parseFloat(amountPaid) || 0,
        remainingAmount: parseFloat(remainingAmount) || 0,
        remainingAmountDate: remainingAmountDate || null,
        callStatus: 'Not Answered',
        paymentStatus: 'Not Paid',
      }
    });`;

const newCreate = `await prisma.studentSubmission.create({
      data: {
        employeeId,
        targetId,
        studentName,
        domain: domain || '',
        collegeName: collegeName || '',
        mailId: mailId || '',
        phoneNumber: phoneNumber || '',
        totalAmount: parseFloat(totalAmount) || 0,
        amountPaid: parseFloat(amountPaid) || 0,
        remainingAmount: parseFloat(remainingAmount) || 0,
        remainingAmountDate: remainingAmountDate || null,
        callStatus: 'Not Answered',
        paymentStatus: 'Not Paid',
        courseType: courseType || null,
        courseDuration: courseDuration || null,
        fileUrl: fileUrl || null
      }
    });`;

if (content.includes(oldCreate)) {
  content = content.replace(oldCreate, newCreate);
} else {
    // try looser match
    const altOldCreate = `await prisma.studentSubmission.create({
      data: {
        employeeId,
        targetId,
        studentName,
        domain: domain || '',
        collegeName: collegeName || '',
        mailId: mailId || '',
        phoneNumber: phoneNumber || '',
        totalAmount: parseFloat(totalAmount) || 0,
        amountPaid: parseFloat(amountPaid) || 0,
        remainingAmount: parseFloat(remainingAmount) || 0,
        remainingAmountDate: remainingAmountDate || null,`;
    const altNewCreate = `await prisma.studentSubmission.create({
      data: {
        employeeId,
        targetId,
        studentName,
        domain: domain || '',
        collegeName: collegeName || '',
        mailId: mailId || '',
        phoneNumber: phoneNumber || '',
        totalAmount: parseFloat(totalAmount) || 0,
        amountPaid: parseFloat(amountPaid) || 0,
        remainingAmount: parseFloat(remainingAmount) || 0,
        remainingAmountDate: remainingAmountDate || null,
        courseType: courseType || null,
        courseDuration: courseDuration || null,
        fileUrl: fileUrl || null,`;
    content = content.replace(altOldCreate, altNewCreate);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Backend tasks updated successfully');
