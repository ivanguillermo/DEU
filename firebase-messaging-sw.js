importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAz14i2wcoJ7hQpbQ0_unr41_0ms4PIoTI",
  authDomain: "prodeu-61ee3.firebaseapp.com",
  projectId: "prodeu-61ee3",
  storageBucket: "prodeu-61ee3.firebasestorage.app",
  messagingSenderId: "635497125360",
  appId: "1:635497125360:web:0fb70f7f72e51097deb935",
  measurementId: "G-WCZ15JZ8FV"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Notificación recibida en background:', payload);

  const title = payload.notification?.title || payload.data?.title || 'DEU PRO';
  const options = {
    body: payload.notification?.body || payload.data?.body || 'Nueva notificación',
    icon: './icon.png',          // ruta relativa
    badge: './icon.png',
    data: payload.data || {},
    requireInteraction: false
  };

  return self.registration.showNotification(title, options);
});
