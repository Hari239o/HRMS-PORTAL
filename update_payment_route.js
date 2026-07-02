const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'client/backend/routes/tasks.js');
let content = fs.readFileSync(file, 'utf8');

const targetStr = `router.patch('/submit/:id/update-payment', authenticate, authorize(['admin', 'hr', 'manager', 'post_sales', 'post sales']), async (req, res) => {
  try {
    const { additionalPayment } = req.body;
    const payment = parseFloat(additionalPayment);

    if (isNaN(payment) || payment <= 0) {
      return res.status(400).json({ error: 'Invalid payment amount' });
    }

    const submission = await prisma.studentSubmission.findUnique({ where: { id: req.params.id } });
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    if (submission.remainingAmount < payment) {
      return res.status(400).json({ error: 'Payment exceeds remaining balance' });
    }

    // Update submission
    await prisma.studentSubmission.update({
      where: { id: req.params.id },
      data: { 
        amountPaid: { increment: payment },
        remainingAmount: { decrement: payment }
      }
    });

    // Update target revenue
    if (submission.targetId) {
      await prisma.target.update({
        where: { id: submission.targetId },
        data: { 
          achievedRevenue: { increment: payment }
        }
      });
    }

    res.json({ success: true, message: 'Payment updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});`;

const newStr = `router.patch('/submit/:id/update-payment', authenticate, authorize(['admin', 'hr', 'manager', 'post_sales', 'post sales']), async (req, res) => {
  try {
    const { additionalPayment, paymentDate } = req.body;
    const payment = parseFloat(additionalPayment);

    if (isNaN(payment) || payment <= 0) {
      return res.status(400).json({ error: 'Invalid payment amount' });
    }

    const submission = await prisma.studentSubmission.findUnique({ where: { id: req.params.id } });
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    if (submission.remainingAmount < payment) {
      return res.status(400).json({ error: 'Payment exceeds remaining balance' });
    }

    const isFullyPaid = (submission.remainingAmount - payment) === 0;
    const paymentDateObj = paymentDate ? new Date(paymentDate) : new Date();

    // Update submission
    await prisma.studentSubmission.update({
      where: { id: req.params.id },
      data: { 
        amountPaid: { increment: payment },
        remainingAmount: { decrement: payment },
        lastPaymentDate: paymentDateObj
      }
    });

    // Update target revenue
    if (submission.targetId) {
      await prisma.target.update({
        where: { id: submission.targetId },
        data: { 
          achievedRevenue: { increment: payment }
        }
      });
    }

    // Notifications for full payment
    if (isFullyPaid) {
      try {
        await prisma.notification.create({
          data: {
            userId: submission.employeeId,
            title: 'Full Payment Received',
            message: \`The full payment for student \${submission.studentName} has been received!\`,
            type: 'payment_completed'
          }
        });

        const employee = await prisma.employee.findUnique({
          where: { id: submission.employeeId },
          include: { team: true }
        });
        
        if (employee && employee.team && employee.team.leaderId) {
          await prisma.notification.create({
            data: {
              userId: employee.team.leaderId,
              title: 'Team Member Fully Paid Intake',
              message: \`\${employee.name} has secured full payment for student \${submission.studentName}!\`,
              type: 'team_payment_completed'
            }
          });
        }
      } catch (notifErr) {
        console.error('Error sending notifications:', notifErr);
      }
    }

    res.json({ success: true, message: 'Payment updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});`;

content = content.replace(targetStr, newStr);
fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated update-payment route!');
