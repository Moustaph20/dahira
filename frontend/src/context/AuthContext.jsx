
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../api/client";

import {
  demanderTokenNotification,
} from "../firebase-messaging";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null);
  const [chargement, setChargement] = useState(true);

  // ==========================================================
  // ENREGISTRER L'APPAREIL POUR LES NOTIFICATIONS PUSH
  // ==========================================================

  async function enregistrerAppareilNotification() {
    try {
      // ------------------------------------------------------
      // Vérifier qu'un utilisateur est connecté
      // ------------------------------------------------------

      if (!utilisateur) {
        console.log(
          "Aucun utilisateur connecté : impossible d'enregistrer l'appareil."
        );

        return null;
      }

      // ------------------------------------------------------
      // Vérifier que l'utilisateur possède un membre_id
      // ------------------------------------------------------

      if (!utilisateur.membre_id) {
        console.log(
          "Cet utilisateur n'est associé à aucun membre."
        );

        return null;
      }

      // ------------------------------------------------------
      // Demander à Firebase le token FCM
      // ------------------------------------------------------

      const token =
        await demanderTokenNotification();

      if (!token) {
        console.warn(
          "Aucun token FCM récupéré."
        );

        return null;
      }

      console.log(
        "Token FCM récupéré avec succès."
      );

      // ------------------------------------------------------
      // Envoyer le token au backend
      // ------------------------------------------------------

      const response = await api.post(
        "/notifications/appareil",
        {
          token,
          plateforme: "web",
        }
      );

      console.log(
        "APPAREIL NOTIFICATION ENREGISTRÉ :",
        response.data
      );

      return response.data;

    } catch (error) {
      // ------------------------------------------------------
      // IMPORTANT :
      //
      // Une erreur FCM ne doit JAMAIS empêcher l'utilisateur
      // de se connecter à l'application.
      // ------------------------------------------------------

      console.error(
        "ERREUR ENREGISTREMENT APPAREIL FCM :",
        error
      );

      return null;
    }
  }

  // ==========================================================
  // CHARGER L'UTILISATEUR CONNECTÉ
  // ==========================================================

  async function chargerUtilisateur() {
    const token = localStorage.getItem("token");

    if (!token) {
      setUtilisateur(null);
      setChargement(false);
      return null;
    }

    try {
      const response = await api.get("/auth/me");

      console.log(
        "UTILISATEUR CONNECTÉ :",
        response.data
      );

      setUtilisateur(response.data);

      return response.data;

    } catch (error) {
      console.error(
        "ERREUR AUTH/ME :",
        error
      );

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        setUtilisateur(null);
      }

      return null;

    } finally {
      setChargement(false);
    }
  }

  // ==========================================================
  // CHARGEMENT INITIAL
  // ==========================================================

  useEffect(() => {
    chargerUtilisateur();
  }, []);

  // ==========================================================
  // CONNEXION
  // ==========================================================

  async function connexion(
    identifiant,
    motDePasse
  ) {
    setChargement(true);

    try {
      const response = await api.post(
        "/auth/login",
        {
          identifiant,
          mot_de_passe: motDePasse,
        }
      );

      const token =
        response.data.access_token;

      if (!token) {
        throw new Error(
          "Aucun token reçu."
        );
      }

      localStorage.setItem(
        "token",
        token
      );

      // ------------------------------------------------------
      // Récupérer l'utilisateur connecté
      // ------------------------------------------------------

      const utilisateurConnecte =
        await chargerUtilisateur();

      if (!utilisateurConnecte) {
        throw new Error(
          "Impossible de récupérer les informations de l'utilisateur."
        );
      }

      // ------------------------------------------------------
      // ENREGISTREMENT FCM
      // ------------------------------------------------------
      //
      // Cette opération est volontairement séparée de la
      // connexion.
      //
      // Si FCM échoue, l'utilisateur reste connecté.
      //
      // ------------------------------------------------------

      try {
        // On utilise directement l'utilisateur récupéré
        // puisque setUtilisateur() est asynchrone.

        if (
          utilisateurConnecte.membre_id
        ) {
          const fcmToken =
            await demanderTokenNotification();

          if (fcmToken) {
            const appareilResponse =
              await api.post(
                "/notifications/appareil",
                {
                  token: fcmToken,
                  plateforme: "web",
                }
              );

            console.log(
              "APPAREIL FCM ENREGISTRÉ :",
              appareilResponse.data
            );
          } else {
            console.warn(
              "Aucun token FCM récupéré."
            );
          }
        }

      } catch (firebaseError) {
        console.error(
          "ERREUR FCM :",
          firebaseError
        );

        // ----------------------------------------------------
        // IMPORTANT :
        // On ne bloque pas la connexion si Firebase échoue.
        // ----------------------------------------------------
      }

      return utilisateurConnecte;

    } catch (error) {
      setUtilisateur(null);

      localStorage.removeItem(
        "token"
      );

      throw error;

    } finally {
      setChargement(false);
    }
  }

  // ==========================================================
  // DÉCONNEXION
  // ==========================================================

  function deconnexion() {
    localStorage.removeItem("token");
    setUtilisateur(null);
  }

  // ==========================================================
  // PERMISSION
  // ==========================================================

  function aPermission(code) {
    if (
      !Array.isArray(
        utilisateur?.permissions
      )
    ) {
      return false;
    }

    return utilisateur.permissions.some(
      (permission) =>
        permission?.code === code
    );
  }

  // ==========================================================
  // FONCTION
  // ==========================================================

  function aFonction(nom) {
    if (
      !Array.isArray(
        utilisateur?.fonctions
      )
    ) {
      return false;
    }

    return utilisateur.fonctions.some(
      (fonction) =>
        fonction?.nom === nom
    );
  }

  // ==========================================================
  // MEMBRE D'UN KOUREL
  // ==========================================================

  function estMembreKourel() {
    return (
      utilisateur?.est_membre_kourel === true
    );
  }

  // ==========================================================
  // GESTIONNAIRE D'UN KOUREL
  // ==========================================================

  function estGestionnaireKourel(kourelId = null) {
    if (!utilisateur) {
      return false;
    }

    if (
      utilisateur.est_gestionnaire_kourel === true
    ) {
      return true;
    }

    if (
      utilisateur.gestionnaire_kourel_id != null
    ) {
      if (
        kourelId == null ||
        Number(
          utilisateur.gestionnaire_kourel_id
        ) === Number(kourelId)
      ) {
        return true;
      }
    }

    if (
      Array.isArray(
        utilisateur.kourels
      )
    ) {
      return utilisateur.kourels.some(
        (kourel) => {

          if (
            kourelId != null &&
            Number(kourel?.id) !== Number(kourelId)
          ) {
            return false;
          }

          return (
            kourel?.gestionnaire === true ||
            kourel?.est_gestionnaire === true ||
            kourel?.is_gestionnaire === true
          );
        }
      );
    }

    return false;
  }

  // ==========================================================
  // RÉCUPÉRER LES KOURELS
  // ==========================================================

  function getKourelsUtilisateur() {
    if (
      !Array.isArray(
        utilisateur?.kourels
      )
    ) {
      return [];
    }

    return utilisateur.kourels;
  }

  // ==========================================================
  // RÉCUPÉRER L'ESPACE UTILISATEUR
  // ==========================================================

  function getEspaceUtilisateur() {
    if (
      !Array.isArray(
        utilisateur?.espace
      )
    ) {
      return [];
    }

    return utilisateur.espace;
  }

  // ==========================================================
  // CONTEXT
  // ==========================================================

  return (
    <AuthContext.Provider
      value={{
        utilisateur,

        chargement,

        connexion,

        deconnexion,

        chargerUtilisateur,

        // Notifications push
        enregistrerAppareilNotification,

        // Permissions
        aPermission,

        // Fonctions
        aFonction,

        // Kourel
        estMembreKourel,
        estGestionnaireKourel,
        getKourelsUtilisateur,

        // Espace
        getEspaceUtilisateur,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// HOOK
// ============================================================

export function useAuth() {
  return useContext(AuthContext);
}

