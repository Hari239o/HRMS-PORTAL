const { PrismaClient } = require('@prisma/client');

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Intercept Notification creations to send to Knock
prisma.$use(async (params, next) => {
  const result = await next(params);
  
  if (params.model === 'Notification' && (params.action === 'create' || params.action === 'createMany')) {
    const triggerKnock = async (data) => {
      const secretKey = process.env.KNOCK_SECRET_API_KEY;
      if (!secretKey) return;
      
      try {
        await fetch('https://api.knock.app/v1/workflows/in-app-feed/trigger', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            recipients: [data.userId],
            data: {
              title: data.title,
              message: data.message,
              urlData: data.data || {}
            }
          })
        });
      } catch (err) {
        console.error('Knock API Error:', err);
      }
    };

    if (params.action === 'create') {
      triggerKnock(params.args.data);
    } else if (params.action === 'createMany') {
      const records = Array.isArray(params.args.data) ? params.args.data : [params.args.data];
      records.forEach(triggerKnock);
    }
  }

  return result;
});

module.exports = prisma;
