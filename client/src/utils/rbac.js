export const isSuperAdmin = (user) => {
  if (!user) return false;
  return user.role === 'admin' || user.email === 'harikishorereddy9908@gmail.com';
};

export const hasAdminAccess = (user) => {
  if (!user) return false;
  return isSuperAdmin(user) || user.role === 'hr';
};

export const hasApproverAccess = (user) => {
  if (!user) return false;
  return ['admin', 'hr', 'manager', 'post_sales', 'post sales'].includes(user.role) || isSuperAdmin(user);
};
