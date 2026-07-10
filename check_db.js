const prisma = require('./client/prisma/client');
async function check() {
  const notifs = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log('Recent notifications in DB:', notifs);
}
check();
