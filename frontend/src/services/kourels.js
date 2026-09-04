import api from "./api";

// ============================================================
// LISTER LES KOURELS
// ============================================================

export async function getKourels(inclureInactifs = false) {
  const response = await api.get("/kourels", {
    params: {
      inclure_inactifs: inclureInactifs,
    },
  });

  return response.data;
}

// ============================================================
// CONSULTER UN KOUREL
// ============================================================

export async function getKourel(kourelId) {
  const response = await api.get(`/kourels/${kourelId}`);

  return response.data;
}

// ============================================================
// CREER UN KOUREL
// ============================================================

export async function creerKourel(data) {
  const response = await api.post("/kourels", data);

  return response.data;
}

// ============================================================
// MODIFIER UN KOUREL
// ============================================================

export async function modifierKourel(kourelId, data) {
  const response = await api.put(
    `/kourels/${kourelId}`,
    data
  );

  return response.data;
}

// ============================================================
// DESACTIVER UN KOUREL
// ============================================================

export async function desactiverKourel(kourelId) {
  const response = await api.patch(
    `/kourels/${kourelId}/desactiver`
  );

  return response.data;
}

// ============================================================
// ACTIVER UN KOUREL
// ============================================================

export async function activerKourel(kourelId) {
  const response = await api.patch(
    `/kourels/${kourelId}/activer`
  );

  return response.data;
}

// ============================================================
// LISTER LES MEMBRES D'UN KOUREL
// ============================================================

export async function getMembresKourel(kourelId) {
  const response = await api.get(
    `/kourels/${kourelId}/membres`
  );

  return response.data;
}

// ============================================================
// AJOUTER UN MEMBRE AU KOUREL
// ============================================================

export async function ajouterMembreKourel(
  kourelId,
  membreId
) {
  const response = await api.post(
    `/kourels/${kourelId}/membres`,
    {
      membre_id: membreId,
    }
  );

  return response.data;
}

// ============================================================
// RETIRER UN MEMBRE DU KOUREL
// ============================================================

export async function retirerMembreKourel(
  kourelId,
  membreId
) {
  const response = await api.delete(
    `/kourels/${kourelId}/membres/${membreId}`
  );

  return response.data;
}