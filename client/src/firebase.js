import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-geonixa',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

if ((process.env.NODE_ENV === 'development') && (process.env.NEXT_PUBLIC_USE_FIRESTORE_EMULATOR === 'true')) {
  const host = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || '127.0.0.1';
  const port = Number(process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT) || 8080;
  connectFirestoreEmulator(db, host, port);
  console.log('Connected Firestore client to emulator', host, port);
}

export { db };
