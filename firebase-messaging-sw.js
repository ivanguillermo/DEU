// firebase-messaging-sw.js
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

// Manejar notificaciones cuando la app está en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('Notificación en background:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png',
    badge: '/icon.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
