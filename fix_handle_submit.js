const fs = require('fs');
const file = 'client/src/app/(protected)/performance/page.jsx';
let content = fs.readFileSync(file, 'utf8');

const split = content.split('  const handleTargetAssign = async (e) => {');
const newContent = split[0] + `    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (form[key] !== null && form[key] !== undefined) {
          formData.append(key, form[key]);
        }
      });
      await api.post(\`\${process.env.NEXT_PUBLIC_API_URL || ''}/api/tasks/submit\`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});
      toast.success('Sale registered successfully!');
      setForm({ studentName: '', domain: '', collegeName: '', mailId: '', phoneNumber: '', totalAmount: '', amountPaid: '', remainingAmount: '', remainingAmountDate: '', courseType: 'Live', courseDuration: '1', file: null });
      if (document.querySelector('input[type="file"]')) {
        document.querySelector('input[type="file"]').value = '';
      }
      fetchPerformance();
    } catch (err) {
      toast.error('Submission failed');
    }
  };

  const handleTargetAssign = async (e) => {` + split[1];

fs.writeFileSync(file, newContent, 'utf8');
console.log('Fixed handleStudentSubmit');
