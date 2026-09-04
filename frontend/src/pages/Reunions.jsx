
import { useEffect, useMemo, useState } from "react";

import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  AlertCircle,
  CalendarDays,
  Check,
  Clock,
  Eye,
  FileText,
  Map,
  MapPin,
  Navigation,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import {
  activerReunion,
  annulerReunion,
  creerReunion,
  desactiverReunion,
  getReunions,
  modifierCompteRendu,
  modifierReunion,
  modifierStatutReunion,
  recupererLocalisationGoogleMaps,
} from "../services/reunions";


/* ==========================================================================
   CONFIGURATION LEAFLET
   ========================================================================== */

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});


/* ==========================================================================
   CONSTANTES
   ========================================================================== */

const POSITION_DAKAR = [14.7167, -17.4677];

const TYPES_REUNION = [
  {
    value: "MENSUELLE",
    label: "Réunion mensuelle",
  },
  {
    value: "EXTRAORDINAIRE",
    label: "Réunion extraordinaire",
  },
  {
    value: "BUREAU",
    label: "Réunion de bureau",
  },
  {
    value: "KOUREL",
    label: "Réunion de Kourel",
  },
  {
    value: "AUTRE",
    label: "Autre",
  },
];

const STATUTS_REUNION = [
  {
    value: "PROGRAMMEE",
    label: "Programmée",
  },
  {
    value: "EN_COURS",
    label: "En cours",
  },
  {
    value: "TERMINEE",
    label: "Terminée",
  },
  {
    value: "ANNULEE",
    label: "Annulée",
  },
];


const FORMULAIRE_INITIAL = {
  titre: "",
  type_reunion: "MENSUELLE",
  description: "",
  ordre_du_jour: "",
  date_reunion: "",
  lieu: "",
  adresse: "",
  latitude: "",
  longitude: "",
  statut: "PROGRAMMEE",
  compte_rendu: "",
  lien_google_maps: "",
};


/* ==========================================================================
   COMPOSANT : CLIC SUR LA CARTE
   ========================================================================== */

function SelectionPositionCarte({ onPositionChange }) {
  useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng;

      onPositionChange({
        latitude: lat,
        longitude: lng,
      });
    },
  });

  return null;
}


/* ==========================================================================
   COMPOSANT : RECENTRAGE CARTE
   ========================================================================== */

function RecentrerCarte({ position }) {
  const map = useMap();

  useEffect(() => {
    if (!position) {
      return;
    }

    map.setView(position, 16);
  }, [map, position]);

  return null;
}


/* ==========================================================================
   UTILITAIRES
   ========================================================================== */

function formaterDate(dateValue) {
  if (!dateValue) {
    return "Date non renseignée";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Date invalide";
  }

  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}


function formaterHeure(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}


function obtenirLabelType(type) {
  const element = TYPES_REUNION.find(
    (item) => item.value === type
  );

  return element?.label || type || "Autre";
}


function obtenirLabelStatut(statut) {
  const element = STATUTS_REUNION.find(
    (item) => item.value === statut
  );

  return element?.label || statut || "Inconnu";
}


function obtenirClasseStatut(statut) {
  switch (statut) {
    case "PROGRAMMEE":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "EN_COURS":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "TERMINEE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "ANNULEE":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}


function convertirDatePourInput(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  const heures = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${annee}-${mois}-${jour}T${heures}:${minutes}`;
}


/* ==========================================================================
   COORDONNÉES
   ========================================================================== */

function obtenirCoordonnees(reunion) {
  if (
    reunion?.latitude === null ||
    reunion?.latitude === undefined ||
    reunion?.longitude === null ||
    reunion?.longitude === undefined
  ) {
    return null;
  }

  const latitude = Number(reunion.latitude);
  const longitude = Number(reunion.longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
}


/* ==========================================================================
   GOOGLE MAPS / APPLE PLANS
   ========================================================================== */

function ouvrirGoogleMaps(reunion) {
  const coordonnees = obtenirCoordonnees(reunion);

  if (!coordonnees) {
    return;
  }

  const { latitude, longitude } = coordonnees;

  const url =
    `https://www.google.com/maps/search/?api=1&query=` +
    `${latitude},${longitude}`;

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );
}


function ouvrirItineraireGoogleMaps(reunion) {
  const coordonnees = obtenirCoordonnees(reunion);

  if (!coordonnees) {
    return;
  }

  const { latitude, longitude } = coordonnees;

  const url =
    `https://www.google.com/maps/dir/?api=1&destination=` +
    `${latitude},${longitude}`;

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );
}


function ouvrirApplePlans(reunion) {
  const coordonnees = obtenirCoordonnees(reunion);

  if (!coordonnees) {
    return;
  }

  const { latitude, longitude } = coordonnees;

  const url =
    `https://maps.apple.com/?ll=` +
    `${latitude},${longitude}`;

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );
}


/* ==========================================================================
   COMPOSANT PRINCIPAL
   ========================================================================== */

