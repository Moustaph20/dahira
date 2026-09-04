
import api from "./api";

/**
 * ============================================================
 * RÉUNIONS
 * ============================================================
 */

/**
 * Récupérer la liste des réunions
 *
 * @param {string} recherche
 * @param {string} statut
 * @param {string} typeReunion
 * @param {boolean} inclureInactives
 */
export async function getReunions(
  recherche = "",
  statut = "",
  typeReunion = "",
  inclureInactives = false
) {
  const params = {};

  if (recherche?.trim()) {
    params.recherche = recherche.trim();
  }

  if (statut) {
    params.statut = statut;
  }

  if (typeReunion) {
    params.type_reunion = typeReunion;
  }

  params.inclure_inactives = inclureInactives;

  const response = await api.get("/reunions", {
    params,
  });

  return response.data;
}


/**
 * Récupérer les réunions à venir
 */
export async function getReunionsAVenir() {
  const response = await api.get("/reunions/a-venir");

  return response.data;
}


/**
 * Récupérer les réunions passées
 */
export async function getReunionsPassees() {
  const response = await api.get("/reunions/passees");

  return response.data;
}


/**
 * Récupérer une réunion par son identifiant
 *
 * @param {number|string} reunionId
 */
export async function getReunion(reunionId) {
  const response = await api.get(`/reunions/${reunionId}`);

  return response.data;
}


/**
 * Créer une nouvelle réunion
 *
 * @param {Object} reunion
 */
export async function creerReunion(reunion) {
  const response = await api.post("/reunions", reunion);

  return response.data;
}


/**
 * Modifier une réunion
 *
 * @param {number|string} reunionId
 * @param {Object} reunion
 */
export async function modifierReunion(reunionId, reunion) {
  const response = await api.put(
    `/reunions/${reunionId}`,
    reunion
  );

  return response.data;
}


/**
 * Modifier le statut d'une réunion
 *
 * @param {number|string} reunionId
 * @param {string} statut
 */
export async function modifierStatutReunion(
  reunionId,
  statut
) {
  const response = await api.patch(
    `/reunions/${reunionId}/statut`,
    {
      statut,
    }
  );

  return response.data;
}


/**
 * Modifier le compte rendu d'une réunion
 *
 * @param {number|string} reunionId
 * @param {string|null} compteRendu
 */
export async function modifierCompteRendu(
  reunionId,
  compteRendu
) {
  const response = await api.patch(
    `/reunions/${reunionId}/compte-rendu`,
    {
      compte_rendu: compteRendu,
    }
  );

  return response.data;
}


/**
 * Annuler une réunion
 *
 * @param {number|string} reunionId
 */
export async function annulerReunion(reunionId) {
  const response = await api.patch(
    `/reunions/${reunionId}/annuler`
  );

  return response.data;
}


/**
 * Désactiver une réunion
 *
 * @param {number|string} reunionId
 */
export async function desactiverReunion(reunionId) {
  const response = await api.patch(
    `/reunions/${reunionId}/desactiver`
  );

  return response.data;
}


/**
 * Activer une réunion
 *
 * @param {number|string} reunionId
 */
export async function activerReunion(reunionId) {
  const response = await api.patch(
    `/reunions/${reunionId}/activer`
  );

  return response.data;
}


/**
 * ============================================================
 * LOCALISATION GOOGLE MAPS
 * ============================================================
 */

/**
 * Récupérer automatiquement les coordonnées GPS
 * à partir d'un lien Google Maps.
 *
 * Exemple de lien reçu sur WhatsApp :
 *
 * https://maps.app.goo.gl/xxxxxxxx
 *
 * ou :
 *
 * https://www.google.com/maps/@14.735123,-17.300456,17z
 *
 * Le backend se charge d'analyser le lien et de retourner :
 *
 * {
 *   latitude: 14.735123,
 *   longitude: -17.300456
 * }
 *
 * @param {string} lien
 */
export async function recupererLocalisationGoogleMaps(lien) {
  if (!lien || !lien.trim()) {
    throw new Error(
      "Veuillez coller un lien Google Maps."
    );
  }

  const response = await api.post(
    "/reunions/localisation/google-maps",
    {
      lien: lien.trim(),
    }
  );

  return response.data;
}


/**
 * ============================================================
 * UTILITAIRES GOOGLE MAPS
 * ============================================================
 */

/**
 * Construire un lien Google Maps à partir
 * de coordonnées GPS.
 *
 * @param {number|string} latitude
 * @param {number|string} longitude
 * @returns {string|null}
 */
export function construireLienGoogleMaps(
  latitude,
  longitude
) {
  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined
  ) {
    return null;
  }

  return (
    "https://www.google.com/maps/search/?api=1&query=" +
    `${encodeURIComponent(latitude)},${encodeURIComponent(longitude)}`
  );
}


/**
 * Construire un lien Google Maps permettant
 * de lancer un itinéraire vers le lieu de la réunion.
 *
 * @param {number|string} latitude
 * @param {number|string} longitude
 * @returns {string|null}
 */
export function construireLienItineraireGoogleMaps(
  latitude,
  longitude
) {
  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined
  ) {
    return null;
  }

  return (
    "https://www.google.com/maps/dir/?api=1&destination=" +
    `${encodeURIComponent(latitude)},${encodeURIComponent(longitude)}`
  );
}


/**
 * ============================================================
 * APPLE MAPS
 * ============================================================
 */

/**
 * Construire un lien Apple Maps à partir
 * de coordonnées GPS.
 *
 * @param {number|string} latitude
 * @param {number|string} longitude
 * @returns {string|null}
 */
export function construireLienAppleMaps(
  latitude,
  longitude
) {
  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined
  ) {
    return null;
  }

  return (
    "https://maps.apple.com/?ll=" +
    `${encodeURIComponent(latitude)},${encodeURIComponent(longitude)}`
  );
}


/**
 * Construire un lien d'itinéraire Apple Maps.
 *
 * @param {number|string} latitude
 * @param {number|string} longitude
 * @returns {string|null}
 */
export function construireLienItineraireAppleMaps(
  latitude,
  longitude
) {
  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined
  ) {
    return null;
  }

  return (
    "https://maps.apple.com/?daddr=" +
    `${encodeURIComponent(latitude)},${encodeURIComponent(longitude)}`
  );
}
