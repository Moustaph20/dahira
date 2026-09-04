import api from "./api";

/*
|--------------------------------------------------------------------------
| Khassidas d'une répétition
|--------------------------------------------------------------------------
*/

/**
 * Liste des Khassidas programmées
 * pour une répétition.
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
 * Ajouter une Khassida
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
 * Modifier une association Khassida/répétition
 *
 * À utiliser uniquement si votre backend
 * expose cette route.
 */
export async function modifierKhassidaRepetition(
  id,
  data
) {
  const response = await api.put(
    `/repetition-khassidas/${id}`,
    data
  );

  return response.data;
}


/**
 * Supprimer une Khassida d'une répétition
 */
export async function supprimerKhassidaRepetition(
  repetitionId,
  khassidaId
) {
  await api.delete(
    `/repetitions/${repetitionId}/khassidas/${khassidaId}`
  );
}