const prisma = require('./client/prisma/client');

async function test() {
  try {
    const admin = await prisma.employee.findFirst({ where: { role: 'admin' } });
    if (!admin) {
      console.log('No admin found');
      return;
    }
    console.log('Creating notification for admin:', admin.id);
    const n = await prisma.notification.create({
      data: {
        userId: admin.id,
        title: 'Test Title',
        message: 'Test Message',
        type: 'test'
      }
    });
    console.log('Notification created:', n);
  } catch (e) {
    console.error('Error:', e);
  }
}

test();
