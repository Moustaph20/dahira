import api from "./client";

export async function getRepetition(id) {
  const response = await api.get(
    `/repetitions/${id}`
  );

  return response.data;
}

export async function getRepetitions() {
  const response = await api.get(
    "/repetitions"
  );

  return response.data;
}

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

export async function supprimerRepetition(id) {
  const response = await api.delete(
    `/repetitions/${id}`
  );

  return response.data;
}