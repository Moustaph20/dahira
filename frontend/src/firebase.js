import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDyzeZQKrQVBnXrgQ3QCrpf88_X5u7xizU",
  authDomain: "dahira-91185.firebaseapp.com",
  projectId: "dahira-91185",
  storageBucket: "dahira-91185.firebasestorage.app",
  messagingSenderId: "21327870901",
  appId: "1:21327870901:web:ae03293e59caa679de77fc",
  measurementId: "G-WMDW7CF1D1",
};

const app = initializeApp(firebaseConfig);

export async function getFirebaseMessaging() {
  const supported = await isSupported();

  if (!supported) {
    console.warn("Firebase Messaging n'est pas supporté par ce navigateur.");
    return null;
  }

  return getMessaging(app);
}

export default app;