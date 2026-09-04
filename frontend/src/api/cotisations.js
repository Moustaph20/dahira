import api from "./client";

/*
|--------------------------------------------------------------------------
| CRÉER UNE COTISATION
|--------------------------------------------------------------------------
|
| Crée une seule cotisation pour un membre et une période.
| Si un paiement initial est fourni, il est automatiquement
| associé à cette cotisation.
|
|--------------------------------------------------------------------------
*/

export const creerCotisation = async ({
  membre_id,
  montant,
  montant_cotise,
  mois_concerne,
  annee,
  mode_paiement = "espèce",
  date_cotisation = null,
  reference = null,
}) => {
  const params = {
    membre_id: Number(membre_id),
    montant: Number(montant),
    montant_cotise: Number(montant_cotise),
    mois_concerne,
    annee: Number(annee),
    mode_paiement,
  };

  if (date_cotisation) {
    params.date_cotisation = date_cotisation;
  }

  if (reference) {
    params.reference = reference;
  }

  const response = await api.post(
    "/cotisations",
    null,
    {
      params,
    }
  );

  return response.data;
};


/*
|--------------------------------------------------------------------------
| AJOUTER UN PAIEMENT
|--------------------------------------------------------------------------
|
| Permet de compléter une cotisation existante.
|
|--------------------------------------------------------------------------
*/

export const ajouterPaiement = async ({
  cotisation_id,
  montant,
  mode_paiement = "espèce",
  date_paiement = null,
  reference = null,
}) => {
  const params = {
    montant: Number(montant),
    mode_paiement,
  };

  if (date_paiement) {
    params.date_paiement = date_paiement;
  }

  if (reference) {
    params.reference = reference;
  }

  const response = await api.post(
    `/cotisations/${cotisation_id}/paiements`,
    null,
    {
      params,
    }
  );

  return response.data;
};


/*
|--------------------------------------------------------------------------
| LISTER LES COTISATIONS
|--------------------------------------------------------------------------
*/

export const getCotisations = async ({
  membre_id = null,
  date_debut = null,
  date_fin = null,
  mois_concerne = null,
  annee = null,
} = {}) => {
  const params = {};

  if (
    membre_id !== null &&
    membre_id !== undefined
  ) {
    params.membre_id = Number(membre_id);
  }

  if (date_debut) {
    params.date_debut = date_debut;
  }

  if (date_fin) {
    params.date_fin = date_fin;
  }

  if (mois_concerne) {
    params.mois_concerne = mois_concerne;
  }

  if (
    annee !== null &&
    annee !== undefined &&
    annee !== ""
  ) {
    params.annee = Number(annee);
  }

  const response = await api.get(
    "/cotisations",
    {
      params,
    }
  );

  return response.data;
};


/*
|--------------------------------------------------------------------------
| CONSULTER UNE COTISATION
|--------------------------------------------------------------------------
*/

export const getCotisation = async (
  cotisationId
) => {
  const response = await api.get(
    `/cotisations/${cotisationId}`
  );

  return response.data;
};


/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

export default {
  creerCotisation,
  ajouterPaiement,
  getCotisations,
  getCotisation,
};