
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null);
  const [chargement, setChargement] = useState(true);

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

      const utilisateurConnecte =
        await chargerUtilisateur();

      if (!utilisateurConnecte) {
        throw new Error(
          "Impossible de récupérer les informations de l'utilisateur."
        );
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
  //
  // Le backend reste la source de vérité pour sécuriser
  // les opérations CRUD.
  //
  // Cette fonction sert uniquement au FRONTEND pour afficher
  // ou masquer les boutons d'administration.
  //
  // On accepte plusieurs structures possibles afin de rester
  // compatible avec les données déjà présentes dans /auth/me.
  // ==========================================================

  function estGestionnaireKourel(kourelId = null) {
    if (!utilisateur) {
      return false;
    }

    // --------------------------------------------------------
    // Cas où le backend fournit directement un indicateur
    // --------------------------------------------------------

    if (
      utilisateur.est_gestionnaire_kourel === true
    ) {
      return true;
    }

    // --------------------------------------------------------
    // Cas où le backend fournit un seul kourel gestionné
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // Cas où les Kourels de l'utilisateur contiennent
    // l'information gestionnaire
    // --------------------------------------------------------

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
