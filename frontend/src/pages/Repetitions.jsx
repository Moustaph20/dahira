import { useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  RefreshCw,
  AlertCircle,
  Clock3,
  MapPin,
  BookOpen,
  Music,
  ChevronRight,
  X,
  UserRound,
  Volume2,
  CheckCircle2,
  History,
  Headphones,
} from "lucide-react";

import api from "../api/client";
import { useAuth } from "../context/AuthContext";

// ============================================================
// UTILITAIRES
// ============================================================

function formaterDate(date) {
  if (!date) return "-";

  const valeur = new Date(`${date}T00:00:00`);

  if (Number.isNaN(valeur.getTime())) {
    return date;
  }

  return valeur.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formaterHeure(heure) {
  if (!heure) return null;
  return String(heure).slice(0, 5);
}

function obtenirJour(date) {
  if (!date) return "--";

  const valeur = new Date(`${date}T00:00:00`);

  if (Number.isNaN(valeur.getTime())) {
    return "--";
  }

  return valeur.getDate();
}

function obtenirMois(date) {
  if (!date) return "---";

  const valeur = new Date(`${date}T00:00:00`);

  if (Number.isNaN(valeur.getTime())) {
    return "---";
  }

  return valeur
    .toLocaleDateString("fr-FR", {
      month: "short",
    })
    .replace(".", "")
    .toUpperCase();
}

function obtenirDateAujourdHui() {
  const maintenant = new Date();

  const annee = maintenant.getFullYear();
  const mois = String(maintenant.getMonth() + 1).padStart(2, "0");
  const jour = String(maintenant.getDate()).padStart(2, "0");

  return `${annee}-${mois}-${jour}`;
}

function obtenirStatut(date) {
  if (!date) return "avenir";

  const aujourdHui = obtenirDateAujourdHui();

  if (date === aujourdHui) {
    return "aujourd_hui";
  }

  if (date < aujourdHui) {
    return "passee";
  }

  return "avenir";
}

function obtenirInformationsStatut(statut) {
  if (statut === "aujourd_hui") {
    return {
      label: "Aujourd'hui",
      classe:
        "bg-emerald-100 text-emerald-700 border-emerald-200",
      icone: CheckCircle2,
    };
  }

  if (statut === "passee") {
    return {
      label: "Terminée",
      classe:
        "bg-slate-100 text-slate-500 border-slate-200",
      icone: History,
    };
  }

  return {
    label: "À venir",
    classe:
      "bg-amber-100 text-amber-700 border-amber-200",
    icone: CalendarDays,
  };
}

function construireUrlAudio(fichier) {
  if (!fichier) return null;

  const valeur = String(fichier).trim();

  if (!valeur) {
    return null;
  }

  if (
    valeur.startsWith("http://") ||
    valeur.startsWith("https://")
  ) {
    return valeur;
  }

  const baseUrl =
    api.defaults.baseURL?.replace(/\/$/, "") || "";

  const chemin = valeur.startsWith("/")
    ? valeur
    : `/${valeur}`;

  return `${baseUrl}${chemin}`;
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

function Repetitions() {
  const { aPermission } = useAuth();

  const [repetitions, setRepetitions] = useState([]);
  const [repetitionSelectionnee, setRepetitionSelectionnee] =
    useState(null);

  const [chargement, setChargement] = useState(true);
  const [chargementDetail, setChargementDetail] =
    useState(false);

  const [erreur, setErreur] = useState("");
  const [erreurDetail, setErreurDetail] = useState("");

  const peutConsulter = aPermission("KOUREL_CONSULTER");

  // ==========================================================
  // CHARGER LES REPETITIONS
  // ==========================================================

  async function chargerRepetitions() {
    if (!peutConsulter) {
      setRepetitions([]);
      setChargement(false);
      return;
    }

    try {
      setChargement(true);
      setErreur("");

      const response = await api.get("/repetitions");

      const data = Array.isArray(response.data)
  ? response.data
  : Array.isArray(response.data?.items)
    ? response.data.items
    : [];

const aujourdHui = obtenirDateAujourdHui();

const repetitionsAVenir = data
  .filter(
    (repetition) =>
      repetition?.date_repetition &&
      repetition.date_repetition >= aujourdHui
  )
  .sort((a, b) =>
    String(a.date_repetition).localeCompare(
      String(b.date_repetition)
    )
  );

setRepetitions(repetitionsAVenir);
    } catch (error) {
      console.error(
        "ERREUR CHARGEMENT REPETITIONS :",
        error
      );

      setErreur(
        error.response?.data?.detail ||
          "Impossible de charger les répétitions."
      );

      setRepetitions([]);
    } finally {
      setChargement(false);
    }
  }

  // ==========================================================
  // CHARGER LE DETAIL
  // ==========================================================

  async function ouvrirDetail(repetition) {
    if (!repetition?.id) {
      return;
    }

    try {
      setErreurDetail("");
      setChargementDetail(true);

      const response = await api.get(
        `/repetitions/${repetition.id}`
      );

      setRepetitionSelectionnee(response.data);
    } catch (error) {
      console.error(
        "ERREUR DETAIL REPETITION :",
        error
      );

      setErreurDetail(
        error.response?.data?.detail ||
          "Impossible de charger le détail de la répétition."
      );
    } finally {
      setChargementDetail(false);
    }
  }

  // ==========================================================
  // FERMER DETAIL
  // ==========================================================

  function fermerDetail() {
    if (chargementDetail) {
      return;
    }

    setRepetitionSelectionnee(null);
    setErreurDetail("");
  }

  // ==========================================================
  // CHARGEMENT INITIAL
  // ==========================================================

  useEffect(() => {
    chargerRepetitions();
  }, [peutConsulter]);

  // ==========================================================
  // STATISTIQUES
  // ==========================================================

  const statistiques = useMemo(() => {
    const aujourdHui = obtenirDateAujourdHui();

    const aujourdHuiCount = repetitions.filter(
      (item) =>
        item?.date_repetition === aujourdHui
    ).length;

    const aVenir = repetitions.filter(
      (item) =>
        item?.date_repetition &&
        item.date_repetition > aujourdHui
    ).length;

    const passees = repetitions.filter(
      (item) =>
        item?.date_repetition &&
        item.date_repetition < aujourdHui
    ).length;

    return {
      total: repetitions.length,
      aujourdHui: aujourdHuiCount,
      aVenir,
      passees,
    };
  }, [repetitions]);

  // ==========================================================
  // ACCES INTERDIT
  // ==========================================================

  if (!peutConsulter) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <AlertCircle
              size={32}
              className="text-red-500"
            />
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-900">
            Accès non autorisé
          </h2>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Vous n&apos;avez pas la permission de consulter
            le programme des répétitions du Kourel.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // CHARGEMENT
  // ==========================================================

  if (chargement) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />

          <div className="mt-3 h-9 w-72 animate-pulse rounded bg-slate-200" />

          <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-slate-100" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-2xl bg-white"
            />
          ))}
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-3xl bg-white"
            />
          ))}
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDU PRINCIPAL
  // ==========================================================

  return (
    <div className="space-y-7">
      {/* ======================================================
          EN-TETE
      ====================================================== */}

      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700">
              Kourel
            </span>

            <span className="text-xs text-slate-400">
              Programme religieux
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Répétitions
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Retrouvez les séances de répétition du Kourel,
            leurs horaires, leurs lieux et les Khassidas
            prévues avec leurs tons et leurs audios.
          </p>
        </div>

        <button
          type="button"
          onClick={chargerRepetitions}
          disabled={chargement}
          className="
            flex items-center justify-center gap-2
            rounded-xl border border-slate-200
            bg-white px-4 py-3
            text-sm font-semibold text-slate-700
            shadow-sm transition
            hover:border-amber-200
            hover:bg-amber-50
            hover:text-amber-700
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          <RefreshCw
            size={17}
            className={chargement ? "animate-spin" : ""}
          />

          Actualiser
        </button>
      </div>

      {/* ======================================================
          ERREUR
      ====================================================== */}

      {erreur && (
        <div
          className="
            flex items-start gap-3
            rounded-2xl border border-red-200
            bg-red-50 p-4 text-sm text-red-700
          "
        >
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0"
          />

          <div className="flex-1">
            <p className="font-semibold">
              Impossible de charger les répétitions
            </p>

            <p className="mt-1">
              {erreur}
            </p>
          </div>

          <button
            type="button"
            onClick={chargerRepetitions}
            className="
              rounded-lg bg-red-600
              px-3 py-1.5 text-xs
              font-semibold text-white
              hover:bg-red-700
            "
          >
            Réessayer
          </button>
        </div>
      )}

      {/* ======================================================
          STATISTIQUES
      ====================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
     
        <StatCard
          icon={CheckCircle2}
          label="Aujourd'hui"
          value={statistiques.aujourdHui}
          description="Séance prévue aujourd'hui"
          iconClass="bg-emerald-50 text-emerald-600"
        />

  
      </div>

      {/* ======================================================
          LISTE
      ====================================================== */}

      {repetitions.length === 0 ? (
        <div
          className="
            rounded-3xl border border-slate-200
            bg-white p-12 text-center shadow-sm
          "
        >
          <div
            className="
              mx-auto flex h-16 w-16
              items-center justify-center
              rounded-2xl bg-amber-50
            "
          >
            <CalendarDays
              size={30}
              className="text-amber-500"
            />
          </div>

          <h2
            className="
              mt-5 text-lg font-bold
              text-slate-800
            "
          >
            Aucune répétition programmée
          </h2>

          <p
            className="
              mx-auto mt-2 max-w-md
              text-sm leading-6 text-slate-500
            "
          >
            Aucune séance de répétition n&apos;est actuellement
            disponible dans le programme du Kourel.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {repetitions.map((repetition) => (
            <RepetitionCard
              key={repetition.id}
              repetition={repetition}
              onClick={() => ouvrirDetail(repetition)}
            />
          ))}
        </div>
      )}

      {/* ======================================================
          MODAL DETAIL
      ====================================================== */}

      {(repetitionSelectionnee || chargementDetail) && (
        <div
          className="
            fixed inset-0 z-[100]
            flex items-center justify-center
            bg-slate-950/60 p-4
            backdrop-blur-sm
          "
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !chargementDetail
            ) {
              fermerDetail();
            }
          }}
        >
          <div
            className="
              flex max-h-[90vh] w-full max-w-3xl
              flex-col overflow-hidden
              rounded-3xl bg-white shadow-2xl
            "
          >
            {/* =================================================
                HEADER MODAL
            ================================================= */}

            <div
              className="
                flex items-start justify-between
                border-b border-slate-100
                px-6 py-5
              "
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="
                      rounded-full bg-amber-100
                      px-3 py-1 text-xs font-bold
                      text-amber-700
                    "
                  >
                    Répétition
                  </span>

                  {repetitionSelectionnee &&
                    obtenirStatut(
                      repetitionSelectionnee.date_repetition
                    ) === "aujourd_hui" && (
                      <span
                        className="
                          rounded-full bg-emerald-100
                          px-3 py-1 text-xs font-bold
                          text-emerald-700
                        "
                      >
                        Aujourd&apos;hui
                      </span>
                    )}
                </div>

                {repetitionSelectionnee ? (
                  <h2
                    className="
                      mt-3 text-xl font-bold
                      capitalize text-slate-900
                    "
                  >
                    {formaterDate(
                      repetitionSelectionnee.date_repetition
                    )}
                  </h2>
                ) : (
                  <div
                    className="
                      mt-3 h-6 w-64
                      animate-pulse rounded
                      bg-slate-200
                    "
                  />
                )}
              </div>

              <button
                type="button"
                onClick={fermerDetail}
                disabled={chargementDetail}
                aria-label="Fermer"
                className="
                  shrink-0 rounded-xl p-2
                  text-slate-400 transition
                  hover:bg-slate-100
                  hover:text-slate-700
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                <X size={21} />
              </button>
            </div>

            {/* =================================================
                CONTENU MODAL
            ================================================= */}

            <div className="overflow-y-auto p-6">
              {chargementDetail && !repetitionSelectionnee ? (
                <div className="space-y-6">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="
                          h-24 animate-pulse
                          rounded-2xl bg-slate-100
                        "
                      />
                    ))}
                  </div>

                  <div
                    className="
                      h-8 w-64
                      animate-pulse rounded
                      bg-slate-200
                    "
                  />

                  <div
                    className="
                      h-40 animate-pulse
                      rounded-2xl bg-slate-100
                    "
                  />
                </div>
              ) : repetitionSelectionnee ? (
                <>
                  {/* ERREUR DETAIL */}

                  {erreurDetail && (
                    <div
                      className="
                        mb-5 flex items-start
                        gap-3 rounded-2xl
                        border border-red-200
                        bg-red-50 p-4
                        text-sm text-red-700
                      "
                    >
                      <AlertCircle
                        size={18}
                        className="mt-0.5 shrink-0"
                      />

                      <span>
                        {erreurDetail}
                      </span>
                    </div>
                  )}

                  {/* INFORMATIONS */}

                  <div
                    className="
                      grid gap-3 sm:grid-cols-3
                    "
                  >
                    <InfoBox
                      icon={Clock3}
                      label="Horaire"
                      value={
                        repetitionSelectionnee.heure_debut
                          ? `${formaterHeure(
                              repetitionSelectionnee.heure_debut
                            )}${
                              repetitionSelectionnee.heure_fin
                                ? ` – ${formaterHeure(
                                    repetitionSelectionnee.heure_fin
                                  )}`
                                : ""
                            }`
                          : "Horaire non précisé"
                      }
                    />

                    <InfoBox
                      icon={MapPin}
                      label="Lieu"
                      value={
                        repetitionSelectionnee.lieu ||
                        "Lieu non précisé"
                      }
                    />

                    <InfoBox
                      icon={BookOpen}
                      label="Khassidas"
                      value={`${(
                        repetitionSelectionnee.khassidas || []
                      ).length} ${
                        (
                          repetitionSelectionnee.khassidas || []
                        ).length > 1
                          ? "prévues"
                          : "prévue"
                      }`}
                    />
                  </div>

                  {/* KHASSIDAS */}

                  <div className="mt-7">
                    <div
                      className="
                        mb-4 flex items-center
                        justify-between gap-3
                      "
                    >
                      <div>
                        <h3
                          className="
                            text-lg font-bold
                            text-slate-900
                          "
                        >
                          Khassidas au programme
                        </h3>

                        <p
                          className="
                            mt-1 text-sm text-slate-500
                          "
                        >
                          Ordre prévu pour la séance
                        </p>
                      </div>

                      <div
                        className="
                          rounded-xl bg-amber-50
                          p-2.5 text-amber-600
                        "
                      >
                        <BookOpen size={19} />
                      </div>
                    </div>

                    {Array.isArray(
                      repetitionSelectionnee.khassidas
                    ) &&
                    repetitionSelectionnee.khassidas.length > 0 ? (
                      <div className="space-y-4">
                        {repetitionSelectionnee.khassidas
                          .slice()
                          .sort(
                            (a, b) =>
                              (a?.ordre ?? 0) -
                              (b?.ordre ?? 0)
                          )
                          .map((khassida, index) => (
                            <KhassidaCard
                              key={
                                khassida.id ??
                                `khassida-${index}`
                              }
                              khassida={khassida}
                              index={index}
                            />
                          ))}
                      </div>
                    ) : (
                      <div
                        className="
                          rounded-2xl border
                          border-dashed border-slate-200
                          bg-slate-50 p-8 text-center
                        "
                      >
                        <BookOpen
                          size={28}
                          className="mx-auto text-slate-300"
                        />

                        <p
                          className="
                            mt-3 text-sm font-semibold
                            text-slate-600
                          "
                        >
                          Aucune Khassida associée
                        </p>

                        <p
                          className="
                            mt-1 text-xs
                            text-slate-400
                          "
                        >
                          Le programme de cette répétition
                          ne contient pas encore de Khassida.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// CARTE STATISTIQUE
// ============================================================

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  iconClass,
}) {
  return (
    <div
      className="
        rounded-2xl border border-slate-200
        bg-white p-5 shadow-sm
      "
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p
            className="
              mt-2 text-3xl font-bold
              text-slate-900
            "
          >
            {value}
          </p>
        </div>

        <div
          className={`
            rounded-xl p-3
            ${iconClass}
          `}
        >
          <Icon size={21} />
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}

// ============================================================
// CARTE REPETITION
// ============================================================

function RepetitionCard({
  repetition,
  onClick,
}) {
  const statut = obtenirStatut(
    repetition?.date_repetition
  );

  const informations =
    obtenirInformationsStatut(statut);

  const IconStatut = informations.icone;

  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group w-full overflow-hidden
        rounded-3xl border border-slate-200
        bg-white text-left shadow-sm
        transition duration-200
        hover:-translate-y-0.5
        hover:border-amber-200
        hover:shadow-lg
      "
    >
      <div
        className="
          flex flex-col gap-5
          p-5 md:flex-row
          md:items-center md:p-6
        "
      >
        {/* DATE */}

        <div
          className="
            flex shrink-0
            items-center gap-4
            md:w-56
          "
        >
          <div
            className="
              flex h-14 w-14 shrink-0
              flex-col items-center
              justify-center rounded-2xl
              bg-amber-50 text-amber-700
            "
          >
            <span
              className="
                text-[10px] font-bold uppercase
              "
            >
              {obtenirMois(
                repetition?.date_repetition
              )}
            </span>

            <span
              className="
                text-xl font-bold leading-5
              "
            >
              {obtenirJour(
                repetition?.date_repetition
              )}
            </span>
          </div>

          <div className="min-w-0">
            <p
              className="
                text-sm font-bold
                capitalize text-slate-800
              "
            >
              {formaterDate(
                repetition?.date_repetition
              )}
            </p>

            <span
              className={`
                mt-2 inline-flex
                items-center gap-1.5
                rounded-full border
                px-2.5 py-1
                text-[11px] font-semibold
                ${informations.classe}
              `}
            >
              <IconStatut size={12} />
              {informations.label}
            </span>
          </div>
        </div>

        {/* INFORMATIONS */}

        <div
          className="
            flex flex-1
            flex-wrap gap-3
          "
        >
          <MiniInfo
            icon={Clock3}
            text={
              repetition?.heure_debut
                ? `${formaterHeure(
                    repetition.heure_debut
                  )}${
                    repetition?.heure_fin
                      ? ` – ${formaterHeure(
                          repetition.heure_fin
                        )}`
                      : ""
                  }`
                : "Horaire non précisé"
            }
          />

          <MiniInfo
            icon={MapPin}
            text={
              repetition?.lieu ||
              "Lieu non précisé"
            }
          />
        </div>

        {/* ACTION */}

        <div
          className="
            flex items-center
            justify-between gap-4
            border-t border-slate-100
            pt-4 md:border-0 md:pt-0
          "
        >
          <span
            className="
              hidden text-xs
              text-slate-400 sm:block
            "
          >
            Voir le programme
          </span>

          <div
            className="
              flex h-10 w-10
              items-center justify-center
              rounded-xl bg-slate-50
              text-slate-400
              transition
              group-hover:bg-amber-50
              group-hover:text-amber-600
            "
          >
            <ChevronRight size={20} />
          </div>
        </div>
      </div>
    </button>
  );
}

// ============================================================
// MINI INFORMATION
// ============================================================

function MiniInfo({
  icon: Icon,
  text,
}) {
  return (
    <div
      className="
        inline-flex items-center gap-2
        rounded-xl bg-slate-50
        px-3 py-2 text-xs
        font-medium text-slate-600
      "
    >
      <Icon
        size={15}
        className="shrink-0 text-slate-400"
      />

      <span className="break-words">
        {text}
      </span>
    </div>
  );
}

// ============================================================
// INFO DETAIL
// ============================================================

function InfoBox({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div
      className="
        rounded-2xl border border-slate-100
        bg-slate-50 p-4
      "
    >
      <div
        className="
          flex items-center gap-2
          text-xs font-semibold
          uppercase tracking-wide
          text-slate-400
        "
      >
        <Icon size={14} />
        {label}
      </div>

      <p
        className="
          mt-2 break-words
          text-sm font-semibold
          text-slate-800
        "
      >
        {value}
      </p>
    </div>
  );
}

// ============================================================
// CARTE KHASSIDA
// ============================================================

function KhassidaCard({
  khassida,
  index,
}) {
  const audios = Array.isArray(khassida?.audios)
    ? khassida.audios
    : [];

  return (
    <div
      className="
        rounded-2xl border
        border-slate-200
        bg-white p-5 shadow-sm
      "
    >
      <div
        className="
          flex flex-col gap-4
          sm:flex-row
        "
      >
        {/* ORDRE */}

        <div
          className="
            flex h-11 w-11
            shrink-0 items-center
            justify-center rounded-xl
            bg-amber-50 text-sm
            font-bold text-amber-700
          "
        >
          {index + 1}
        </div>

        {/* CONTENU */}

        <div
          className="
            min-w-0 flex-1
          "
        >
          <div
            className="
              flex flex-col gap-2
              sm:flex-row sm:items-start
              sm:justify-between
            "
          >
            <div className="min-w-0">
              <h4
                className="
                  break-words
                  text-base font-bold
                  text-slate-900
                "
              >
                {khassida?.titre ||
                  "Khassida sans titre"}
              </h4>

              {khassida?.auteur && (
                <p
                  className="
                    mt-1 flex items-center
                    gap-1.5 text-xs
                    text-slate-400
                  "
                >
                  <UserRound size={13} />

                  <span>
                    {khassida.auteur}
                  </span>
                </p>
              )}
            </div>

            {audios.length > 0 && (
              <span
                className="
                  inline-flex w-fit
                  shrink-0 items-center
                  gap-1.5 rounded-full
                  bg-emerald-50
                  px-2.5 py-1
                  text-[11px] font-semibold
                  text-emerald-700
                "
              >
                <Music size={12} />

                {audios.length} audio
                {audios.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {khassida?.description && (
            <p
              className="
                mt-3 text-sm
                leading-6 text-slate-500
              "
            >
              {khassida.description}
            </p>
          )}

          {/* AUDIOS */}

          {audios.length > 0 && (
            <div className="mt-4 space-y-3">
              {audios.map((audio, audioIndex) => (
                <AudioCard
                  key={
                    audio?.id ??
                    `audio-${audioIndex}`
                  }
                  audio={audio}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// AUDIO
// ============================================================

function AudioCard({
  audio,
}) {
  const fichier = construireUrlAudio(
    audio?.fichier
  );

  return (
    <div
      className="
        rounded-2xl border
        border-slate-100
        bg-slate-50 p-4
      "
    >
      <div
        className="
          flex flex-col gap-3
          sm:flex-row sm:items-center
          sm:justify-between
        "
      >
        <div
          className="
            flex min-w-0
            items-center gap-3
          "
        >
          <div
            className="
              flex h-10 w-10
              shrink-0 items-center
              justify-center rounded-xl
              bg-emerald-50
              text-emerald-600
            "
          >
            <Headphones size={18} />
          </div>

          <div className="min-w-0">
            <p
              className="
                truncate text-sm
                font-semibold text-slate-800
              "
            >
              {audio?.titre || "Audio"}
            </p>

            {audio?.ton && (
              <p
                className="
                  mt-1 flex items-center
                  gap-1.5 text-xs
                  text-amber-600
                "
              >
                <Volume2 size={13} />

                Ton :

                <span>
                  {audio.ton.nom || "Non précisé"}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {fichier ? (
        <audio
          controls
          preload="none"
          className="mt-3 w-full"
          src={fichier}
        >
          Votre navigateur ne prend pas en charge
          la lecture audio.
        </audio>
      ) : (
        <p
          className="
            mt-3 text-xs
            text-slate-400
          "
        >
          Fichier audio indisponible.
        </p>
      )}
    </div>
  );
}

export default Repetitions;