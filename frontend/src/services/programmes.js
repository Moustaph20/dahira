
import api from "../api/client";


// ============================================================
// CRÉER UN PROGRAMME MENSUEL
// Réservé au gestionnaire du Kourel
// ============================================================

export async function creerProgramme(
  kourelId,
  annee,
  mois
) {
  const response = await api.post(
    "/programmes",
    null,
    {
      params: {
        kourel_id: kourelId,
        annee,
        mois,
      },
    }
  );

  return response.data;
}


// ============================================================
// CONSULTER UN PROGRAMME
// KOUREL_CONSULTER suffit
// ============================================================

export async function getProgramme(
  programmeId
) {
  const response = await api.get(
    `/programmes/${programmeId}`
  );

  return response.data;
}


// ============================================================
// GÉNÉRER LES RÉPÉTITIONS DU JEUDI
// Réservé au gestionnaire
// ============================================================

export async function genererRepetitions(
  programmeId
) {
  const response = await api.post(
    `/programmes/${programmeId}/generer-repetitions`
  );

  return response.data;
}


// ============================================================
// AJOUTER UNE DÉCLAMATION / ÉVÉNEMENT
// Réservé au gestionnaire
// ============================================================

export async function ajouterDeclamation(
  programmeId,
  {
    date_declamation,
    evenement,
    heure = null,
    lieu = null,
  }
) {
  const response = await api.post(
    `/programmes/${programmeId}/declamations`,
    null,
    {
      params: {
        date_declamation,
        evenement,
        heure,
        lieu,
      },
    }
  );

  return response.data;
}


// ============================================================
// ALIAS POUR COMPATIBILITÉ AVEC LE FRONTEND
// ============================================================

export const consulterProgramme = getProgramme;

export const creerProgrammeMensuel =
  creerProgramme;

export const ajouterEvenement =
  ajouterDeclamation;
