
import api from "./api";

// ============================================================
// COMMUNICATIONS
// ============================================================

/**
 * Récupérer toutes les communications
 *
 * @param {Object} filtres
 * @param {boolean|null} filtres.actif
 * @param {string|null} filtres.type_communication
 * @param {string|null} filtres.priorite
 */
export async function listerCommunications({
  actif = null,
  type_communication = null,
  priorite = null,
} = {}) {
  const params = {};

  if (actif !== null && actif !== undefined) {
    params.actif = actif;
  }

  if (
    type_communication !== null &&
    type_communication !== undefined &&
    type_communication !== ""
  ) {
    params.type_communication = type_communication;
  }

  if (
    priorite !== null &&
    priorite !== undefined &&
    priorite !== ""
  ) {
    params.priorite = priorite;
  }

  const response = await api.get("/communications", {
    params,
  });

  return response.data;
}


// ============================================================
// ALIAS COMPATIBLE AVEC Communication.jsx
// ============================================================

/**
 * Ancien nom conservé pour assurer la compatibilité
 * avec les composants qui utilisent getCommunications().
 */
export async function getCommunications(filtres = {}) {
  return listerCommunications(filtres);
}


// ============================================================
// COMMUNICATION PAR ID
// ============================================================

export async function obtenirCommunication(id) {
  const response = await api.get(
    `/communications/${id}`
  );

  return response.data;
}


// ============================================================
// CRÉATION
// ============================================================

export async function creerCommunication(donnees) {
  const response = await api.post(
    "/communications",
    donnees
  );

  return response.data;
}


// ============================================================
// MODIFICATION
// ============================================================

export async function modifierCommunication(
  id,
  donnees
) {
  const response = await api.put(
    `/communications/${id}`,
    donnees
  );

  return response.data;
}


// ============================================================
// MODIFICATION DU STATUT
// ============================================================

export async function modifierStatutCommunication(
  id,
  actif
) {
  const response = await api.patch(
    `/communications/${id}/statut`,
    {
      actif,
    }
  );

  return response.data;
}


// ============================================================
// SUPPRESSION
// ============================================================

export async function supprimerCommunication(id) {
  await api.delete(
    `/communications/${id}`
  );
}
