const fs = require('fs');
const file = 'client/backend/routes/tasks.js';
let content = fs.readFileSync(file, 'utf8');

const newRoute = `
router.put('/submit/:id', authenticate, upload.single('file'), async (req, res) => {
  const { id } = req.params;
  const { studentName, domain, collegeName, mailId, phoneNumber, totalAmount, amountPaid, remainingAmount, remainingAmountDate, courseType, courseDuration } = req.body;
  const employeeId = req.user.id;
  
  try {
    const submission = await prisma.studentSubmission.findUnique({ where: { id } });
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    if (submission.employeeId !== employeeId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to edit this submission' });
    }

    let fileUrl = submission.fileUrl;
    if (req.file) {
      try {
        fileUrl = await uploadStreamToGCS(req.file, 'submissions');
      } catch (error) {
        console.error('File upload failed', error);
      }
    }

    if (parseFloat(remainingAmount) > 0) {
      if (!remainingAmountDate) {
        return res.status(400).json({ error: 'Due date is required for the remaining amount.' });
      }
      const selectedDate = new Date(remainingAmountDate);
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      const diffTime = selectedDate.getTime() - currentDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 10) {
        return res.status(400).json({ error: 'The remaining amount due date must be within 10 days from today.' });
      } else if (diffDays < 0) {
        return res.status(400).json({ error: 'The due date cannot be in the past.' });
      }
    }

    await prisma.studentSubmission.update({
      where: { id },
      data: {
        studentName,
        domain: domain || '',
        collegeName: collegeName || '',
        mailId: mailId || '',
        phoneNumber: phoneNumber || '',
        totalAmount: parseFloat(totalAmount) || 0,
        amountPaid: parseFloat(amountPaid) || 0,
        remainingAmount: parseFloat(remainingAmount) || 0,
        remainingAmountDate: remainingAmountDate || '',
        courseType: courseType || 'Live',
        courseDuration: courseDuration || '1',
        fileUrl
      }
    });

    res.json({ success: true, message: 'Student metric updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
`;

if (!content.includes("router.put('/submit/:id',")) {
    content = content.replace("router.get('/performance',", newRoute + "\nrouter.get('/performance',");
    fs.writeFileSync(file, content, 'utf8');
    console.log('Added PUT route');
} else {
    console.log('PUT route already exists');
}
