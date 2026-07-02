const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'client/backend/routes/tasks.js');
let content = fs.readFileSync(file, 'utf8');

const updatePaymentIdx = content.indexOf("router.patch('/submit/:id/update-payment'");
if (updatePaymentIdx === -1) {
  console.error("Could not find update-payment route");
  process.exit(1);
}

const before = content.substring(0, updatePaymentIdx);
const after = content.substring(updatePaymentIdx);

const defaultRoute = `router.patch('/submit/:id/default', authenticate, authorize(['admin', 'hr', 'manager', 'post_sales', 'post sales']), async (req, res) => {
  try {
    const { warning } = req.body;
    
    if (!warning) {
      return res.status(400).json({ error: 'Warning description is required' });
    }

    const submission = await prisma.studentSubmission.findUnique({ where: { id: req.params.id } });
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    if (submission.approvalStatus !== 'Approved') {
      return res.status(400).json({ error: 'Can only default an approved submission' });
    }

    // Update submission
    await prisma.studentSubmission.update({
      where: { id: req.params.id },
      data: { 
        approvalStatus: 'Defaulted',
        defaultWarning: warning
      }
    });

    // Reduce Target Revenue and Count
    if (submission.targetId) {
      await prisma.target.update({
        where: { id: submission.targetId },
        data: { 
          achievedRevenue: { decrement: submission.amountPaid },
          achievedCount: { decrement: 1 }
        }
      });
    }

    res.json({ message: 'Submission marked as defaulted and target updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

`;

fs.writeFileSync(file, before + defaultRoute + after, 'utf8');
console.log('Successfully inserted default route!');
