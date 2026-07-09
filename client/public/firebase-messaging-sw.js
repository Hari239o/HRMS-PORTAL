importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAfX2Jl8WpirM2jYKEBiUohlbneU6KWBHc",
  authDomain: "attendance-geonixa.firebaseapp.com",
  projectId: "attendance-geonixa",
  storageBucket: "attendance-geonixa.firebasestorage.app",
  messagingSenderId: "36063007825",
  appId: "1:36063007825:web:13b1693a27b88479dd9470",
  measurementId: "G-W78R9G8RV6"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Geonixa HR Portal';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.message || 'You have a new notification.',
    icon: '/logo-only.png',
    badge: '/logo-only.png',
    data: payload.data || {},
    requireInteraction: true
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked', event);
  event.notification.close();

  // Try to open the app or focus the existing tab
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it
      if (windowClients.length > 0) {
        let client = windowClients[0];
        for (let i = 0; i < windowClients.length; i++) {
          if (windowClients[i].focused) {
            client = windowClients[i];
            break;
          }
        }
        return client.focus();
      }
      // Otherwise open a new window
      return clients.openWindow('/');
    })
  );
});
