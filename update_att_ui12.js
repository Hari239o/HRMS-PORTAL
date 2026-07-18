const fs = require('fs');

async function main() {
  const pagePath = 'client/src/app/(protected)/leaves/page.jsx';
  let content = fs.readFileSync(pagePath, 'utf8');

  // Fix mobile layout for toolbar (make filter and apply button side-by-side on mobile)
  const mobileToolbarOld = `<div className="flex flex-col sm:flex-row w-full md:w-auto items-stretch sm:items-center gap-4 z-10">
          <div className="relative w-full sm:w-auto sm:min-w-[160px]">`;
  const mobileToolbarNew = `<div className="flex flex-row w-full md:w-auto items-stretch sm:items-center gap-4 z-10">
          <div className="relative flex-1 sm:flex-none sm:w-auto sm:min-w-[160px]">`;
  content = content.replace(mobileToolbarOld, mobileToolbarNew);

  // For the Apply buttons, make them flex-1 on mobile so they share space with the select
  const applyLeaveOld = `className="bg-[#eb4917] hover:bg-[#d43f10] text-white px-6 py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-[#eb4917]/30 transition-all duration-300 transform hover:-translate-y-1 w-full sm:w-auto"`;
  const applyLeaveNew = `className="bg-[#eb4917] hover:bg-[#d43f10] text-white px-4 py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-[#eb4917]/30 transition-all duration-300 transform hover:-translate-y-1 flex-1 sm:flex-none sm:w-auto whitespace-nowrap"`;
  // Using global replace for both Apply Leave and Raise Issue buttons
  content = content.split(applyLeaveOld).join(applyLeaveNew);

  fs.writeFileSync(pagePath, content);
  console.log('Successfully updated mobile toolbar layout in leaves page');
}

main();
