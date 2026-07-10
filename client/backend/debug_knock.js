require('dotenv').config({ path: '../.env' });
const axios = require('axios');

async function debugKnock() {
  const secretKey = process.env.KNOCK_SECRET_API_KEY;
  if (!secretKey) {
    console.error('No Knock API key found in ../.env!');
    return;
  }
  
  console.log('Using Secret Key:', secretKey.substring(0, 10) + '...');

  const recipients = [
    'bf381029-6a70-4c8d-a327-7acc7961a3d2', // Hari Kishore (Admin)
    '420bc056-b5d3-494c-8748-b16d68aa52bd'  // Kishore
  ];

  console.log('Sending direct Knock API request to:', recipients);

  try {
    const res = await axios.post('https://api.knock.app/v1/workflows/in-app-feed/trigger', {
      recipients: recipients,
      data: {
        title: 'TEST PUSH',
        message: 'This is a strict direct push test! Did you get it?',
        urlData: {}
      }
    }, {
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Knock API Response:', res.status, res.data);
  } catch (err) {
    console.error('Knock API Error Details:', err.response ? JSON.stringify(err.response.data, null, 2) : err.message);
  }
}

debugKnock();
