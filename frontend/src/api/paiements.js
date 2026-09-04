import api from "./client";

/*
|--------------------------------------------------------------------------
| PAIEMENTS
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| CRÉER UN PAIEMENT
|--------------------------------------------------------------------------
*/

export const creerPaiement = async ({
  cotisation_id,
  montant,
  mode_paiement = "espèce",
  date_paiement = null,
  reference = null,
}) => {
  const params = {
    cotisation_id,
    montant,
    mode_paiement,
  };

  if (date_paiement) {
    params.date_paiement = date_paiement;
  }

  if (reference) {
    params.reference = reference;
  }

  const response = await api.post(
    "/paiements",
    null,
    {
      params,
    }
  );

  return response.data;
};


/*
|--------------------------------------------------------------------------
| LISTER LES PAIEMENTS
|--------------------------------------------------------------------------
*/

export const getPaiements = async ({
  membre_id = null,
  cotisation_id = null,
  date_debut = null,
  date_fin = null,
  mode_paiement = null,
} = {}) => {

  const params = {};

  if (
    membre_id !== null &&
    membre_id !== undefined
  ) {
    params.membre_id = membre_id;
  }

  if (
    cotisation_id !== null &&
    cotisation_id !== undefined
  ) {
    params.cotisation_id = cotisation_id;
  }

  if (date_debut) {
    params.date_debut = date_debut;
  }

  if (date_fin) {
    params.date_fin = date_fin;
  }

  if (mode_paiement) {
    params.mode_paiement = mode_paiement;
  }

  const response = await api.get(
    "/paiements",
    {
      params,
    }
  );

  return response.data;
};


/*
|--------------------------------------------------------------------------
| CONSULTER UN PAIEMENT
|--------------------------------------------------------------------------
*/

export const getPaiement = async (
  paiementId
) => {

  const response = await api.get(
    `/paiements/${paiementId}`
  );

  return response.data;
};


/*
|--------------------------------------------------------------------------
| EXPORT PAR DÉFAUT
|--------------------------------------------------------------------------
*/

export default {
  creerPaiement,
  getPaiements,
  getPaiement,
};