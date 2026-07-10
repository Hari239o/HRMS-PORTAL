require('dotenv').config({ path: '../.env' });
const axios = require('axios');

async function checkRun() {
  const secretKey = process.env.KNOCK_SECRET_API_KEY;
  try {
    const res = await axios.get('https://api.knock.app/v1/workflow_runs/7f0389c3-c054-5cba-8c3e-d5be1328faa2', {
      headers: {
        'Authorization': `Bearer ${secretKey}`
      }
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Error fetching run:', err.response ? err.response.data : err.message);
  }
}
checkRun();
