
// src/pages/Communication.jsx

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle,
  Edit,
  Filter,
  Info,
  Megaphone,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import {
  getCommunications,
  creerCommunication,
  modifierCommunication,
  modifierStatutCommunication,
  supprimerCommunication,
} from "../services/communications";


// ============================================================
// CONSTANTES
// ============================================================

const TYPES_COMMUNICATION = [
  {
    value: "ANNONCE",
    label: "Annonce",
  },
  {
    value: "REUNION",
    label: "Réunion",
  },
  {
    value: "PROGRAMME_RELIGIEUX",
    label: "Programme religieux",
  },
  {
    value: "KOUREL",
    label: "Kourel",
  },
  {
    value: "RAPPEL",
    label: "Rappel",
  },
  {
    value: "URGENT",
    label: "Urgent",
  },
  {
    value: "AUTRE",
    label: "Autre",
  },
];

const PRIORITES_COMMUNICATION = [
  {
    value: "NORMALE",
    label: "Normale",
  },
  {
    value: "IMPORTANTE",
    label: "Importante",
  },
  {
    value: "URGENTE",
    label: "Urgente",
  },
];


// ============================================================
// FORMULAIRE INITIAL
// ============================================================

const FORMULAIRE_INITIAL = {
  titre: "",
  contenu: "",
  type_communication: "ANNONCE",
  priorite: "NORMALE",
  date_publication: "",
  date_expiration: "",
  actif: true,
};


// ============================================================
// UTILITAIRES
// ============================================================

const formaterDate = (date) => {
  if (!date) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  } catch {
    return "-";
  }
};


const formaterDatePourInput = (date) => {
  if (!date) {
    return "";
  }

  try {
    const valeur = new Date(date);

    if (Number.isNaN(valeur.getTime())) {
      return "";
    }

    const annee = valeur.getFullYear();
    const mois = String(
      valeur.getMonth() + 1
    ).padStart(2, "0");
    const jour = String(
      valeur.getDate()
    ).padStart(2, "0");
    const heures = String(
      valeur.getHours()
    ).padStart(2, "0");
    const minutes = String(
      valeur.getMinutes()
    ).padStart(2, "0");

    return `${annee}-${mois}-${jour}T${heures}:${minutes}`;
  } catch {
    return "";
  }
};


const obtenirLabelType = (type) => {
  const resultat =
    TYPES_COMMUNICATION.find(
      (item) => item.value === type
    );

  return resultat
    ? resultat.label
    : type;
};


const obtenirLabelPriorite = (priorite) => {
  const resultat =
    PRIORITES_COMMUNICATION.find(
      (item) => item.value === priorite
    );

  return resultat
    ? resultat.label
    : priorite;
};


const obtenirClassesPriorite = (priorite) => {
  switch (priorite) {
    case "URGENTE":
      return "bg-red-100 text-red-700 border-red-200";

    case "IMPORTANTE":
      return "bg-orange-100 text-orange-700 border-orange-200";

    default:
      return "bg-green-100 text-green-700 border-green-200";
  }
};


const obtenirClassesType = (type) => {
  switch (type) {
    case "REUNION":
      return "bg-blue-100 text-blue-700";

    case "PROGRAMME_RELIGIEUX":
      return "bg-purple-100 text-purple-700";

    case "KOUREL":
      return "bg-indigo-100 text-indigo-700";

    case "RAPPEL":
      return "bg-yellow-100 text-yellow-700";

    case "URGENT":
      return "bg-red-100 text-red-700";

    case "ANNONCE":
      return "bg-emerald-100 text-emerald-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
};


// ============================================================
// EXTRACTION ERREUR API
// ============================================================

const extraireMessageErreur = (erreur) => {
  const detail =
    erreur?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        return (
          item?.msg ||
          "Erreur de validation."
        );
      })
      .join(" ");
  }

  if (detail && typeof detail === "object") {
    return (
      detail.message ||
      detail.msg ||
      "Une erreur est survenue."
    );
  }

  return (
    erreur?.message ||
    "Une erreur est survenue."
  );
};


// ============================================================
// COMPOSANT
// ============================================================

