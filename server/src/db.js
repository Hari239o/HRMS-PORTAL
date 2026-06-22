const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
const isDevelopment = process.env.NODE_ENV === 'development';
const useEmulator = isDevelopment && (
  process.env.USE_FIREBASE_EMULATOR === 'true' ||
  process.env.USE_FIRESTORE_EMULATOR === 'true'
);

console.log('Firebase Mode:', process.env.NODE_ENV || 'undefined');
console.log('USE_FIREBASE_EMULATOR:', process.env.USE_FIREBASE_EMULATOR);
console.log('USE_FIRESTORE_EMULATOR:', process.env.USE_FIRESTORE_EMULATOR);
console.log('Using Firestore emulator:', useEmulator);

if (useEmulator) {
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
  process.env.FIRESTORE_EMULATOR_HOST = emulatorHost;
  console.log('Connecting to Firestore emulator at', emulatorHost);

  try {
    admin.initializeApp({ projectId: process.env.FIRESTORE_PROJECT_ID || 'demo-geonixa' });
    console.log('Connected to Firestore emulator');
  } catch (e) {
    console.error('Firestore emulator init failed:', e.message || e);
    process.exit(1);
  }
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Connected to Firestore database via FIREBASE_SERVICE_ACCOUNT env variable');
  } catch (e) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable. Ensure it is valid JSON.', e.message || e);
    process.exit(1);
  }
} else if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Connected to Firestore database (Cloud)');
  } catch (e) {
    console.error('Failed to initialize Firebase Admin SDK with serviceAccountKey.json:', e.message || e);
    process.exit(1);
  }
} else {
  console.error('Missing Firebase credentials.');
  console.error('Provide FIREBASE_SERVICE_ACCOUNT via environment variables (for Vercel), OR a valid serviceAccountKey.json in server/serviceAccountKey.json, OR enable the Firestore emulator.');
  console.error('  NODE_ENV=development USE_FIRESTORE_EMULATOR=true');
  process.exit(1);
}

const db = admin.firestore();

module.exports = { db, admin };
