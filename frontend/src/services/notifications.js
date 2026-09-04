import api from "../api/client";

// ============================================================
// RÉCUPÉRER TOUTES LES NOTIFICATIONS
// ============================================================

export async function getNotifications() {
  const response = await api.get("/notifications");

  return response.data;
}


// ============================================================
// RÉCUPÉRER LES NOTIFICATIONS NON LUES
// ============================================================

export async function getNotificationsNonLues() {
  const response = await api.get(
    "/notifications/non-lues"
  );

  return response.data;
}


// ============================================================
// RÉCUPÉRER LE COMPTEUR
// ============================================================

export async function getNotificationsCompteur() {
  const response = await api.get(
    "/notifications/compteur"
  );

  return response.data;
}


// ============================================================
// RÉCUPÉRER UNE NOTIFICATION
// ============================================================

export async function getNotification(id) {
  const response = await api.get(
    `/notifications/${id}`
  );

  return response.data;
}


// ============================================================
// MARQUER UNE NOTIFICATION COMME LUE
// ============================================================

export async function marquerNotificationLue(id) {
  const response = await api.patch(
    `/notifications/${id}/lue`
  );

  return response.data;
}


// ============================================================
// MARQUER TOUTES LES NOTIFICATIONS COMME LUES
// ============================================================

export async function marquerToutesNotificationsLues() {
  const response = await api.patch(
    "/notifications/toutes-lues"
  );

  return response.data;
}


// ============================================================
// SUPPRIMER UNE NOTIFICATION
// ============================================================

export async function supprimerNotification(id) {
  const response = await api.delete(
    `/notifications/${id}`
  );

  return response.data;
}


// ============================================================
// CRÉER UNE NOTIFICATION
// ============================================================

export async function creerNotification(data) {
  const response = await api.post(
    "/notifications",
    data
  );

  return response.data;
}