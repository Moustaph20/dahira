import api from "./api";

/*
|--------------------------------------------------------------------------
| KHASSIDAS
|--------------------------------------------------------------------------
*/

/**
 * Liste des Khassidas
 */
export async function getKhassidas() {
  const response = await api.get("/khassidas");
  return response.data;
}


/**
 * Liste des audios d'une Khassida
 */
export async function getAudiosKhassida(khassidaId) {
  const response = await api.get(
    `/audios/khassida/${khassidaId}`
  );

  return response.data;
}