import {
  useEffect,
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit,
  Headphones,
  Loader2,
  Music,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import api from "../api/client";
import { useAuth } from "../context/AuthContext";


// ============================================================
// URL AUDIO
// ============================================================

function getAudioUrl(fichier) {
  if (!fichier) {
    return "";
  }

  if (
    fichier.startsWith("http://") ||
    fichier.startsWith("https://")
  ) {
    return fichier;
  }

  const baseURL = api.defaults.baseURL;

  const chemin = fichier
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");

  return `${baseURL.replace(/\/+$/, "")}/${chemin}`;
}


// ============================================================
// COMPOSANT
// ============================================================

export default function Khassidas() {
  const { aPermission } = useAuth();

  // ==========================================================
  // ETATS KHASSIDAS
  // ==========================================================

  const [khassidas, setKhassidas] = useState([]);

  const [chargement, setChargement] = useState(true);

  const [erreur, setErreur] = useState("");

  const [message, setMessage] = useState("");

  const [khassidaOuverte, setKhassidaOuverte] =
    useState(null);


  // ==========================================================
  // FORMULAIRE KHASSIDA
  // ==========================================================

  const [modalKhassida, setModalKhassida] =
    useState(false);

  const [modeKhassida, setModeKhassida] =
    useState("creation");

  const [khassidaSelectionnee, setKhassidaSelectionnee] =
    useState(null);

  const [formKhassida, setFormKhassida] = useState({
    titre: "",
    auteur: "",
    description: "",
  });

  const [chargementKhassida, setChargementKhassida] =
    useState(false);


  // ==========================================================
  // FORMULAIRE AUDIO
  // ==========================================================

  const [modalAudio, setModalAudio] =
    useState(false);

  const [modeAudio, setModeAudio] =
    useState("creation");

  const [audioSelectionne, setAudioSelectionne] =
    useState(null);

  const [khassidaAudio, setKhassidaAudio] =
    useState(null);

  const [tons, setTons] = useState([]);

  const [chargementTons, setChargementTons] =
    useState(false);

  const [formAudio, setFormAudio] = useState({
    ton_id: "",
    titre: "",
    description: "",
    fichier: null,
  });

  const [chargementAudio, setChargementAudio] =
    useState(false);


  // ==========================================================
  // PERMISSIONS
  // ==========================================================

  const peutCreer =
    aPermission("KOUREL_CREER");

  const peutModifier =
    aPermission("KOUREL_MODIFIER");

  const peutSupprimer =
    aPermission("KOUREL_SUPPRIMER");

  const peutGererProgramme =
    aPermission("PROGRAMME_GERER");


  // ==========================================================
  // MESSAGE TEMPORAIRE
  // ==========================================================

  function afficherMessage(texte) {
    setMessage(texte);

    setTimeout(() => {
      setMessage("");
    }, 4000);
  }


  // ==========================================================
  // CHARGER LES KHASSIDAS
  // ==========================================================

  async function chargerKhassidas() {
    setChargement(true);
    setErreur("");

    try {
      const response =
        await api.get("/khassidas");

      console.log(
        "KHASSIDAS REÇUES :",
        response.data
      );

      setKhassidas(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error) {
      console.error(
        "ERREUR CHARGEMENT KHASSIDAS :",
        error
      );

      setErreur(
        error.response?.data?.detail ||
        "Impossible de charger les Khassidas."
      );
    } finally {
      setChargement(false);
    }
  }


  // ==========================================================
  // CHARGEMENT INITIAL
  // ==========================================================

  useEffect(() => {
    chargerKhassidas();
  }, []);


  // ==========================================================
  // OUVRIR / FERMER KHASSIDA
  // ==========================================================

  function toggleKhassida(id) {
    setKhassidaOuverte(
      (ancienne) =>
        ancienne === id
          ? null
          : id
    );
  }


  // ==========================================================
  // FORMULAIRE KHASSIDA
  // ==========================================================

  function ouvrirCreationKhassida() {
    setModeKhassida("creation");

    setKhassidaSelectionnee(null);

    setFormKhassida({
      titre: "",
      auteur: "",
      description: "",
    });

    setErreur("");

    setModalKhassida(true);
  }


  function ouvrirModificationKhassida(khassida) {
    setModeKhassida("modification");

    setKhassidaSelectionnee(khassida);

    setFormKhassida({
      titre: khassida.titre || "",
      auteur: khassida.auteur || "",
      description: khassida.description || "",
    });

    setErreur("");

    setModalKhassida(true);
  }


  function fermerModalKhassida() {
    if (chargementKhassida) {
      return;
    }

    setModalKhassida(false);

    setKhassidaSelectionnee(null);
  }


  function modifierChampKhassida(e) {
    const { name, value } = e.target;

    setFormKhassida((ancien) => ({
      ...ancien,
      [name]: value,
    }));
  }


  // ==========================================================
  // CREER / MODIFIER KHASSIDA
  // ==========================================================

  async function enregistrerKhassida(e) {
    e.preventDefault();

    setErreur("");

    const titre =
      formKhassida.titre.trim();

    if (!titre) {
      setErreur(
        "Le titre de la Khassida est obligatoire."
      );

      return;
    }

    setChargementKhassida(true);

    try {
      const donnees = {
        titre,
        auteur:
          formKhassida.auteur.trim() || null,
        description:
          formKhassida.description.trim() || null,
      };

      if (modeKhassida === "creation") {
        await api.post(
          "/khassidas",
          donnees
        );

        afficherMessage(
          "Khassida ajoutée avec succès."
        );
      } else {
        await api.put(
          `/khassidas/${khassidaSelectionnee.id}`,
          donnees
        );

        afficherMessage(
          "Khassida modifiée avec succès."
        );
      }

      fermerModalKhassida();

      await chargerKhassidas();
    } catch (error) {
      console.error(
        "ERREUR KHASSIDA :",
        error
      );

      setErreur(
        error.response?.data?.detail ||
        "Une erreur est survenue."
      );
    } finally {
      setChargementKhassida(false);
    }
  }


  // ==========================================================
  // SUPPRIMER KHASSIDA
  // ==========================================================

  async function supprimerKhassida(khassida) {
    const confirmation = window.confirm(
      `Voulez-vous vraiment supprimer la Khassida "${khassida.titre}" ?`
    );

    if (!confirmation) {
      return;
    }

    setErreur("");

    try {
      await api.delete(
        `/khassidas/${khassida.id}`
      );

      if (
        khassidaOuverte ===
        khassida.id
      ) {
        setKhassidaOuverte(null);
      }

      afficherMessage(
        "Khassida supprimée avec succès."
      );

      await chargerKhassidas();
    } catch (error) {
      console.error(
        "ERREUR SUPPRESSION KHASSIDA :",
        error
      );

      setErreur(
        error.response?.data?.detail ||
        "Impossible de supprimer la Khassida."
      );
    }
  }


  // ==========================================================
  // CHARGER LES TONS
  // ==========================================================
  //
  // CORRECTION :
  // Les tons sont maintenant chargés directement depuis
  // GET /tons.
  //
  // Swagger confirme que cette route retourne les 13 tons
  // actifs de la base de données.
  //
  // ==========================================================

  async function chargerTons() {
    setChargementTons(true);

    try {
      const response =
        await api.get("/tons");

      console.log(
        "TONS REÇUS :",
        response.data
      );

      console.log(
        "NOMBRE DE TONS :",
        Array.isArray(response.data)
          ? response.data.length
          : 0
      );

      setTons(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error) {
      console.error(
        "ERREUR CHARGEMENT TONS :",
        error
      );

      setTons([]);

      setErreur(
        error.response?.data?.detail ||
        "Impossible de charger les tons."
      );
    } finally {
      setChargementTons(false);
    }
  }


  // ==========================================================
  // OUVRIR AJOUT AUDIO
  // ==========================================================

  async function ouvrirAjoutAudio(khassida) {
    setModeAudio("creation");

    setAudioSelectionne(null);

    setKhassidaAudio(khassida);

    setFormAudio({
      ton_id: "",
      titre: "",
      description: "",
      fichier: null,
    });

    setTons([]);

    setErreur("");

    setModalAudio(true);

    await chargerTons();
  }


  // ==========================================================
  // OUVRIR MODIFICATION AUDIO
  // ==========================================================

  async function ouvrirModificationAudio(
    khassida,
    audio
  ) {
    setModeAudio("modification");

    setAudioSelectionne(audio);

    setKhassidaAudio(khassida);

    setFormAudio({
      ton_id:
        audio.ton?.id ||
        audio.ton_id ||
        "",
      titre:
        audio.titre || "",
      description:
        audio.description || "",
      fichier: null,
    });

    setTons([]);

    setErreur("");

    setModalAudio(true);

    await chargerTons();
  }


  // ==========================================================
  // FERMER MODAL AUDIO
  // ==========================================================

  function fermerModalAudio() {
    if (chargementAudio) {
      return;
    }

    setModalAudio(false);

    setAudioSelectionne(null);

    setKhassidaAudio(null);

    setTons([]);

    setFormAudio({
      ton_id: "",
      titre: "",
      description: "",
      fichier: null,
    });
  }


  // ==========================================================
  // MODIFICATION CHAMP AUDIO
  // ==========================================================

  function modifierChampAudio(e) {
    const { name, value } = e.target;

    setFormAudio((ancien) => ({
      ...ancien,
      [name]: value,
    }));
  }


  // ==========================================================
  // FICHIER AUDIO
  // ==========================================================

  function selectionnerFichier(e) {
    const fichier =
      e.target.files?.[0] || null;

    setFormAudio((ancien) => ({
      ...ancien,
      fichier,
    }));
  }


  // ==========================================================
  // CREER / MODIFIER AUDIO
  // ==========================================================

  async function enregistrerAudio(e) {
    e.preventDefault();

    setErreur("");

    if (!khassidaAudio) {
      setErreur(
        "La Khassida est obligatoire."
      );

      return;
    }

    if (!formAudio.ton_id) {
      setErreur(
        "Veuillez sélectionner un ton."
      );

      return;
    }

    if (!formAudio.titre.trim()) {
      setErreur(
        "Le titre de l'audio est obligatoire."
      );

      return;
    }

    if (
      modeAudio === "creation" &&
      !formAudio.fichier
    ) {
      setErreur(
        "Veuillez sélectionner un fichier audio."
      );

      return;
    }

    setChargementAudio(true);

    try {
      // ======================================================
      // CREATION
      // ======================================================

      if (modeAudio === "creation") {
        const formData = new FormData();

        formData.append(
          "khassida_id",
          khassidaAudio.id
        );

        formData.append(
          "ton_id",
          formAudio.ton_id
        );

        formData.append(
          "titre",
          formAudio.titre.trim()
        );

        if (
          formAudio.description.trim()
        ) {
          formData.append(
            "description",
            formAudio.description.trim()
          );
        }

        formData.append(
          "fichier",
          formAudio.fichier
        );

        await api.post(
          "/audios/",
          formData
        );

        afficherMessage(
          "Audio ajouté avec succès."
        );
      }

      // ======================================================
      // MODIFICATION
      // ======================================================

      else {
        if (
          !audioSelectionne?.id
        ) {
          throw new Error(
            "Audio introuvable."
          );
        }

        const formData = new FormData();

        formData.append(
          "khassida_id",
          khassidaAudio.id
        );

        formData.append(
          "ton_id",
          formAudio.ton_id
        );

        formData.append(
          "titre",
          formAudio.titre.trim()
        );

        if (
          formAudio.description.trim()
        ) {
          formData.append(
            "description",
            formAudio.description.trim()
          );
        }

        if (formAudio.fichier) {
          formData.append(
            "fichier",
            formAudio.fichier
          );
        }

        await api.put(
          `/audios/${audioSelectionne.id}`,
          formData
        );

        afficherMessage(
          "Audio modifié avec succès."
        );
      }

      fermerModalAudio();

      await chargerKhassidas();
    } catch (error) {
      console.error(
        "ERREUR AUDIO :",
        error
      );

      setErreur(
        error.response?.data?.detail ||
        error.message ||
        "Impossible d'enregistrer l'audio."
      );
    } finally {
      setChargementAudio(false);
    }
  }


  // ==========================================================
  // SUPPRIMER AUDIO
  // ==========================================================

  async function supprimerAudio(
    audio
  ) {
    const confirmation =
      window.confirm(
        `Voulez-vous vraiment supprimer l'audio "${audio.titre}" ?`
      );

    if (!confirmation) {
      return;
    }

    setErreur("");

    try {
      await api.delete(
        `/audios/${audio.id}`
      );

      afficherMessage(
        "Audio supprimé avec succès."
      );

      await chargerKhassidas();
    } catch (error) {
      console.error(
        "ERREUR SUPPRESSION AUDIO :",
        error
      );

      setErreur(
        error.response?.data?.detail ||
        "Impossible de supprimer l'audio."
      );
    }
  }


  // ==========================================================
  // CHARGEMENT
  // ==========================================================

  if (chargement) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-700" />

              <p className="mt-4 text-sm text-slate-500">
                Chargement des Khassidas...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }


  // ==========================================================
  // INTERFACE
  // ==========================================================

  return (
    <div className="min-h-screen bg-slate-50 p-6">

      <div className="mx-auto max-w-6xl">

        {/* ====================================================
            MESSAGE SUCCÈS
        ==================================================== */}

        {message && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            <CheckCircle2 className="h-5 w-5 shrink-0" />

            <p className="text-sm font-medium">
              {message}
            </p>
          </div>
        )}


        {/* ====================================================
            ERREUR
        ==================================================== */}

        {erreur && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">

            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="flex-1">
              <p className="text-sm font-medium">
                {erreur}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setErreur("")
              }
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-5 w-5" />
            </button>

          </div>
        )}


        {/* ====================================================
            EN-TÊTE
        ==================================================== */}

        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Music className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Khassidas
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Gestion des Khassidas, tons et audios.
              </p>
            </div>

          </div>


          {peutCreer && (
            <button
              type="button"
              onClick={
                ouvrirCreationKhassida
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
            >
              <Plus className="h-5 w-5" />

              Ajouter une Khassida
            </button>
          )}

        </div>


        {/* ====================================================
            AUCUNE KHASSIDA
        ==================================================== */}

        {khassidas.length === 0 ? (

          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">

            <Music className="mx-auto h-12 w-12 text-slate-300" />

            <h2 className="mt-4 font-semibold text-slate-700">
              Aucune Khassida
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Aucune Khassida disponible pour le moment.
            </p>

            {peutCreer && (
              <button
                type="button"
                onClick={
                  ouvrirCreationKhassida
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                <Plus className="h-4 w-4" />

                Ajouter une Khassida
              </button>
            )}

          </div>

        ) : (

          <div className="space-y-4">

            {khassidas.map(
              (khassida) => {

                const audios =
                  Array.isArray(
                    khassida.audios
                  )
                    ? khassida.audios.filter(
                        (audio) =>
                          audio.actif !== false
                      )
                    : [];

                const ouverte =
                  khassidaOuverte ===
                  khassida.id;

                return (

                  <div
                    key={khassida.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >

                    {/* ==========================================
                        EN-TÊTE KHASSIDA
                    ========================================== */}

                    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">

                      <button
                        type="button"
                        onClick={() =>
                          toggleKhassida(
                            khassida.id
                          )
                        }
                        className="flex min-w-0 flex-1 items-center gap-4 text-left"
                      >

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                          <Music className="h-6 w-6" />
                        </div>

                        <div className="min-w-0">

                          <h2 className="truncate text-lg font-semibold text-slate-900">
                            {khassida.titre}
                          </h2>

                          {khassida.auteur && (
                            <p className="mt-1 text-sm text-slate-500">
                              Auteur :{" "}
                              {khassida.auteur}
                            </p>
                          )}

                          {khassida.description && (
                            <p className="mt-1 text-sm text-slate-500">
                              {khassida.description}
                            </p>
                          )}

                        </div>

                      </button>


                      {/* ========================================
                          ACTIONS
                      ======================================== */}

                      <div className="flex flex-wrap items-center gap-2">

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          {audios.length}{" "}
                          {audios.length > 1
                            ? "audios"
                            : "audio"}
                        </span>


                        {peutModifier && (
                          <button
                            type="button"
                            onClick={() =>
                              ouvrirModificationKhassida(
                                khassida
                              )
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-emerald-700"
                            title="Modifier la Khassida"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}


                        {peutSupprimer && (
                          <button
                            type="button"
                            onClick={() =>
                              supprimerKhassida(
                                khassida
                              )
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                            title="Supprimer la Khassida"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}


                        <button
                          type="button"
                          onClick={() =>
                            toggleKhassida(
                              khassida.id
                            )
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
                        >
                          {ouverte ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </button>

                      </div>

                    </div>


                    {/* ==========================================
                        CONTENU
                    ========================================== */}

                    {ouverte && (

                      <div className="border-t border-slate-200 bg-slate-50 p-5">

                        {/* ======================================
                            BOUTON AJOUT AUDIO
                        ====================================== */}

                        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

                          <div>
                            <h3 className="font-semibold text-slate-800">
                              Audios
                            </h3>

                            <p className="text-sm text-slate-500">
                              Les différents tons et fichiers audio de cette Khassida.
                            </p>
                          </div>


                          {peutGererProgramme && (
                            <button
                              type="button"
                              onClick={() =>
                                ouvrirAjoutAudio(
                                  khassida
                                )
                              }
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
                            >
                              <Upload className="h-4 w-4" />

                              Ajouter un audio
                            </button>
                          )}

                        </div>


                        {/* ======================================
                            AUCUN AUDIO
                        ====================================== */}

                        {audios.length === 0 ? (

                          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">

                            <Headphones className="mx-auto h-10 w-10 text-slate-300" />

                            <p className="mt-3 text-sm text-slate-500">
                              Aucun audio associé à cette Khassida.
                            </p>

                            {peutGererProgramme && (
                              <button
                                type="button"
                                onClick={() =>
                                  ouvrirAjoutAudio(
                                    khassida
                                  )
                                }
                                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                              >
                                <Plus className="h-4 w-4" />

                                Ajouter le premier audio
                              </button>
                            )}

                          </div>

                        ) : (

                          <div className="space-y-4">

                            {audios.map(
                              (audio, index) => {

                                const ton =
                                  audio.ton;

                                return (

                                  <div
                                    key={audio.id}
                                    className="rounded-xl border border-slate-200 bg-white p-5"
                                  >

                                    <div className="flex flex-col gap-4">

                                      {/* ====================
                                          INFORMATIONS
                                      ==================== */}

                                      <div className="flex items-start gap-3">

                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                          <Headphones className="h-5 w-5" />
                                        </div>


                                        <div className="min-w-0 flex-1">

                                          <div className="flex flex-wrap items-center gap-2">

                                            <h4 className="font-semibold text-slate-900">
                                              {audio.titre ||
                                                `Audio ${index + 1}`}
                                            </h4>


                                            {ton && (
                                              <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                                                Ton :{" "}
                                                {ton.nom}
                                              </span>
                                            )}

                                          </div>


                                          {audio.description && (
                                            <p className="mt-1 text-sm text-slate-500">
                                              {audio.description}
                                            </p>
                                          )}

                                        </div>


                                        {/* ====================
                                            ACTIONS AUDIO
                                        ==================== */}

                                        {peutGererProgramme && (
                                          <div className="flex shrink-0 items-center gap-1">

                                            <button
                                              type="button"
                                              onClick={() =>
                                                ouvrirModificationAudio(
                                                  khassida,
                                                  audio
                                                )
                                              }
                                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-emerald-700"
                                              title="Modifier l'audio"
                                            >
                                              <Pencil className="h-4 w-4" />
                                            </button>


                                            <button
                                              type="button"
                                              onClick={() =>
                                                supprimerAudio(
                                                  audio
                                                )
                                              }
                                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                                              title="Supprimer l'audio"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </button>

                                          </div>
                                        )}

                                      </div>


                                      {/* ====================
                                          LECTEUR
                                      ==================== */}

                                      <div className="rounded-xl bg-slate-50 p-3">

                                        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">

                                          <Headphones className="h-4 w-4" />

                                          Écouter l'audio

                                        </div>


                                        <audio
                                          controls
                                          preload="metadata"
                                          className="w-full"
                                          src={getAudioUrl(
                                            audio.fichier
                                          )}
                                        >
                                          Votre navigateur ne supporte pas la lecture audio.
                                        </audio>

                                      </div>

                                    </div>

                                  </div>

                                );
                              }
                            )}

                          </div>

                        )}

                      </div>

                    )}

                  </div>
                );
              }
            )}

          </div>
        )}

      </div>


      {/* ========================================================
          MODAL KHASSIDA
      ======================================================== */}

      {modalKhassida && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-slate-200 p-5">

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {modeKhassida === "creation"
                    ? "Ajouter une Khassida"
                    : "Modifier la Khassida"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Renseignez les informations de la Khassida.
                </p>
              </div>


              <button
                type="button"
                onClick={
                  fermerModalKhassida
                }
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>

            </div>


            <form
              onSubmit={
                enregistrerKhassida
              }
              className="space-y-5 p-5"
            >

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Titre *
                </label>

                <input
                  type="text"
                  name="titre"
                  value={
                    formKhassida.titre
                  }
                  onChange={
                    modifierChampKhassida
                  }
                  placeholder="Ex : Al Bourda"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  required
                />

              </div>


              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Auteur
                </label>

                <input
                  type="text"
                  name="auteur"
                  value={
                    formKhassida.auteur
                  }
                  onChange={
                    modifierChampKhassida
                  }
                  placeholder="Nom de l'auteur"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />

              </div>


              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    formKhassida.description
                  }
                  onChange={
                    modifierChampKhassida
                  }
                  rows={4}
                  placeholder="Description..."
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />

              </div>


              {erreur && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {erreur}
                </div>
              )}


              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">

                <button
                  type="button"
                  onClick={
                    fermerModalKhassida
                  }
                  disabled={
                    chargementKhassida
                  }
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>


                <button
                  type="submit"
                  disabled={
                    chargementKhassida
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {chargementKhassida ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}

                  {modeKhassida === "creation"
                    ? "Ajouter"
                    : "Enregistrer"}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}


      {/* ========================================================
          MODAL AUDIO
      ======================================================== */}

      {modalAudio && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-slate-200 p-5">

              <div>

                <h2 className="text-lg font-bold text-slate-900">

                  {modeAudio === "creation"
                    ? "Ajouter un audio"
                    : "Modifier l'audio"}

                </h2>

                <p className="mt-1 text-sm text-slate-500">

                  {khassidaAudio?.titre}

                </p>

              </div>


              <button
                type="button"
                onClick={
                  fermerModalAudio
                }
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>

            </div>


            <form
              onSubmit={
                enregistrerAudio
              }
              className="space-y-5 p-5"
            >

              {/* ==============================================
                  TON
              ============================================== */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Ton *
                </label>

                {chargementTons ? (

                  <div className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-500">

                    <Loader2 className="h-4 w-4 animate-spin" />

                    Chargement des tons...

                  </div>

                ) : (

                  <select
                    name="ton_id"
                    value={
                      formAudio.ton_id
                    }
                    onChange={
                      modifierChampAudio
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    required
                  >

                    <option value="">
                      Sélectionner un ton
                    </option>

                    {tons.map(
                      (ton) => (
                        <option
                          key={ton.id}
                          value={ton.id}
                        >
                          {ton.nom}
                        </option>
                      )
                    )}

                  </select>

                )}

                {!chargementTons &&
                  tons.length === 0 && (
                    <p className="mt-2 text-xs text-amber-600">
                      Aucun ton disponible. Vérifiez que des tons actifs existent dans la base de données.
                    </p>
                  )}

              </div>


              {/* ==============================================
                  TITRE
              ============================================== */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Titre de l'audio *
                </label>

                <input
                  type="text"
                  name="titre"
                  value={
                    formAudio.titre
                  }
                  onChange={
                    modifierChampAudio
                  }
                  placeholder="Ex : Ton Baye Fall"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  required
                />

              </div>


              {/* ==============================================
                  DESCRIPTION
              ============================================== */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    formAudio.description
                  }
                  onChange={
                    modifierChampAudio
                  }
                  rows={3}
                  placeholder="Description de l'audio..."
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />

              </div>


              {/* ==============================================
                  FICHIER
              ============================================== */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">

                  {modeAudio === "creation"
                    ? "Fichier audio *"
                    : "Nouveau fichier audio"}

                </label>

                <input
                  type="file"
                  accept=".mp3,.wav,.m4a,.ogg,audio/mpeg,audio/wav,audio/mp4,audio/ogg"
                  onChange={
                    selectionnerFichier
                  }
                  className="block w-full cursor-pointer rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-600"
                  required={
                    modeAudio ===
                    "creation"
                  }
                />

                <p className="mt-2 text-xs text-slate-500">
                  Formats acceptés : MP3, WAV, M4A et OGG.
                </p>

              </div>


              {/* ==============================================
                  APERÇU AUDIO EXISTANT
              ============================================== */}

              {modeAudio ===
                "modification" &&
                audioSelectionne?.fichier && (

                  <div className="rounded-xl bg-slate-50 p-4">

                    <p className="mb-2 text-xs font-medium text-slate-500">
                      Audio actuel
                    </p>

                    <audio
                      controls
                      preload="metadata"
                      className="w-full"
                      src={getAudioUrl(
                        audioSelectionne.fichier
                      )}
                    />

                  </div>

                )}


              {erreur && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {erreur}
                </div>
              )}


              {/* ==============================================
                  BOUTONS
              ============================================== */}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">

                <button
                  type="button"
                  onClick={
                    fermerModalAudio
                  }
                  disabled={
                    chargementAudio
                  }
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>


                <button
                  type="submit"
                  disabled={
                    chargementAudio ||
                    chargementTons
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {chargementAudio ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : modeAudio ===
                    "creation" ? (
                    <Upload className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}

                  {modeAudio ===
                  "creation"
                    ? "Ajouter l'audio"
                    : "Enregistrer"}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}