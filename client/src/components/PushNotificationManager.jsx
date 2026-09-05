"use client";
import { useEffect, useState } from "react";
import { useKnockClient } from "@knocklabs/react";
import { getToken, onMessage } from "firebase/messaging";
import { setupMessaging } from "../lib/firebase";
import toast from "react-hot-toast";
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export default function PushNotificationManager({ user }) {
  const knock = useKnockClient();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const hasDismissed = localStorage.getItem("push_notification_dismissed");
    if (hasDismissed === "true") {
      setDismissed(true);
    }
    checkPermission();
  }, []);

  const syncTokenToKnock = async (token) => {
    const fcmChannelId = process.env.NEXT_PUBLIC_KNOCK_FCM_CHANNEL_ID;
    if (fcmChannelId) {
      await knock.user.setChannelData({
        channelId: fcmChannelId,
        channelData: {
          tokens: [token],
        },
      });
      console.log("FCM token synced to Knock successfully.");
    }
  };

  const checkPermission = async () => {
    if (Capacitor.isNativePlatform()) {
      // Native App (Capacitor)
      try {
        const { receive } = await PushNotifications.checkPermissions();
        if (receive === 'granted') {
          setPermissionGranted(true);
          initializeNativePush();
        } else if (receive === 'denied') {
          setDismissed(true);
        }
      } catch (err) {
        console.error("Native push error: ", err);
      }
    } else {
      // Web Browser
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          setPermissionGranted(true);
          initializeWebPush();
        } else if (Notification.permission === "denied") {
          setDismissed(true);
        }
      }
    }
  };

  const initializeNativePush = async () => {
    try {
      await PushNotifications.addListener('registration', (token) => {
        console.log("Native Push Registration Token: ", token.value);
        syncTokenToKnock(token.value);
      });

      await PushNotifications.addListener('registrationError', (error) => {
        console.error("Native Push Registration Error: ", JSON.stringify(error));
      });

      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        toast.success(`${notification.title}: ${notification.body}`, {
          icon: '🔔',
          duration: 5000,
        });
      });

      await PushNotifications.register();
    } catch (err) {
      console.error("Error initializing native push: ", err);
    }
  };

  const initializeWebPush = async () => {
    try {
      const messaging = await setupMessaging();
      if (!messaging) return;

      const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      const currentToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: swRegistration,
      });

      if (currentToken) {
        console.log("Web FCM Token acquired!");
        await syncTokenToKnock(currentToken);
      }

      onMessage(messaging, (payload) => {
        console.log("Message received. ", payload);
        toast.success(`${payload.notification?.title}: ${payload.notification?.body}`, {
          icon: '🔔',
          duration: 5000,
        });
      });
    } catch (err) {
      console.error("Error initializing web push: ", err);
    }
  };

  const handleRequestPermission = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const { receive } = await PushNotifications.requestPermissions();
        if (receive === 'granted') {
          setPermissionGranted(true);
          initializeNativePush();
        } else {
          localStorage.setItem("push_notification_dismissed", "true");
          setDismissed(true);
        }
      } catch (err) {
        console.error("Error requesting native permissions: ", err);
        localStorage.setItem("push_notification_dismissed", "true");
        setDismissed(true);
      }
    } else {
      if (typeof window !== "undefined" && "Notification" in window) {
        try {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            setPermissionGranted(true);
            initializeWebPush();
          } else {
            localStorage.setItem("push_notification_dismissed", "true");
            setDismissed(true);
          }
        } catch (err) {
          localStorage.setItem("push_notification_dismissed", "true");
          setDismissed(true);
        }
      } else {
        localStorage.setItem("push_notification_dismissed", "true");
        setDismissed(true);
      }
    }
  };

  if (!isClient) return null;
  if (permissionGranted || dismissed) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-5 border border-gray-100 dark:border-gray-700 shadow-sm">
              <img src="/logo-only.png" alt="Geonixa" className="w-12 h-12 object-contain" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Stay Updated</h3>
            <p className="text-gray-500 dark:text-gray-400 text-[15px] leading-relaxed mb-8 px-2">
              Enable push notifications to get instant lock-screen alerts for new issues, approvals, and holidays even when the app is closed.
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleRequestPermission}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md shadow-blue-600/20 transition-all active:scale-[0.98] text-[15px]"
            >
              Allow Notifications
            </button>
            <button 
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.setItem("push_notification_dismissed", "true");
                }
                setDismissed(true);
              }}
              className="w-full py-3.5 px-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium rounded-xl transition-all active:scale-[0.98] text-[15px]"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
