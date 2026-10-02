import api from "../api/client";


// ============================================================
// CONNEXION
// ============================================================

export async function login(
  identifiant,
  mot_de_passe
) {
  const response = await api.post(
    "/auth/login",
    {
      identifiant,
      mot_de_passe,
    }
  );

  const token =
    response.data.access_token;

  if (!token) {
    throw new Error(
      "Aucun token reçu depuis le serveur."
    );
  }

  localStorage.setItem(
    "token",
    token
  );

  return response.data;
}


// ============================================================
// UTILISATEUR CONNECTÉ
// ============================================================

export async function getMe() {
  const token =
    localStorage.getItem("token");

  if (!token) {
    throw new Error(
      "Aucun token trouvé."
    );
  }

  const response = await api.get(
    "/auth/me",
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  return response.data;
}


// ============================================================
// MODIFIER LE MOT DE PASSE
// ============================================================

export async function modifierMotDePasse(
  ancien_mot_de_passe,
  nouveau_mot_de_passe
) {
  const token =
    localStorage.getItem("token");

  if (!token) {
    throw new Error(
      "Aucun token trouvé."
    );
  }

  const response = await api.put(
    "/auth/modifier-mot-de-passe",
    {
      ancien_mot_de_passe,
      nouveau_mot_de_passe,
    },
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  return response.data;
}


// ============================================================
// DÉCONNEXION
// ============================================================

export function logout() {
  localStorage.removeItem(
    "token"
  );
}