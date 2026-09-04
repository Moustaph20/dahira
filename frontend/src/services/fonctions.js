import api from "./api";

export async function getFonctions() {
  const response = await api.get("/fonctions");

  return response.data;
}