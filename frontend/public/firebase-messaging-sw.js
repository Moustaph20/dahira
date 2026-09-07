importScripts(
  "https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js"
);

const firebaseConfig = {
  apiKey: "AIzaSyDyzeZQKrQVBnXrgQ3QCrpf88_X5u7xizU",
  authDomain: "dahira-91185.firebaseapp.com",
  projectId: "dahira-91185",
  storageBucket: "dahira-91185.firebasestorage.app",
  messagingSenderId: "21327870901",
  appId: "1:21327870901:web:ae03293e59caa679de77fc",
  measurementId: "G-WMDW7CF1D1",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Notification reçue en arrière-plan",
    payload
  );

  const notificationTitle =
    payload.notification?.title || "Dahira";

  const notificationOptions = {
    body:
      payload.notification?.body ||
      "Vous avez une nouvelle communication.",
    icon: "/logo192.png",
    data: payload.data || {},
  };

  self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});