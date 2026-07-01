const fs = require('fs');
let c = fs.readFileSync('client/src/components/Sidebar.jsx', 'utf8');

c = c.replace(
  "import { hasAdminAccess, isSuperAdmin } from '@/utils/rbac';",
  "import { hasAdminAccess, isSuperAdmin, hasApproverAccess } from '@/utils/rbac';"
);

c = c.replace(
  "    { name: 'Performance', icon: Trophy, path: '/performance' },",
  "    { name: 'Performance', icon: Trophy, path: '/performance' },\n    { name: 'Approvals', icon: ClipboardList, path: '/approvals' },"
);

fs.writeFileSync('client/src/components/Sidebar.jsx', c);
