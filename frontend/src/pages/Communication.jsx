import { useEffect, useMemo, useRef, useState } from "react";

import {
  AlertCircle,
  Ban,
  Bell,
  Calendar,
  CalendarClock,
  CheckCircle,
  ChevronDown,
  Clock3,
  Edit,
  FileAudio,
  FileText,
  Filter,
  Info,
  Megaphone,
  Mic,
  MicOff,
  MessageSquare,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  Square,
  Trash2,
  Upload,
  Volume2,
  X,
  XCircle,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import {
  getCommunications,
  creerCommunication,
  modifierCommunication,
  modifierStatutCommunication,
  annulerCommunication,
  supprimerCommunication,
  televerserAudioCommunication,
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

const STATUTS_COMMUNICATION = [
  {
    value: "BROUILLON",
    label: "Brouillon",
  },
  {
    value: "PROGRAMMEE",
    label: "Programmée",
  },
  {
    value: "PUBLIEE",
    label: "Publiée",
  },
  {
    value: "EXPIREE",
    label: "Expirée",
  },
  {
    value: "ANNULEE",
    label: "Annulée",
  },
];

const FORMULAIRE_INITIAL = {
  titre: "",
  contenu: "",
  audio_url: null,
  type_communication: "ANNONCE",
  priorite: "NORMALE",
  mode_publication: "IMMEDIATE",
  date_publication: "",
  date_expiration: "",
  actif: true,
  statut: "PUBLIEE",
};


// ============================================================
// UTILITAIRES
// ============================================================

function formaterDate(date) {
  if (!date) {
    return "—";
  }

  const valeur = new Date(date);

  if (Number.isNaN(valeur.getTime())) {
    return "—";
  }

  return valeur.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}


function formaterDateCourte(date) {
  if (!date) {
    return "—";
  }

  const valeur = new Date(date);

  if (Number.isNaN(valeur.getTime())) {
    return "—";
  }

  return valeur.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}


function formaterDatePourInput(date) {
  if (!date) {
    return "";
  }

  const valeur = new Date(date);

  if (Number.isNaN(valeur.getTime())) {
    return "";
  }

  const annee = valeur.getFullYear();
  const mois = String(valeur.getMonth() + 1).padStart(2, "0");
  const jour = String(valeur.getDate()).padStart(2, "0");
  const heures = String(valeur.getHours()).padStart(2, "0");
  const minutes = String(valeur.getMinutes()).padStart(2, "0");

  return `${annee}-${mois}-${jour}T${heures}:${minutes}`;
}


function obtenirLabelType(type) {
  const resultat = TYPES_COMMUNICATION.find(
    (item) => item.value === type
  );

  return resultat?.label || type || "Autre";
}


function obtenirLabelPriorite(priorite) {
  const resultat = PRIORITES_COMMUNICATION.find(
    (item) => item.value === priorite
  );

  return resultat?.label || priorite || "Normale";
}


function obtenirLabelStatut(statut) {
  const resultat = STATUTS_COMMUNICATION.find(
    (item) => item.value === statut
  );

  return resultat?.label || statut || "Inconnu";
}


function obtenirClassesPriorite(priorite) {
  switch (priorite) {
    case "URGENTE":
      return "bg-red-50 text-red-700 border-red-100";

    case "IMPORTANTE":
      return "bg-amber-50 text-amber-700 border-amber-100";

    default:
      return "bg-slate-50 text-slate-600 border-slate-100";
  }
}


function obtenirClassesType(type) {
  switch (type) {
    case "URGENT":
      return "bg-red-50 text-red-700 border-red-100";

    case "REUNION":
      return "bg-blue-50 text-blue-700 border-blue-100";

    case "PROGRAMME_RELIGIEUX":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";

    case "KOUREL":
      return "bg-violet-50 text-violet-700 border-violet-100";

    case "RAPPEL":
      return "bg-amber-50 text-amber-700 border-amber-100";

    default:
      return "bg-slate-50 text-slate-600 border-slate-100";
  }
}


function obtenirClassesStatut(statut) {
  switch (statut) {
    case "BROUILLON":
      return "bg-slate-100 text-slate-700 border-slate-200";

    case "PROGRAMMEE":
      return "bg-blue-50 text-blue-700 border-blue-100";

    case "PUBLIEE":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";

    case "EXPIREE":
      return "bg-amber-50 text-amber-700 border-amber-100";

    case "ANNULEE":
      return "bg-red-50 text-red-700 border-red-100";

    default:
      return "bg-slate-50 text-slate-600 border-slate-100";
  }
}


function obtenirIconeStatut(statut) {
  switch (statut) {
    case "BROUILLON":
      return FileText;

    case "PROGRAMMEE":
      return CalendarClock;

    case "PUBLIEE":
      return CheckCircle;

    case "EXPIREE":
      return Clock3;

    case "ANNULEE":
      return Ban;

    default:
      return Info;
  }
}


function extraireMessageErreur(error) {
  if (
    error?.response?.status === 422 &&
    Array.isArray(error?.response?.data?.detail)
  ) {
    return error.response.data.detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        return item?.msg || "Donnée invalide.";
      })
      .join(" ");
  }

  if (
    typeof error?.response?.data?.detail === "string"
  ) {
    return error.response.data.detail;
  }

  if (
    typeof error?.response?.data?.message === "string"
  ) {
    return error.response.data.message;
  }

  return error?.message || "Une erreur est survenue.";
}


function obtenirFormatAudio() {
  if (
    typeof MediaRecorder === "undefined"
  ) {
    return null;
  }

  const formats = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/mp4",
  ];

  return (
    formats.find((format) =>
      MediaRecorder.isTypeSupported(format)
    ) || ""
  );
}


// ============================================================
// CARTE STATISTIQUE
// ============================================================

function StatistiqueCarte({
  label,
  valeur,
  icone: Icone,
  couleur = "slate",
}) {
  const couleurs = {
    slate: {
      fond: "bg-slate-50",
      icone: "text-slate-600",
    },

    emerald: {
      fond: "bg-emerald-50",
      icone: "text-emerald-600",
    },

    blue: {
      fond: "bg-blue-50",
      icone: "text-blue-600",
    },

    amber: {
      fond: "bg-amber-50",
      icone: "text-amber-600",
    },

    rose: {
      fond: "bg-rose-50",
      icone: "text-rose-600",
    },
  };

  const theme =
    couleurs[couleur] || couleurs.slate;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
            {label}
          </p>

          <p className="mt-1 text-2xl font-black text-slate-900">
            {valeur}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${theme.fond} ${theme.icone}`}
        >
          <Icone size={19} />
        </div>
      </div>
    </div>
  );
}


// ============================================================
// COMPOSANT LECTEUR AUDIO
// ============================================================

function LecteurAudio({
  audioUrl,
  compact = false,
}) {
  const audioRef = useRef(null);

  const [enLecture, setEnLecture] =
    useState(false);

  const [progression, setProgression] =
    useState(0);

  const [duree, setDuree] =
    useState(0);

  const [tempsActuel, setTempsActuel] =
    useState(0);

  function basculerLecture() {
    if (!audioRef.current) {
      return;
    }

    if (enLecture) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  }

  function handleTimeUpdate() {
    if (!audioRef.current) {
      return;
    }

    const current =
      audioRef.current.currentTime || 0;

    const duration =
      audioRef.current.duration || 0;

    setTempsActuel(current);

    setProgression(
      duration > 0
        ? (current / duration) * 100
        : 0
    );
  }

  function handleLoadedMetadata() {
    if (!audioRef.current) {
      return;
    }

    setDuree(
      audioRef.current.duration || 0
    );
  }

  function handleEnded() {
    setEnLecture(false);
    setProgression(0);
    setTempsActuel(0);

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }

  function changerPosition(event) {
    if (!audioRef.current) {
      return;
    }

    const valeur =
      Number(event.target.value);

    const duration =
      audioRef.current.duration || 0;

    audioRef.current.currentTime =
      (valeur / 100) * duration;
  }

  function formaterTemps(secondes) {
    if (!Number.isFinite(secondes)) {
      return "00:00";
    }

    const minutes = Math.floor(
      secondes / 60
    );

    const secondesRestantes = Math.floor(
      secondes % 60
    );

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(
      secondesRestantes
    ).padStart(2, "0")}`;
  }

  if (!audioUrl) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border border-emerald-100 bg-emerald-50/70 ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onPlay={() =>
          setEnLecture(true)
        }
        onPause={() =>
          setEnLecture(false)
        }
        onTimeUpdate={
          handleTimeUpdate
        }
        onLoadedMetadata={
          handleLoadedMetadata
        }
        onEnded={handleEnded}
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={basculerLecture}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white shadow-sm transition hover:bg-emerald-800"
          title={
            enLecture
              ? "Pause"
              : "Lire le message vocal"
          }
        >
          {enLecture ? (
            <Pause size={18} />
          ) : (
            <Play
              size={18}
              className="ml-0.5"
            />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Volume2
                size={16}
                className="shrink-0 text-emerald-700"
              />

              <span className="text-xs font-bold text-emerald-800">
                Message vocal
              </span>
            </div>

            <span className="text-[11px] font-semibold text-emerald-700">
              {formaterTemps(tempsActuel)}
              {" / "}
              {formaterTemps(duree)}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={progression}
            onChange={changerPosition}
            className="h-1.5 w-full cursor-pointer accent-emerald-700"
          />
        </div>
      </div>
    </div>
  );
}


