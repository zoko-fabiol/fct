/* FCT Automobile - Service Worker Firebase Cloud Messaging (notifications en arrière-plan) */
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js');

// Configuration cliente publique (identique à firebase-applet-config.json)
firebase.initializeApp({
  apiKey: 'AIzaSyDOrL2WTMbKmo4P1f0n06x9trk6eWYokTM',
  authDomain: 'fct-cmr.firebaseapp.com',
  projectId: 'fct-cmr',
  storageBucket: 'fct-cmr.firebasestorage.app',
  messagingSenderId: '11946393528',
  appId: '1:11946393528:web:4169d263b70ea2c4b6d94d',
});

const messaging = firebase.messaging();

// Les messages contenant un bloc `notification` sont affichés automatiquement par le navigateur.
messaging.onBackgroundMessage((payload) => {
  if (payload.notification) return;
  const data = payload.data || {};
  self.registration.showNotification(data.title || 'FCT Automobile', {
    body: data.body || '',
    icon: '/fct-logo.png',
    data,
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      if (list.length > 0) return list[0].focus();
      return self.clients.openWindow('/');
    })
  );
});

