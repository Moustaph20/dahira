import api from "./client";

/*
|--------------------------------------------------------------------------
| PROGRAMMES RELIGIEUX
|--------------------------------------------------------------------------
*/

export async function getProgrammes() {
  const response = await api.get("/programmes-religieux");
  return response.data;
}

export async function getProgramme(id) {
  const response = await api.get(
    `/programmes-religieux/${id}`
  );

  return response.data;
}

export async function creerProgramme(data) {
  const response = await api.post(
    "/programmes-religieux",
    data
  );

  return response.data;
}

export async function modifierProgramme(id, data) {
  const response = await api.put(
    `/programmes-religieux/${id}`,
    data
  );

  return response.data;
}

export async function supprimerProgramme(id) {
  const response = await api.delete(
    `/programmes-religieux/${id}`
  );

  return response.data;
}


/*
|--------------------------------------------------------------------------
| REPETITIONS
|--------------------------------------------------------------------------
*/

export async function getRepetitionsProgramme(
  programmeId
) {
  const response = await api.get(
    `/programmes-religieux/${programmeId}/repetitions`
  );

  return response.data;
}

export async function genererRepetitions(
  programmeId
) {
  const response = await api.post(
    `/programmes-religieux/${programmeId}/repetitions/generer`
  );

  return response.data;
}


/*
|--------------------------------------------------------------------------
| DECLAMATIONS
|--------------------------------------------------------------------------
*/

export async function getDeclamationsProgramme(
  programmeId
) {
  const response = await api.get(
    `/programmes-religieux/${programmeId}/declamations`
  );

  return response.data;
}

export async function ajouterDeclamation(
  programmeId,
  data
) {
  const response = await api.post(
    `/programmes-religieux/${programmeId}/declamations`,
    data
  );

  return response.data;
}

export async function supprimerDeclamation(
  programmeId,
  declamationId
) {
  const response = await api.delete(
    `/programmes-religieux/${programmeId}/declamations/${declamationId}`
  );

  return response.data;
}