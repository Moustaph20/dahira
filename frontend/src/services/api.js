
import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.1.15:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * ============================================================
 * AJOUT AUTOMATIQUE DU TOKEN
 * ============================================================
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * ============================================================
 * GESTION DES ERREURS 401
 * ============================================================
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.warn(
        "Session expirée ou token invalide."
      );
    }

    return Promise.reject(error);
  }
);

export default api;

