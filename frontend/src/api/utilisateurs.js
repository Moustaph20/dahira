import api from "./client";

// ============================================================
// LISTER LES UTILISATEURS
// ============================================================

export async function getUtilisateurs(
  recherche = "",
  inclureInactifs = false
) {
  const response = await api.get("/utilisateurs", {
    params: {
      ...(recherche.trim()
        ? { recherche: recherche.trim() }
        : {}),
      inclure_inactifs: inclureInactifs,
    },
  });

  return response.data;
}

// ============================================================
// CONSULTER
// ============================================================

export async function getUtilisateur(id) {
  const response = await api.get(`/utilisateurs/${id}`);

  return response.data;
}

// ============================================================
// CRÉER
// ============================================================

export async function creerUtilisateur(data) {
  const response = await api.post("/utilisateurs", {
    membre_id: Number(data.membre_id),
    identifiant: data.identifiant.trim(),
    mot_de_passe: data.mot_de_passe,
    fonction_ids: data.fonction_ids.map(Number),
  });

  return response.data;
}

// ============================================================
// MODIFIER
// ============================================================

export async function modifierUtilisateur(id, data) {
  const response = await api.put(`/utilisateurs/${id}`, {
    ...(data.identifiant !== undefined
      ? {
          identifiant: data.identifiant.trim(),
        }
      : {}),

    ...(data.fonction_ids !== undefined
      ? {
          fonction_ids: data.fonction_ids.map(Number),
        }
      : {}),
  });

  return response.data;
}

// ============================================================
// MODIFIER MOT DE PASSE
// ============================================================

export async function modifierMotDePasse(
  id,
  mot_de_passe
) {
  const response = await api.patch(
    `/utilisateurs/${id}/mot-de-passe`,
    {
      mot_de_passe,
    }
  );

  return response.data;
}

// ============================================================
// DÉSACTIVER
// ============================================================

export async function desactiverUtilisateur(id) {
  const response = await api.patch(
    `/utilisateurs/${id}/desactiver`
  );

  return response.data;
}

// ============================================================
// RÉACTIVER
// ============================================================

export async function activerUtilisateur(id) {
  const response = await api.patch(
    `/utilisateurs/${id}/activer`
  );

  return response.data;
}