const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'client/backend/routes/tasks.js');
let content = fs.readFileSync(file, 'utf8');

const anchor = "router.patch('/submit/:id/approve', authenticate, authorize(['admin', 'hr', 'manager', 'post_sales', 'post sales']), async (req, res) => {";

const newRoutes = `
router.get('/submit/clearances', authenticate, authorize(['admin', 'hr', 'manager', 'post_sales', 'post sales']), async (req, res) => {
  try {
    const submissions = await prisma.studentSubmission.findMany({
      where: { 
        approvalStatus: 'Approved',
        remainingAmount: { gt: 0 }
      },
      include: { target: true },
      orderBy: { date: 'asc' }
    });

    const employeeIds = [...new Set(submissions.map(s => s.employeeId))];
    const employees = await prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: { id: true, name: true, email: true, teamId: true }
    });
    
    const employeeMap = {};
    employees.forEach(emp => employeeMap[emp.id] = emp.name);

    const mapped = submissions.map(s => {
      const employeeName = employeeMap[s.employeeId] || 'Admin / Unknown';
      return {
        ...s,
        employeeName,
        date: s.date.toISOString(),
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString()
      };
    });

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/submit/:id/update-payment', authenticate, authorize(['admin', 'hr', 'manager', 'post_sales', 'post sales']), async (req, res) => {
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
});

`;

content = content.replace(anchor, newRoutes + anchor);
fs.writeFileSync(file, content, 'utf8');
console.log('Backend routes updated.');
