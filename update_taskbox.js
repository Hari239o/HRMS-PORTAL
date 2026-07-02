const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'client/src/app/(protected)/taskbox/page.jsx');
let content = fs.readFileSync(file, 'utf8');

// Insert import if not exists
if (!content.includes('import ApprovalsPage')) {
  content = content.replace(
    "import { hasAdminAccess, isSuperAdmin } from '@/utils/rbac';",
    "import { hasAdminAccess, isSuperAdmin } from '@/utils/rbac';\nimport ApprovalsPage from '../approvals/page';"
  );
}

// Find Employee View
const employeeViewTarget = "// Employee View";
const employeeViewReplace = `// Post Sales View
  if (user?.role === 'post_sales' || user?.role === 'post sales') {
    return <ApprovalsPage />;
  }

  // Employee View`;

if (!content.includes('return <ApprovalsPage />;')) {
  content = content.replace(employeeViewTarget, employeeViewReplace);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Update complete');
