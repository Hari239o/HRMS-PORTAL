require('dotenv').config({ path: '../.env' });
const prisma = require('../prisma/client');
const axios = require('axios');

async function directKnockToKishore() {
  const secretKey = process.env.KNOCK_SECRET_API_KEY;
  if (!secretKey) return;
  
  console.log('Sending direct Knock Trigger and WAITING 20 seconds...');
  try {
    const res = await axios.post('https://api.knock.app/v1/workflows/in-app-feed/trigger', {
      recipients: ['420bc056-b5d3-494c-8748-b16d68aa52bd'], // Kishore
      data: {
        title: 'Final Test PUSH',
        message: 'Kishore, please tell Hari if you got this on your screen! It should pop up directly.',
        urlData: {}
      }
    }, {
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Knock HTTP 200 Success!', res.data);
    await new Promise(r => setTimeout(r, 20000));
    console.log('Wait complete.');
  } catch (err) {
    console.error('Knock Error:', err.response ? err.response.data : err.message);
  }
}
directKnockToKishore();
