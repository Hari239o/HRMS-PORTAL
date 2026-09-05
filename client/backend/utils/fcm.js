const admin = require('firebase-admin');
const axios = require('axios');
const path = require('path');

// Initialize Firebase Admin with the same credentials used for GCS
if (!admin.apps.length) {
  let serviceAccount = null;
  
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
      serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    } catch (e) {
      console.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON for FCM');
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      const fullPath = path.resolve(__dirname, '..', process.env.GOOGLE_APPLICATION_CREDENTIALS);
      serviceAccount = require(fullPath);
    } catch (e) {
      console.error('Failed to load local credential file for FCM');
    }
  }

  if (serviceAccount) {
    try {
      // CRITICAL: Delete this environment variable before initializing Firebase Admin, 
      // otherwise google-auth-library will attempt to read the file and crash on Vercel
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin initialized successfully via cert.');
    } catch (err) {
      console.error('Failed to initialize Firebase Admin:', err.message);
    }
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
      console.log('Firebase Admin initialized via applicationDefault().');
    } catch (e) {
      console.error('Firebase Admin complete failure:', e.message);
    }
  }
}

/**
 * Sends a push notification directly using Firebase Admin SDK, by fetching the FCM token from Knock.
 * This bypasses Knock's push delivery pipeline, ensuring push notifications are sent even if Knock workflows
 * are missing the push channel.
 */
async function sendDirectPushNotification(userId, title, message, urlData = {}) {
  const secretKey = process.env.KNOCK_SECRET_API_KEY;
  const fcmChannelId = process.env.NEXT_PUBLIC_KNOCK_FCM_CHANNEL_ID;
  
  if (!secretKey || !fcmChannelId) {
    console.warn('Skipping direct FCM push: Missing Knock keys in env.');
    return;
  }
  
  if (!admin.apps.length) {
    console.warn('Skipping direct FCM push: Firebase Admin is not initialized.');
    return;
  }

  try {
    // 1. Fetch user's registered FCM tokens from Knock
    const res = await axios.get(`https://api.knock.app/v1/users/${userId}/channel_data/${fcmChannelId}`, {
      headers: { 'Authorization': `Bearer ${secretKey}` }
    });

    const tokens = res.data?.data?.tokens;
    if (!tokens || tokens.length === 0) {
      console.log(`No FCM tokens registered in Knock for user ${userId}. Direct push skipped.`);
      return;
    }

    // 2. Prepare FCM payload
    // Note: React Native / Capacitor apps often expect specific payload formats for routing
    const payload = {
      notification: {
        title: title,
        body: message,
      },
      data: {
        ...urlData,
        // Stringify any nested objects in data since FCM only accepts string key/values
        ...(Object.fromEntries(Object.entries(urlData).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v)])))
      },
      tokens: tokens
    };

    // 3. Send via Firebase Admin Multicast
    const response = await admin.messaging().sendEachForMulticast(payload);
    console.log(`Direct FCM Push to ${userId}: ${response.successCount} successful, ${response.failureCount} failed.`);
    
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`Token ${tokens[idx]} failed:`, resp.error);
        }
      });
    }
  } catch (error) {
    console.error(`Error in sendDirectPushNotification for ${userId}:`, error.response?.data || error.message);
  }
}

module.exports = {
  sendDirectPushNotification,
  admin
};