export default function Reunions() {
  const { aPermission } = useAuth();


  /* ------------------------------------------------------------------------
     PERMISSIONS
     ------------------------------------------------------------------------ */

  const peutConsulter =
    !aPermission ||
    aPermission("REUNION_CONSULTER");

  const peutCreer =
    !aPermission ||
    aPermission("REUNION_CREER");

  const peutModifier =
    !aPermission ||
    aPermission("REUNION_MODIFIER");

  const peutSupprimer =
    !aPermission ||
    aPermission("REUNION_SUPPRIMER");


  /* ------------------------------------------------------------------------
     ETATS
     ------------------------------------------------------------------------ */

  const [reunions, setReunions] = useState([]);

  const [chargement, setChargement] = useState(true);

  const [erreur, setErreur] = useState("");

  const [message, setMessage] = useState("");

  const [recherche, setRecherche] = useState("");

  const [rechercheActive, setRechercheActive] =
    useState("");

  const [filtreStatut, setFiltreStatut] =
    useState("");

  const [filtreType, setFiltreType] =
    useState("");

  const [inclureInactives, setInclureInactives] =
    useState(false);


  const [modalFormulaire, setModalFormulaire] =
    useState(false);

  const [modalDetails, setModalDetails] =
    useState(false);

  const [modalCompteRendu, setModalCompteRendu] =
    useState(false);


  const [modeEdition, setModeEdition] =
    useState(false);

  const [reunionSelectionnee, setReunionSelectionnee] =
    useState(null);


  const [formulaire, setFormulaire] =
    useState(FORMULAIRE_INITIAL);

  const [erreursFormulaire, setErreursFormulaire] =
    useState({});


  const [compteRendu, setCompteRendu] =
    useState("");


  const [enregistrement, setEnregistrement] =
    useState(false);

  const [actionId, setActionId] =
    useState(null);


  /* ------------------------------------------------------------------------
     LOCALISATION GOOGLE MAPS
     ------------------------------------------------------------------------ */

  const [chargementLocalisation, setChargementLocalisation] =
    useState(false);

  const [erreurLocalisation, setErreurLocalisation] =
    useState("");

  const [localisationRecuperee, setLocalisationRecuperee] =
    useState(false);


  /* ==========================================================================
     CHARGEMENT DES RÉUNIONS
     ========================================================================== */

  async function chargerReunions() {
    try {
      setChargement(true);
      setErreur("");

      const data = await getReunions(
        rechercheActive,
        filtreStatut,
        filtreType,
        inclureInactives
      );

      setReunions(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (error) {
      console.error(
        "Erreur chargement réunions :",
        error
      );

      if (error.response?.status === 401) {
        setErreur(
          "Votre session a expiré. Veuillez vous reconnecter."
        );
      } else if (error.response?.status === 403) {
        setErreur(
          "Vous n'avez pas la permission de consulter les réunions."
        );
      } else {
        setErreur(
          error.response?.data?.detail ||
          "Impossible de charger les réunions."
        );
      }

    } finally {
      setChargement(false);
    }
  }


  useEffect(() => {
    if (peutConsulter) {
      chargerReunions();
    }
  }, [
    filtreStatut,
    filtreType,
    inclureInactives,
    rechercheActive,
  ]);


  /* ==========================================================================
     RECHERCHE
     ========================================================================== */

  function handleRecherche(event) {
    event.preventDefault();

    setRechercheActive(
      recherche.trim()
    );
  }


  function effacerRecherche() {
    setRecherche("");

    setRechercheActive("");
  }


  /* ==========================================================================
     FORMULAIRE
     ========================================================================== */

  function handleChange(event) {
    const { name, value } = event.target;

    setFormulaire((ancien) => ({
      ...ancien,
      [name]: value,
    }));

    setErreursFormulaire((ancien) => ({
      ...ancien,
      [name]: "",
    }));

    if (name === "lien_google_maps") {
      setErreurLocalisation("");
      setLocalisationRecuperee(false);
    }
  }


  function ouvrirCreation() {
    setModeEdition(false);

    setReunionSelectionnee(null);

    setFormulaire({
      ...FORMULAIRE_INITIAL,
    });

    setErreursFormulaire({});

    setErreurLocalisation("");

    setLocalisationRecuperee(false);

    setModalFormulaire(true);
  }


  function ouvrirEdition(reunion) {
    setModeEdition(true);

    setReunionSelectionnee(reunion);

    setFormulaire({
      titre: reunion.titre || "",

      type_reunion:
        reunion.type_reunion ||
        "MENSUELLE",

      description:
        reunion.description || "",

      ordre_du_jour:
        reunion.ordre_du_jour || "",

      date_reunion:
        convertirDatePourInput(
          reunion.date_reunion
        ),

      lieu:
        reunion.lieu || "",

      adresse:
        reunion.adresse || "",

      latitude:
        reunion.latitude !== null &&
        reunion.latitude !== undefined
          ? String(reunion.latitude)
          : "",

      longitude:
        reunion.longitude !== null &&
        reunion.longitude !== undefined
          ? String(reunion.longitude)
          : "",

      statut:
        reunion.statut ||
        "PROGRAMMEE",

      compte_rendu:
        reunion.compte_rendu || "",

      lien_google_maps: "",
    });

    setErreursFormulaire({});

    setErreurLocalisation("");

    setLocalisationRecuperee(false);

    setModalFormulaire(true);
  }


  function fermerFormulaire() {
    if (
      enregistrement ||
      chargementLocalisation
    ) {
      return;
    }

    setModalFormulaire(false);

    setErreursFormulaire({});

    setErreurLocalisation("");

    setLocalisationRecuperee(false);
  }


  /* ==========================================================================
     LOCALISATION GOOGLE MAPS
     ========================================================================== */

  async function handleRecupererLocalisation() {
    const lien =
      formulaire.lien_google_maps?.trim();

    if (!lien) {
      setErreurLocalisation(
        "Veuillez coller un lien Google Maps."
      );

      return;
    }

    try {
      setChargementLocalisation(true);

      setErreurLocalisation("");

      setLocalisationRecuperee(false);

      const data =
        await recupererLocalisationGoogleMaps(
          lien
        );

      if (
        data?.latitude === undefined ||
        data?.longitude === undefined
      ) {
        throw new Error(
          "Le serveur n'a pas retourné de coordonnées."
        );
      }

      const latitude = Number(
        data.latitude
      );

      const longitude = Number(
        data.longitude
      );

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        throw new Error(
          "Les coordonnées récupérées sont invalides."
        );
      }

      setFormulaire((ancien) => ({
        ...ancien,

        latitude:
          latitude.toFixed(6),

        longitude:
          longitude.toFixed(6),
      }));

      setErreursFormulaire((ancien) => ({
        ...ancien,

        latitude: "",
        longitude: "",
      }));

      setLocalisationRecuperee(true);

      setMessage(
        "Localisation Google Maps récupérée avec succès."
      );

    } catch (error) {
      console.error(
        "Erreur récupération localisation Google Maps :",
        error
      );

      setErreurLocalisation(
        error.response?.data?.detail ||
        error.message ||
        "Impossible de récupérer la localisation depuis ce lien Google Maps."
      );

      setLocalisationRecuperee(false);

    } finally {
      setChargementLocalisation(false);
    }
  }


  /* ==========================================================================
     POSITION CARTE
     ========================================================================== */

  function handlePositionCarte({
    latitude,
    longitude,
  }) {
    setFormulaire((ancien) => ({
      ...ancien,

      latitude:
        Number(latitude).toFixed(6),

      longitude:
        Number(longitude).toFixed(6),
    }));

    setErreursFormulaire((ancien) => ({
      ...ancien,

      latitude: "",
      longitude: "",
    }));

    setLocalisationRecuperee(false);
  }


  function handlePositionMarker(event) {
    const marker =
      event.target;

    const {
      lat,
      lng,
    } = marker.getLatLng();

    handlePositionCarte({
      latitude: lat,
      longitude: lng,
    });
  }


  const positionActuelle = useMemo(() => {
    const latitude =
      Number(formulaire.latitude);

    const longitude =
      Number(formulaire.longitude);

    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
    ) {
      return [
        latitude,
        longitude,
      ];
    }

    return POSITION_DAKAR;
  }, [
    formulaire.latitude,
    formulaire.longitude,
  ]);


  /* ==========================================================================
     VALIDATION
     ========================================================================== */

  function validerFormulaire() {
    const erreurs = {};

    if (
      !formulaire.titre.trim() ||
      formulaire.titre.trim().length < 2
    ) {
      erreurs.titre =
        "Le titre est obligatoire.";
    }


    if (!formulaire.date_reunion) {
      erreurs.date_reunion =
        "La date et l'heure sont obligatoires.";
    }


    if (
      !formulaire.lieu.trim() ||
      formulaire.lieu.trim().length < 2
    ) {
      erreurs.lieu =
        "Le lieu est obligatoire.";
    }


    const latitudeRemplie =
      formulaire.latitude !== "" &&
      formulaire.latitude !== null &&
      formulaire.latitude !== undefined;

    const longitudeRemplie =
      formulaire.longitude !== "" &&
      formulaire.longitude !== null &&
      formulaire.longitude !== undefined;


    if (
      latitudeRemplie !== longitudeRemplie
    ) {
      erreurs.latitude =
        "La latitude et la longitude doivent être renseignées ensemble.";

      erreurs.longitude =
        "La latitude et la longitude doivent être renseignées ensemble.";
    }


    if (latitudeRemplie) {
      const latitude =
        Number(formulaire.latitude);

      if (!Number.isFinite(latitude)) {
        erreurs.latitude =
          "La latitude doit être un nombre valide.";
      } else if (
        latitude < -90 ||
        latitude > 90
      ) {
        erreurs.latitude =
          "La latitude doit être comprise entre -90 et 90.";
      }
    }


    if (longitudeRemplie) {
      const longitude =
        Number(formulaire.longitude);

      if (!Number.isFinite(longitude)) {
        erreurs.longitude =
          "La longitude doit être un nombre valide.";
      } else if (
        longitude < -180 ||
        longitude > 180
      ) {
        erreurs.longitude =
          "La longitude doit être comprise entre -180 et 180.";
      }
    }


    setErreursFormulaire(erreurs);

    return (
      Object.keys(erreurs).length === 0
    );
  }


  /* ==========================================================================
     ENREGISTREMENT
     ========================================================================== */

  async function handleSubmit(event) {
    event.preventDefault();

    if (!validerFormulaire()) {
      return;
    }

    try {
      setEnregistrement(true);

      setErreur("");

      const donnees = {
        titre:
          formulaire.titre.trim(),

        type_reunion:
          formulaire.type_reunion,

        description:
          formulaire.description.trim() ||
          null,

        ordre_du_jour:
          formulaire.ordre_du_jour.trim() ||
          null,

        date_reunion:
          formulaire.date_reunion,

        lieu:
          formulaire.lieu.trim(),

        adresse:
          formulaire.adresse.trim() ||
          null,

        latitude:
          formulaire.latitude !== ""
            ? Number(formulaire.latitude)
            : null,

        longitude:
          formulaire.longitude !== ""
            ? Number(formulaire.longitude)
            : null,

        statut:
          formulaire.statut,

        compte_rendu:
          formulaire.compte_rendu.trim() ||
          null,
      };


      if (modeEdition) {
        await modifierReunion(
          reunionSelectionnee.id,
          donnees
        );

        setMessage(
          "Réunion modifiée avec succès."
        );
      } else {
        await creerReunion(
          donnees
        );

        setMessage(
          "Réunion créée avec succès."
        );
      }


      setModalFormulaire(false);

      setFormulaire({
        ...FORMULAIRE_INITIAL,
      });

      setErreurLocalisation("");

      setLocalisationRecuperee(false);

      await chargerReunions();

    } catch (error) {
      console.error(
        "Erreur enregistrement réunion :",
        error
      );

      setErreur(
        error.response?.data?.detail ||
        "Impossible d'enregistrer la réunion."
      );

    } finally {
      setEnregistrement(false);
    }
  }


  /* ==========================================================================
     DÉTAILS
     ========================================================================== */

  function ouvrirDetails(reunion) {
    setReunionSelectionnee(reunion);

    setModalDetails(true);
  }


  function fermerDetails() {
    setModalDetails(false);

    setReunionSelectionnee(null);
  }


  /* ==========================================================================
     STATUT
     ========================================================================== */

  async function changerStatut(
    reunion,
    statut
  ) {
    try {
      setActionId(reunion.id);

      setErreur("");

      await modifierStatutReunion(
        reunion.id,
        statut
      );

      setMessage(
        "Statut de la réunion mis à jour."
      );

      await chargerReunions();

      if (
        reunionSelectionnee?.id ===
        reunion.id
      ) {
        setReunionSelectionnee(
          (ancienne) => ({
            ...ancienne,
            statut,
          })
        );
      }

    } catch (error) {
      console.error(
        "Erreur changement statut :",
        error
      );

      setErreur(
        error.response?.data?.detail ||
        "Impossible de modifier le statut."
      );

    } finally {
      setActionId(null);
    }
  }


  async function handleAnnuler(reunion) {
    await changerStatut(
      reunion,
      "ANNULEE"
    );
  }


  /* ==========================================================================
     COMPTE RENDU
     ========================================================================== */

  function ouvrirCompteRendu(reunion) {
    setReunionSelectionnee(reunion);

    setCompteRendu(
      reunion.compte_rendu || ""
    );

    setModalCompteRendu(true);
  }


  async function enregistrerCompteRendu(
    event
  ) {
    event.preventDefault();

    if (!reunionSelectionnee) {
      return;
    }

    try {
      setEnregistrement(true);

      setErreur("");

      await modifierCompteRendu(
        reunionSelectionnee.id,
        compteRendu.trim() || null
      );

      setMessage(
        "Compte rendu enregistré avec succès."
      );

      setModalCompteRendu(false);

      await chargerReunions();

    } catch (error) {
      console.error(
        "Erreur compte rendu :",
        error
      );

      setErreur(
        error.response?.data?.detail ||
        "Impossible d'enregistrer le compte rendu."
      );

    } finally {
      setEnregistrement(false);
    }
  }


  /* ==========================================================================
     ACTIVATION / DÉSACTIVATION
     ========================================================================== */

  async function handleDesactiver(reunion) {
    try {
      setActionId(reunion.id);

      setErreur("");

      await desactiverReunion(
        reunion.id
      );

      setMessage(
        "Réunion désactivée."
      );

      await chargerReunions();

    } catch (error) {
      console.error(
        "Erreur désactivation réunion :",
        error
      );

      setErreur(
        error.response?.data?.detail ||
        "Impossible de désactiver la réunion."
      );

    } finally {
      setActionId(null);
    }
  }


  async function handleActiver(reunion) {
    try {
      setActionId(reunion.id);

      setErreur("");

      await activerReunion(
        reunion.id
      );

      setMessage(
        "Réunion activée."
      );

      await chargerReunions();

    } catch (error) {
      console.error(
        "Erreur activation réunion :",
        error
      );

      setErreur(
        error.response?.data?.detail ||
        "Impossible d'activer la réunion."
      );

    } finally {
      setActionId(null);
    }
  }


  /* ==========================================================================
     SUPPRESSION / ANNULATION
     ========================================================================== */

  async function handleSuppression(reunion) {
    const confirmation =
      window.confirm(
        `Voulez-vous vraiment désactiver la réunion "${reunion.titre}" ?`
      );

    if (!confirmation) {
      return;
    }

    await handleDesactiver(reunion);
  }


  /* ==========================================================================
     MESSAGE TEMPORAIRE
     ========================================================================== */

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer =
      setTimeout(() => {
        setMessage("");
      }, 4000);

    return () => clearTimeout(timer);
  }, [message]);


  /* ==========================================================================
     PERMISSION
     ========================================================================== */

  if (!peutConsulter) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl">

          <div className="rounded-3xl border border-red-100 bg-white p-10 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertCircle size={30} />
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              Accès refusé
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Vous n'avez pas la permission de consulter les réunions.
            </p>

          </div>

        </div>
      </div>
    );
  }


  /* ==========================================================================
     RENDER
     ========================================================================== */

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900 sm:p-6">

      <div className="mx-auto max-w-7xl">

        {/* ==================================================================
            EN-TÊTE
        ================================================================== */}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg">
                <CalendarDays size={24} />
              </div>

              <div>

                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  Réunions
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Gestion des réunions du Dahira
                </p>

              </div>

            </div>

          </div>


          {peutCreer && (
            <button
              type="button"
              onClick={ouvrirCreation}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-2xl
                bg-emerald-700
                px-5
                py-3
                text-sm
                font-bold
                text-white
                shadow-lg
                shadow-emerald-700/20
                transition-all
                hover:-translate-y-0.5
                hover:bg-emerald-800
                hover:shadow-xl
              "
            >
              <Plus size={18} />
              Nouvelle réunion
            </button>
          )}

        </div>


        {/* ==================================================================
            MESSAGES
        ================================================================== */}

        {message && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">

            <Check size={18} />

            <span>
              {message}
            </span>

            <button
              type="button"
              onClick={() => setMessage("")}
              className="ml-auto"
            >
              <X size={16} />
            </button>

          </div>
        )}


        {erreur && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span className="flex-1">
              {erreur}
            </span>

            <button
              type="button"
              onClick={() => setErreur("")}
            >
              <X size={16} />
            </button>

          </div>
        )}


        {/* ==================================================================
            FILTRES
        ================================================================== */}

        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="grid gap-3 lg:grid-cols-[1fr_200px_220px_auto_auto]">

            <form
              onSubmit={handleRecherche}
              className="relative"
            >

              <Search
                size={18}
                className="
                  pointer-events-none
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <input
                type="text"
                value={recherche}
                onChange={(event) =>
                  setRecherche(
                    event.target.value
                  )
                }
                placeholder="Rechercher une réunion..."
                className="
                  w-full
                  rounded-2xl
                  border
                  border-slate-200
                  bg-slate-50
                  py-3
                  pl-11
                  pr-4
                  text-sm
                  outline-none
                  transition
                  focus:border-emerald-400
                  focus:bg-white
                  focus:ring-4
                  focus:ring-emerald-500/10
                "
              />

            </form>


            <select
              value={filtreStatut}
              onChange={(event) =>
                setFiltreStatut(
                  event.target.value
                )
              }
              className="
                rounded-2xl
                border
                border-slate-200
                bg-slate-50
                px-4
                py-3
                text-sm
                outline-none
                focus:border-emerald-400
                focus:ring-4
                focus:ring-emerald-500/10
              "
            >

              <option value="">
                Tous les statuts
              </option>

              {STATUTS_REUNION.map(
                (statut) => (
                  <option
                    key={statut.value}
                    value={statut.value}
                  >
                    {statut.label}
                  </option>
                )
              )}

            </select>


            <select
              value={filtreType}
              onChange={(event) =>
                setFiltreType(
                  event.target.value
                )
              }
              className="
                rounded-2xl
                border
                border-slate-200
                bg-slate-50
                px-4
                py-3
                text-sm
                outline-none
                focus:border-emerald-400
                focus:ring-4
                focus:ring-emerald-500/10
              "
            >

              <option value="">
                Tous les types
              </option>

              {TYPES_REUNION.map(
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


            <button
              type="button"
              onClick={chargerReunions}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-2xl
                border
                border-slate-200
                bg-white
                px-4
                py-3
                text-sm
                font-semibold
                text-slate-700
                transition
                hover:bg-slate-50
              "
            >
              <RefreshCw size={17} />
              Actualiser
            </button>


            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600">

              <input
                type="checkbox"
                checked={inclureInactives}
                onChange={(event) =>
                  setInclureInactives(
                    event.target.checked
                  )
                }
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />

              Inactives

            </label>

          </div>


          {rechercheActive && (
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">

              Recherche :

              <span className="font-bold text-slate-700">
                "{rechercheActive}"
              </span>

              <button
                type="button"
                onClick={effacerRecherche}
                className="font-semibold text-emerald-700 hover:underline"
              >
                Effacer
              </button>

            </div>
          )}

        </div>


        {/* ==================================================================
            CHARGEMENT / LISTE
        ================================================================== */}

        {chargement ? (

          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">

            <RefreshCw
              size={32}
              className="mx-auto animate-spin text-emerald-600"
            />

            <p className="mt-4 text-sm font-medium text-slate-500">
              Chargement des réunions...
            </p>

          </div>

        ) : reunions.length === 0 ? (

          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <CalendarDays size={28} />
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-900">
              Aucune réunion
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Aucune réunion ne correspond aux critères sélectionnés.
            </p>

          </div>

        ) : (

          <div className="grid gap-5">

            {reunions.map((reunion) => {

              const coordonnees =
                obtenirCoordonnees(reunion);

              return (
                <div
                  key={reunion.id}
                  className="
                    overflow-hidden
                    rounded-3xl
                    border
                    border-slate-200
                    bg-white
                    shadow-sm
                    transition
                    hover:shadow-md
                  "
                >

                  <div className="p-5 sm:p-6">

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <span
                            className={`
                              inline-flex
                              items-center
                              rounded-full
                              border
                              px-3
                              py-1
                              text-xs
                              font-bold
                              ${obtenirClasseStatut(
                                reunion.statut
                              )}
                            `}
                          >
                            {obtenirLabelStatut(
                              reunion.statut
                            )}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {obtenirLabelType(
                              reunion.type_reunion
                            )}
                          </span>

                        </div>


                        <h2 className="mt-3 text-xl font-black text-slate-900">
                          {reunion.titre}
                        </h2>


                        <div className="mt-4 grid gap-3 sm:grid-cols-2">

                          <div className="flex items-start gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                              <CalendarDays size={17} />
                            </div>

                            <div>

                              <p className="text-xs font-medium text-slate-400">
                                Date
                              </p>

                              <p className="text-sm font-semibold text-slate-700">
                                {formaterDate(
                                  reunion.date_reunion
                                )}
                              </p>

                            </div>

                          </div>


                          <div className="flex items-start gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                              <Clock size={17} />
                            </div>

                            <div>

                              <p className="text-xs font-medium text-slate-400">
                                Heure
                              </p>

                              <p className="text-sm font-semibold text-slate-700">
                                {formaterHeure(
                                  reunion.date_reunion
                                )}
                              </p>

                            </div>

                          </div>


                          <div className="flex items-start gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                              <MapPin size={17} />
                            </div>

                            <div>

                              <p className="text-xs font-medium text-slate-400">
                                Lieu
                              </p>

                              <p className="text-sm font-semibold text-slate-700">
                                {reunion.lieu}
                              </p>

                              {reunion.adresse && (
                                <p className="mt-0.5 text-xs text-slate-500">
                                  {reunion.adresse}
                                </p>
                              )}

                            </div>

                          </div>


                          {coordonnees && (
                            <div className="flex items-start gap-3">

                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                                <Map size={17} />
                              </div>

                              <div>

                                <p className="text-xs font-medium text-slate-400">
                                  Localisation
                                </p>

                                <p className="text-sm font-semibold text-emerald-700">
                                  Coordonnées disponibles
                                </p>

                              </div>

                            </div>
                          )}

                        </div>


                        {reunion.description && (
                          <p className="mt-5 line-clamp-2 max-w-3xl text-sm leading-6 text-slate-500">
                            {reunion.description}
                          </p>
                        )}

                      </div>


                      <div className="flex flex-wrap items-center gap-2 lg:w-[250px] lg:justify-end">

                        <button
                          type="button"
                          onClick={() =>
                            ouvrirDetails(reunion)
                          }
                          className="
                            inline-flex
                            items-center
                            gap-2
                            rounded-xl
                            border
                            border-slate-200
                            bg-white
                            px-3
                            py-2.5
                            text-xs
                            font-bold
                            text-slate-700
                            transition
                            hover:bg-slate-50
                          "
                        >
                          <Eye size={16} />
                          Détails
                        </button>


                        {peutModifier && (
                          <button
                            type="button"
                            onClick={() =>
                              ouvrirEdition(reunion)
                            }
                            className="
                              inline-flex
                              items-center
                              gap-2
                              rounded-xl
                              bg-emerald-50
                              px-3
                              py-2.5
                              text-xs
                              font-bold
                              text-emerald-700
                              transition
                              hover:bg-emerald-100
                            "
                          >
                            <Pencil size={16} />
                            Modifier
                          </button>
                        )}


                        {peutModifier &&
                          reunion.statut !==
                            "ANNULEE" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleAnnuler(reunion)
                              }
                              disabled={
                                actionId ===
                                reunion.id
                              }
                              className="
                                inline-flex
                                items-center
                                gap-2
                                rounded-xl
                                bg-red-50
                                px-3
                                py-2.5
                                text-xs
                                font-bold
                                text-red-700
                                transition
                                hover:bg-red-100
                                disabled:opacity-50
                              "
                            >
                              <X size={16} />
                              Annuler
                            </button>
                          )}


                        {peutSupprimer &&
                          reunion.actif && (
                            <button
                              type="button"
                              onClick={() =>
                                handleSuppression(reunion)
                              }
                              disabled={
                                actionId ===
                                reunion.id
                              }
                              className="
                                inline-flex
                                items-center
                                gap-2
                                rounded-xl
                                bg-slate-100
                                px-3
                                py-2.5
                                text-xs
                                font-bold
                                text-slate-600
                                transition
                                hover:bg-slate-200
                                disabled:opacity-50
                              "
                            >
                              <Trash2 size={16} />
                              Désactiver
                            </button>
                          )}


                        {peutModifier &&
                          !reunion.actif && (
                            <button
                              type="button"
                              onClick={() =>
                                handleActiver(reunion)
                              }
                              disabled={
                                actionId ===
                                reunion.id
                              }
                              className="
                                inline-flex
                                items-center
                                gap-2
                                rounded-xl
                                bg-emerald-50
                                px-3
                                py-2.5
                                text-xs
                                font-bold
                                text-emerald-700
                                transition
                                hover:bg-emerald-100
                                disabled:opacity-50
                              "
                            >
                              <Check size={16} />
                              Activer
                            </button>
                          )}

                      </div>

                    </div>


                    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">

                      {coordonnees && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              ouvrirGoogleMaps(reunion)
                            }
                            className="
                              inline-flex
                              items-center
                              gap-2
                              rounded-xl
                              border
                              border-slate-200
                              bg-white
                              px-3
                              py-2
                              text-xs
                              font-bold
                              text-slate-700
                              transition
                              hover:bg-slate-50
                            "
                          >
                            <MapPin size={15} />
                            Google Maps
                          </button>


                          <button
                            type="button"
                            onClick={() =>
                              ouvrirApplePlans(reunion)
                            }
                            className="
                              inline-flex
                              items-center
                              gap-2
                              rounded-xl
                              border
                              border-slate-200
                              bg-white
                              px-3
                              py-2
                              text-xs
                              font-bold
                              text-slate-700
                              transition
                              hover:bg-slate-50
                            "
                          >
                            <Map size={15} />
                            Plans
                          </button>
                        </>
                      )}


                      {peutModifier && (
                        <button
                          type="button"
                          onClick={() =>
                            ouvrirCompteRendu(reunion)
                          }
                          className="
                            inline-flex
                            items-center
                            gap-2
                            rounded-xl
                            border
                            border-slate-200
                            bg-white
                            px-3
                            py-2
                            text-xs
                            font-bold
                            text-slate-700
                            transition
                            hover:bg-slate-50
                          "
                        >
                          <FileText size={15} />
                          Compte rendu
                        </button>
                      )}

                    </div>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>


      {/* =========================================================================
          MODAL CRÉATION / MODIFICATION
      ========================================================================= */}

      {modalFormulaire && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

          <div className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

              <div>

                <h2 className="text-xl font-black text-slate-900">
                  {modeEdition
                    ? "Modifier la réunion"
                    : "Nouvelle réunion"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Renseignez les informations de la réunion.
                </p>

              </div>


              <button
                type="button"
                onClick={fermerFormulaire}
                disabled={
                  enregistrement ||
                  chargementLocalisation
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:opacity-50"
              >
                <X size={19} />
              </button>

            </div>


            <form
              onSubmit={handleSubmit}
              className="overflow-y-auto p-6"
            >

              <div className="grid gap-5 md:grid-cols-2">

                {/* TITRE */}

                <div className="md:col-span-2">

                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Titre
                  </label>

                  <input
                    type="text"
                    name="titre"
                    value={formulaire.titre}
                    onChange={handleChange}
                    placeholder="Ex. Réunion mensuelle d'août"
                    className="
                      w-full
                      rounded-2xl
                      border
                      border-slate-200
                      px-4
                      py-3
                      text-sm
                      outline-none
                      focus:border-emerald-400
                      focus:ring-4
                      focus:ring-emerald-500/10
                    "
                  />

                  {erreursFormulaire.titre && (
                    <p className="mt-1 text-xs text-red-600">
                      {erreursFormulaire.titre}
                    </p>
                  )}

                </div>


                {/* TYPE */}

                <div>

                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Type de réunion
                  </label>

                  <select
                    name="type_reunion"
                    value={formulaire.type_reunion}
                    onChange={handleChange}
                    className="
                      w-full
                      rounded-2xl
                      border
                      border-slate-200
                      px-4
                      py-3
                      text-sm
                      outline-none
                      focus:border-emerald-400
                      focus:ring-4
                      focus:ring-emerald-500/10
                    "
                  >

                    {TYPES_REUNION.map(
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


                {/* STATUT */}

                <div>

                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Statut
                  </label>

                  <select
                    name="statut"
                    value={formulaire.statut}
                    onChange={handleChange}
                    className="
                      w-full
                      rounded-2xl
                      border
                      border-slate-200
                      px-4
                      py-3
                      text-sm
                      outline-none
                      focus:border-emerald-400
                      focus:ring-4
                      focus:ring-emerald-500/10
                    "
                  >

                    {STATUTS_REUNION.map(
                      (statut) => (
                        <option
                          key={statut.value}
                          value={statut.value}
                        >
                          {statut.label}
                        </option>
                      )
                    )}

                  </select>

                </div>


                {/* DATE */}

                <div>

                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Date et heure
                  </label>

                  <input
                    type="datetime-local"
                    name="date_reunion"
                    value={formulaire.date_reunion}
                    onChange={handleChange}
                    className="
                      w-full
                      rounded-2xl
                      border
                      border-slate-200
                      px-4
                      py-3
                      text-sm
                      outline-none
                      focus:border-emerald-400
                      focus:ring-4
                      focus:ring-emerald-500/10
                    "
                  />

                  {erreursFormulaire.date_reunion && (
                    <p className="mt-1 text-xs text-red-600">
                      {erreursFormulaire.date_reunion}
                    </p>
                  )}

                </div>


                {/* LIEU */}

                <div>

                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Lieu
                  </label>

                  <input
                    type="text"
                    name="lieu"
                    value={formulaire.lieu}
                    onChange={handleChange}
                    placeholder="Ex. Chez Dieuwrigne"
                    className="
                      w-full
                      rounded-2xl
                      border
                      border-slate-200
                      px-4
                      py-3
                      text-sm
                      outline-none
                      focus:border-emerald-400
                      focus:ring-4
                      focus:ring-emerald-500/10
                    "
                  />

                  {erreursFormulaire.lieu && (
                    <p className="mt-1 text-xs text-red-600">
                      {erreursFormulaire.lieu}
                    </p>
                  )}

                </div>


                {/* ADRESSE */}

                <div className="md:col-span-2">

                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Adresse
                  </label>

                  <input
                    type="text"
                    name="adresse"
                    value={formulaire.adresse}
                    onChange={handleChange}
                    placeholder="Ex. Castors, Dakar"
                    className="
                      w-full
                      rounded-2xl
                      border
                      border-slate-200
                      px-4
                      py-3
                      text-sm
                      outline-none
                      focus:border-emerald-400
                      focus:ring-4
                      focus:ring-emerald-500/10
                    "
                  />

                </div>


                {/* =================================================================
                    GOOGLE MAPS
                ================================================================= */}

                <div className="md:col-span-2">

                  <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">

                    <div className="flex items-start gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                        <MapPin size={19} />
                      </div>

                      <div className="min-w-0 flex-1">

                        <h3 className="text-sm font-black text-slate-800">
                          Localisation depuis Google Maps
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Vous pouvez copier directement le lien Google Maps reçu sur WhatsApp et le coller ici.
                        </p>

                      </div>

                    </div>


                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">

                      <input
                        type="url"
                        name="lien_google_maps"
                        value={
                          formulaire.lien_google_maps
                        }
                        onChange={handleChange}
                        placeholder="Collez ici le lien Google Maps..."
                        className="
                          min-w-0
                          flex-1
                          rounded-xl
                          border
                          border-slate-200
                          bg-white
                          px-4
                          py-3
                          text-sm
                          outline-none
                          focus:border-blue-400
                          focus:ring-4
                          focus:ring-blue-500/10
                        "
                      />


                      <button
                        type="button"
                        onClick={
                          handleRecupererLocalisation
                        }
                        disabled={
                          chargementLocalisation ||
                          !formulaire.lien_google_maps.trim()
                        }
                        className="
                          inline-flex
                          items-center
                          justify-center
                          gap-2
                          rounded-xl
                          bg-blue-600
                          px-4
                          py-3
                          text-sm
                          font-bold
                          text-white
                          shadow-sm
                          transition
                          hover:bg-blue-700
                          disabled:cursor-not-allowed
                          disabled:opacity-50
                        "
                      >

                        {chargementLocalisation ? (
                          <>
                            <RefreshCw
                              size={17}
                              className="animate-spin"
                            />

                            Récupération...
                          </>
                        ) : (
                          <>
                            <Navigation size={17} />

                            Récupérer
                          </>
                        )}

                      </button>

                    </div>


                    {erreurLocalisation && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">

                        <AlertCircle
                          size={16}
                          className="mt-0.5 shrink-0"
                        />

                        <span>
                          {erreurLocalisation}
                        </span>

                      </div>
                    )}


                    {localisationRecuperee && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700">

                        <Check
                          size={16}
                          className="mt-0.5 shrink-0"
                        />

                        <div>

                          <p className="font-bold">
                            Localisation récupérée avec succès.
                          </p>

                          <p className="mt-0.5">
                            La carte a été positionnée automatiquement sur l'emplacement indiqué.
                          </p>

                        </div>

                      </div>
                    )}

                  </div>

                </div>


                {/* =================================================================
                    CARTE LEAFLET
                ================================================================= */}

                <div className="md:col-span-2">

                  <div className="mb-3">

                    <h3 className="flex items-center gap-2 text-sm font-black text-slate-800">

                      <Map
                        size={17}
                        className="text-emerald-600"
                      />

                      Localisation sur la carte

                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Vous pouvez cliquer sur la carte ou déplacer le marqueur pour ajuster précisément la position.
                    </p>

                  </div>


                  <div className="overflow-hidden rounded-2xl border border-slate-200">

                    <MapContainer
                      center={positionActuelle}
                      zoom={13}
                      scrollWheelZoom
                      style={{
                        height: "320px",
                        width: "100%",
                      }}
                    >

                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />

                      <RecentrerCarte
                        position={positionActuelle}
                      />

                      <SelectionPositionCarte
                        onPositionChange={
                          handlePositionCarte
                        }
                      />


                      {formulaire.latitude !== "" &&
                        formulaire.longitude !== "" && (
                          <Marker
                            position={
                              positionActuelle
                            }
                            draggable
                            eventHandlers={{
                              dragend:
                                handlePositionMarker,
                            }}
                          />
                        )}

                    </MapContainer>

                  </div>


                  <div className="mt-3 grid gap-3 sm:grid-cols-2">

                    {/* LATITUDE */}

                    <div>

                      <label className="mb-2 block text-xs font-bold text-slate-600">
                        Latitude
                      </label>

                      <input
                        type="number"
                        step="any"
                        name="latitude"
                        value={formulaire.latitude}
                        onChange={handleChange}
                        placeholder="14.716700"
                        className="
                          w-full
                          rounded-xl
                          border
                          border-slate-200
                          bg-slate-50
                          px-3
                          py-2.5
                          text-sm
                          outline-none
                          focus:border-emerald-400
                          focus:bg-white
                        "
                      />

                      {erreursFormulaire.latitude && (
                        <p className="mt-1 text-xs text-red-600">
                          {erreursFormulaire.latitude}
                        </p>
                      )}

                    </div>


                    {/* LONGITUDE */}

                    <div>

                      <label className="mb-2 block text-xs font-bold text-slate-600">
                        Longitude
                      </label>

                      <input
                        type="number"
                        step="any"
                        name="longitude"
                        value={formulaire.longitude}
                        onChange={handleChange}
                        placeholder="-17.467700"
                        className="
                          w-full
                          rounded-xl
                          border
                          border-slate-200
                          bg-slate-50
                          px-3
                          py-2.5
                          text-sm
                          outline-none
                          focus:border-emerald-400
                          focus:bg-white
                        "
                      />

                      {erreursFormulaire.longitude && (
                        <p className="mt-1 text-xs text-red-600">
                          {erreursFormulaire.longitude}
                        </p>
                      )}

                    </div>

                  </div>


                  {formulaire.latitude !== "" &&
                    formulaire.longitude !== "" && (
                      <div className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-700">

                        <div className="flex items-center gap-2 font-bold">

                          <MapPin size={15} />

                          Position sélectionnée

                        </div>

                        <p className="mt-1">
                          {formulaire.latitude},{" "}
                          {formulaire.longitude}
                        </p>

                      </div>
                    )}

                </div>


                {/* DESCRIPTION */}

                <div className="md:col-span-2">

                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={formulaire.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Description de la réunion..."
                    className="
                      w-full
                      resize-none
                      rounded-2xl
                      border
                      border-slate-200
                      px-4
                      py-3
                      text-sm
                      outline-none
                      focus:border-emerald-400
                      focus:ring-4
                      focus:ring-emerald-500/10
                    "
                  />

                </div>


                {/* ORDRE DU JOUR */}

                <div className="md:col-span-2">

                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Ordre du jour
                  </label>

                  <textarea
                    name="ordre_du_jour"
                    value={formulaire.ordre_du_jour}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Points à traiter pendant la réunion..."
                    className="
                      w-full
                      resize-none
                      rounded-2xl
                      border
                      border-slate-200
                      px-4
                      py-3
                      text-sm
                      outline-none
                      focus:border-emerald-400
                      focus:ring-4
                      focus:ring-emerald-500/10
                    "
                  />

                </div>


                {/* COMPTE RENDU */}

                <div className="md:col-span-2">

                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Compte rendu
                  </label>

                  <textarea
                    name="compte_rendu"
                    value={formulaire.compte_rendu}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Compte rendu de la réunion..."
                    className="
                      w-full
                      resize-none
                      rounded-2xl
                      border
                      border-slate-200
                      px-4
                      py-3
                      text-sm
                      outline-none
                      focus:border-emerald-400
                      focus:ring-4
                      focus:ring-emerald-500/10
                    "
                  />

                </div>

              </div>


              {/* BOUTONS */}

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={fermerFormulaire}
                  disabled={
                    enregistrement ||
                    chargementLocalisation
                  }
                  className="
                    rounded-2xl
                    border
                    border-slate-200
                    px-5
                    py-3
                    text-sm
                    font-bold
                    text-slate-600
                    transition
                    hover:bg-slate-50
                    disabled:opacity-50
                  "
                >
                  Annuler
                </button>


                <button
                  type="submit"
                  disabled={
                    enregistrement ||
                    chargementLocalisation
                  }
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-2xl
                    bg-emerald-700
                    px-5
                    py-3
                    text-sm
                    font-bold
                    text-white
                    shadow-lg
                    shadow-emerald-700/20
                    transition
                    hover:bg-emerald-800
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
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
                      <Check size={17} />

                      {modeEdition
                        ? "Enregistrer les modifications"
                        : "Créer la réunion"}
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}


      {/* =========================================================================
          MODAL DÉTAILS
      ========================================================================= */}

      {modalDetails &&
        reunionSelectionnee && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

            <div className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

              <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">

                <div className="min-w-0 pr-4">

                  <div className="flex flex-wrap items-center gap-2">

                    <span
                      className={`
                        rounded-full
                        border
                        px-3
                        py-1
                        text-xs
                        font-bold
                        ${obtenirClasseStatut(
                          reunionSelectionnee.statut
                        )}
                      `}
                    >
                      {obtenirLabelStatut(
                        reunionSelectionnee.statut
                      )}
                    </span>


                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {obtenirLabelType(
                        reunionSelectionnee.type_reunion
                      )}
                    </span>

                  </div>


                  <h2 className="mt-3 text-xl font-black text-slate-900">
                    {reunionSelectionnee.titre}
                  </h2>

                </div>


                <button
                  type="button"
                  onClick={fermerDetails}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                >
                  <X size={19} />
                </button>

              </div>


              <div className="overflow-y-auto p-6">

                <div className="grid gap-5 md:grid-cols-2">

                  {/* DATE */}

                  <div className="rounded-2xl bg-slate-50 p-4">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                        <CalendarDays size={19} />
                      </div>

                      <div>

                        <p className="text-xs font-medium text-slate-400">
                          Date
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {formaterDate(
                            reunionSelectionnee.date_reunion
                          )}
                        </p>

                      </div>

                    </div>

                  </div>


                  {/* HEURE */}

                  <div className="rounded-2xl bg-slate-50 p-4">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                        <Clock size={19} />
                      </div>

                      <div>

                        <p className="text-xs font-medium text-slate-400">
                          Heure
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {formaterHeure(
                            reunionSelectionnee.date_reunion
                          )}
                        </p>

                      </div>

                    </div>

                  </div>


                  {/* LIEU */}

                  <div className="rounded-2xl bg-slate-50 p-4">

                    <div className="flex items-start gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                        <MapPin size={19} />
                      </div>

                      <div>

                        <p className="text-xs font-medium text-slate-400">
                          Lieu
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {reunionSelectionnee.lieu}
                        </p>

                        {reunionSelectionnee.adresse && (
                          <p className="mt-1 text-xs text-slate-500">
                            {reunionSelectionnee.adresse}
                          </p>
                        )}

                      </div>

                    </div>

                  </div>


                  {/* TYPE */}

                  <div className="rounded-2xl bg-slate-50 p-4">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                        <CalendarDays size={19} />
                      </div>

                      <div>

                        <p className="text-xs font-medium text-slate-400">
                          Type
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {obtenirLabelType(
                            reunionSelectionnee.type_reunion
                          )}
                        </p>

                      </div>

                    </div>

                  </div>


                  {/* DESCRIPTION */}

                  {reunionSelectionnee.description && (
                    <div className="md:col-span-2">

                      <h3 className="mb-2 text-sm font-black text-slate-800">
                        Description
                      </h3>

                      <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                        {reunionSelectionnee.description}
                      </div>

                    </div>
                  )}


                  {/* ORDRE DU JOUR */}

                  {reunionSelectionnee.ordre_du_jour && (
                    <div className="md:col-span-2">

                      <h3 className="mb-2 text-sm font-black text-slate-800">
                        Ordre du jour
                      </h3>

                      <div className="whitespace-pre-line rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                        {
                          reunionSelectionnee.ordre_du_jour
                        }
                      </div>

                    </div>
                  )}


                  {/* COMPTE RENDU */}

                  {reunionSelectionnee.compte_rendu && (
                    <div className="md:col-span-2">

                      <h3 className="mb-2 text-sm font-black text-slate-800">
                        Compte rendu
                      </h3>

                      <div className="whitespace-pre-line rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                        {
                          reunionSelectionnee.compte_rendu
                        }
                      </div>

                    </div>
                  )}

                </div>


                {/* LOCALISATION */}

                {obtenirCoordonnees(
                  reunionSelectionnee
                ) && (
                  <div className="mt-6">

                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                      <div>

                        <h3 className="flex items-center gap-2 text-sm font-black text-slate-800">

                          <MapPin
                            size={18}
                            className="text-emerald-600"
                          />

                          Localisation

                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          Coordonnées enregistrées pour cette réunion.
                        </p>

                      </div>


                      <div className="flex flex-wrap gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            ouvrirGoogleMaps(
                              reunionSelectionnee
                            )
                          }
                          className="
                            inline-flex
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            bg-slate-900
                            px-4
                            py-2.5
                            text-xs
                            font-bold
                            text-white
                            shadow-sm
                            transition
                            hover:bg-slate-800
                          "
                        >
                          <MapPin size={16} />
                          Ouvrir dans Google Maps
                        </button>


                        <button
                          type="button"
                          onClick={() =>
                            ouvrirApplePlans(
                              reunionSelectionnee
                            )
                          }
                          className="
                            inline-flex
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            border
                            border-slate-200
                            bg-white
                            px-4
                            py-2.5
                            text-xs
                            font-bold
                            text-slate-700
                            transition
                            hover:bg-slate-50
                          "
                        >
                          <Map size={16} />
                          Ouvrir dans Plans
                        </button>


                        <button
                          type="button"
                          onClick={() =>
                            ouvrirItineraireGoogleMaps(
                              reunionSelectionnee
                            )
                          }
                          className="
                            inline-flex
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            bg-emerald-700
                            px-4
                            py-2.5
                            text-xs
                            font-bold
                            text-white
                            shadow-sm
                            transition
                            hover:bg-emerald-800
                          "
                        >
                          <Navigation size={16} />
                          Itinéraire
                        </button>

                      </div>

                    </div>


                    <div className="overflow-hidden rounded-2xl border border-slate-200">

                      <MapContainer
                        center={[
                          Number(
                            reunionSelectionnee.latitude
                          ),
                          Number(
                            reunionSelectionnee.longitude
                          ),
                        ]}
                        zoom={16}
                        scrollWheelZoom
                        style={{
                          height: "320px",
                          width: "100%",
                        }}
                      >

                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <Marker
                          position={[
                            Number(
                              reunionSelectionnee.latitude
                            ),
                            Number(
                              reunionSelectionnee.longitude
                            ),
                          ]}
                        />

                      </MapContainer>

                    </div>


                    <div className="mt-3 flex flex-col gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">

                      <span className="font-medium text-slate-500">
                        Coordonnées
                      </span>

                      <span className="font-bold text-slate-700">
                        {reunionSelectionnee.latitude}
                        {" , "}
                        {reunionSelectionnee.longitude}
                      </span>

                    </div>

                  </div>
                )}


                {!obtenirCoordonnees(
                  reunionSelectionnee
                ) && (
                  <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">

                    <MapPin
                      size={28}
                      className="mx-auto text-slate-400"
                    />

                    <p className="mt-3 text-sm font-bold text-slate-600">
                      Aucune localisation enregistrée
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Ajoutez une latitude et une longitude pour pouvoir ouvrir cette réunion dans Google Maps ou Plans.
                    </p>

                  </div>
                )}

              </div>


              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row sm:justify-end">

                {peutModifier && (
                  <button
                    type="button"
                    onClick={() => {
                      const reunion =
                        reunionSelectionnee;

                      fermerDetails();

                      ouvrirEdition(
                        reunion
                      );
                    }}
                    className="
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      rounded-2xl
                      bg-emerald-700
                      px-5
                      py-3
                      text-sm
                      font-bold
                      text-white
                      transition
                      hover:bg-emerald-800
                    "
                  >
                    <Pencil size={17} />
                    Modifier
                  </button>
                )}


                <button
                  type="button"
                  onClick={fermerDetails}
                  className="
                    rounded-2xl
                    border
                    border-slate-200
                    px-5
                    py-3
                    text-sm
                    font-bold
                    text-slate-600
                    transition
                    hover:bg-slate-50
                  "
                >
                  Fermer
                </button>

              </div>

            </div>

          </div>
        )}


      {/* =========================================================================
          MODAL COMPTE RENDU
      ========================================================================= */}

      {modalCompteRendu &&
        reunionSelectionnee && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

            <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">

              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

                <div>

                  <h2 className="text-xl font-black text-slate-900">
                    Compte rendu
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {reunionSelectionnee.titre}
                  </p>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    setModalCompteRendu(false)
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"
                >
                  <X size={19} />
                </button>

              </div>


              <form
                onSubmit={
                  enregistrerCompteRendu
                }
                className="p-6"
              >

                <textarea
                  value={compteRendu}
                  onChange={(event) =>
                    setCompteRendu(
                      event.target.value
                    )
                  }
                  rows={10}
                  placeholder="Saisissez le compte rendu de la réunion..."
                  className="
                    w-full
                    resize-none
                    rounded-2xl
                    border
                    border-slate-200
                    px-4
                    py-3
                    text-sm
                    leading-6
                    outline-none
                    focus:border-emerald-400
                    focus:ring-4
                    focus:ring-emerald-500/10
                  "
                />


                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    onClick={() =>
                      setModalCompteRendu(false)
                    }
                    className="
                      rounded-2xl
                      border
                      border-slate-200
                      px-5
                      py-3
                      text-sm
                      font-bold
                      text-slate-600
                      hover:bg-slate-50
                    "
                  >
                    Annuler
                  </button>


                  <button
                    type="submit"
                    disabled={enregistrement}
                    className="
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      rounded-2xl
                      bg-emerald-700
                      px-5
                      py-3
                      text-sm
                      font-bold
                      text-white
                      hover:bg-emerald-800
                      disabled:opacity-60
                    "
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
                        <Check size={17} />
                        Enregistrer
                      </>
                    )}

                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

    </div>
  );
}
