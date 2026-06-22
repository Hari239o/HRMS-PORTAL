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

let db;
let initError = null;

if (useEmulator) {
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
  process.env.FIRESTORE_EMULATOR_HOST = emulatorHost;
  console.log('Connecting to Firestore emulator at', emulatorHost);

  try {
    admin.initializeApp({ projectId: process.env.FIRESTORE_PROJECT_ID || 'demo-geonixa' });
    console.log('Connected to Firestore emulator');
    db = admin.firestore();
  } catch (e) {
    console.error('Firestore emulator init failed:', e.message || e);
    initError = 'Firestore emulator init failed: ' + (e.message || e);
  }
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Connected to Firestore database via FIREBASE_SERVICE_ACCOUNT env variable');
    db = admin.firestore();
  } catch (e) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT. Ensure it is valid JSON.', e.message || e);
    initError = 'Failed to parse FIREBASE_SERVICE_ACCOUNT. ' + (e.message || '');
  }
} else if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Connected to Firestore database (Cloud)');
    db = admin.firestore();
  } catch (e) {
    console.error('Failed to initialize Firebase Admin SDK with serviceAccountKey.json:', e.message || e);
    initError = 'Failed to initialize via JSON file: ' + (e.message || '');
  }
} else {
  console.error('Missing Firebase credentials.');
  initError = 'Missing Firebase credentials in Vercel environment.';
}

if (!db) {
  // Create a proxy that throws the initError whenever db is accessed
  db = new Proxy({}, {
    get: function(target, prop) {
      throw new Error("Database not initialized: " + initError);
    }
  });
}

module.exports = { db, admin, initError };
