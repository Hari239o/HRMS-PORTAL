const fs = require('fs');
const file = 'client/src/app/(protected)/performance/page.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add paymentDate state
const oldState = `const [paymentAmount, setPaymentAmount] = useState('');`;
const newState = `const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');`;
if (!content.includes('const [paymentDate')) {
  content = content.replace(oldState, newState);
}

// 2. Update handleUpdatePayment
const oldHandleUpdate = `      await api.patch(\`/api/tasks/submit/\${selectedClearance.id}/update-payment\`, {
        additionalPayment: paymentAmount
      });
      toast.success('Payment updated successfully');
      setSelectedClearance(null);
      setPaymentAmount('');
      fetchClearances();`;
const newHandleUpdate = `      await api.patch(\`/api/tasks/submit/\${selectedClearance.id}/update-payment\`, {
        additionalPayment: paymentAmount,
        paymentDate: paymentDate || new Date().toISOString()
      });
      toast.success('Payment updated successfully');
      setSelectedClearance(null);
      setPaymentAmount('');
      setPaymentDate('');
      fetchClearances();`;
content = content.replace(oldHandleUpdate, newHandleUpdate);

// 3. Update onClick reset
content = content.replace(`setPaymentAmount(''); setIsDefaulting(false);`, `setPaymentAmount(''); setPaymentDate(''); setIsDefaulting(false);`);

// 4. Update the Date display in Modal
content = content.replace(`Date: {format(new Date(selectedClearance.updatedAt || selectedClearance.date), 'dd MMM')}`, `Date: {format(new Date(selectedClearance.lastPaymentDate || selectedClearance.updatedAt || selectedClearance.date), 'dd MMM')}`);

// 5. Update the form to include the date input
const oldFormInput = `<label className="block text-sm font-bold text-slate-700 mb-2">New Payment Amount (₹)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max={selectedClearance.remainingAmount}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent block p-4 font-medium transition-all"
                        placeholder="Enter amount paid"
                      />
                      <button`;

const newFormInput = `<div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Payment Amount (₹)</label>
                          <input
                            type="number"
                            required
                            min="1"
                            max={selectedClearance.remainingAmount}
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent block p-4 font-medium transition-all"
                            placeholder="Enter amount"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Date Received</label>
                          <input
                            type="date"
                            required
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent block p-4 font-medium transition-all"
                          />
                        </div>
                      </div>
                      <button`;

if (content.includes('New Payment Amount (₹)')) {
  content = content.replace(oldFormInput, newFormInput);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated frontend for date option!');
