
import api from "./api";

/**
 * ============================================================
 * RÉCUPÉRER LES MEMBRES
 * ============================================================
 *
 * @param {string} recherche
 * @param {boolean} inclureInactifs
 */
export async function getMembres(
  recherche = "",
  inclureInactifs = false
) {
  const params = {};

  if (recherche && recherche.trim()) {
    params.recherche = recherche.trim();
  }

  params.inclure_inactifs = inclureInactifs;

  const response = await api.get("/membres", {
    params,
  });

  return response.data;
}

/**
 * ============================================================
 * RÉCUPÉRER UN MEMBRE
 * ============================================================
 */
export async function getMembre(id) {
  const response = await api.get(`/membres/${id}`);

  return response.data;
}

/**
 * ============================================================
 * CRÉER UN MEMBRE
 * ============================================================
 */
export async function creerMembre(donnees) {
  console.log(
    "➡️ POST /membres - données :",
    donnees
  );

  const response = await api.post(
    "/membres",
    donnees
  );

  console.log(
    "⬅️ POST /membres - réponse :",
    response.data
  );

  return response.data;
}

/**
 * ============================================================
 * MODIFIER UN MEMBRE
 * ============================================================
 */
export async function modifierMembre(
  id,
  donnees
) {
  console.log(
    `➡️ PUT /membres/${id} - données :`,
    donnees
  );

  const response = await api.put(
    `/membres/${id}`,
    donnees
  );

  console.log(
    `⬅️ PUT /membres/${id} - réponse :`,
    response.data
  );

  return response.data;
}

/**
 * ============================================================
 * DÉSACTIVER UN MEMBRE
 * ============================================================
 */
export async function desactiverMembre(id) {
  console.log(
    `➡️ PATCH /membres/${id}/desactiver`
  );

  const response = await api.patch(
    `/membres/${id}/desactiver`
  );

  console.log(
    `⬅️ PATCH /membres/${id}/desactiver - réponse :`,
    response.data
  );

  return response.data;
}

/**
 * ============================================================
 * ACTIVER / RÉACTIVER UN MEMBRE
 * ============================================================
 */
export async function activerMembre(id) {
  console.log(
    `➡️ PATCH /membres/${id}/activer`
  );

  const response = await api.patch(
    `/membres/${id}/activer`
  );

  console.log(
    `⬅️ PATCH /membres/${id}/activer - réponse :`,
    response.data
  );

  return response.data;
}

