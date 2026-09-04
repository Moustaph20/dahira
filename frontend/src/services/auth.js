import api from "../api/client";

export async function login(identifiant, mot_de_passe) {
  console.log("IDENTIFIANT :", identifiant);
  console.log("MOT DE PASSE :", mot_de_passe);

  const response = await api.post("/auth/login", {
    identifiant,
    mot_de_passe,
  });

  console.log("REPONSE API :", response.data);

  const token = response.data.access_token;

  if (!token) {
    throw new Error("Aucun token reçu depuis le serveur.");
  }

  localStorage.setItem("token", token);

  console.log(
    "TOKEN ENREGISTRÉ :",
    localStorage.getItem("token")
  );

  return response.data;
}

export async function getMe() {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Aucun token trouvé.");
  }

  const response = await api.get("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export function logout() {
  localStorage.removeItem("token");
}