// ============================================================
// COMPOSANT ENREGISTREUR VOCAL
// ============================================================

function EnregistreurVocal({
  audioUrl,
  onAudioChange,
  erreur,
  disabled = false,
}) {
  const mediaRecorderRef =
    useRef(null);

  const streamRef =
    useRef(null);

  const chunksRef =
    useRef([]);

  const audioPreviewRef =
    useRef(null);

  const [enregistrement, setEnregistrement] =
    useState(false);

  const [envoi, setEnvoi] =
    useState(false);

  const [temps, setTemps] =
    useState(0);

  const [audioLocalUrl, setAudioLocalUrl] =
    useState(null);

  const [erreurLocale, setErreurLocale] =
    useState("");

  const [messageLocal, setMessageLocal] =
    useState("");

  const timerRef =
    useRef(null);

  // ----------------------------------------------------------
  // NETTOYAGE
  // ----------------------------------------------------------

  useEffect(() => {
    return () => {
      arreterFluxMicrophone();

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (audioLocalUrl) {
        URL.revokeObjectURL(
          audioLocalUrl
        );
      }
    };
  }, [audioLocalUrl]);

  // ----------------------------------------------------------
  // ARRÊTER MICROPHONE
  // ----------------------------------------------------------

  function arreterFluxMicrophone() {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      streamRef.current = null;
    }
  }

  // ----------------------------------------------------------
  // TIMER
  // ----------------------------------------------------------

  function demarrerTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setTemps(0);

    timerRef.current =
      setInterval(() => {
        setTemps((ancien) => {
          if (ancien >= 600) {
            return ancien;
          }

          return ancien + 1;
        });
      }, 1000);
  }

  function arreterTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function formaterTemps(secondes) {
    const minutes = Math.floor(
      secondes / 60
    );

    const secondesRestantes =
      secondes % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(
      secondesRestantes
    ).padStart(2, "0")}`;
  }

  // ----------------------------------------------------------
  // DÉMARRER
  // ----------------------------------------------------------

  async function demarrerEnregistrement() {
    if (disabled || enregistrement) {
      return;
    }

    setErreurLocale("");
    setMessageLocal("");

    if (
      typeof navigator ===
        "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices
        .getUserMedia
    ) {
      setErreurLocale(
        "Votre navigateur ne permet pas l'accès au microphone."
      );

      return;
    }

    if (
      typeof MediaRecorder ===
      "undefined"
    ) {
      setErreurLocale(
        "L'enregistrement vocal n'est pas pris en charge par ce navigateur."
      );

      return;
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: true,
          }
        );

      streamRef.current = stream;

      const mimeType =
        obtenirFormatAudio();

      const options = mimeType
        ? {
            mimeType,
          }
        : undefined;

      const recorder =
        new MediaRecorder(
          stream,
          options
        );

      mediaRecorderRef.current =
        recorder;

      chunksRef.current = [];

      recorder.ondataavailable =
        (event) => {
          if (
            event.data &&
            event.data.size > 0
          ) {
            chunksRef.current.push(
              event.data
            );
          }
        };

      recorder.onerror = () => {
        setErreurLocale(
          "Une erreur est survenue pendant l'enregistrement."
        );

        arreterEnregistrement();
      };

      recorder.onstop = async () => {
        arreterTimer();
        arreterFluxMicrophone();

        const type =
          recorder.mimeType ||
          "audio/webm";

        const blob = new Blob(
          chunksRef.current,
          {
            type,
          }
        );

        if (!blob.size) {
          setErreurLocale(
            "Aucun son n'a été enregistré."
          );

          return;
        }

        const extension =
          type.includes("ogg")
            ? "ogg"
            : type.includes("mp4")
              ? "mp4"
              : type.includes("mpeg")
                ? "mp3"
                : "webm";

        const fichier =
          new File(
            [blob],
            `communication-vocal-${Date.now()}.${extension}`,
            {
              type,
            }
          );

        if (
          fichier.size >
          10 * 1024 * 1024
        ) {
          setErreurLocale(
            "Le message vocal dépasse la limite de 10 Mo."
          );

          return;
        }

        const localUrl =
          URL.createObjectURL(
            blob
          );

        setAudioLocalUrl(
          localUrl
        );

        // ----------------------------------------------------
        // UPLOAD CLOUDINARY VIA BACKEND
        // ----------------------------------------------------

        try {
          setEnvoi(true);
          setErreurLocale("");
          setMessageLocal(
            "Envoi du message vocal..."
          );

          const resultat =
            await televerserAudioCommunication(
              fichier
            );

          if (
            !resultat?.audio_url
          ) {
            throw new Error(
              "Le serveur n'a pas retourné l'URL du message vocal."
            );
          }

          onAudioChange(
            resultat.audio_url
          );

          setMessageLocal(
            "Message vocal prêt."
          );
        } catch (error) {
          console.error(
            "Erreur upload vocal :",
            error
          );

          setErreurLocale(
            extraireMessageErreur(
              error
            )
          );
        } finally {
          setEnvoi(false);
        }
      };

      recorder.start();

      setEnregistrement(true);

      demarrerTimer();
    } catch (error) {
      console.error(
        "Erreur accès microphone :",
        error
      );

      if (
        error?.name ===
        "NotAllowedError"
      ) {
        setErreurLocale(
          "L'accès au microphone a été refusé. Autorisez le microphone dans votre navigateur."
        );
      } else if (
        error?.name ===
        "NotFoundError"
      ) {
        setErreurLocale(
          "Aucun microphone n'a été détecté sur cet appareil."
        );
      } else {
        setErreurLocale(
          "Impossible d'accéder au microphone."
        );
      }

      arreterFluxMicrophone();
    }
  }

  // ----------------------------------------------------------
  // ARRÊTER
  // ----------------------------------------------------------

  function arreterEnregistrement() {
    arreterTimer();

    setEnregistrement(false);

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !==
        "inactive"
    ) {
      mediaRecorderRef.current.stop();
    } else {
      arreterFluxMicrophone();
    }
  }

  // ----------------------------------------------------------
  // SUPPRIMER VOCAL
  // ----------------------------------------------------------

  function supprimerAudio() {
    if (enregistrement) {
      arreterEnregistrement();
    }

    if (audioLocalUrl) {
      URL.revokeObjectURL(
        audioLocalUrl
      );

      setAudioLocalUrl(null);
    }

    onAudioChange(null);

    setTemps(0);

    setMessageLocal("");

    setErreurLocale("");
  }

  // ----------------------------------------------------------
  // REFAIRE
  // ----------------------------------------------------------

  function refaireEnregistrement() {
    supprimerAudio();

    setTimeout(() => {
      demarrerEnregistrement();
    }, 100);
  }

  // ----------------------------------------------------------
  // RENDU
  // ----------------------------------------------------------

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
          <Mic size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800">
                Message vocal
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Enregistrez un message vocal
                directement depuis votre
                microphone.
              </p>
            </div>

            {enregistrement && (
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
                {formaterTemps(temps)}
              </span>
            )}
          </div>

          {/* ------------------------------------------------
              ENREGISTREMENT
          ------------------------------------------------ */}

          {!enregistrement &&
            !audioUrl &&
            !audioLocalUrl && (
              <button
                type="button"
                onClick={
                  demarrerEnregistrement
                }
                disabled={
                  disabled || envoi
                }
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Mic size={17} />

                Enregistrer un vocal
              </button>
            )}

          {/* ------------------------------------------------
              ENREGISTREMENT EN COURS
          ------------------------------------------------ */}

          {enregistrement && (
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-red-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 animate-pulse items-center justify-center rounded-full bg-red-100 text-red-600">
                  <MicOff size={19} />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Enregistrement en cours
                  </p>

                  <p className="text-xs text-slate-500">
                    Parlez dans le microphone...
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  arreterEnregistrement
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700"
              >
                <Square size={15} />

                Arrêter
              </button>
            </div>
          )}

          {/* ------------------------------------------------
              UPLOAD
          ------------------------------------------------ */}

          {envoi && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <RefreshCw
                size={18}
                className="animate-spin text-blue-600"
              />

              <div>
                <p className="text-sm font-bold text-blue-900">
                  Envoi du vocal...
                </p>

                <p className="text-xs text-blue-700">
                  Le message vocal est envoyé
                  vers le serveur.
                </p>
              </div>
            </div>
          )}

          {/* ------------------------------------------------
              PREVISUALISATION LOCAL
          ------------------------------------------------ */}

          {audioLocalUrl && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                Prévisualisation
              </p>

              <audio
                ref={audioPreviewRef}
                src={audioLocalUrl}
                controls
                className="w-full"
              />
            </div>
          )}

          {/* ------------------------------------------------
              AUDIO CLOUDINARY
          ------------------------------------------------ */}

          {audioUrl &&
            !audioLocalUrl && (
              <div className="mt-4">
                <LecteurAudio
                  audioUrl={audioUrl}
                />
              </div>
            )}

          {/* ------------------------------------------------
              ACTIONS AUDIO
          ------------------------------------------------ */}

          {(audioUrl ||
            audioLocalUrl) &&
            !enregistrement && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={
                    refaireEnregistrement
                  }
                  disabled={
                    disabled || envoi
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <RotateCcw size={14} />

                  Refaire
                </button>

                <button
                  type="button"
                  onClick={
                    supprimerAudio
                  }
                  disabled={
                    disabled || envoi
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                >
                  <Trash2 size={14} />

                  Supprimer le vocal
                </button>
              </div>
            )}

          {/* ------------------------------------------------
              MESSAGE
          ------------------------------------------------ */}

          {messageLocal && (
            <p className="mt-3 text-xs font-semibold text-emerald-700">
              {messageLocal}
            </p>
          )}

          {/* ------------------------------------------------
              ERREUR
          ------------------------------------------------ */}

          {(erreurLocale || erreur) && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle
                size={15}
                className="mt-0.5 shrink-0"
              />

              <span>
                {erreurLocale || erreur}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

function Communication() {
  const { aPermission } = useAuth();

  // ==========================================================
  // PERMISSIONS
  // ==========================================================

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

  // ==========================================================
  // ETATS
  // ==========================================================

  const [communications, setCommunications] =
    useState([]);

  const [chargement, setChargement] =
    useState(true);

  const [erreur, setErreur] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [filtres, setFiltres] =
    useState({
      actif: null,
      type_communication: "",
      priorite: "",
      statut_communication: "",
    });

  const [filtresOuverts, setFiltresOuverts] =
    useState(false);

  const [modalOuverte, setModalOuverte] =
    useState(false);

  const [modeEdition, setModeEdition] =
    useState(false);

  const [
    communicationSelectionnee,
    setCommunicationSelectionnee,
  ] = useState(null);

  const [formulaire, setFormulaire] =
    useState({
      ...FORMULAIRE_INITIAL,
    });

  const [erreursFormulaire, setErreursFormulaire] =
    useState({});

  const [enregistrement, setEnregistrement] =
    useState(false);

  const [actionId, setActionId] =
    useState(null);

  const [modalSuppression, setModalSuppression] =
    useState(false);

  const [
    communicationASupprimer,
    setCommunicationASupprimer,
  ] = useState(null);

  const [
    suppressionEnCours,
    setSuppressionEnCours,
  ] = useState(false);


  // ==========================================================
  // CHARGER COMMUNICATIONS
  // ==========================================================

  async function chargerCommunications() {
    try {
      setChargement(true);
      setErreur("");

      const data =
        await getCommunications({
          actif: filtres.actif,
          type_communication:
            filtres.type_communication,
          priorite:
            filtres.priorite,
          statut_communication:
            filtres.statut_communication,
        });

      setCommunications(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Erreur chargement communications :",
        error
      );

      if (
        error?.response?.status ===
        401
      ) {
        setErreur(
          "Votre session a expiré. Veuillez vous reconnecter."
        );
      } else if (
        error?.response?.status ===
        403
      ) {
        setErreur(
          "Vous n'avez pas la permission de consulter les communications."
        );
      } else {
        setErreur(
          extraireMessageErreur(
            error
          )
        );
      }
    } finally {
      setChargement(false);
    }
  }


  // ==========================================================
  // CHARGEMENT INITIAL
  // ==========================================================

  useEffect(() => {
    if (peutConsulter) {
      chargerCommunications();
    } else {
      setChargement(false);
    }
  }, [
    peutConsulter,
    filtres.actif,
    filtres.type_communication,
    filtres.priorite,
    filtres.statut_communication,
  ]);


  // ==========================================================
  // STATISTIQUES
  // ==========================================================


  const statistiques = useMemo(() => {
    return {
      total:
        communications.length,

      publiees:
        communications.filter(
          (item) =>
            item.statut ===
            "PUBLIEE"
        ).length,

      programmees:
        communications.filter(
          (item) =>
            item.statut ===
            "PROGRAMMEE"
        ).length,

      brouillons:
        communications.filter(
          (item) =>
            item.statut ===
            "BROUILLON"
        ).length,

      expirees:
        communications.filter(
          (item) =>
            item.statut ===
            "EXPIREE"
        ).length,
    };
  }, [communications]);

  // ==========================================================
  // CHANGEMENT FORMULAIRE
  // ==========================================================

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setFormulaire(
      (ancien) => ({
        ...ancien,
        [name]: value,
      })
    );

    setErreursFormulaire(
      (ancien) => ({
        ...ancien,
        [name]: "",
      })
    );

    setErreur("");
  }


  // ==========================================================
  // CHANGEMENT AUDIO
  // ==========================================================

  function handleAudioChange(
    audioUrl
  ) {
    setFormulaire(
      (ancien) => ({
        ...ancien,
        audio_url:
          audioUrl || null,
      })
    );

    setErreursFormulaire(
      (ancien) => ({
        ...ancien,
        contenu: "",
        audio_url: "",
      })
    );

    setErreur("");
  }


  // ==========================================================
  // MODE PUBLICATION
  // ==========================================================

  function handleModePublicationChange(
    mode
  ) {
    let statut = "PUBLIEE";

    if (mode === "PROGRAMMEE") {
      statut = "PROGRAMMEE";
    }

    if (mode === "BROUILLON") {
      statut = "BROUILLON";
    }

    setFormulaire(
      (ancien) => ({
        ...ancien,

        mode_publication:
          mode,

        statut,

        actif:
          mode !== "BROUILLON",

        date_publication:
          mode === "IMMEDIATE"
            ? ""
            : ancien.date_publication,
      })
    );

    setErreursFormulaire(
      (ancien) => ({
        ...ancien,
        date_publication: "",
      })
    );

    setErreur("");
  }


  // ==========================================================
  // VALIDATION
  // ==========================================================

  function validerFormulaire() {
    const erreurs = {};

    const titre =
      String(
        formulaire.titre || ""
      ).trim();

    const contenu =
      String(
        formulaire.contenu || ""
      ).trim();

    const audioUrl =
      String(
        formulaire.audio_url || ""
      ).trim();

    // --------------------------------------------------------
    // TITRE
    // --------------------------------------------------------

    if (!titre) {
      erreurs.titre =
        "Le titre est obligatoire.";
    } else if (
      titre.length < 3
    ) {
      erreurs.titre =
        "Le titre doit contenir au moins 3 caractères.";
    }

    // --------------------------------------------------------
    // TEXTE / VOCAL
    // --------------------------------------------------------

    if (!contenu && !audioUrl) {
      erreurs.contenu =
        "Ajoutez un message texte ou enregistrez un message vocal.";
    } else if (
      contenu &&
      contenu.length < 3
    ) {
      erreurs.contenu =
        "Le contenu doit contenir au moins 3 caractères ou être laissé vide si vous utilisez uniquement un vocal.";
    }

    // --------------------------------------------------------
    // PROGRAMMATION
    // --------------------------------------------------------

    if (
      formulaire.mode_publication ===
      "PROGRAMMEE"
    ) {
      if (
        !formulaire.date_publication
      ) {
        erreurs.date_publication =
          "La date et l'heure de publication sont obligatoires.";
      } else {
        const datePublication =
          new Date(
            formulaire.date_publication
          );

        if (
          Number.isNaN(
            datePublication.getTime()
          )
        ) {
          erreurs.date_publication =
            "La date de publication est invalide.";
        } else if (
          datePublication.getTime() <=
          Date.now()
        ) {
          erreurs.date_publication =
            "La date de programmation doit être dans le futur.";
        }
      }
    }

    // --------------------------------------------------------
    // EXPIRATION
    // --------------------------------------------------------

    if (
      formulaire.date_expiration &&
      formulaire.mode_publication !==
        "BROUILLON"
    ) {
      const expiration =
        new Date(
          formulaire.date_expiration
        );

      if (
        Number.isNaN(
          expiration.getTime()
        )
      ) {
        erreurs.date_expiration =
          "La date d'expiration est invalide.";
      } else {
        let publication;

        if (
          formulaire.mode_publication ===
          "PROGRAMMEE"
        ) {
          publication =
            new Date(
              formulaire.date_publication
            );
        } else {
          publication =
            new Date();
        }

        if (
          expiration.getTime() <=
          publication.getTime()
        ) {
          erreurs.date_expiration =
            "La date d'expiration doit être postérieure à la publication.";
        }
      }
    }

    setErreursFormulaire(
      erreurs
    );

    return (
      Object.keys(erreurs)
        .length === 0
    );
  }


  // ==========================================================
  // AJOUT
  // ==========================================================

  function ouvrirAjout() {
    if (!peutCreer) {
      return;
    }

    setModeEdition(false);

    setCommunicationSelectionnee(
      null
    );

    setFormulaire({
      ...FORMULAIRE_INITIAL,
    });

    setErreursFormulaire({});

    setErreur("");

    setMessage("");

    setModalOuverte(true);
  }


  // ==========================================================
  // MODIFICATION
  // ==========================================================

  function ouvrirModification(
    communication
  ) {
    if (!peutModifier) {
      return;
    }

    const statut =
      communication.statut ||
      "PUBLIEE";

    let modePublication =
      "IMMEDIATE";

    if (
      statut ===
      "PROGRAMMEE"
    ) {
      modePublication =
        "PROGRAMMEE";
    }

    if (
      statut ===
      "BROUILLON"
    ) {
      modePublication =
        "BROUILLON";
    }

    setModeEdition(true);

    setCommunicationSelectionnee(
      communication
    );

    setFormulaire({
      titre:
        communication.titre ||
        "",

      contenu:
        communication.contenu ||
        "",

      audio_url:
        communication.audio_url ||
        null,

      type_communication:
        communication.type_communication ||
        "ANNONCE",

      priorite:
        communication.priorite ||
        "NORMALE",

      mode_publication:
        modePublication,

      date_publication:
        communication.date_publication
          ? formaterDatePourInput(
              communication.date_publication
            )
          : "",

      date_expiration:
        communication.date_expiration
          ? formaterDatePourInput(
              communication.date_expiration
            )
          : "",

      actif:
        communication.actif !==
        false,

      statut,
    });

    setErreursFormulaire({});

    setErreur("");

    setMessage("");

    setModalOuverte(true);
  }


  // ==========================================================
  // FERMER MODAL
  // ==========================================================

  function fermerModal() {
    if (enregistrement) {
      return;
    }

    setModalOuverte(false);

    setModeEdition(false);

    setCommunicationSelectionnee(
      null
    );

    setFormulaire({
      ...FORMULAIRE_INITIAL,
    });

    setErreursFormulaire({});
  }


  // ==========================================================
  // SOUMISSION
  // ==========================================================

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setErreur("");

    setMessage("");

    if (!validerFormulaire()) {
      return;
    }

    try {
      setEnregistrement(true);

      const maintenant =
        new Date();

      let statut =
        "PUBLIEE";

      let actif = true;

      let datePublication =
        maintenant.toISOString();

      if (
        formulaire.mode_publication ===
        "BROUILLON"
      ) {
        statut =
          "BROUILLON";

        actif = false;

        datePublication =
          maintenant.toISOString();
      } else if (
        formulaire.mode_publication ===
        "PROGRAMMEE"
      ) {
        statut =
          "PROGRAMMEE";

        actif = true;

        datePublication =
          new Date(
            formulaire.date_publication
          ).toISOString();
      } else {
        statut =
          "PUBLIEE";

        actif = true;

        datePublication =
          maintenant.toISOString();
      }

      const contenu =
        String(
          formulaire.contenu ||
            ""
        ).trim();

      const audioUrl =
        String(
          formulaire.audio_url ||
            ""
        ).trim() || null;

      const donnees = {
        titre:
          formulaire.titre.trim(),

        // IMPORTANT :
        // le texte est maintenant facultatif.
        contenu:
          contenu || null,

        // IMPORTANT :
        // le vocal est facultatif,
        // mais texte OU vocal doit exister.
        audio_url:
          audioUrl,

        type_communication:
          formulaire.type_communication,

        priorite:
          formulaire.priorite,

        date_publication:
          datePublication,

        date_expiration:
          formulaire.date_expiration
            ? new Date(
                formulaire.date_expiration
              ).toISOString()
            : null,

        statut,

        actif,
      };

      // ------------------------------------------------------
      // MODIFICATION
      // ------------------------------------------------------

      if (
        modeEdition &&
        communicationSelectionnee
      ) {
        await modifierCommunication(
          communicationSelectionnee.id,
          donnees
        );

        setMessage(
          "La communication a été modifiée avec succès."
        );
      }

      // ------------------------------------------------------
      // CREATION
      // ------------------------------------------------------

      else {
        await creerCommunication(
          donnees
        );

        if (
          statut ===
          "PROGRAMMEE"
        ) {
          setMessage(
            "La communication a été programmée avec succès."
          );
        } else if (
          statut ===
          "BROUILLON"
        ) {
          setMessage(
            "Le brouillon a été enregistré avec succès."
          );
        } else {
          setMessage(
            "La communication a été publiée avec succès."
          );
        }
      }

      fermerModal();

      await chargerCommunications();
    } catch (error) {
      console.error(
        "Erreur enregistrement communication :",
        error
      );

      if (
        error?.response?.status ===
        401
      ) {
        setErreur(
          "Votre session a expiré. Veuillez vous reconnecter."
        );
      } else if (
        error?.response?.status ===
        403
      ) {
        setErreur(
          "Vous n'avez pas la permission d'effectuer cette action."
        );
      } else {
        setErreur(
          extraireMessageErreur(
            error
          )
        );
      }
    } finally {
      setEnregistrement(false);
    }
  }


  // ==========================================================
  // ACTIVER / DESACTIVER
  // ==========================================================

  async function handleToggleActif(
    communication
  ) {
    if (!peutModifier) {
      return;
    }

    const action =
      communication.actif
        ? "désactiver"
        : "réactiver";

    const confirmation =
      window.confirm(
        `Voulez-vous vraiment ${action} la communication « ${communication.titre} » ?`
      );

    if (!confirmation) {
      return;
    }

    try {
      setActionId(
        communication.id
      );

      setErreur("");

      setMessage("");

      await modifierStatutCommunication(
        communication.id,
        !communication.actif
      );

      setMessage(
        communication.actif
          ? "La communication a été désactivée."
          : "La communication a été réactivée."
      );

      await chargerCommunications();
    } catch (error) {
      console.error(
        "Erreur modification statut communication :",
        error
      );

      setErreur(
        extraireMessageErreur(
          error
        )
      );
    } finally {
      setActionId(null);
    }
  }


  // ==========================================================
  // ANNULER PROGRAMMATION
  // ==========================================================

  async function handleAnnulerCommunication(
    communication
  ) {
    if (!peutModifier) {
      return;
    }

    const confirmation =
      window.confirm(
        `Voulez-vous vraiment annuler la programmation de « ${communication.titre} » ?`
      );

    if (!confirmation) {
      return;
    }

    try {
      setActionId(
        communication.id
      );

      setErreur("");

      setMessage("");

      await annulerCommunication(
        communication.id
      );

      setMessage(
        "La communication programmée a été annulée."
      );

      await chargerCommunications();
    } catch (error) {
      console.error(
        "Erreur annulation communication :",
        error
      );

      setErreur(
        extraireMessageErreur(
          error
        )
      );
    } finally {
      setActionId(null);
    }
  }


  // ==========================================================
  // SUPPRESSION
  // ==========================================================

  function ouvrirSuppression(
    communication
  ) {
    if (!peutSupprimer) {
      return;
    }

    setCommunicationASupprimer(
      communication
    );

    setModalSuppression(true);
  }


  async function confirmerSuppression() {
    if (
      !communicationASupprimer ||
      !peutSupprimer
    ) {
      return;
    }

    try {
      setSuppressionEnCours(
        true
      );

      setErreur("");

      setMessage("");

      await supprimerCommunication(
        communicationASupprimer.id
      );

      setMessage(
        "La communication a été supprimée avec succès."
      );

      setModalSuppression(
        false
      );

      setCommunicationASupprimer(
        null
      );

      await chargerCommunications();
    } catch (error) {
      console.error(
        "Erreur suppression communication :",
        error
      );

      setErreur(
        extraireMessageErreur(
          error
        )
      );
    } finally {
      setSuppressionEnCours(
        false
      );
    }
  }


  // ==========================================================
  // RESET FILTRES
  // ==========================================================

  function reinitialiserFiltres() {
    setFiltres({
      actif: null,
      type_communication: "",
      priorite: "",
      statut_communication: "",
    });
  }


  // ==========================================================
  // ACCES REFUSE
  // ==========================================================

  if (!peutConsulter) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-[2rem] border border-red-100 bg-white p-8 text-center shadow-[0_20px_60px_-35px_rgba(15,23,42,0.3)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <XCircle size={30} />
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-900">
            Accès refusé
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Vous n'avez pas la permission de
            consulter les communications du
            Dahira.
          </p>
        </div>
      </div>
    );
  }


  // ==========================================================
  // RENDU
  // ==========================================================

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">

      {/* ======================================================
          EN-TÊTE
      ====================================================== */}

      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.25)] sm:p-7 lg:p-8">

        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-rose-100/60 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-emerald-100/50 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          <div className="min-w-0">

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <Megaphone size={23} />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600">
                  Communication
                </p>

                <h1 className="mt-1 truncate text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  Communications
                </h1>
              </div>

            </div>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500 sm:text-[15px]">
              Publiez les annonces du Dahira
              avec un message texte, un message
              vocal ou les deux. Vous pouvez
              également programmer leur diffusion.
            </p>

          </div>

          {peutCreer && (
            <button
              type="button"
              onClick={ouvrirAjout}
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-emerald-900 sm:w-auto"
            >
              <Plus size={18} />

              Nouvelle communication
            </button>
          )}

        </div>

      </section>


      {/* ======================================================
          MESSAGES
      ====================================================== */}

      {erreur && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">

          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0"
          />

          <div className="min-w-0 flex-1">

            <p className="font-semibold">
              Une erreur est survenue
            </p>

            <p className="mt-1 leading-5">
              {erreur}
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              setErreur("")
            }
            className="shrink-0 rounded-lg p-1 hover:bg-red-100"
          >
            <X size={16} />
          </button>

        </div>
      )}


      {message && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">

          <CheckCircle
            size={19}
            className="mt-0.5 shrink-0"
          />

          <p className="flex-1 leading-5">
            {message}
          </p>

          <button
            type="button"
            onClick={() =>
              setMessage("")
            }
            className="shrink-0 rounded-lg p-1 hover:bg-emerald-100"
          >
            <X size={16} />
          </button>

        </div>
      )}


      {/* ======================================================
          STATISTIQUES
      ====================================================== */}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">

        <StatistiqueCarte
          label="Total"
          valeur={
            statistiques.total
          }
          icone={MessageSquare}
          couleur="slate"
        />

        <StatistiqueCarte
          label="Publiées"
          valeur={
            statistiques.publiees
          }
          icone={CheckCircle}
          couleur="emerald"
        />

        <StatistiqueCarte
          label="Programmées"
          valeur={
            statistiques.programmees
          }
          icone={CalendarClock}
          couleur="blue"
        />

        <StatistiqueCarte
          label="Brouillons"
          valeur={
            statistiques.brouillons
          }
          icone={FileText}
          couleur="amber"
        />

        <StatistiqueCarte
          label="Expirées"
          valeur={
            statistiques.expirees
          }
          icone={Clock3}
          couleur="rose"
        />

      </section>


      {/* ======================================================
          FILTRES
      ====================================================== */}

      <section className="rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm">

        <div className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">

          <button
            type="button"
            onClick={() =>
              setFiltresOuverts(
                (ancien) =>
                  !ancien
              )
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 lg:w-auto"
          >
            <Filter size={17} />

            Filtres

            <ChevronDown
              size={16}
              className={`transition ${
                filtresOuverts
                  ? "rotate-180"
                  : ""
              }`}
            />
          </button>

          <button
            type="button"
            onClick={
              reinitialiserFiltres
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 sm:w-auto"
          >
            <RefreshCw size={16} />

            Réinitialiser
          </button>

        </div>


        {filtresOuverts && (
          <div className="border-t border-slate-100 p-4 sm:p-5">

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              {/* STATUT */}

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Statut
                </label>

                <select
                  value={
                    filtres.statut_communication
                  }
                  onChange={(event) =>
                    setFiltres(
                      (ancien) => ({
                        ...ancien,
                        statut_communication:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                >
                  <option value="">
                    Tous les statuts
                  </option>

                  {STATUTS_COMMUNICATION.map(
                    (statut) => (
                      <option
                        key={
                          statut.value
                        }
                        value={
                          statut.value
                        }
                      >
                        {statut.label}
                      </option>
                    )
                  )}
                </select>
              </div>


              {/* TYPE */}

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Type
                </label>

                <select
                  value={
                    filtres.type_communication
                  }
                  onChange={(event) =>
                    setFiltres(
                      (ancien) => ({
                        ...ancien,
                        type_communication:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                >
                  <option value="">
                    Tous les types
                  </option>

                  {TYPES_COMMUNICATION.map(
                    (type) => (
                      <option
                        key={
                          type.value
                        }
                        value={
                          type.value
                        }
                      >
                        {type.label}
                      </option>
                    )
                  )}
                </select>
              </div>


              {/* PRIORITE */}

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Priorité
                </label>

                <select
                  value={
                    filtres.priorite
                  }
                  onChange={(event) =>
                    setFiltres(
                      (ancien) => ({
                        ...ancien,
                        priorite:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                >
                  <option value="">
                    Toutes les priorités
                  </option>

                  {PRIORITES_COMMUNICATION.map(
                    (priorite) => (
                      <option
                        key={
                          priorite.value
                        }
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


              {/* ACTIF */}

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Activation
                </label>

                <select
                  value={
                    filtres.actif ===
                    null
                      ? ""
                      : String(
                          filtres.actif
                        )
                  }
                  onChange={(event) => {
                    const valeur =
                      event.target.value;

                    setFiltres(
                      (ancien) => ({
                        ...ancien,
                        actif:
                          valeur ===
                          ""
                            ? null
                            : valeur ===
                                "true",
                      })
                    );
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
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

            </div>
          </div>
        )}

      </section>


      {/* ======================================================
          LISTE
      ====================================================== */}

      <section className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm">

        <div className="border-b border-slate-100 p-5 sm:p-6">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-lg font-black text-slate-900">
                Liste des communications
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {
                  communications.length
                }{" "}
                communication
                {communications.length >
                1
                  ? "s"
                  : ""}{" "}
                affichée
                {communications.length >
                1
                  ? "s"
                  : ""}
              </p>
            </div>

            <button
              type="button"
              onClick={
                chargerCommunications
              }
              disabled={chargement}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <RefreshCw
                size={15}
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


        {/* CHARGEMENT */}

        {chargement ? (
          <div className="flex min-h-[300px] items-center justify-center px-6">

            <div className="flex flex-col items-center gap-3 text-center">

              <span className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-700" />

              <p className="text-sm font-medium text-slate-500">
                Chargement des communications...
              </p>

            </div>

          </div>
        )


        /* AUCUNE */

        : communications.length ===
          0 ? (
          <div className="flex min-h-[330px] flex-col items-center justify-center px-6 py-12 text-center">

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Megaphone size={28} />
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-900">
              Aucune communication
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              Aucune communication ne
              correspond aux filtres
              sélectionnés.
            </p>

            {peutCreer && (
              <button
                type="button"
                onClick={
                  ouvrirAjout
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-900"
              >
                <Plus size={17} />

                Créer une communication
              </button>
            )}

          </div>
        )


        /* LISTE */

        : (
          <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-2">

            {communications.map(
              (communication) => {
                const IconStatut =
                  obtenirIconeStatut(
                    communication.statut
                  );

                const contenu =
                  String(
                    communication.contenu ||
                      ""
                  ).trim();

                return (
                  <article
                    key={
                      communication.id
                    }
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/5"
                  >

                    <div
                      className={`absolute inset-x-0 top-0 h-1 ${
                        communication.statut ===
                        "PROGRAMMEE"
                          ? "bg-blue-500"
                          : communication.statut ===
                              "PUBLIEE"
                            ? "bg-emerald-500"
                            : communication.statut ===
                                "ANNULEE"
                              ? "bg-red-500"
                              : communication.statut ===
                                  "EXPIREE"
                                ? "bg-amber-500"
                                : "bg-slate-300"
                      }`}
                    />


                    {/* HEADER */}

                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold ${obtenirClassesType(
                              communication.type_communication
                            )}`}
                          >
                            {obtenirLabelType(
                              communication.type_communication
                            )}
                          </span>

                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold ${obtenirClassesPriorite(
                              communication.priorite
                            )}`}
                          >
                            {obtenirLabelPriorite(
                              communication.priorite
                            )}
                          </span>

                        </div>

                        <h3 className="mt-3 line-clamp-2 text-base font-black leading-6 text-slate-900 sm:text-lg">
                          {
                            communication.titre
                          }
                        </h3>

                      </div>


                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${obtenirClassesStatut(
                          communication.statut
                        )}`}
                      >
                        <IconStatut
                          size={18}
                        />
                      </div>

                    </div>


                    {/* TEXTE */}

                    {contenu && (
                      <div className="mt-4 rounded-xl bg-slate-50 p-4">

                        <div className="flex items-start gap-3">

                          <MessageSquare
                            size={17}
                            className="mt-0.5 shrink-0 text-slate-400"
                          />

                          <p className="line-clamp-4 whitespace-pre-line text-sm leading-6 text-slate-600">
                            {
                              contenu
                            }
                          </p>

                        </div>

                      </div>
                    )}


                    {/* VOCAL */}

                    {communication.audio_url && (
                      <div className="mt-4">

                        <LecteurAudio
                          audioUrl={
                            communication.audio_url
                          }
                        />

                      </div>
                    )}


                    {/* INDICATEUR TYPE MESSAGE */}

                    <div className="mt-3 flex flex-wrap gap-2">

                      {contenu && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600">
                          <FileText
                            size={13}
                          />

                          Texte
                        </span>
                      )}

                      {communication.audio_url && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">
                          <FileAudio
                            size={13}
                          />

                          Vocal
                        </span>
                      )}

                    </div>


                    {/* DATES */}

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">

                      <div className="rounded-xl border border-slate-100 bg-white p-3">

                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">

                          <Calendar
                            size={13}
                          />

                          {communication.statut ===
                          "PROGRAMMEE"
                            ? "Publication prévue"
                            : "Publication"}

                        </div>

                        <p className="mt-1 text-xs font-semibold text-slate-700">
                          {formaterDate(
                            communication.date_publication
                          )}
                        </p>

                      </div>


                      <div className="rounded-xl border border-slate-100 bg-white p-3">

                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">

                          <Clock3
                            size={13}
                          />

                          Expiration

                        </div>

                        <p className="mt-1 text-xs font-semibold text-slate-700">

                          {communication.date_expiration
                            ? formaterDate(
                                communication.date_expiration
                              )
                            : "Aucune"}

                        </p>

                      </div>

                    </div>


                    {/* STATUT */}

                    <div className="mt-4 flex flex-wrap items-center gap-2">

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${obtenirClassesStatut(
                          communication.statut
                        )}`}
                      >
                        <IconStatut
                          size={13}
                        />

                        {obtenirLabelStatut(
                          communication.statut
                        )}
                      </span>


                      {communication.statut ===
                        "PUBLIEE" &&
                        communication.push_envoye && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                            <Bell
                              size={13}
                            />

                            Notification envoyée
                          </span>
                        )}


                      {communication.statut ===
                        "PROGRAMMEE" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                          <CalendarClock
                            size={13}
                          />

                          En attente de publication
                        </span>
                      )}


                      {communication.statut ===
                        "ANNULEE" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                          <Ban
                            size={13}
                          />

                          Programmation annulée
                        </span>
                      )}

                    </div>


                    {/* ETAT ACTIF */}

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">

                      <div className="flex items-center gap-2">

                        <span
                          className={`h-2 w-2 rounded-full ${
                            communication.actif
                              ? "bg-emerald-500"
                              : "bg-slate-300"
                          }`}
                        />

                        <span className="text-xs font-semibold text-slate-500">
                          {communication.actif
                            ? "Active"
                            : "Inactive"}
                        </span>

                      </div>


                      <span className="text-[10px] font-medium text-slate-400">

                        {communication.date_expiration
                          ? `Expire le ${formaterDateCourte(
                              communication.date_expiration
                            )}`
                          : "Sans expiration"}

                      </span>

                    </div>


                    {/* ACTIONS */}

                    {(peutModifier ||
                      peutSupprimer) && (
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">

                        {peutModifier && (
                          <button
                            type="button"
                            onClick={() =>
                              ouvrirModification(
                                communication
                              )
                            }
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 sm:flex-none"
                          >
                            <Edit
                              size={15}
                            />

                            Modifier
                          </button>
                        )}


                        {peutModifier &&
                          communication.statut ===
                            "PROGRAMMEE" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleAnnulerCommunication(
                                  communication
                                )
                              }
                              disabled={
                                actionId ===
                                communication.id
                              }
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                            >
                              {actionId ===
                              communication.id ? (
                                <RefreshCw
                                  size={15}
                                  className="animate-spin"
                                />
                              ) : (
                                <XCircle
                                  size={15}
                                />
                              )}

                              Annuler
                            </button>
                          )}


                        {peutModifier &&
                          communication.statut !==
                            "ANNULEE" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleActif(
                                  communication
                                )
                              }
                              disabled={
                                actionId ===
                                communication.id
                              }
                              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none ${
                                communication.actif
                                  ? "border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                  : "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              {communication.actif
                                ? "Désactiver"
                                : "Réactiver"}
                            </button>
                          )}


                        {peutSupprimer && (
                          <button
                            type="button"
                            onClick={() =>
                              ouvrirSuppression(
                                communication
                              )
                            }
                            className="inline-flex items-center justify-center rounded-xl border border-red-100 p-2.5 text-red-600 transition hover:bg-red-50"
                            title="Supprimer"
                          >
                            <Trash2
                              size={16}
                            />
                          </button>
                        )}

                      </div>
                    )}

                  </article>
                );
              }
            )}

          </div>
        )}

      </section>


      {/* ======================================================
          MODALE CREATION / MODIFICATION
      ====================================================== */}

      {modalOuverte && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">

          <div className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-[2rem]">

            {/* HEADER */}

            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">

              <div className="min-w-0">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">

                    {modeEdition ? (
                      <Edit
                        size={18}
                      />
                    ) : (
                      <Megaphone
                        size={18}
                      />
                    )}

                  </div>

                  <div>

                    <h2 className="text-lg font-black text-slate-900">
                      {modeEdition
                        ? "Modifier la communication"
                        : "Nouvelle communication"}
                    </h2>

                    <p className="text-xs text-slate-500">
                      {modeEdition
                        ? "Modifiez les informations de cette communication."
                        : "Créez une nouvelle communication pour la Dahira."}
                    </p>

                  </div>

                </div>

              </div>


              <button
                type="button"
                onClick={
                  fermerModal
                }
                disabled={
                  enregistrement
                }
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>

            </div>


            {/* FORMULAIRE */}

            <form
              onSubmit={
                handleSubmit
              }
              className="flex min-h-0 flex-1 flex-col"
            >

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">

                <div className="space-y-5">


                  {/* ==================================================
                      TITRE
                  ================================================== */}

                  <div>

                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Titre
                    </label>

                    <input
                      type="text"
                      name="titre"
                      value={
                        formulaire.titre
                      }
                      onChange={
                        handleChange
                      }
                      maxLength={200}
                      placeholder="Ex. Réunion générale de la Dahira"
                      className={`w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:ring-4 focus:ring-emerald-600/10 ${
                        erreursFormulaire.titre
                          ? "border-red-300 focus:border-red-500"
                          : "border-slate-200 focus:border-emerald-600"
                      }`}
                    />

                    {erreursFormulaire.titre && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">
                        {
                          erreursFormulaire.titre
                        }
                      </p>
                    )}

                  </div>


                  {/* ==================================================
                      CONTENU TEXTE
                  ================================================== */}

                  <div>

                    <div className="mb-2 flex items-center justify-between gap-3">

                      <label className="block text-sm font-bold text-slate-700">
                        Contenu texte
                        <span className="ml-1 font-normal text-slate-400">
                          (facultatif)
                        </span>
                      </label>

                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Texte ou vocal
                      </span>

                    </div>

                    <textarea
                      name="contenu"
                      value={
                        formulaire.contenu
                      }
                      onChange={
                        handleChange
                      }
                      rows={6}
                      placeholder="Écrivez le contenu de la communication... Vous pouvez laisser vide si vous envoyez uniquement un vocal."
                      className={`w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:ring-4 focus:ring-emerald-600/10 ${
                        erreursFormulaire.contenu
                          ? "border-red-300 focus:border-red-500"
                          : "border-slate-200 focus:border-emerald-600"
                      }`}
                    />

                    {erreursFormulaire.contenu && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">
                        {
                          erreursFormulaire.contenu
                        }
                      </p>
                    )}

                  </div>


                  {/* ==================================================
                      ENREGISTREUR VOCAL
                  ================================================== */}

                  <EnregistreurVocal
                    audioUrl={
                      formulaire.audio_url
                    }
                    onAudioChange={
                      handleAudioChange
                    }
                    erreur={
                      erreursFormulaire.audio_url
                    }
                    disabled={
                      enregistrement
                    }
                  />


                  {/* ==================================================
                      INFORMATION TEXTE / VOCAL
                  ================================================== */}

                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">

                    <div className="flex items-start gap-3">

                      <Info
                        size={18}
                        className="mt-0.5 shrink-0 text-blue-600"
                      />

                      <div>

                        <p className="text-sm font-bold text-blue-900">
                          Contenu de la communication
                        </p>

                        <p className="mt-1 text-xs leading-5 text-blue-700">
                          Vous pouvez envoyer uniquement
                          un texte, uniquement un message
                          vocal, ou les deux. Une
                          communication ne peut pas être
                          créée sans texte et sans vocal.
                        </p>

                      </div>

                    </div>

                  </div>


                  {/* ==================================================
                      TYPE / PRIORITE
                  ================================================== */}

                  <div className="grid gap-4 sm:grid-cols-2">

                    <div>

                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Type de communication
                      </label>

                      <select
                        name="type_communication"
                        value={
                          formulaire.type_communication
                        }
                        onChange={
                          handleChange
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                      >
                        {TYPES_COMMUNICATION.map(
                          (type) => (
                            <option
                              key={
                                type.value
                              }
                              value={
                                type.value
                              }
                            >
                              {
                                type.label
                              }
                            </option>
                          )
                        )}
                      </select>

                    </div>


                    <div>

                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Priorité
                      </label>

                      <select
                        name="priorite"
                        value={
                          formulaire.priorite
                        }
                        onChange={
                          handleChange
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                      >
                        {PRIORITES_COMMUNICATION.map(
                          (priorite) => (
                            <option
                              key={
                                priorite.value
                              }
                              value={
                                priorite.value
                              }
                            >
                              {
                                priorite.label
                              }
                            </option>
                          )
                        )}
                      </select>

                    </div>

                  </div>


                  {/* ==================================================
                      MODE PUBLICATION
                  ================================================== */}

                  <div>

                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Mode de publication
                    </label>

                    <div className="grid gap-3 sm:grid-cols-3">


                      {/* IMMEDIATE */}

                      <button
                        type="button"
                        onClick={() =>
                          handleModePublicationChange(
                            "IMMEDIATE"
                          )
                        }
                        className={`rounded-2xl border p-4 text-left transition ${
                          formulaire.mode_publication ===
                          "IMMEDIATE"
                            ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >

                        <div className="flex items-center gap-2">

                          <Send
                            size={18}
                            className={
                              formulaire.mode_publication ===
                              "IMMEDIATE"
                                ? "text-emerald-600"
                                : "text-slate-400"
                            }
                          />

                          <span className="text-sm font-bold text-slate-800">
                            Immédiate
                          </span>

                        </div>

                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          Publier maintenant et
                          envoyer la notification.
                        </p>

                      </button>


                      {/* PROGRAMMEE */}

                      <button
                        type="button"
                        onClick={() =>
                          handleModePublicationChange(
                            "PROGRAMMEE"
                          )
                        }
                        className={`rounded-2xl border p-4 text-left transition ${
                          formulaire.mode_publication ===
                          "PROGRAMMEE"
                            ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >

                        <div className="flex items-center gap-2">

                          <CalendarClock
                            size={18}
                            className={
                              formulaire.mode_publication ===
                              "PROGRAMMEE"
                                ? "text-blue-600"
                                : "text-slate-400"
                            }
                          />

                          <span className="text-sm font-bold text-slate-800">
                            Programmée
                          </span>

                        </div>

                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          Publier automatiquement
                          à une date future.
                        </p>

                      </button>


                      {/* BROUILLON */}

                      <button
                        type="button"
                        onClick={() =>
                          handleModePublicationChange(
                            "BROUILLON"
                          )
                        }
                        className={`rounded-2xl border p-4 text-left transition ${
                          formulaire.mode_publication ===
                          "BROUILLON"
                            ? "border-slate-500 bg-slate-100 ring-2 ring-slate-100"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >

                        <div className="flex items-center gap-2">

                          <FileText
                            size={18}
                            className={
                              formulaire.mode_publication ===
                              "BROUILLON"
                                ? "text-slate-700"
                                : "text-slate-400"
                            }
                          />

                          <span className="text-sm font-bold text-slate-800">
                            Brouillon
                          </span>

                        </div>

                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          Enregistrer sans publier.
                        </p>

                      </button>

                    </div>

                  </div>


                  {/* ==================================================
                      DATE PUBLICATION
                  ================================================== */}

                  {formulaire.mode_publication ===
                    "PROGRAMMEE" && (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">

                      <div className="flex items-start gap-3">

                        <CalendarClock
                          size={19}
                          className="mt-0.5 shrink-0 text-blue-600"
                        />

                        <div className="min-w-0 flex-1">

                          <label className="mb-2 block text-sm font-bold text-blue-900">
                            Date et heure de publication
                          </label>

                          <input
                            type="datetime-local"
                            name="date_publication"
                            value={
                              formulaire.date_publication
                            }
                            min={
                              new Date()
                                .toISOString()
                                .slice(
                                  0,
                                  16
                                )
                            }
                            onChange={
                              handleChange
                            }
                            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-600/10 ${
                              erreursFormulaire.date_publication
                                ? "border-red-300 focus:border-red-500"
                                : "border-blue-200 focus:border-blue-500"
                            }`}
                          />

                          {erreursFormulaire.date_publication && (
                            <p className="mt-1.5 text-xs font-medium text-red-600">
                              {
                                erreursFormulaire.date_publication
                              }
                            </p>
                          )}

                          <p className="mt-2 text-xs leading-5 text-blue-700">
                            La communication sera
                            publiée automatiquement
                            lorsque cette date sera
                            atteinte.
                          </p>

                        </div>

                      </div>

                    </div>
                  )}


                  {/* ==================================================
                      DATE EXPIRATION
                  ================================================== */}

                  <div>

                    <label className="mb-2 block text-sm font-bold text-slate-700">

                      Date d'expiration

                      <span className="ml-1 font-normal text-slate-400">
                        (facultative)
                      </span>

                    </label>

                    <input
                      type="datetime-local"
                      name="date_expiration"
                      value={
                        formulaire.date_expiration
                      }
                      onChange={
                        handleChange
                      }
                      className={`w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:ring-4 focus:ring-emerald-600/10 ${
                        erreursFormulaire.date_expiration
                          ? "border-red-300 focus:border-red-500"
                          : "border-slate-200 focus:border-emerald-600"
                      }`}
                    />

                    {erreursFormulaire.date_expiration && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">
                        {
                          erreursFormulaire.date_expiration
                        }
                      </p>
                    )}

                    <p className="mt-1.5 text-xs text-slate-500">
                      La communication passera
                      automatiquement à l'état
                      « Expirée » après cette date.
                    </p>

                  </div>


                  {/* ==================================================
                      NOTIFICATION
                  ================================================== */}

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

                    <div className="flex items-start gap-3">

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                        <Bell size={17} />
                      </div>

                      <div>

                        <p className="text-sm font-bold text-slate-800">
                          Notification push
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Lors de la publication, les
                          appareils enregistrés recevront
                          une notification. Pour un message
                          vocal, la notification indique
                          qu'un message vocal est disponible.
                        </p>

                      </div>

                    </div>

                  </div>

                </div>

              </div>


              {/* ==================================================
                  FOOTER
              ================================================== */}

              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">

                <button
                  type="button"
                  onClick={
                    fermerModal
                  }
                  disabled={
                    enregistrement
                  }
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Annuler
                </button>


                <button
                  type="submit"
                  disabled={
                    enregistrement
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {enregistrement ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="animate-spin"
                      />

                      Enregistrement...
                    </>
                  ) : formulaire.mode_publication ===
                    "PROGRAMMEE" ? (
                    <>
                      <CalendarClock
                        size={17}
                      />

                      Programmer
                    </>
                  ) : formulaire.mode_publication ===
                    "BROUILLON" ? (
                    <>
                      <FileText
                        size={17}
                      />

                      Enregistrer le brouillon
                    </>
                  ) : (
                    <>
                      <Send
                        size={17}
                      />

                      {modeEdition
                        ? "Enregistrer les modifications"
                        : "Publier maintenant"}
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

      {modalSuppression &&
        communicationASupprimer && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">

            <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl sm:p-7">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <Trash2 size={22} />
              </div>

              <h2 className="mt-5 text-xl font-black text-slate-900">
                Supprimer la communication ?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Vous êtes sur le point de supprimer :
              </p>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">

                <p className="font-bold text-slate-800">
                  {
                    communicationASupprimer.titre
                  }
                </p>

                {communicationASupprimer.contenu && (
                  <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-500">
                    {
                      communicationASupprimer.contenu
                    }
                  </p>
                )}

                {communicationASupprimer.audio_url && (
                  <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                    <FileAudio
                      size={14}
                    />

                    Cette communication contient
                    également un message vocal.
                  </div>
                )}

              </div>


              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={() => {
                    if (
                      suppressionEnCours
                    ) {
                      return;
                    }

                    setModalSuppression(
                      false
                    );

                    setCommunicationASupprimer(
                      null
                    );
                  }}
                  disabled={
                    suppressionEnCours
                  }
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Annuler
                </button>


                <button
                  type="button"
                  onClick={
                    confirmerSuppression
                  }
                  disabled={
                    suppressionEnCours
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {suppressionEnCours ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="animate-spin"
                      />

                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2
                        size={17}
                      />

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


export default Communication;