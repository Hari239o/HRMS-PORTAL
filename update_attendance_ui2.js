const fs = require('fs');

async function main() {
  const pagePath = 'client/src/app/(protected)/attendance/page.jsx';
  let content = fs.readFileSync(pagePath, 'utf8');

  // 1. Wrap the return statement with a Fragment
  const returnStartOld = `return (\n    <div className="space-y-8 fade-in relative">`;
  const returnStartNew = `return (\n    <>\n      <div className="space-y-8 fade-in relative">`;
  content = content.replace(returnStartOld, returnStartNew);

  // 2. Close the root div before the modal
  const modalStartOld = `      {/* Missed Checkout Request Modal */}`;
  const modalStartNew = `      </div>\n\n      {/* Missed Checkout Request Modal */}`;
  content = content.replace(modalStartOld, modalStartNew);

  // 3. Replace the final closing div with fragment close
  const fileEndOld = `    </div>\n  );\n}`;
  const fileEndNew = `    </>\n  );\n}`;
  content = content.replace(fileEndOld, fileEndNew);

  // 4. Update the Raise Attendance Issue button UI
  const buttonOld = `className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl transition-colors border border-rose-200 flex items-center justify-center gap-2 shadow-sm"`;
  const buttonNew = `className="w-full py-4 bg-gradient-to-r from-rose-500 to-[#eb4917] hover:from-rose-600 hover:to-[#d43f10] text-white font-black rounded-2xl transition-all duration-300 border border-transparent flex items-center justify-center gap-2 shadow-xl shadow-rose-500/30 hover:shadow-2xl hover:shadow-rose-500/40 hover:-translate-y-1 tracking-wide uppercase text-sm"`;
  content = content.replace(buttonOld, buttonNew);
  
  const iconOld = `<AlertCircle size={18} />\n              Raise Attendance Issue`;
  const iconNew = `<AlertCircle size={20} strokeWidth={2.5} />\n              Raise Attendance Issue`;
  content = content.replace(iconOld, iconNew);

  // 5. Remove the glass morphism and animation from the modal
  const modalWrapperOld = `<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">`;
  const modalWrapperNew = `<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">`;
  content = content.replace(modalWrapperOld, modalWrapperNew);

  fs.writeFileSync(pagePath, content);
  console.log('Successfully updated attendance page UI and fixed modal positioning');
}

main();
