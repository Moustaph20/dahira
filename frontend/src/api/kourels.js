
import api from "./client";

/*
|--------------------------------------------------------------------------
| KOURELS
|--------------------------------------------------------------------------
*/

export async function getKourels() {
  const response = await api.get("/kourels");
  return response.data;
}

export async function getKourel(id) {
  const response = await api.get(`/kourels/${id}`);
  return response.data;
}

export async function creerKourel(data) {
  const response = await api.post("/kourels", data);
  return response.data;
}

export async function modifierKourel(id, data) {
  const response = await api.put(`/kourels/${id}`, data);
  return response.data;
}

export async function supprimerKourel(id) {
  const response = await api.delete(`/kourels/${id}`);
  return response.data;
}

/*
|--------------------------------------------------------------------------
| MEMBRES DU KOUREL
|--------------------------------------------------------------------------
*/

export async function getMembresKourel(kourelId) {
  const response = await api.get(
    `/kourels/${kourelId}/membres`
  );

  return response.data;
}

export async function ajouterMembreKourel(
  kourelId,
  data
) {
  const response = await api.post(
    `/kourels/${kourelId}/membres`,
    data
  );

  return response.data;
}

export async function retirerMembreKourel(
  kourelId,
  membreId
) {
  const response = await api.delete(
    `/kourels/${kourelId}/membres/${membreId}`
  );

  return response.data;
}