export default function Communication() {
  const { aPermission } = useAuth();

  // ----------------------------------------------------------
  // PERMISSIONS
  // ----------------------------------------------------------

  const peutConsulter = aPermission(
    "COMMUNICATION_CONSULTER"
  );

  const peutCreer = aPermission(
    "COMMUNICATION_CREER"
  );

  const peutModifier = aPermission(
    "COMMUNICATION_MODIFIER"
  );

  const peutSupprimer = aPermission(
    "COMMUNICATION_SUPPRIMER"
  );


  // ----------------------------------------------------------
  // ETATS
  // ----------------------------------------------------------

  const [
    communications,
    setCommunications,
  ] = useState([]);

  const [
    chargement,
    setChargement,
  ] = useState(false);

  const [
    erreur,
    setErreur,
  ] = useState("");

  const [
    messageSucces,
    setMessageSucces,
  ] = useState("");


  // ----------------------------------------------------------
  // FILTRES
  // ----------------------------------------------------------

  const [
    filtreActif,
    setFiltreActif,
  ] = useState("");

  const [
    filtreType,
    setFiltreType,
  ] = useState("");

  const [
    filtrePriorite,
    setFiltrePriorite,
  ] = useState("");


  // ----------------------------------------------------------
  // MODALE FORMULAIRE
  // ----------------------------------------------------------

  const [
    afficherFormulaire,
    setAfficherFormulaire,
  ] = useState(false);

  const [
    communicationSelectionnee,
    setCommunicationSelectionnee,
  ] = useState(null);

  const [
    formulaire,
    setFormulaire,
  ] = useState(FORMULAIRE_INITIAL);

  const [
    enregistrement,
    setEnregistrement,
  ] = useState(false);


  // ----------------------------------------------------------
  // MODALE SUPPRESSION
  // ----------------------------------------------------------

  const [
    communicationASupprimer,
    setCommunicationASupprimer,
  ] = useState(null);

  const [
    suppression,
    setSuppression,
  ] = useState(false);


  // ==========================================================
  // CHARGER LES COMMUNICATIONS
  // ==========================================================

  const chargerCommunications = async () => {
    if (!peutConsulter) {
      return;
    }

    setChargement(true);
    setErreur("");

    try {
      const filtres = {};

      if (filtreActif !== "") {
        filtres.actif =
          filtreActif === "true";
      }

      if (filtreType !== "") {
        filtres.type_communication =
          filtreType;
      }

      if (filtrePriorite !== "") {
        filtres.priorite =
          filtrePriorite;
      }

      const donnees =
        await getCommunications(
          filtres
        );

      setCommunications(
        Array.isArray(donnees)
          ? donnees
          : []
      );
    } catch (err) {
      console.error(
        "Erreur chargement communications :",
        err
      );

      setErreur(
        extraireMessageErreur(err)
      );
    } finally {
      setChargement(false);
    }
  };


  useEffect(() => {
    chargerCommunications();
  }, [
    peutConsulter,
    filtreActif,
    filtreType,
    filtrePriorite,
  ]);


  // ==========================================================
  // MESSAGES TEMPORAIRES
  // ==========================================================

  const afficherSucces = (message) => {
    setMessageSucces(message);

    setTimeout(() => {
      setMessageSucces("");
    }, 4000);
  };


  // ==========================================================
  // OUVRIR FORMULAIRE CREATION
  // ==========================================================

  const ouvrirCreation = () => {
    setCommunicationSelectionnee(null);

    setFormulaire({
      ...FORMULAIRE_INITIAL,
      date_publication: "",
      date_expiration: "",
      actif: true,
    });

    setErreur("");

    setAfficherFormulaire(true);
  };


  // ==========================================================
  // OUVRIR FORMULAIRE MODIFICATION
  // ==========================================================

  const ouvrirModification = (
    communication
  ) => {
    setCommunicationSelectionnee(
      communication
    );

    setFormulaire({
      titre:
        communication.titre || "",

      contenu:
        communication.contenu || "",

      type_communication:
        communication.type_communication ||
        "ANNONCE",

      priorite:
        communication.priorite ||
        "NORMALE",

      date_publication:
        formaterDatePourInput(
          communication.date_publication
        ),

      date_expiration:
        formaterDatePourInput(
          communication.date_expiration
        ),

      actif:
        communication.actif ?? true,
    });

    setErreur("");

    setAfficherFormulaire(true);
  };


  // ==========================================================
  // FERMER FORMULAIRE
  // ==========================================================

  const fermerFormulaire = () => {
    if (enregistrement) {
      return;
    }

    setAfficherFormulaire(false);
    setCommunicationSelectionnee(null);
    setFormulaire(
      FORMULAIRE_INITIAL
    );
  };


  // ==========================================================
  // CHANGEMENT FORMULAIRE
  // ==========================================================

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormulaire((ancien) => ({
      ...ancien,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };


  // ==========================================================
  // VALIDATION FORMULAIRE
  // ==========================================================

  const validerFormulaire = () => {
    if (
      !formulaire.titre.trim() ||
      formulaire.titre.trim().length < 2
    ) {
      return "Le titre doit contenir au moins 2 caractères.";
    }

    if (!formulaire.contenu.trim()) {
      return "Le contenu de la communication est obligatoire.";
    }

    if (
      formulaire.date_publication &&
      formulaire.date_expiration
    ) {
      const publication =
        new Date(
          formulaire.date_publication
        );

      const expiration =
        new Date(
          formulaire.date_expiration
        );

      if (
        expiration <= publication
      ) {
        return (
          "La date d'expiration doit être postérieure à la date de publication."
        );
      }
    }

    return null;
  };


  // ==========================================================
  // ENREGISTRER
  // ==========================================================

  const enregistrerCommunication =
    async (event) => {
      event.preventDefault();

      setErreur("");
      setMessageSucces("");

      const erreurValidation =
        validerFormulaire();

      if (erreurValidation) {
        setErreur(
          erreurValidation
        );
        return;
      }

      setEnregistrement(true);

      try {
        const donnees = {
          titre:
            formulaire.titre.trim(),

          contenu:
            formulaire.contenu.trim(),

          type_communication:
            formulaire.type_communication,

          priorite:
            formulaire.priorite,

          date_publication:
            formulaire.date_publication
              ? new Date(
                  formulaire.date_publication
                ).toISOString()
              : null,

          date_expiration:
            formulaire.date_expiration
              ? new Date(
                  formulaire.date_expiration
                ).toISOString()
              : null,

          actif:
            formulaire.actif,
        };


        if (
          communicationSelectionnee
        ) {
          await modifierCommunication(
            communicationSelectionnee.id,
            donnees
          );

          afficherSucces(
            "Communication modifiée avec succès."
          );
        } else {
          await creerCommunication(
            donnees
          );

          afficherSucces(
            "Communication créée avec succès."
          );
        }

        fermerFormulaire();

        await chargerCommunications();
      } catch (err) {
        console.error(
          "Erreur enregistrement communication :",
          err
        );

        setErreur(
          extraireMessageErreur(err)
        );
      } finally {
        setEnregistrement(false);
      }
    };


  // ==========================================================
  // ACTIVER / DESACTIVER
  // ==========================================================

  const changerStatut = async (
    communication
  ) => {
    if (!peutModifier) {
      return;
    }

    try {
      setErreur("");
      setMessageSucces("");

      await modifierStatutCommunication(
        communication.id,
        !communication.actif
      );

      afficherSucces(
        communication.actif
          ? "Communication désactivée avec succès."
          : "Communication activée avec succès."
      );

      await chargerCommunications();
    } catch (err) {
      console.error(
        "Erreur modification statut :",
        err
      );

      setErreur(
        extraireMessageErreur(err)
      );
    }
  };


  // ==========================================================
  // OUVRIR CONFIRMATION SUPPRESSION
  // ==========================================================

  const demanderSuppression = (
    communication
  ) => {
    if (!peutSupprimer) {
      return;
    }

    setCommunicationASupprimer(
      communication
    );
  };


  // ==========================================================
  // ANNULER SUPPRESSION
  // ==========================================================

  const annulerSuppression = () => {
    if (suppression) {
      return;
    }

    setCommunicationASupprimer(
      null
    );
  };


  // ==========================================================
  // SUPPRIMER
  // ==========================================================

  const confirmerSuppression =
    async () => {
      if (
        !communicationASupprimer ||
        !peutSupprimer
      ) {
        return;
      }

      setSuppression(true);
      setErreur("");
      setMessageSucces("");

      try {
        await supprimerCommunication(
          communicationASupprimer.id
        );

        afficherSucces(
          "Communication supprimée avec succès."
        );

        setCommunicationASupprimer(
          null
        );

        await chargerCommunications();
      } catch (err) {
        console.error(
          "Erreur suppression communication :",
          err
        );

        setErreur(
          extraireMessageErreur(err)
        );
      } finally {
        setSuppression(false);
      }
    };


  // ==========================================================
  // AUCUNE PERMISSION CONSULTATION
  // ==========================================================

  if (!peutConsulter) {
    return (
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle
                size={32}
                className="text-red-600"
              />
            </div>

            <h1 className="text-xl font-semibold text-gray-800">
              Accès refusé
            </h1>

            <p className="mt-2 text-gray-500">
              Vous ne disposez pas de la permission
              nécessaire pour consulter les
              communications.
            </p>
          </div>
        </div>
      </div>
    );
  }


  // ==========================================================
  // RENDU
  // ==========================================================

  return (
    <div className="p-4 md:p-6">

      {/* ======================================================
          EN-TÊTE
      ====================================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">

        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
              <Megaphone
                size={24}
                className="text-blue-600"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Communications
              </h1>

              <p className="text-sm text-gray-500">
                Gérez les annonces et informations
                destinées aux membres du Dahira.
              </p>
            </div>
          </div>
        </div>


        {peutCreer && (
          <button
            type="button"
            onClick={ouvrirCreation}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition shadow-sm"
          >
            <Plus size={19} />

            Nouvelle communication
          </button>
        )}

      </div>


      {/* ======================================================
          MESSAGES
      ====================================================== */}

      {messageSucces && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">
          <CheckCircle
            size={20}
            className="mt-0.5 shrink-0"
          />

          <span className="text-sm">
            {messageSucces}
          </span>
        </div>
      )}


      {erreur && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0"
          />

          <span className="text-sm">
            {erreur}
          </span>

          <button
            type="button"
            onClick={() => setErreur("")}
            className="ml-auto hover:text-red-900"
          >
            <X size={18} />
          </button>
        </div>
      )}


      {/* ======================================================
          FILTRES
      ====================================================== */}

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 mb-6">

        <div className="flex items-center gap-2 mb-4">
          <Filter
            size={19}
            className="text-gray-600"
          />

          <h2 className="font-semibold text-gray-800">
            Filtres
          </h2>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">

          {/* STATUT */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Statut
            </label>

            <select
              value={filtreActif}
              onChange={(event) =>
                setFiltreActif(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">
                Tous
              </option>

              <option value="true">
                Actives
              </option>

              <option value="false">
                Inactives
              </option>
            </select>
          </div>


          {/* TYPE */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Type
            </label>

            <select
              value={filtreType}
              onChange={(event) =>
                setFiltreType(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">
                Tous les types
              </option>

              {TYPES_COMMUNICATION.map(
                (type) => (
                  <option
                    key={type.value}
                    value={type.value}
                  >
                    {type.label}
                  </option>
                )
              )}
            </select>
          </div>


          {/* PRIORITE */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Priorité
            </label>

            <select
              value={filtrePriorite}
              onChange={(event) =>
                setFiltrePriorite(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">
                Toutes les priorités
              </option>

              {PRIORITES_COMMUNICATION.map(
                (priorite) => (
                  <option
                    key={priorite.value}
                    value={
                      priorite.value
                    }
                  >
                    {priorite.label}
                  </option>
                )
              )}
            </select>
          </div>


          {/* ACTUALISER */}

          <div className="flex items-end">
            <button
              type="button"
              onClick={
                chargerCommunications
              }
              disabled={chargement}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
            >
              <RefreshCw
                size={17}
                className={
                  chargement
                    ? "animate-spin"
                    : ""
                }
              />

              Actualiser
            </button>
          </div>

        </div>
      </div>


      

      {/* ======================================================
          LISTE
      ====================================================== */}

      {chargement ? (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-12 text-center">
          <RefreshCw
            size={32}
            className="mx-auto text-blue-600 animate-spin"
          />

          <p className="mt-4 text-gray-500">
            Chargement des communications...
          </p>
        </div>
      ) : communications.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-12 text-center">

          <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
            <MessageSquare
              size={30}
              className="text-gray-400"
            />
          </div>

          <h3 className="mt-4 text-lg font-semibold text-gray-800">
            Aucune communication
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Aucune communication ne correspond
            aux filtres sélectionnés.
          </p>

          {peutCreer && (
            <button
              type="button"
              onClick={ouvrirCreation}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              <Plus size={17} />

              Créer une communication
            </button>
          )}

        </div>
      ) : (
        <div className="space-y-4">

          {communications.map(
            (communication) => (
              <div
                key={communication.id}
                className={`bg-white border rounded-2xl shadow-sm overflow-hidden ${
                  communication.actif
                    ? "border-gray-200"
                    : "border-gray-200 opacity-75"
                }`}
              >

                <div className="p-5">

                  {/* EN-TETE CARTE */}

                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">

                    <div className="flex gap-3">

                      <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <Megaphone
                          size={21}
                          className="text-blue-600"
                        />
                      </div>

                      <div>

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="text-lg font-semibold text-gray-800">
                            {communication.titre}
                          </h3>

                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${obtenirClassesType(
                              communication.type_communication
                            )}`}
                          >
                            {obtenirLabelType(
                              communication.type_communication
                            )}
                          </span>

                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border ${obtenirClassesPriorite(
                              communication.priorite
                            )}`}
                          >
                            {obtenirLabelPriorite(
                              communication.priorite
                            )}
                          </span>

                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              communication.actif
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {communication.actif
                              ? "Active"
                              : "Inactive"}
                          </span>

                        </div>


                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">

                          <span className="inline-flex items-center gap-1.5">
                            <Calendar size={14} />

                            Publiée le{" "}
                            {formaterDate(
                              communication.date_publication
                            )}
                          </span>

                          {communication.date_expiration && (
                            <span className="inline-flex items-center gap-1.5">
                              <Calendar size={14} />

                              Expire le{" "}
                              {formaterDate(
                                communication.date_expiration
                              )}
                            </span>
                          )}

                        </div>

                      </div>

                    </div>


                    {/* ACTIONS */}

                    <div className="flex items-center gap-2 shrink-0">

                      {peutModifier && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              ouvrirModification(
                                communication
                              )
                            }
                            title="Modifier"
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition text-sm"
                          >
                            <Edit
                              size={16}
                            />

                            <span className="hidden sm:inline">
                              Modifier
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              changerStatut(
                                communication
                              )
                            }
                            title={
                              communication.actif
                                ? "Désactiver"
                                : "Activer"
                            }
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition ${
                              communication.actif
                                ? "border border-orange-300 text-orange-700 hover:bg-orange-50"
                                : "border border-green-300 text-green-700 hover:bg-green-50"
                            }`}
                          >
                            {communication.actif ? (
                              <>
                                <XCircle
                                  size={16}
                                />

                                <span className="hidden sm:inline">
                                  Désactiver
                                </span>
                              </>
                            ) : (
                              <>
                                <CheckCircle
                                  size={16}
                                />

                                <span className="hidden sm:inline">
                                  Activer
                                </span>
                              </>
                            )}
                          </button>
                        </>
                      )}


                      {peutSupprimer && (
                        <button
                          type="button"
                          onClick={() =>
                            demanderSuppression(
                              communication
                            )
                          }
                          title="Supprimer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition text-sm"
                        >
                          <Trash2
                            size={16}
                          />

                          <span className="hidden sm:inline">
                            Supprimer
                          </span>
                        </button>
                      )}

                    </div>

                  </div>


                  {/* CONTENU */}

                  <div className="mt-4 pl-0 lg:pl-14">

                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {communication.contenu}
                    </p>

                  </div>


                  {/* PIED */}

                  <div className="mt-4 pt-4 border-t border-gray-100 pl-0 lg:pl-14">

                    <div className="flex flex-wrap items-center justify-between gap-3">

                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Info size={14} />

                        Communication #{communication.id}
                      </div>

                      {communication.updated_at &&
                        communication.updated_at !==
                          communication.created_at && (
                          <span className="text-xs text-gray-400">
                            Modifiée le{" "}
                            {formaterDate(
                              communication.updated_at
                            )}
                          </span>
                        )}

                    </div>

                  </div>

                </div>

              </div>
            )
          )}

        </div>
      )}


      {/* ======================================================
          MODALE CREATION / MODIFICATION
      ====================================================== */}

      {afficherFormulaire && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

          <div
            className="absolute inset-0 bg-black/50"
            onClick={fermerFormulaire}
          />

          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">

            {/* TITRE MODALE */}

            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-200 bg-white">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Send
                    size={20}
                    className="text-blue-600"
                  />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {communicationSelectionnee
                      ? "Modifier la communication"
                      : "Nouvelle communication"}
                  </h2>

                  <p className="text-xs text-gray-500">
                    Renseignez les informations
                    de la communication.
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={fermerFormulaire}
                disabled={enregistrement}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>

            </div>


            {/* FORMULAIRE */}

            <form
              onSubmit={
                enregistrerCommunication
              }
              className="p-6 space-y-5"
            >

              {/* TITRE */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Titre
                  <span className="text-red-500 ml-1">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  name="titre"
                  value={formulaire.titre}
                  onChange={handleChange}
                  maxLength={200}
                  placeholder="Ex. Réunion mensuelle de septembre"
                  disabled={enregistrement}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>


              {/* CONTENU */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contenu
                  <span className="text-red-500 ml-1">
                    *
                  </span>
                </label>

                <textarea
                  name="contenu"
                  value={formulaire.contenu}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Saisissez le contenu de la communication..."
                  disabled={enregistrement}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>


              {/* TYPE + PRIORITE */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Type
                  </label>

                  <select
                    name="type_communication"
                    value={
                      formulaire.type_communication
                    }
                    onChange={handleChange}
                    disabled={enregistrement}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    {TYPES_COMMUNICATION.map(
                      (type) => (
                        <option
                          key={type.value}
                          value={type.value}
                        >
                          {type.label}
                        </option>
                      )
                    )}
                  </select>
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Priorité
                  </label>

                  <select
                    name="priorite"
                    value={
                      formulaire.priorite
                    }
                    onChange={handleChange}
                    disabled={enregistrement}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    {PRIORITES_COMMUNICATION.map(
                      (priorite) => (
                        <option
                          key={priorite.value}
                          value={
                            priorite.value
                          }
                        >
                          {priorite.label}
                        </option>
                      )
                    )}
                  </select>
                </div>

              </div>


              {/* DATES */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Date de publication
                  </label>

                  <input
                    type="datetime-local"
                    name="date_publication"
                    value={
                      formulaire.date_publication
                    }
                    onChange={handleChange}
                    disabled={enregistrement}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />

                  <p className="mt-1 text-xs text-gray-400">
                    Laissez vide pour utiliser
                    automatiquement la date actuelle.
                  </p>
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Date d'expiration
                  </label>

                  <input
                    type="datetime-local"
                    name="date_expiration"
                    value={
                      formulaire.date_expiration
                    }
                    onChange={handleChange}
                    disabled={enregistrement}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />

                  <p className="mt-1 text-xs text-gray-400">
                    Optionnelle.
                  </p>
                </div>

              </div>


              {/* STATUT */}

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">

                <label className="flex items-center gap-3 cursor-pointer">

                  <input
                    type="checkbox"
                    name="actif"
                    checked={
                      formulaire.actif
                    }
                    onChange={handleChange}
                    disabled={enregistrement}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />

                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Communication active
                    </p>

                    <p className="text-xs text-gray-500 mt-0.5">
                      Une communication active
                      peut être affichée aux membres.
                    </p>
                  </div>

                </label>

              </div>


              {/* ERREUR DANS FORMULAIRE */}

              {erreur && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle
                    size={18}
                    className="shrink-0 mt-0.5"
                  />

                  <span>
                    {erreur}
                  </span>
                </div>
              )}


              {/* ACTIONS */}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={
                    fermerFormulaire
                  }
                  disabled={enregistrement}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={enregistrement}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {enregistrement ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="animate-spin"
                      />

                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Send size={17} />

                      {communicationSelectionnee
                        ? "Enregistrer les modifications"
                        : "Publier la communication"}
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}


      {/* ======================================================
          MODALE SUPPRESSION
      ====================================================== */}

      {communicationASupprimer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">

          <div
            className="absolute inset-0 bg-black/50"
            onClick={annulerSuppression}
          />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2
                  size={21}
                  className="text-red-600"
                />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Supprimer la communication
                </h2>

                <p className="text-sm text-gray-500">
                  Cette action est définitive.
                </p>
              </div>

            </div>


            <div className="mt-5 rounded-xl bg-gray-50 border border-gray-200 p-4">

              <p className="font-medium text-gray-800">
                {communicationASupprimer.titre}
              </p>

              <p className="mt-1 text-sm text-gray-500 line-clamp-3">
                {communicationASupprimer.contenu}
              </p>

            </div>


            <p className="mt-4 text-sm text-gray-600">
              Êtes-vous sûr de vouloir supprimer
              cette communication ?
            </p>


            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">

              <button
                type="button"
                onClick={
                  annulerSuppression
                }
                disabled={suppression}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={
                  confirmerSuppression
                }
                disabled={suppression}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {suppression ? (
                  <>
                    <RefreshCw
                      size={17}
                      className="animate-spin"
                    />

                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 size={17} />

                    Supprimer
                  </>
                )}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
