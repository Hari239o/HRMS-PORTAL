const fs = require('fs');
const file = 'client/src/app/(protected)/performance/page.jsx';
let content = fs.readFileSync(file, 'utf8');

const target = `  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(\`\${process.env.NEXT_PUBLIC_API_URL || ''}/api/tasks/submit\`, form);
      toast.success('Sale registered successfully!');
      setForm({ studentName: '', domain: '', collegeName: '', mailId: '', phoneNumber: '', totalAmount: '', amountPaid: '', remainingAmount: '', remainingAmountDate: '' });
      fetchPerformance();
    } catch (err) {
      toast.error('Submission failed');
    }
  };`;

const replacement = `  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    
    // Validation for remaining amount date
    if (form.remainingAmount > 0) {
      if (!form.remainingAmountDate) {
        toast.error('Please select a due date for the remaining amount.');
        return;
      }
      
      const selectedDate = new Date(form.remainingAmountDate);
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Reset time to midnight for accurate day calculation
      
      const diffTime = selectedDate.getTime() - currentDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 10) {
        toast.error('The remaining amount due date must be within 10 days from today.');
        return;
      } else if (diffDays < 0) {
        toast.error('The due date cannot be in the past.');
        return;
      }
    }

    try {
      await api.post(\`\${process.env.NEXT_PUBLIC_API_URL || ''}/api/tasks/submit\`, form);
      toast.success('Sale registered successfully!');
      setForm({ studentName: '', domain: '', collegeName: '', mailId: '', phoneNumber: '', totalAmount: '', amountPaid: '', remainingAmount: '', remainingAmountDate: '' });
      fetchPerformance();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    }
  };`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log('Replaced successfully');
} else {
  console.log('Target not found in file');
}
