import api from "./client";

/*
|--------------------------------------------------------------------------
| CRÉER UNE COTISATION
|--------------------------------------------------------------------------
|
| La cotisation représente le montant fixe dû par le membre.
| Aucun paiement n'est créé ici.
|
|--------------------------------------------------------------------------
*/

export const creerCotisation = async ({
  membre_id,
  montant,
  mois_concerne,
  annee,
  date_cotisation = null,
}) => {
  const params = {
    membre_id: Number(membre_id),
    montant: Number(montant),
    mois_concerne,
    annee: Number(annee),
  };

  if (date_cotisation) {
    params.date_cotisation = date_cotisation;
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
| MODIFIER UNE COTISATION
|--------------------------------------------------------------------------
*/

export const modifierCotisation = async (
  cotisationId,
  {
    membre_id,
    montant,
    mois_concerne,
    annee,
    date_cotisation = null,
  }
) => {
  const params = {
    membre_id: Number(membre_id),
    montant: Number(montant),
    mois_concerne,
    annee: Number(annee),
  };

  if (date_cotisation) {
    params.date_cotisation = date_cotisation;
  }

  const response = await api.put(
    `/cotisations/${cotisationId}`,
    null,
    {
      params,
    }
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| SUPPRIMER UNE COTISATION
|--------------------------------------------------------------------------
*/

export const supprimerCotisation = async (
  cotisationId
) => {
  const response = await api.delete(
    `/cotisations/${cotisationId}`
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| AJOUTER UN PAIEMENT
|--------------------------------------------------------------------------
|
| Le paiement est séparé de la cotisation.
|
| Exemple :
| Cotisation = 7 000 FCFA
| Paiement = 5 000 FCFA
| Reste = 2 000 FCFA
|
|--------------------------------------------------------------------------
*/

export const ajouterPaiement = async (
  cotisation_id,
  {
    montant,
    mode_paiement = "espèce",
    date_paiement = null,
    reference = null,
  }
) => {
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
| RÉCUPÉRER LES COTISATIONS
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
| RÉCUPÉRER UNE COTISATION
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
| EXPORT PAR DÉFAUT
|--------------------------------------------------------------------------
*/

export default {
  creerCotisation,
  modifierCotisation,
  supprimerCotisation,
  ajouterPaiement,
  getCotisations,
  getCotisation,
};