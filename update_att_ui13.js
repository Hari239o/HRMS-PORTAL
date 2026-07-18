const fs = require('fs');

async function main() {
  const pagePath = 'client/src/app/(protected)/leaves/page.jsx';
  let content = fs.readFileSync(pagePath, 'utf8');

  // 1. Wrap the return statement with a Fragment
  const returnStartOld = `return (\n    <div className="space-y-8 animate-in fade-in duration-700 pb-12 relative">`;
  const returnStartNew = `return (\n    <>\n      <div className="space-y-8 animate-in fade-in duration-700 pb-12 relative">`;
  content = content.replace(returnStartOld, returnStartNew);

  // 2. Close the root div before the modals
  const modalStartOld = `{/* Leave Application Modal */}`;
  const modalStartNew = `</div>\n\n      {/* Leave Application Modal */}`;
  content = content.replace(modalStartOld, modalStartNew);

  // 3. Replace the final closing div with fragment close
  const fileEndOld = `    </div>\n  );\n};`;
  const fileEndNew = `    </>\n  );\n};`;
  content = content.replace(fileEndOld, fileEndNew);

  fs.writeFileSync(pagePath, content);
  console.log('Successfully moved modals outside of animated relative container to fix fixed positioning bug');
}

main();
