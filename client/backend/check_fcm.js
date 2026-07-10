require('dotenv').config({ path: '../.env' });
const axios = require('axios');

async function checkChannelData() {
  const secretKey = process.env.KNOCK_SECRET_API_KEY;
  const fcmChannelId = process.env.NEXT_PUBLIC_KNOCK_FCM_CHANNEL_ID;
  
  if (!secretKey || !fcmChannelId) {
    console.error('Missing keys');
    return;
  }
  
  const userId = '420bc056-b5d3-494c-8748-b16d68aa52bd'; // Kishore

  try {
    const res = await axios.get(`https://api.knock.app/v1/users/${userId}/channel_data/${fcmChannelId}`, {
      headers: {
        'Authorization': `Bearer ${secretKey}`
      }
    });
    console.log('Channel Data for Kishore:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Error fetching channel data:', err.response ? err.response.data : err.message);
  }
}
checkChannelData();
