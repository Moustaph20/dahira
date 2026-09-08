
import { getToken } from "firebase/messaging";
import { getFirebaseMessaging } from "./firebase";

const VAPID_KEY =
  "BIgkG4BgVzFFwN1RGFH1cb4LvTu7CR5EIUbpQLrL1zxXXbPQzI7BAMumtdJn2tbsiZ5M8BbB67XJzHGDXqrdBc0";

/**
 * ==========================================================
 * RÉCUPÉRER LE TOKEN FCM
 * ==========================================================
 *
 * Cette fonction :
 * - demande la permission au navigateur ;
 * - enregistre le Service Worker Firebase ;
 * - récupère le token FCM.
 *
 * Elle NE crée aucune notification.
 */
export async function demanderTokenNotification() {
  try {
    if (!("Notification" in window)) {
      console.warn(
        "Les notifications ne sont pas supportées par ce navigateur."
      );

      return null;
    }

    const messaging =
      await getFirebaseMessaging();

    if (!messaging) {
      return null;
    }

    const permission =
      await Notification.requestPermission();

    console.log(
      "Permission notification :",
      permission
    );

    if (permission !== "granted") {
      console.warn(
        "Permission de notification refusée."
      );

      return null;
    }

    const registration =
      await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );

    console.log(
      "Service Worker FCM enregistré :",
      registration
    );

    const token = await getToken(
      messaging,
      {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration:
          registration,
      }
    );

    if (!token) {
      console.warn(
        "Firebase n'a retourné aucun token FCM."
      );

      return null;
    }

    console.log(
      "TOKEN FCM récupéré avec succès."
    );

    return token;

  } catch (error) {
    console.error(
      "Erreur lors de la récupération du token FCM :",
      error
    );

    return null;
  }
}

