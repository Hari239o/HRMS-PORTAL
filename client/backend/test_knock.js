require('dotenv').config({ path: '../.env' });
const axios = require('axios');

async function testKnock() {
  const secretKey = process.env.KNOCK_SECRET_API_KEY;
  if (!secretKey) {
    console.error('No Knock Secret Key found!');
    return;
  }
  
  try {
    const res = await axios.post('https://api.knock.app/v1/workflows/in-app-feed/trigger', {
      recipients: ['19dc880e-e377-408b-bf3a-29c1463c65e9'], // Test employee ID
      data: {
        title: 'Lunch Time!',
        message: `Hey Test I think you tired get lunch from 1:30 pm to 2:30 pm and come fast with full of energy to complete today task`,
        urlData: {}
      }
    }, {
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Knock Trigger Success:', res.data);
  } catch (err) {
    console.error('Knock API Error:', err.response ? err.response.data : err.message);
  }
}
testKnock();
