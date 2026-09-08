
importScripts(
  "https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js"
);

const firebaseConfig = {
  apiKey:
    "AIzaSyDyzeZQKrQVBnXrg3Crpf88_X5u7xizU",
  authDomain:
    "dahira-91185.firebaseapp.com",
  projectId:
    "dahira-91185",
  storageBucket:
    "dahira-91185.firebasestorage.app",
  messagingSenderId:
    "21327870901",
  appId:
    "1:21327870901:web:ae03293e59caa679de77fc",
  measurementId:
    "G-WMDW7CF1D1",
};

firebase.initializeApp(firebaseConfig);

firebase.messaging();

