import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-geonixa',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

if (import.meta.env.DEV && (import.meta.env.VITE_USE_FIRESTORE_EMULATOR === 'true')) {
  const host = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST || '127.0.0.1';
  const port = Number(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT) || 8080;
  connectFirestoreEmulator(db, host, port);
  console.log('Connected Firestore client to emulator', host, port);
}

export { db };
