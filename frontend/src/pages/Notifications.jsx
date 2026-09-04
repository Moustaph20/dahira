import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Info,
  AlertTriangle,
  XCircle,
  CircleCheck,
  CalendarDays,
  Users,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import {
  getNotifications,
  marquerNotificationLue,
  marquerToutesNotificationsLues,
  supprimerNotification,
} from "../services/notifications";

// ==========================================================
// CONFIGURATION DES TYPES
// ==========================================================

const TYPE_CONFIG = {
  INFO: {
    label: "Information",
    icon: Info,
  },
  SUCCES: {
    label: "Succès",
    icon: CircleCheck,
  },
  AVERTISSEMENT: {
    label: "Avertissement",
    icon: AlertTriangle,
  },
  ERREUR: {
    label: "Erreur",
    icon: XCircle,
  },
  COTISATION: {
    label: "Cotisation",
    icon: CircleCheck,
  },
  REUNION: {
    label: "Réunion",
    icon: CalendarDays,
  },
  KOUREL: {
    label: "Kourel",
    icon: Users,
  },
  COMMUNICATION: {
    label: "Communication",
    icon: MessageSquare,
  },
};

function getTypeConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.INFO;
}

// ==========================================================
// FORMATAGE DATE
// ==========================================================

function formatDate(dateString) {
  if (!dateString) {
    return "";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ==========================================================
// PAGE NOTIFICATIONS
// ==========================================================

export default function Notifications() {
  const navigate = useNavigate();
  const { utilisateur } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [traitement, setTraitement] = useState(false);

  // ========================================================
  // CHARGER LES NOTIFICATIONS
  // ========================================================

  const chargerNotifications = async () => {
    try {
      setChargement(true);
      setErreur("");

      const response = await getNotifications();

      const data = Array.isArray(response)
        ? response
        : response?.data || [];

      setNotifications(data);
    } catch (error) {
      console.error(
        "Erreur lors du chargement des notifications :",
        error
      );

      setErreur(
        error?.response?.data?.detail ||
          "Impossible de charger les notifications."
      );
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    if (utilisateur) {
      chargerNotifications();
    }
  }, [utilisateur]);

  // ========================================================
  // STATISTIQUES
  // ========================================================

  const nonLues = useMemo(
    () => notifications.filter((notification) => !notification.lu),
    [notifications]
  );

  const nombreNonLues = nonLues.length;

  // ========================================================
  // MARQUER UNE NOTIFICATION COMME LUE
  // ========================================================

  const handleMarquerLue = async (notificationId) => {
    try {
      setTraitement(true);

      await marquerNotificationLue(notificationId);

      setNotifications((ancien) =>
        ancien.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                lu: true,
                date_lecture: new Date().toISOString(),
              }
            : notification
        )
      );
    } catch (error) {
      console.error(
        "Erreur lors du marquage de la notification :",
        error
      );

      setErreur(
        error?.response?.data?.detail ||
          "Impossible de marquer la notification comme lue."
      );
    } finally {
      setTraitement(false);
    }
  };

  // ========================================================
  // MARQUER TOUTES LES NOTIFICATIONS COMME LUES
  // ========================================================

  const handleMarquerToutesLues = async () => {
    if (nombreNonLues === 0) {
      return;
    }

    try {
      setTraitement(true);
      setErreur("");

      await marquerToutesNotificationsLues();

      setNotifications((ancien) =>
        ancien.map((notification) => ({
          ...notification,
          lu: true,
          date_lecture:
            notification.date_lecture ||
            new Date().toISOString(),
        }))
      );
    } catch (error) {
      console.error(
        "Erreur lors du marquage de toutes les notifications :",
        error
      );

      setErreur(
        error?.response?.data?.detail ||
          "Impossible de marquer toutes les notifications comme lues."
      );
    } finally {
      setTraitement(false);
    }
  };

  // ========================================================
  // SUPPRIMER UNE NOTIFICATION
  // ========================================================

  const handleSupprimer = async (notificationId) => {
    try {
      setTraitement(true);
      setErreur("");

      await supprimerNotification(notificationId);

      setNotifications((ancien) =>
        ancien.filter(
          (notification) => notification.id !== notificationId
        )
      );
    } catch (error) {
      console.error(
        "Erreur lors de la suppression de la notification :",
        error
      );

      setErreur(
        error?.response?.data?.detail ||
          "Impossible de supprimer la notification."
      );
    } finally {
      setTraitement(false);
    }
  };

  // ========================================================
  // CLIQUER SUR UNE NOTIFICATION
  // ========================================================

  const handleNotificationClick = async (notification) => {
    if (!notification.lu) {
      await handleMarquerLue(notification.id);
    }

    if (notification.route) {
      navigate(notification.route);
    }
  };

  // ========================================================
  // RENDU
  // ========================================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        {/* ==================================================
            EN-TÊTE
        ================================================== */}

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-3">
                <Bell className="h-7 w-7 text-blue-600" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Notifications
                </h1>

                <p className="text-sm text-gray-500">
                  Consultez vos dernières notifications.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={chargerNotifications}
              disabled={chargement || traitement}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  chargement ? "animate-spin" : ""
                }`}
              />

              Actualiser
            </button>

            {nombreNonLues > 0 && (
              <button
                type="button"
                onClick={handleMarquerToutesLues}
                disabled={traitement}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCheck className="h-4 w-4" />

                Tout marquer comme lu
              </button>
            )}
          </div>
        </div>

        {/* ==================================================
            STATISTIQUES
        ================================================== */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total
                </p>

                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {notifications.length}
                </p>
              </div>

              <div className="rounded-lg bg-gray-100 p-3">
                <Bell className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Non lues
                </p>

                <p className="mt-1 text-3xl font-bold text-blue-600">
                  {nombreNonLues}
                </p>
              </div>

              <div className="rounded-lg bg-blue-100 p-3">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
            ERREUR
        ================================================== */}

        {erreur && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="flex-1">
              <p className="font-medium">
                Une erreur est survenue
              </p>

              <p className="mt-1 text-sm">{erreur}</p>
            </div>

            <button
              type="button"
              onClick={() => setErreur("")}
              className="rounded-md p-1 transition hover:bg-red-100"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ==================================================
            CHARGEMENT
        ================================================== */}

        {chargement ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-600" />

            <p className="mt-3 text-sm text-gray-500">
              Chargement des notifications...
            </p>
          </div>
        ) : notifications.length === 0 ? (
          /* ==================================================
             AUCUNE NOTIFICATION
          ================================================== */

          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Bell className="h-8 w-8 text-gray-400" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              Aucune notification
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Vous n'avez aucune notification pour le moment.
            </p>
          </div>
        ) : (
          /* ==================================================
             LISTE DES NOTIFICATIONS
          ================================================== */

          <div className="space-y-3">
            {notifications.map((notification) => {
              const config = getTypeConfig(notification.type);
              const Icon = config.icon;

              return (
                <div
                  key={notification.id}
                  className={`rounded-xl border bg-white shadow-sm transition ${
                    notification.lu
                      ? "border-gray-200"
                      : "border-blue-200 bg-blue-50/40"
                  }`}
                >
                  <div className="p-4 md:p-5">
                    <div className="flex gap-4">
                      {/* ICÔNE */}

                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                          notification.lu
                            ? "bg-gray-100 text-gray-500"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* CONTENU */}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h2
                                className={`text-base ${
                                  notification.lu
                                    ? "font-medium text-gray-800"
                                    : "font-bold text-gray-900"
                                }`}
                              >
                                {notification.titre}
                              </h2>

                              {!notification.lu && (
                                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                                  Nouveau
                                </span>
                              )}

                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                {config.label}
                              </span>
                            </div>

                            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">
                              {notification.message}
                            </p>

                            <p className="mt-2 text-xs text-gray-400">
                              {formatDate(notification.created_at)}
                            </p>
                          </div>
                        </div>

                        {/* ACTIONS */}

                        <div className="mt-4 flex flex-wrap gap-2">
                          {notification.route && (
                            <button
                              type="button"
                              onClick={() =>
                                handleNotificationClick(notification)
                              }
                              disabled={traitement}
                              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Bell className="h-4 w-4" />

                              Consulter
                            </button>
                          )}

                          {!notification.lu && (
                            <button
                              type="button"
                              onClick={() =>
                                handleMarquerLue(notification.id)
                              }
                              disabled={traitement}
                              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Check className="h-4 w-4" />

                              Marquer comme lue
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              handleSupprimer(notification.id)
                            }
                            disabled={traitement}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />

                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}