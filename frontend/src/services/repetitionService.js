import api from "./api";

/*
|--------------------------------------------------------------------------
| Répétitions du Kourel
|--------------------------------------------------------------------------
*/

/**
 * Lister toutes les répétitions
 */
export async function getRepetitions() {
  const response = await api.get("/repetitions");
  return response.data;
}


/**
 * Obtenir une répétition
 */
export async function getRepetition(id) {
  const response = await api.get(`/repetitions/${id}`);
  return response.data;
}


/**
 * Créer une répétition
 */
export async function creerRepetition(data) {
  const response = await api.post(
    "/repetitions",
    data
  );

  return response.data;
}


/**
 * Modifier une répétition
 */
export async function modifierRepetition(
  id,
  data
) {
  const response = await api.put(
    `/repetitions/${id}`,
    data
  );

  return response.data;
}


/**
 * Supprimer une répétition
 */
export async function supprimerRepetition(id) {
  await api.delete(
    `/repetitions/${id}`
  );
}


/**
 * Lister les Khassidas d'une répétition
 */
export async function getKhassidasRepetition(
  repetitionId
) {
  const response = await api.get(
    `/repetitions/${repetitionId}/khassidas`
  );

  return response.data;
}


/**
 * Ajouter une Khassida à une répétition
 */
export async function ajouterKhassidaRepetition(
  repetitionId,
  data
) {
  const response = await api.post(
    `/repetitions/${repetitionId}/khassidas`,
    data
  );

  return response.data;
}


/**
 * Retirer une Khassida d'une répétition
 */
export async function supprimerKhassidaRepetition(
  repetitionId,
  khassidaId
) {
  await api.delete(
    `/repetitions/${repetitionId}/khassidas/${khassidaId}`
  );
}