export const isSuperAdmin = (user) => {
  if (!user) return false;
  return user.role === 'admin' || user.email === 'harikishorereddy9908@gmail.com';
};

export const hasAdminAccess = (user) => {
  if (!user) return false;
  return isSuperAdmin(user) || user.role === 'hr';
};
