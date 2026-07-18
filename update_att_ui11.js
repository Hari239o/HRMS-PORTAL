const fs = require('fs');

async function main() {
  const pagePath = 'client/src/app/(protected)/leaves/page.jsx';
  let content = fs.readFileSync(pagePath, 'utf8');

  // Remove backdrop blur and animations from Leave Modal
  const leaveModalOld = `<div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] flex flex-col rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-gray-100">`;
  const leaveModalNew = `<div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] flex flex-col rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100">`;
  content = content.replace(leaveModalOld, leaveModalNew);

  // Remove backdrop blur and animations from Problem Modal
  const problemModalOld = `<div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] flex flex-col rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-gray-100">`;
  const problemModalNew = `<div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] flex flex-col rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100">`;
  content = content.replace(problemModalOld, problemModalNew);

  fs.writeFileSync(pagePath, content);
  console.log('Successfully updated modals to snap open without blur or animation');
}

main();
