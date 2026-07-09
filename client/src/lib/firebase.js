import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAfX2Jl8WpirM2jYKEBiUohlbneU6KWBHc",
  authDomain: "attendance-geonixa.firebaseapp.com",
  projectId: "attendance-geonixa",
  storageBucket: "attendance-geonixa.firebasestorage.app",
  messagingSenderId: "36063007825",
  appId: "1:36063007825:web:13b1693a27b88479dd9470",
  measurementId: "G-W78R9G8RV6"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Messaging
let messaging = null;

export const setupMessaging = async () => {
  if (typeof window !== "undefined" && typeof navigator !== "undefined") {
    try {
      const supported = await isSupported();
      if (supported) {
        messaging = getMessaging(app);
      }
    } catch (err) {
      console.log("Firebase Messaging not supported:", err);
    }
  }
  return messaging;
};

export { app };
