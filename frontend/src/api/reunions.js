import api from "./client";

// Lister
export async function getReunions(params = {}) {
  const response = await api.get("/reunions", {
    params,
  });

  return response.data;
}

// Consulter
export async function getReunion(id) {
  const response = await api.get(`/reunions/${id}`);

  return response.data;
}

// Créer
export async function creerReunion(data) {
  const response = await api.post("/reunions", data);

  return response.data;
}

// Modifier
export async function modifierReunion(id, data) {
  const response = await api.put(
    `/reunions/${id}`,
    data
  );

  return response.data;
}

// Désactiver
export async function desactiverReunion(id) {
  const response = await api.delete(
    `/reunions/${id}`
  );

  return response.data;
}