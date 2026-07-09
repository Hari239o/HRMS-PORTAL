"use client";
import { useEffect, useState } from "react";
import { useKnockClient } from "@knocklabs/react";
import { getToken, onMessage } from "firebase/messaging";
import { setupMessaging } from "../lib/firebase";
import toast from "react-hot-toast";

export default function PushNotificationManager({ user }) {
  const knock = useKnockClient();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if permission is already granted
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        setPermissionGranted(true);
        initializePush();
      }
    }
  }, []);

  const initializePush = async () => {
    try {
      const messaging = await setupMessaging();
      if (!messaging) return;

      // Manually register the service worker to prevent race conditions
      await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      
      // CRITICAL: Wait until the service worker is fully active and ready!
      const swRegistration = await navigator.serviceWorker.ready;

      const currentToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: swRegistration,
      });

      if (currentToken) {
        console.log("FCM Token acquired!");
        // Sync token to Knock
        const fcmChannelId = process.env.NEXT_PUBLIC_KNOCK_FCM_CHANNEL_ID;
        if (fcmChannelId) {
          await knock.user.setChannelData({
            channelId: fcmChannelId,
            channelData: {
              tokens: [currentToken],
            },
          });
          console.log("FCM token synced to Knock successfully.");
        } else {
          console.error("Missing NEXT_PUBLIC_KNOCK_FCM_CHANNEL_ID in env.");
        }
      } else {
        console.log("No registration token available. Request permission to generate one.");
      }

      // Handle incoming messages when the app is in the foreground
      onMessage(messaging, (payload) => {
        console.log("Message received. ", payload);
        toast.success(`${payload.notification?.title}: ${payload.notification?.body}`, {
          icon: '🔔',
          duration: 5000,
        });
      });
    } catch (err) {
      console.error("An error occurred while retrieving token or syncing with Knock. ", err);
    }
  };

  const handleRequestPermission = () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          console.log("Notification permission granted.");
          setPermissionGranted(true);
          initializePush();
        } else {
          console.log("Unable to get permission to notify.");
          setDismissed(true);
        }
      });
    }
  };

  if (permissionGranted || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[9999] bg-white dark:bg-gray-800 p-4 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-sm animate-in slide-in-from-bottom-5">
      <div className="flex items-start gap-3">
        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full text-blue-600 dark:text-blue-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Enable Push Notifications</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
            Get instant lock screen alerts for new issues, approvals, and holidays even when the app is closed.
          </p>
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => setDismissed(true)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              Maybe later
            </button>
            <button 
              onClick={handleRequestPermission}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              Allow Notifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
