import api from "../api/client";

// ============================================================
// LISTER LES MEMBRES
// ============================================================

export async function getMembres(
  recherche = "",
  inclureInactifs = false
) {
  const response = await api.get("/membres", {
    params: {
      ...(recherche.trim()
        ? {
            recherche: recherche.trim(),
          }
        : {}),
      inclure_inactifs: inclureInactifs,
    },
  });

  return response.data;
}

// ============================================================
// CONSULTER UN MEMBRE
// ============================================================

export async function getMembre(id) {
  const response = await api.get(
    `/membres/${id}`
  );

  return response.data;
}

// ============================================================
// CRÉER UN MEMBRE
// ============================================================

export async function creerMembre(data) {
  const response = await api.post("/membres", {
    nom: data.nom.trim(),
    prenom: data.prenom.trim(),
    telephone: data.telephone.trim(),
    lieu_residence:
      data.lieu_residence.trim(),
  });

  return response.data;
}

// ============================================================
// MODIFIER UN MEMBRE
// ============================================================

export async function modifierMembre(id, data) {
  const response = await api.put(
    `/membres/${id}`,
    {
      nom: data.nom.trim(),
      prenom: data.prenom.trim(),
      telephone: data.telephone.trim(),
      lieu_residence:
        data.lieu_residence.trim(),
    }
  );

  return response.data;
}

// ============================================================
// DÉSACTIVER UN MEMBRE
// ============================================================

export async function desactiverMembre(id) {
  const response = await api.patch(
    `/membres/${id}/desactiver`
  );

  return response.data;
}

// ============================================================
// RÉACTIVER UN MEMBRE
// ============================================================

export async function activerMembre(id) {
  const response = await api.patch(
    `/membres/${id}/activer`
  );

  return response.data;
}