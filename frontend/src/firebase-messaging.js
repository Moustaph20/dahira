import { getToken, onMessage } from "firebase/messaging";
import { getFirebaseMessaging } from "./firebase";

const VAPID_KEY =
  "BIgkG4BgVzFFwN1RGFH1cb4LvTu7CR5EIUbpQLrL1zxXXbPQzI7BAMumtdJn2tbsiZ5M8BbB67XJzHGDXqrdBc0";

/**
 * Demande l'autorisation de recevoir les notifications
 * et récupère le token FCM du navigateur.
 */
export async function demanderTokenNotification() {
  try {
    if (!("Notification" in window)) {
      console.warn(
        "Les notifications ne sont pas supportées par ce navigateur."
      );
      return null;
    }

    const messaging = await getFirebaseMessaging();

    if (!messaging) {
      return null;
    }

    const permission = await Notification.requestPermission();

    console.log("Permission notification :", permission);

    if (permission !== "granted") {
      console.warn("Permission de notification refusée.");
      return null;
    }

    const registration =
      await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );

    console.log("Service Worker FCM enregistré :", registration);

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    console.log("TOKEN FCM :", token);

    return token;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération du token FCM :",
      error
    );

    return null;
  }
}

/**
 * Reçoit les notifications lorsque l'application
 * est actuellement ouverte.
 */
export async function ecouterNotifications() {
  try {
    const messaging = await getFirebaseMessaging();

    if (!messaging) {
      return null;
    }

    return onMessage(messaging, (payload) => {
      console.log(
        "Notification FCM reçue au premier plan :",
        payload
      );

      const titre =
        payload.notification?.title || "Dahira";

      const corps =
        payload.notification?.body ||
        "Vous avez une nouvelle communication.";

      if (Notification.permission === "granted") {
        new Notification(titre, {
          body: corps,
          icon: "/logo192.png",
        });
      }
    });
  } catch (error) {
    console.error(
      "Erreur écoute notifications FCM :",
      error
    );

    return null;
  }
}