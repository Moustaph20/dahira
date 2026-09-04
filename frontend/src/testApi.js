import api from "./api/client";

api.get("/docs")
  .then((response) => {
    console.log("Backend accessible :", response.status);
  })
  .catch((error) => {
    console.error("Erreur backend :", error);
  });
  