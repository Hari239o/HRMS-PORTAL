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
        const axios = require('axios');
        await axios.post('https://api.knock.app/v1/workflows/in-app-feed/trigger', {
          recipients: [data.userId],
          data: {
            title: data.title,
            message: data.message,
            urlData: data.data || {}
          }
        }, {
          headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (err) {
        console.error('Knock API Error:', err);
      }
    };

    if (params.action === 'create') {
      await triggerKnock(params.args.data);
    } else if (params.action === 'createMany') {
      const records = Array.isArray(params.args.data) ? params.args.data : [params.args.data];
      await Promise.all(records.map(triggerKnock));
    }
  }

  return result;
});

module.exports = prisma;
