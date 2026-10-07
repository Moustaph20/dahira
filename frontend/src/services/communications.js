import api from "./api";

// ============================================================
// STATUTS
// ============================================================

export const STATUTS_COMMUNICATION = [
  {
    value: "BROUILLON",
    label: "Brouillon",
  },
  {
    value: "PROGRAMMEE",
    label: "Programmée",
  },
  {
    value: "PUBLIEE",
    label: "Publiée",
  },
  {
    value: "EXPIREE",
    label: "Expirée",
  },
  {
    value: "ANNULEE",
    label: "Annulée",
  },
];

// ============================================================
// LISTE
// ============================================================

export async function listerCommunications({
  actif = null,
  type_communication = null,
  priorite = null,
  statut_communication = null,
} = {}) {
  const params = {};

  if (
    actif !== null &&
    actif !== undefined
  ) {
    params.actif = actif;
  }

  if (
    type_communication !== null &&
    type_communication !== undefined &&
    type_communication !== ""
  ) {
    params.type_communication =
      type_communication;
  }

  if (
    priorite !== null &&
    priorite !== undefined &&
    priorite !== ""
  ) {
    params.priorite = priorite;
  }

  if (
    statut_communication !== null &&
    statut_communication !== undefined &&
    statut_communication !== ""
  ) {
    params.statut_communication =
      statut_communication;
  }

  const response = await api.get(
    "/communications",
    {
      params,
    }
  );

  return response.data;
}

// ============================================================
// ALIAS
// ============================================================

export async function getCommunications(
  filtres = {}
) {
  return listerCommunications(filtres);
}

// ============================================================
// DETAIL
// ============================================================

export async function obtenirCommunication(
  id
) {
  const response = await api.get(
    `/communications/${id}`
  );

  return response.data;
}

// ============================================================
// CREATION
// ============================================================

export async function creerCommunication(
  donnees
) {
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
// MODIFIER STATUT
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
// ANNULER
// ============================================================

export async function annulerCommunication(
  id
) {
  const response = await api.patch(
    `/communications/${id}/annuler`
  );

  return response.data;
}

// ============================================================
// SUPPRIMER
// ============================================================

export async function supprimerCommunication(
  id
) {
  await api.delete(
    `/communications/${id}`
  );
}

// ============================================================
// UPLOAD AUDIO
// ============================================================

export async function televerserAudioCommunication(
  fichier
) {
  const formulaire = new FormData();

  formulaire.append(
    "fichier",
    fichier
  );

  const response = await api.post(
    "/communications/audio",
    formulaire,
    {
      headers: {
        "Content-Type":
          "multipart/form-data",
      },
    }
  );

  return response.data;
}