import api from "./client";

// ============================================================
// LISTER LES FONCTIONS
// ============================================================

export async function getFonctions(
  inclureInactives = false
) {
  const response = await api.get("/fonctions", {
    params: {
      inclure_inactives: inclureInactives,
    },
  });

  return response.data;
}

// ============================================================
// CONSULTER
// ============================================================

export async function getFonction(id) {
  const response = await api.get(`/fonctions/${id}`);

  return response.data;
}