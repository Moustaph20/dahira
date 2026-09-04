import api from "./api";

/*
|--------------------------------------------------------------------------
| RÉPÉTITIONS
|--------------------------------------------------------------------------
*/

/**
 * Liste des répétitions
 */
export async function getRepetitions() {
  const response = await api.get("/repetitions");
  return response.data;
}


/**
 * Détail d'une répétition
 *
 * Le backend retourne :
 * - informations de la répétition
 * - Khassidas
 * - audios de chaque Khassida
 * - tons des audios
 */
export async function getRepetition(repetitionId) {
  const response = await api.get(
    `/repetitions/${repetitionId}`
  );

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
  repetitionId,
  data
) {
  const response = await api.put(
    `/repetitions/${repetitionId}`,
    data
  );

  return response.data;
}


/**
 * Supprimer une répétition
 */
export async function supprimerRepetition(
  repetitionId
) {
  await api.delete(
    `/repetitions/${repetitionId}`
  );
}