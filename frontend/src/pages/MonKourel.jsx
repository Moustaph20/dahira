import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Users,
  Crown,
  CalendarDays,
  BookOpen,
  Music,
  Mic2,
  ChevronRight,
  ChevronDown,
  MapPin,
  Phone,
  RefreshCw,
  AlertCircle,
  Loader2,
  X,
  Church,
  Info,
  Volume2,
  Headphones,
  CalendarCheck,
  Clock,
  CircleCheck,
  FileText,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";


/* ============================================================
   UTILITAIRES
   ============================================================ */

function formaterDate(dateValue) {
  if (!dateValue) {
    return "Non renseignée";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Non renseignée";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}


function formaterDateCourte(dateValue) {
  if (!dateValue) {
    return "Non renseignée";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Non renseignée";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}


function formaterMois(mois) {
  if (!mois) {
    return "";
  }

  const moisNumerique = Number(mois);

  if (
    Number.isNaN(moisNumerique) ||
    moisNumerique < 1 ||
    moisNumerique > 12
  ) {
    return String(mois);
  }

  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
  }).format(
    new Date(2026, moisNumerique - 1, 1)
  );
}


function formaterHeure(value) {
  if (!value) {
    return "";
  }

  if (
    typeof value === "string" &&
    /^\d{2}:\d{2}(:\d{2})?$/.test(value)
  ) {
    return value.slice(0, 5);
  }

  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return String(value);
}


function initiales(nom = "", prenom = "") {
  const premiereLettrePrenom =
    prenom?.trim()?.charAt(0) || "";

  const premiereLettreNom =
    nom?.trim()?.charAt(0) || "";

  return (
    premiereLettrePrenom +
    premiereLettreNom
  ).toUpperCase();
}


function nomComplet(membre) {
  if (!membre) {
    return "Membre inconnu";
  }

  return [
    membre.prenom,
    membre.nom,
  ]
    .filter(Boolean)
    .join(" ")
    .trim() || "Membre inconnu";
}


function extraireMessageErreur(error) {
  if (error?.response?.data?.detail) {
    if (
      Array.isArray(
        error.response.data.detail
      )
    ) {
      return error.response.data.detail
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          return (
            item?.msg ||
            "Erreur de validation."
          );
        })
        .join(", ");
    }

    return String(
      error.response.data.detail
    );
  }

  if (error?.message) {
    return error.message;
  }

  return "Une erreur est survenue.";
}


function obtenirUrlAudio(audio) {
  if (!audio) {
    return null;
  }

  const url =
    audio.url ||
    audio.url_audio ||
    audio.fichier_url ||
    audio.audio_url ||
    audio.chemin ||
    audio.path ||
    audio.src ||
    audio.fichier;

  if (!url) {
    return null;
  }

  const valeur = String(url);

  if (
    valeur.startsWith("http://") ||
    valeur.startsWith("https://")
  ) {
    return valeur;
  }

  const baseUrl =
    api.defaults.baseURL || "";

  if (valeur.startsWith("/")) {
    return `${baseUrl}${valeur}`;
  }

  return `${baseUrl}/${valeur}`;
}


function obtenirNomKhassida(item) {
  return (
    item?.khassida?.titre ||
    item?.khassida?.nom ||
    item?.khassida_obj?.titre ||
    item?.khassida_obj?.nom ||
    item?.kassida?.titre ||
    item?.kassida?.nom ||
    item?.khassida_nom ||
    item?.titre ||
    item?.nom ||
    "Khassida"
  );
}


function obtenirNomTon(item) {
  if (!item) {
    return "Ton non renseigné";
  }

  if (
    typeof item.ton === "string"
  ) {
    return item.ton;
  }

  return (
    item?.ton?.nom ||
    item?.ton?.titre ||
    item?.ton_obj?.nom ||
    item?.ton_obj?.titre ||
    item?.ton_nom ||
    "Ton non renseigné"
  );
}


function obtenirAudio(item) {
  if (!item) {
    return null;
  }

  if (item.audio) {
    return item.audio;
  }

  if (item.audio_obj) {
    return item.audio_obj;
  }

  if (
    Array.isArray(item.audios) &&
    item.audios.length > 0
  ) {
    return item.audios[0];
  }

  if (
    item.audio_url ||
    item.url_audio ||
    item.fichier_url ||
    item.audio_path ||
    item.fichier
  ) {
    return {
      url:
        item.audio_url ||
        item.url_audio ||
        item.fichier_url ||
        item.audio_path ||
        item.fichier,
    };
  }

  return null;
}


function normaliserListe(data, proprietes = []) {
  if (Array.isArray(data)) {
    return data;
  }

  for (const propriete of proprietes) {
    if (Array.isArray(data?.[propriete])) {
      return data[propriete];
    }
  }

  return [];
}


/*
 * ============================================================
 * NORMALISATION D'UNE AFFECTATION KHASSIDA
 *
 * Cette logique est volontairement alignée sur celle utilisée
 * dans ProgrammeReligieux.jsx.
 * ============================================================
 */

function normaliserAffectation(item) {
  if (!item) {
    return null;
  }

  const khassida =
    item.khassida ||
    item.khassida_obj ||
    item.kassida ||
    null;

  const ton =
    item.ton ||
    item.ton_obj ||
    null;

  const audio =
    item.audio ||
    item.audio_obj ||
    null;

  return {
    ...item,

    id: item.id,

    ordre:
      item.ordre ??
      item.position ??
      1,

    khassida: khassida
      ? {
          ...khassida,
          titre:
            khassida.titre ||
            khassida.nom ||
            "Khassida",
        }
      : null,

    ton: ton
      ? {
          ...ton,
          nom:
            ton.nom ||
            ton.titre ||
            "Ton",
        }
      : null,

    audio: audio
      ? {
          ...audio,
          titre:
            audio.titre ||
            audio.nom ||
            "Audio",

          url:
            audio.url ||
            audio.fichier_url ||
            audio.audio_url ||
            audio.chemin ||
            audio.file_url ||
            audio.fichier ||
            "",
        }
      : null,
  };
}


/*
 * ============================================================
 * EXTRAIRE PROGRAMME
 * ============================================================
 */

function extraireProgramme(data) {
  if (!data) {
    return null;
  }

  if (
    data.programme &&
    typeof data.programme === "object"
  ) {
    return {
      ...data.programme,
      ...data,
    };
  }

  return data;
}


/*
 * ============================================================
 * DATE / HEURE D'UNE RÉPÉTITION
 * ============================================================
 */

function obtenirDateHeureRepetition(
  repetition
) {
  if (!repetition) {
    return null;
  }

  const dateValue =
    repetition.date ||
    repetition.date_repetition;

  if (!dateValue) {
    return null;
  }

  /*
   * Si le backend retourne déjà une date ISO complète.
   */
  if (
    typeof dateValue === "string" &&
    dateValue.includes("T")
  ) {
    const date = new Date(dateValue);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  /*
   * Date YYYY-MM-DD.
   *
   * Construction en heure locale afin d'éviter les décalages
   * UTC.
   */
  const match =
    String(dateValue).match(
      /^(\d{4})-(\d{2})-(\d{2})/
    );

  if (!match) {
    const date = new Date(dateValue);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }

    return null;
  }

  const annee = Number(match[1]);
  const mois = Number(match[2]) - 1;
  const jour = Number(match[3]);

  let heure = 0;
  let minute = 0;
  let seconde = 0;

  if (repetition.heure_debut) {
    const heureMatch =
      String(
        repetition.heure_debut
      ).match(
        /^(\d{2}):(\d{2})(?::(\d{2}))?/
      );

    if (heureMatch) {
      heure = Number(
        heureMatch[1]
      );

      minute = Number(
        heureMatch[2]
      );

      seconde = Number(
        heureMatch[3] || 0
      );
    }
  }

  return new Date(
    annee,
    mois,
    jour,
    heure,
    minute,
    seconde
  );
}


/*
 * ============================================================
 * PROCHAINE RÉPÉTITION
 * ============================================================
 */

function trouverProchaineRepetition(
  repetitions
) {
  if (!Array.isArray(repetitions)) {
    return null;
  }

  const maintenant = new Date();

  const repetitionsFutures =
    repetitions
      .filter(
        (repetition) =>
          repetition &&
          repetition.actif !== false
      )
      .map((repetition) => ({
        repetition,
        dateHeure:
          obtenirDateHeureRepetition(
            repetition
          ),
      }))
      .filter(
        (item) =>
          item.dateHeure &&
          item.dateHeure >= maintenant
      )
      .sort(
        (a, b) =>
          a.dateHeure.getTime() -
          b.dateHeure.getTime()
      );

  return (
    repetitionsFutures[0]
      ?.repetition || null
  );
}


/*
 * ============================================================
 * CHARGER KHASSIDAS D'UNE RÉPÉTITION
 *
 * IMPORTANT :
 *
 * On utilise ici exactement la route qui permet de récupérer
 * les Khassidas affectées à une répétition donnée.
 *
 * GET
 * /programmes-religieux/{programme_id}
 *     /repetitions/{repetition_id}
 *     /khassidas
 * ============================================================
 */

async function chargerKhassidasRepetition(
  programmeId,
  repetitionId
) {
  if (
    !programmeId ||
    !repetitionId
  ) {
    return [];
  }

  try {
    const response =
      await api.get(
        `/programmes-religieux/${programmeId}/repetitions/${repetitionId}/khassidas`
      );

    const data =
      response.data;

    let liste = [];

    if (Array.isArray(data)) {
      liste = data;
    } else if (
      Array.isArray(data?.items)
    ) {
      liste = data.items;
    } else if (
      Array.isArray(data?.khassidas)
    ) {
      liste = data.khassidas;
    } else if (data) {
      liste = [data];
    }

    return liste
      .map(normaliserAffectation)
      .filter(Boolean)
      .sort(
        (a, b) =>
          Number(a.ordre || 0) -
          Number(b.ordre || 0)
      );
  } catch (error) {
    console.error(
      `Impossible de charger les Khassidas de la répétition ${repetitionId}`,
      error
    );

    throw error;
  }
}


/* ============================================================
   CARTE STATISTIQUE
   ============================================================ */

function StatCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100">
          <Icon
            size={21}
            className="text-gray-700"
          />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
          </p>

          <p className="mt-1 truncate text-xl font-bold text-gray-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}


/* ============================================================
   MEMBRE
   ============================================================ */

function MembreCard({
  membre,
  estGestionnaire,
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition hover:shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
          {initiales(
            membre?.nom,
            membre?.prenom
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-gray-900">
              {nomComplet(membre)}
            </p>

            {estGestionnaire && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                <Crown size={12} />
                Gestionnaire
              </span>
            )}
          </div>

          {membre?.telephone && (
            <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
              <Phone size={12} />
              {membre.telephone}
            </div>
          )}

          {membre?.lieu_residence && (
            <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
              <MapPin size={12} />
              {membre.lieu_residence}
            </div>
          )}
        </div>
      </div>

      <div className="hidden shrink-0 text-right sm:block">
        <p className="text-xs text-gray-400">
          Membre depuis
        </p>

        <p className="mt-1 text-xs font-medium text-gray-600">
          {formaterDate(
            membre?.date_entree
          )}
        </p>
      </div>
    </div>
  );
}


/* ============================================================
   LECTEUR AUDIO
   ============================================================ */

function LecteurAudio({
  audio,
  titre = "Audio",
}) {
  const [lecture, setLecture] =
    useState(false);

  const url =
    obtenirUrlAudio(audio);

  if (!url) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-gray-50 p-3 text-xs text-gray-500">
        <Volume2 size={16} />
        Aucun audio disponible.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white">
          <Headphones size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">
            {titre}
          </p>

          <audio
            controls
            preload="none"
            className="mt-2 h-9 w-full"
            src={url}
            onPlay={() =>
              setLecture(true)
            }
            onPause={() =>
              setLecture(false)
            }
            onEnded={() =>
              setLecture(false)
            }
          />

        </div>

        {lecture && (
          <span className="hidden shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 sm:inline-flex">
            Lecture
          </span>
        )}
      </div>
    </div>
  );
}


/* ============================================================
   PROGRAMME MENSUEL — EN-TÊTE
   ============================================================ */

function ProgrammeHeader({
  programme,
}) {
  if (!programme) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100">
            <CalendarCheck
              size={22}
              className="text-gray-700"
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Programme mensuel
            </p>

            <h3 className="mt-1 text-xl font-bold capitalize text-gray-900">
              {programme.titre ||
                `Programme de ${formaterMois(
                  programme.mois
                )} ${programme.annee || ""}`}
            </h3>
          </div>
        </div>

        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          <CircleCheck size={13} />
          Actif
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-gray-50 p-3">
          <div className="flex items-center gap-2 text-gray-500">
            <CalendarDays size={16} />
            <span className="text-xs font-medium">
              Période
            </span>
          </div>

          <p className="mt-1 text-sm font-semibold capitalize text-gray-900">
            {formaterMois(
              programme.mois
            )}{" "}
            {programme.annee || ""}
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 p-3">
          <div className="flex items-center gap-2 text-gray-500">
            <CalendarDays size={16} />
            <span className="text-xs font-medium">
              Dates
            </span>
          </div>

          <p className="mt-1 text-sm font-semibold text-gray-900">
            {programme.date_debut
              ? formaterDateCourte(
                  programme.date_debut
                )
              : "Non renseignée"}{" "}
            →{" "}
            {programme.date_fin
              ? formaterDateCourte(
                  programme.date_fin
                )
              : "Non renseignée"}
          </p>
        </div>
      </div>

      {programme.description && (
        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-3">
          <div className="flex items-center gap-2 text-gray-500">
            <Info size={16} />
            <span className="text-xs font-medium">
              Description
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            {programme.description}
          </p>
        </div>
      )}
    </div>
  );
}


/* ============================================================
   ACTIVITÉ : RÉPÉTITIONS
   ============================================================ */

function RepetitionsPanel({
  kourel,
  programme,
  repetitions,
  chargement,
  erreur,
  onActualiser,
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Répétitions
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Programme des répétitions de{" "}
            <strong>
              {kourel?.nom}
            </strong>
          </p>
        </div>

        <button
          type="button"
          onClick={onActualiser}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={15} />
          Actualiser
        </button>
      </div>

      {programme && (
        <ProgrammeHeader
          programme={programme}
        />
      )}

      {erreur && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={19}
              className="mt-0.5 text-red-600"
            />

            <div>
              <p className="font-semibold text-red-800">
                Impossible de charger les répétitions
              </p>

              <p className="mt-1 text-sm text-red-700">
                {erreur}
              </p>
            </div>
          </div>
        </div>
      )}

      {chargement ? (
        <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 py-14">
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2
              size={22}
              className="animate-spin"
            />
            Chargement des répétitions...
          </div>
        </div>
      ) : repetitions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-5 py-12 text-center">
          <Music
            size={34}
            className="mx-auto text-gray-400"
          />

          <p className="mt-3 font-semibold text-gray-700">
            Aucune répétition programmée
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Aucune répétition n'est actuellement disponible pour ce programme mensuel.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {repetitions.map(
            (repetition, index) => {
              const listeKhassidas =
                Array.isArray(
                  repetition.khassidas
                )
                  ? repetition.khassidas
                  : [];

              return (
                <div
                  key={
                    repetition.id ??
                    `repetition-${index}`
                  }
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                        <Music
                          size={20}
                          className="text-gray-700"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Prochaine répétition
                        </p>

                        <h4 className="mt-1 text-lg font-bold text-gray-900">
                          {repetition.date
                            ? formaterDate(
                                repetition.date
                              )
                            : repetition.date_repetition
                            ? formaterDate(
                                repetition.date_repetition
                              )
                            : "Date non renseignée"}
                        </h4>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Actif
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {(repetition.date ||
                      repetition.date_repetition) && (
                      <div className="rounded-xl bg-gray-50 p-3">
                        <div className="flex items-center gap-2 text-gray-500">
                          <CalendarDays size={16} />
                          <span className="text-xs font-medium">
                            Date
                          </span>
                        </div>

                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {formaterDate(
                            repetition.date ||
                              repetition.date_repetition
                          )}
                        </p>
                      </div>
                    )}

                    {repetition.heure_debut && (
                      <div className="rounded-xl bg-gray-50 p-3">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Clock size={16} />
                          <span className="text-xs font-medium">
                            Heure
                          </span>
                        </div>

                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {formaterHeure(
                            repetition.heure_debut
                          )}

                          {repetition.heure_fin && (
                            <>
                              {" "}
                              →{" "}
                              {formaterHeure(
                                repetition.heure_fin
                              )}
                            </>
                          )}
                        </p>
                      </div>
                    )}

                    {repetition.lieu && (
                      <div className="rounded-xl bg-gray-50 p-3">
                        <div className="flex items-center gap-2 text-gray-500">
                          <MapPin size={16} />
                          <span className="text-xs font-medium">
                            Lieu
                          </span>
                        </div>

                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {repetition.lieu}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-5">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h5 className="font-semibold text-gray-900">
                          Khassidas à répéter
                        </h5>

                        <p className="mt-1 text-xs text-gray-500">
                          {listeKhassidas.length}{" "}
                          Khassida
                          {listeKhassidas.length >
                          1
                            ? "s"
                            : ""}
                        </p>
                      </div>
                    </div>

                    {listeKhassidas.length ===
                    0 ? (
                      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center">
                        <BookOpen
                          size={25}
                          className="mx-auto text-gray-400"
                        />

                        <p className="mt-2 text-sm font-medium text-gray-600">
                          Aucune Khassida associée
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {listeKhassidas.map(
                          (
                            affectation,
                            khassidaIndex
                          ) => {
                            const audio =
                              obtenirAudio(
                                affectation
                              );

                            return (
                              <div
                                key={
                                  affectation.id ??
                                  `khassida-${khassidaIndex}`
                                }
                                className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
                                    <BookOpen
                                      size={18}
                                      className="text-gray-700"
                                    />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="rounded-full bg-gray-900 px-2 py-1 text-xs font-bold text-white">
                                        #
                                        {affectation.ordre ??
                                          khassidaIndex +
                                            1}
                                      </span>

                                      <h6 className="font-bold text-gray-900">
                                        {obtenirNomKhassida(
                                          affectation
                                        )}
                                      </h6>
                                    </div>

                                    <div className="mt-2 flex flex-wrap gap-2">
                                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-600">
                                        <Volume2
                                          size={13}
                                        />
                                        {obtenirNomTon(
                                          affectation
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {audio && (
                                  <div className="mt-4">
                                    <LecteurAudio
                                      audio={audio}
                                      titre={`Audio — ${obtenirNomKhassida(
                                        affectation
                                      )}`}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}


/* ============================================================
   ACTIVITÉ : KHASSIDAS
   ============================================================ */

function KhassidasPanel({
  khassidas,
  chargement,
  erreur,
  onActualiser,
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Khassidas
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Khassidas à répéter lors de la prochaine répétition.
          </p>
        </div>

        <button
          type="button"
          onClick={onActualiser}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={15} />
          Actualiser
        </button>
      </div>

      {erreur && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={19}
              className="mt-0.5 text-red-600"
            />

            <div>
              <p className="font-semibold text-red-800">
                Impossible de charger les Khassidas
              </p>

              <p className="mt-1 text-sm text-red-700">
                {erreur}
              </p>
            </div>
          </div>
        </div>
      )}

      {chargement ? (
        <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 py-14">
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2
              size={22}
              className="animate-spin"
            />
            Chargement des Khassidas...
          </div>
        </div>
      ) : khassidas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-5 py-12 text-center">
          <BookOpen
            size={34}
            className="mx-auto text-gray-400"
          />

          <p className="mt-3 font-semibold text-gray-700">
            Aucune Khassida à répéter
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Aucune Khassida n'est actuellement associée à la prochaine répétition.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {khassidas.map(
            (affectation, index) => {
              const khassida =
                affectation?.khassida ||
                affectation;

              const audio =
                obtenirAudio(
                  affectation
                );

              return (
                <div
                  key={
                    affectation?.id ??
                    khassida?.id ??
                    `khassida-${index}`
                  }
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                      <BookOpen
                        size={20}
                        className="text-gray-700"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Khassida à répéter
                      </p>

                      <h4 className="mt-1 text-lg font-bold text-gray-900">
                        {khassida?.titre ||
                          khassida?.nom ||
                          obtenirNomKhassida(
                            affectation
                          ) ||
                          "Khassida sans titre"}
                      </h4>

                      {khassida?.auteur && (
                        <p className="mt-1 text-sm text-gray-500">
                          {khassida.auteur}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
                          <Volume2
                            size={13}
                          />
                          {obtenirNomTon(
                            affectation
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {khassida?.description && (
                    <div className="mt-4 rounded-xl bg-gray-50 p-3">
                      <p className="text-sm leading-6 text-gray-600">
                        {khassida.description}
                      </p>
                    </div>
                  )}

                  {audio && (
                    <div className="mt-4">
                      <LecteurAudio
                        audio={audio}
                        titre={`Audio — ${
                          khassida?.titre ||
                          khassida?.nom ||
                          "Khassida"
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}


/* ============================================================
   ACTIVITÉ : DÉCLAMATIONS
   ============================================================ */

function DeclamationsPanel({
  programme,
  declamations,
  chargement,
  erreur,
  onActualiser,
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Déclamations
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Déclamations prévues dans le programme mensuel.
          </p>
        </div>

        <button
          type="button"
          onClick={onActualiser}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={15} />
          Actualiser
        </button>
      </div>

      {programme && (
        <ProgrammeHeader
          programme={programme}
        />
      )}

      {erreur && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={19}
              className="mt-0.5 text-red-600"
            />

            <div>
              <p className="font-semibold text-red-800">
                Impossible de charger les déclamations
              </p>

              <p className="mt-1 text-sm text-red-700">
                {erreur}
              </p>
            </div>
          </div>
        </div>
      )}

      {chargement ? (
        <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 py-14">
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2
              size={22}
              className="animate-spin"
            />
            Chargement des déclamations...
          </div>
        </div>
      ) : declamations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-5 py-12 text-center">
          <Mic2
            size={34}
            className="mx-auto text-gray-400"
          />

          <p className="mt-3 font-semibold text-gray-700">
            Aucune déclamation programmée
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Aucune déclamation n'est actuellement prévue.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {declamations.map(
            (declamation, index) => {
              const donneesDeclamation =
                declamation.declamation ||
                declamation;

              const listeKhassidas =
                Array.isArray(
                  donneesDeclamation.khassidas
                )
                  ? donneesDeclamation.khassidas
                  : [];

              return (
                <div
                  key={
                    declamation.id ??
                    `declamation-${index}`
                  }
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                      <Mic2
                        size={20}
                        className="text-gray-700"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Déclamation
                      </p>

                      <h4 className="mt-1 text-lg font-bold text-gray-900">
                        {declamation.evenement ||
                          "Déclamation"}
                      </h4>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {declamation.date_declamation && (
                      <div className="rounded-xl bg-gray-50 p-3">
                        <div className="flex items-center gap-2 text-gray-500">
                          <CalendarDays size={16} />
                          <span className="text-xs font-medium">
                            Date
                          </span>
                        </div>

                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {formaterDate(
                            declamation.date_declamation
                          )}
                        </p>
                      </div>
                    )}

                    {declamation.heure && (
                      <div className="rounded-xl bg-gray-50 p-3">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Clock size={16} />
                          <span className="text-xs font-medium">
                            Heure
                          </span>
                        </div>

                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {formaterHeure(
                            declamation.heure
                          )}
                        </p>
                      </div>
                    )}

                    {declamation.lieu && (
                      <div className="rounded-xl bg-gray-50 p-3">
                        <div className="flex items-center gap-2 text-gray-500">
                          <MapPin size={16} />
                          <span className="text-xs font-medium">
                            Lieu
                          </span>
                        </div>

                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {declamation.lieu}
                        </p>
                      </div>
                    )}
                  </div>

                  {listeKhassidas.length > 0 && (
                    <div className="mt-5">
                      <h5 className="mb-3 font-semibold text-gray-900">
                        Khassidas à déclamer
                      </h5>

                      <div className="space-y-3">
                        {listeKhassidas.map(
                          (
                            affectation,
                            khassidaIndex
                          ) => {
                            const audio =
                              obtenirAudio(
                                affectation
                              );

                            return (
                              <div
                                key={
                                  affectation.id ??
                                  `declamation-khassida-${khassidaIndex}`
                                }
                                className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
                                    <BookOpen
                                      size={18}
                                      className="text-gray-700"
                                    />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="rounded-full bg-gray-900 px-2 py-1 text-xs font-bold text-white">
                                        #
                                        {affectation.ordre ??
                                          khassidaIndex +
                                            1}
                                      </span>

                                      <h6 className="font-bold text-gray-900">
                                        {obtenirNomKhassida(
                                          affectation
                                        )}
                                      </h6>
                                    </div>

                                    <div className="mt-2">
                                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-600">
                                        <Volume2
                                          size={13}
                                        />
                                        {obtenirNomTon(
                                          affectation
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {audio && (
                                  <div className="mt-4">
                                    <LecteurAudio
                                      audio={audio}
                                      titre={`Audio — ${obtenirNomKhassida(
                                        affectation
                                      )}`}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}

                  {declamation.description && (
                    <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <div className="flex items-center gap-2 text-gray-500">
                        <FileText size={16} />
                        <span className="text-xs font-medium">
                          Informations
                        </span>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-gray-600">
                        {declamation.description}
                      </p>
                    </div>
                  )}
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}


/* ============================================================
   ACTIVITÉ : PROGRAMME RELIGIEUX
   ============================================================ */

function ProgrammeReligieuxPanel({
  programme,
  chargement,
  erreur,
  onActualiser,
}) {
  const repetitions =
    Array.isArray(
      programme?.repetitions
    )
      ? programme.repetitions
      : [];

  const declamations =
    Array.isArray(
      programme?.declamations
    )
      ? programme.declamations
      : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Programme religieux
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Programme religieux mensuel du Kourel.
          </p>
        </div>

        <button
          type="button"
          onClick={onActualiser}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={15} />
          Actualiser
        </button>
      </div>

      {erreur && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={19}
              className="mt-0.5 text-red-600"
            />

            <div>
              <p className="font-semibold text-red-800">
                Impossible de charger le programme
              </p>

              <p className="mt-1 text-sm text-red-700">
                {erreur}
              </p>
            </div>
          </div>
        </div>
      )}

      {chargement ? (
        <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 py-14">
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2
              size={22}
              className="animate-spin"
            />
            Chargement du programme religieux...
          </div>
        </div>
      ) : !programme ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-5 py-12 text-center">
          <CalendarCheck
            size={34}
            className="mx-auto text-gray-400"
          />

          <p className="mt-3 font-semibold text-gray-700">
            Aucun programme religieux
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Aucun programme mensuel n'est actuellement disponible pour ce Kourel.
          </p>
        </div>
      ) : (
        <>
          <ProgrammeHeader
            programme={programme}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
              icon={Music}
              label="Répétitions"
              value={repetitions.length}
            />

            <StatCard
              icon={Mic2}
              label="Déclamations"
              value={declamations.length}
            />
          </div>

          {programme.description && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <FileText size={18} />
                <h4 className="font-semibold">
                  Informations du programme
                </h4>
              </div>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                {programme.description}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}


/* ============================================================
   MODAL ACTIVITÉS
   ============================================================ */

function ActivitesKourel({
  kourel,
  activite,
  programme,
  repetitions,
  khassidas,
  declamations,
  chargements,
  erreurs,
  actualiserActivite,
  onFermer,
}) {
  const titre =
    activite === "repetitions"
      ? "Répétitions"
      : activite === "khassidas"
      ? "Khassidas"
      : activite === "declamations"
      ? "Déclamations"
      : "Programme religieux";

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/50 p-4">
      <div className="mx-auto mt-6 max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="relative bg-gray-900 px-5 py-6 text-white sm:px-7">
          <button
            type="button"
            onClick={onFermer}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>

          <div className="flex items-start gap-4 pr-12">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              {activite ===
              "repetitions" ? (
                <Music size={27} />
              ) : activite ===
                "khassidas" ? (
                <BookOpen size={27} />
              ) : activite ===
                "declamations" ? (
                <Mic2 size={27} />
              ) : (
                <CalendarDays size={27} />
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-400">
                {kourel?.nom}
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                {titre}
              </h2>

              <p className="mt-1 text-sm text-gray-300">
                Activité de votre Kourel
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          {activite ===
            "repetitions" && (
            <RepetitionsPanel
              kourel={kourel}
              programme={programme}
              repetitions={
                repetitions
              }
              chargement={
                chargements.repetitions
              }
              erreur={
                erreurs.repetitions
              }
              onActualiser={() =>
                actualiserActivite(
                  "repetitions"
                )
              }
            />
          )}

          {activite ===
            "khassidas" && (
            <KhassidasPanel
              khassidas={
                khassidas
              }
              chargement={
                chargements.khassidas
              }
              erreur={
                erreurs.khassidas
              }
              onActualiser={() =>
                actualiserActivite(
                  "khassidas"
                )
              }
            />
          )}

          {activite ===
            "declamations" && (
            <DeclamationsPanel
              programme={
                programme
              }
              declamations={
                declamations
              }
              chargement={
                chargements.declamations
              }
              erreur={
                erreurs.declamations
              }
              onActualiser={() =>
                actualiserActivite(
                  "declamations"
                )
              }
            />
          )}

          {activite ===
            "programme" && (
            <ProgrammeReligieuxPanel
              programme={
                programme
              }
              chargement={
                chargements.programme
              }
              erreur={
                erreurs.programme
              }
              onActualiser={() =>
                actualiserActivite(
                  "programme"
                )
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}


/* ============================================================
   DÉTAIL D'UN KOUREL
   ============================================================ */

function DetailKourel({
  kourel,
  membres,
  chargementMembres,
  onFermer,
  onOuvrirActivite,
}) {
  const gestionnaire =
    useMemo(() => {
      if (
        !kourel?.gestionnaire_membre_id
      ) {
        return null;
      }

      return membres.find(
        (membre) =>
          membre.membre_id ===
          kourel.gestionnaire_membre_id
      );
    }, [
      kourel,
      membres,
    ]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
      <div className="mx-auto mt-8 max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="relative bg-gray-900 px-6 py-7 text-white">
          <button
            type="button"
            onClick={onFermer}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>

          <div className="flex items-start gap-4 pr-12">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <Church size={30} />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-300">
                Mon Kourel
              </p>

              <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
                {kourel?.nom}
              </h2>

              {kourel?.description && (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300">
                  {kourel.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={Users}
              label="Membres"
              value={
                membres.length
              }
            />

          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                <Crown
                  size={21}
                  className="text-amber-700"
                />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Gestionnaire du Kourel
                </p>

                <p className="mt-1 text-lg font-bold text-gray-900">
                  {gestionnaire
                    ? nomComplet(
                        gestionnaire
                      )
                    : "Aucun gestionnaire désigné"}
                </p>

                {gestionnaire?.telephone && (
                  <p className="mt-1 text-sm text-gray-600">
                    {gestionnaire.telephone}
                  </p>
                )}
              </div>
            </div>
          </div>


          <section>
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Activités du Kourel
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Consultez les activités religieuses et musicales de votre Kourel.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <button
                type="button"
                onClick={() =>
                  onOuvrirActivite(
                    "repetitions"
                  )
                }
                className="group rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                    <Music
                      size={20}
                      className="text-gray-700"
                    />
                  </div>

                  <ChevronRight
                    size={18}
                    className="text-gray-400 transition group-hover:translate-x-1"
                  />
                </div>

                <p className="mt-3 font-semibold text-gray-900">
                  Répétitions
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Consultez le programme de répétition des Khassidas, leurs tons et leurs audios.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  onOuvrirActivite(
                    "khassidas"
                  )
                }
                className="group rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                    <BookOpen
                      size={20}
                      className="text-gray-700"
                    />
                  </div>

                  <ChevronRight
                    size={18}
                    className="text-gray-400 transition group-hover:translate-x-1"
                  />
                </div>

                <p className="mt-3 font-semibold text-gray-900">
                  Khassidas
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Consultez les Khassidas disponibles.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  onOuvrirActivite(
                    "declamations"
                  )
                }
                className="group rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                    <Mic2
                      size={20}
                      className="text-gray-700"
                    />
                  </div>

                  <ChevronRight
                    size={18}
                    className="text-gray-400 transition group-hover:translate-x-1"
                  />
                </div>

                <p className="mt-3 font-semibold text-gray-900">
                  Déclamations
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Consultez les Khassidas prévues pour les déclamations.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  onOuvrirActivite(
                    "programme"
                  )
                }
                className="group rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                    <CalendarDays
                      size={20}
                      className="text-gray-700"
                    />
                  </div>

                  <ChevronRight
                    size={18}
                    className="text-gray-400 transition group-hover:translate-x-1"
                  />
                </div>

                <p className="mt-3 font-semibold text-gray-900">
                  Programme
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Consultez le programme religieux mensuel de votre Kourel.
                </p>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}


/* ============================================================
   CARTE KOUREL
   ============================================================ */

function KourelCard({
  kourel,
  onVoir,
  onAfficherMembres,
  membresCount,
}) {
  const [ouvert, setOuvert] =
    useState(false);

  return (
    <article className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="bg-gray-900 px-5 py-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <Church size={27} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Kourel
              </p>

              <h2 className="mt-1 truncate text-xl font-bold">
                {kourel.nom}
              </h2>
            </div>
          </div>

          <span className="shrink-0 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
            Actif
          </span>
        </div>
      </div>

      <div className="p-5">
        {kourel.description ? (
          <p className="min-h-[48px] text-sm leading-6 text-gray-600">
            {kourel.description}
          </p>
        ) : (
          <p className="min-h-[48px] text-sm italic text-gray-400">
            Aucune description renseignée.
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-gray-50 p-3">
            <div className="flex items-center gap-2 text-gray-500">
              <Users size={17} />

              <span className="text-xs font-medium">
                Membres
              </span>
            </div>

            <p className="mt-1 text-lg font-bold text-gray-900">
              {membresCount}
            </p>
          </div>

          <div className="rounded-2xl bg-gray-50 p-3">
            <div className="flex items-center gap-2 text-gray-500">
              <CalendarDays size={17} />

              <span className="text-xs font-medium">
                Depuis
              </span>
            </div>

            <p className="mt-1 text-sm font-bold text-gray-900">
              {formaterDate(
                kourel.created_at
              )}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-3">
          <div className="flex items-center gap-2">
            <Crown
              size={17}
              className="text-amber-600"
            />

            <span className="text-xs font-semibold text-amber-700">
              Gestionnaire
            </span>
          </div>

          <p className="mt-1 text-sm font-semibold text-gray-900">
            {kourel.gestionnaire_membre_id
              ? "Gestionnaire désigné"
              : "Aucun gestionnaire désigné"}
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onVoir}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Voir mon Kourel
            <ChevronRight size={17} />
          </button>

          <button
            type="button"
            onClick={() => {
              setOuvert(
                !ouvert
              );

              if (!ouvert) {
                onAfficherMembres();
              }
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Membres

            <ChevronDown
              size={17}
              className={
                ouvert
                  ? "rotate-180"
                  : ""
              }
            />
          </button>
        </div>

        {ouvert && (
          <div className="mt-4 rounded-2xl bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Users size={17} />
              Membres du Kourel
            </div>

            <p className="mt-2 text-sm text-gray-500">
              {membresCount === 0
                ? "Aucun membre actif."
                : `${membresCount} membre${
                    membresCount > 1
                      ? "s"
                      : ""
                  } actif${
                    membresCount > 1
                      ? "s"
                      : ""
                  }.`}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}


/* ============================================================
   COMPOSANT PRINCIPAL
   ============================================================ */

export default function MonKourel() {
  const {
    utilisateur,
  } = useAuth();

  const [kourels, setKourels] =
    useState([]);

  const [
    programmes,
    setProgrammes,
  ] = useState([]);

  const [
    chargement,
    setChargement,
  ] = useState(true);

  const [
    erreur,
    setErreur,
  ] = useState("");

  const [
    kourelSelectionne,
    setKourelSelectionne,
  ] = useState(null);

  const [
    activiteSelectionnee,
    setActiviteSelectionnee,
  ] = useState(null);

  const [
    programmeSelectionne,
    setProgrammeSelectionne,
  ] = useState(null);

  const [
    membresParKourel,
    setMembresParKourel,
  ] = useState({});

  const [
    chargementMembres,
    setChargementMembres,
  ] = useState({});


  /* ==========================================================
     DONNÉES ACTIVITÉS
     ========================================================== */

  const [
    repetitions,
    setRepetitions,
  ] = useState([]);

  const [
    khassidas,
    setKhassidas,
  ] = useState([]);

  const [
    declamations,
    setDeclamations,
  ] = useState([]);


  const [
    chargementsActivites,
    setChargementsActivites,
  ] = useState({
    repetitions: false,
    khassidas: false,
    declamations: false,
    programme: false,
  });


  const [
    erreursActivites,
    setErreursActivites,
  ] = useState({
    repetitions: "",
    khassidas: "",
    declamations: "",
    programme: "",
  });


  /* ==========================================================
     CHARGER MES KOURELS + PROGRAMMES
     ========================================================== */

  const chargerMesKourels =
    useCallback(async () => {
      try {
        setChargement(true);
        setErreur("");

        const responseKourels =
          await api.get(
            "/kourels/mes-kourels"
          );

        const donneesKourels =
          normaliserListe(
            responseKourels.data,
            [
              "kourels",
              "data",
            ]
          );

        setKourels(
          donneesKourels
        );

        const responseProgrammes =
          await api.get(
            "/programmes-religieux"
          );

        const donneesProgrammes =
          normaliserListe(
            responseProgrammes.data,
            [
              "programmes",
              "data",
            ]
          );

        setProgrammes(
          donneesProgrammes
        );
      } catch (error) {
        console.error(
          "Erreur chargement Mes Kourels :",
          error
        );

        setErreur(
          extraireMessageErreur(
            error
          )
        );
      } finally {
        setChargement(false);
      }
    }, []);


  /* ==========================================================
     CHARGER MEMBRES
     ========================================================== */

  const chargerMembres =
    useCallback(
      async (kourelId) => {
        if (!kourelId) {
          return [];
        }

        try {
          setChargementMembres(
            (ancien) => ({
              ...ancien,
              [kourelId]: true,
            })
          );

          const response =
            await api.get(
              `/kourels/${kourelId}/membres`
            );

          const membres =
            normaliserListe(
              response.data,
              [
                "membres",
                "data",
              ]
            );

          setMembresParKourel(
            (ancien) => ({
              ...ancien,
              [kourelId]: membres,
            })
          );

          return membres;
        } catch (error) {
          console.error(
            `Erreur chargement membres Kourel ${kourelId} :`,
            error
          );

          setMembresParKourel(
            (ancien) => ({
              ...ancien,
              [kourelId]: [],
            })
          );

          return [];
        } finally {
          setChargementMembres(
            (ancien) => ({
              ...ancien,
              [kourelId]: false,
            })
          );
        }
      },
      []
    );


  /* ==========================================================
     TROUVER LE PROGRAMME DU KOUREL
     ========================================================== */

  const trouverProgrammeKourel =
    useCallback(
      (kourelId) => {
        if (!kourelId) {
          return null;
        }

        const programmesKourel =
          programmes.filter(
            (programme) =>
              Number(
                programme?.kourel_id
              ) === Number(
                kourelId
              ) &&
              programme?.actif !==
                false
          );

        if (
          programmesKourel.length ===
          0
        ) {
          return null;
        }

        /*
         * Le programme le plus récent reste le programme
         * mensuel de référence du Kourel.
         */
        return [
          ...programmesKourel,
        ].sort(
          (a, b) => {
            const anneeA =
              Number(a?.annee || 0);

            const anneeB =
              Number(b?.annee || 0);

            if (
              anneeA !==
              anneeB
            ) {
              return (
                anneeB -
                anneeA
              );
            }

            return (
              Number(
                b?.mois || 0
              ) -
              Number(
                a?.mois || 0
              )
            );
          }
        )[0];
      },
      [programmes]
    );


  /* ==========================================================
     CHARGER LE PROGRAMME COMPLET
     ========================================================== */

  const chargerProgrammeComplet =
    useCallback(
      async (programmeId) => {
        if (!programmeId) {
          return null;
        }

        const response =
          await api.get(
            `/programmes-religieux/${programmeId}`
          );

        const programme =
          extraireProgramme(
            response.data
          );

        setProgrammeSelectionne(
          programme
        );

        return programme;
      },
      []
    );


  /* ==========================================================
     CHARGER UNE ACTIVITÉ
     ========================================================== */

  const chargerActivite =
    useCallback(
      async (
        type,
        kourelId
      ) => {
        if (!kourelId) {
          return;
        }

        setChargementsActivites(
          (ancien) => ({
            ...ancien,
            [type]: true,
          })
        );

        setErreursActivites(
          (ancien) => ({
            ...ancien,
            [type]: "",
          })
        );


        /*
         * Nettoyage des anciennes données.
         */
        if (
          type === "repetitions"
        ) {
          setRepetitions([]);
          setKhassidas([]);
        }

        if (
          type === "khassidas"
        ) {
          setKhassidas([]);
          setRepetitions([]);
        }

        if (
          type === "declamations"
        ) {
          setDeclamations([]);
        }


        try {
          /*
           * ==================================================
           * 1. TROUVER LE PROGRAMME DU KOUREL
           * ==================================================
           */

          const programmeResume =
            trouverProgrammeKourel(
              kourelId
            );

          if (
            !programmeResume?.id
          ) {
            setProgrammeSelectionne(
              null
            );

            if (
              type ===
              "repetitions"
            ) {
              setRepetitions([]);
              setKhassidas([]);
            }

            if (
              type ===
              "khassidas"
            ) {
              setKhassidas([]);
              setRepetitions([]);
            }

            if (
              type ===
              "declamations"
            ) {
              setDeclamations([]);
            }

            return;
          }


          /*
           * ==================================================
           * 2. CHARGER LE PROGRAMME COMPLET
           * ==================================================
           */

          const programme =
            await chargerProgrammeComplet(
              programmeResume.id
            );

          if (!programme) {
            return;
          }


          /*
           * ==================================================
           * 3. PROGRAMME RELIGIEUX
           * ==================================================
           */

          if (
            type ===
            "programme"
          ) {
            setProgrammeSelectionne(
              programme
            );

            return;
          }


          /*
           * ==================================================
           * 4. RÉCUPÉRER TOUTES LES RÉPÉTITIONS
           * ==================================================
           */

          const toutesLesRepetitions =
            normaliserListe(
              programme?.repetitions,
              []
            );


          /*
           * ==================================================
           * 5. TROUVER UNIQUEMENT LA PROCHAINE
           * ==================================================
           */

          const prochaineRepetition =
            trouverProchaineRepetition(
              toutesLesRepetitions
            );


          /*
           * ==================================================
           * 6. AUCUNE PROCHAINE RÉPÉTITION
           * ==================================================
           */

          if (
            !prochaineRepetition
          ) {
            if (
              type ===
              "repetitions"
            ) {
              setRepetitions([]);
              setKhassidas([]);
            }

            if (
              type ===
              "khassidas"
            ) {
              setKhassidas([]);
              setRepetitions([]);
            }

            return;
          }


          /*
           * ==================================================
           * 7. RÉCUPÉRER LES KHASSIDAS DE CETTE RÉPÉTITION
           *
           * C'EST ICI QUE SE TROUVAIT LE PROBLÈME.
           *
           * On ne se contente plus de :
           *
           * prochaineRepetition.khassidas
           *
           * On appelle explicitement :
           *
           * GET /programmes-religieux/
           *     {programmeId}/repetitions/
           *     {repetitionId}/khassidas
           * ==================================================
           */

          let khassidasChargees = [];

          try {
            khassidasChargees =
              await chargerKhassidasRepetition(
                programme.id,
                prochaineRepetition.id
              );
          } catch (errorKhassidas) {
            console.error(
              "Erreur endpoint Khassidas répétition :",
              errorKhassidas
            );

            /*
             * Fallback sur les données imbriquées
             * du programme complet.
             */
            khassidasChargees =
              Array.isArray(
                prochaineRepetition.khassidas
              )
                ? prochaineRepetition.khassidas
                    .map(
                      normaliserAffectation
                    )
                    .filter(Boolean)
                    .sort(
                      (a, b) =>
                        Number(
                          a.ordre || 0
                        ) -
                        Number(
                          b.ordre || 0
                        )
                    )
                : [];
          }


          /*
           * ==================================================
           * 8. RÉPÉTITION
           * ==================================================
           */

          if (
            type ===
            "repetitions"
          ) {
            const prochaineEnrichie =
              {
                ...prochaineRepetition,
                khassidas:
                  khassidasChargees,
              };

            setRepetitions([
              prochaineEnrichie,
            ]);

            setKhassidas(
              khassidasChargees
            );

            return;
          }


          /*
           * ==================================================
           * 9. KHASSIDAS
           * ==================================================
           */

          if (
            type ===
            "khassidas"
          ) {
            const prochaineEnrichie =
              {
                ...prochaineRepetition,
                khassidas:
                  khassidasChargees,
              };

            setRepetitions([
              prochaineEnrichie,
            ]);

            setKhassidas(
              khassidasChargees
            );

            return;
          }


          /*
           * ==================================================
           * 10. DÉCLAMATIONS
           * ==================================================
           */

          if (
            type ===
            "declamations"
          ) {
            const donnees =
              normaliserListe(
                programme?.declamations,
                []
              );

            setDeclamations(
              donnees
            );

            return;
          }
        } catch (error) {
          console.error(
            `Erreur chargement activité ${type} :`,
            error
          );

          setErreursActivites(
            (ancien) => ({
              ...ancien,
              [type]:
                extraireMessageErreur(
                  error
                ),
            })
          );

          if (
            type ===
            "repetitions"
          ) {
            setRepetitions([]);
            setKhassidas([]);
          }

          if (
            type ===
            "khassidas"
          ) {
            setKhassidas([]);
            setRepetitions([]);
          }

          if (
            type ===
            "declamations"
          ) {
            setDeclamations([]);
          }

          if (
            type ===
            "programme"
          ) {
            setProgrammeSelectionne(
              null
            );
          }
        } finally {
          setChargementsActivites(
            (ancien) => ({
              ...ancien,
              [type]: false,
            })
          );
        }
      },
      [
        chargerProgrammeComplet,
        trouverProgrammeKourel,
      ]
    );


  /* ==========================================================
     OUVRIR DÉTAIL KOUREL
     ========================================================== */

  const ouvrirDetail =
    async (kourel) => {
      setKourelSelectionne(
        kourel
      );

      setActiviteSelectionnee(
        null
      );

      setProgrammeSelectionne(
        null
      );

      setRepetitions([]);
      setKhassidas([]);
      setDeclamations([]);

      setErreursActivites({
        repetitions: "",
        khassidas: "",
        declamations: "",
        programme: "",
      });

      if (
        !membresParKourel[
          kourel.id
        ]
      ) {
        await chargerMembres(
          kourel.id
        );
      }
    };


  /* ==========================================================
     OUVRIR ACTIVITÉ
     ========================================================== */

  const ouvrirActivite =
    async (type) => {
      if (
        !kourelSelectionne
      ) {
        return;
      }

      setActiviteSelectionnee(
        type
      );

      await chargerActivite(
        type,
        kourelSelectionne.id
      );
    };


  /* ==========================================================
     ACTUALISER ACTIVITÉ
     ========================================================== */

  const actualiserActivite =
    async (type) => {
      if (
        !kourelSelectionne
      ) {
        return;
      }

      await chargerActivite(
        type,
        kourelSelectionne.id
      );
    };


  /* ==========================================================
     INITIALISATION
     ========================================================== */

  useEffect(() => {
    if (!utilisateur) {
      return;
    }

    chargerMesKourels();
  }, [
    utilisateur,
    chargerMesKourels,
  ]);


  /* ==========================================================
     NOMBRE TOTAL MEMBRES
     ========================================================== */

  const totalMembres =
    useMemo(() => {
      return Object.values(
        membresParKourel
      ).reduce(
        (
          total,
          membres
        ) =>
          total +
          (Array.isArray(
            membres
          )
            ? membres.length
            : 0),
        0
      );
    }, [
      membresParKourel,
    ]);


  /* ==========================================================
     CHARGEMENT
     ========================================================== */

  if (chargement) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <Loader2
                size={42}
                className="mx-auto animate-spin text-gray-700"
              />

              <p className="mt-4 font-semibold text-gray-800">
                Chargement de vos Kourels...
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Récupération de vos informations.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }


  /* ==========================================================
     RENDU
     ========================================================== */

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ====================================================
            EN-TÊTE
            ==================================================== */}

        <div className="overflow-hidden rounded-3xl bg-gray-900 text-white shadow-lg">
          <div className="px-5 py-7 sm:px-8 sm:py-9">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                  <Church size={32} />
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-400">
                    Mon espace
                  </p>

                  <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                    Mes Kourels
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300">
                    Retrouvez ici les Kourels auxquels vous appartenez,
                    leurs membres, leur gestionnaire ainsi que leurs
                    activités religieuses.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  chargerMesKourels
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/20"
              >
                <RefreshCw size={17} />
                Actualiser
              </button>
            </div>
          </div>
        </div>


        {/* ====================================================
            ERREUR
            ==================================================== */}

        {erreur && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={21}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <div className="flex-1">
                <p className="font-semibold text-red-800">
                  Impossible de charger vos Kourels
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {erreur}
                </p>

                <button
                  type="button"
                  onClick={
                    chargerMesKourels
                  }
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                >
                  <RefreshCw size={14} />
                  Réessayer
                </button>
              </div>
            </div>
          </div>
        )}


        {/* ====================================================
            STATISTIQUES
            ==================================================== */}

        {!erreur &&
          kourels.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                icon={Church}
                label="Mes Kourels"
                value={
                  kourels.length
                }
              />

              <StatCard
                icon={Users}
                label="Membres chargés"
                value={
                  totalMembres
                }
              />

      
            </div>
          )}


        {/* ====================================================
            AUCUN KOUREL
            ==================================================== */}

        {!erreur &&
          kourels.length ===
            0 && (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                <Church
                  size={30}
                  className="text-gray-500"
                />
              </div>

              <h2 className="mt-5 text-xl font-bold text-gray-900">
                Vous n'appartenez à aucun Kourel
              </h2>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-500">
                Aucun Kourel actif n'est actuellement associé à votre compte.
              </p>

              <div className="mx-auto mt-5 flex max-w-md items-start gap-3 rounded-2xl bg-gray-50 p-4 text-left">
                <Info
                  size={19}
                  className="mt-0.5 shrink-0 text-gray-500"
                />

                <p className="text-xs leading-5 text-gray-600">
                  Si vous pensez devoir appartenir à un Kourel,
                  veuillez contacter le responsable chargé de la
                  gestion des membres.
                </p>
              </div>
            </div>
          )}


        {/* ====================================================
            LISTE KOURELS
            ==================================================== */}

        {!erreur &&
          kourels.length >
            0 && (
            <section>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Vos Kourels
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Vous êtes actuellement membre de{" "}
                  <strong>
                    {kourels.length}
                  </strong>{" "}
                  Kourel
                  {kourels.length >
                  1
                    ? "s"
                    : ""}.
                </p>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                {kourels.map(
                  (kourel) => (
                    <KourelCard
                      key={
                        kourel.id
                      }
                      kourel={
                        kourel
                      }
                      membresCount={
                        (
                          membresParKourel[
                            kourel.id
                          ] || []
                        ).length
                      }
                      onVoir={() =>
                        ouvrirDetail(
                          kourel
                        )
                      }
                      onAfficherMembres={() =>
                        chargerMembres(
                          kourel.id
                        )
                      }
                    />
                  )
                )}
              </div>
            </section>
          )}


        {/* ====================================================
            MODAL DÉTAIL KOUREL
            ==================================================== */}

        {kourelSelectionne &&
          !activiteSelectionnee && (
            <DetailKourel
              kourel={
                kourelSelectionne
              }
              membres={
                membresParKourel[
                  kourelSelectionne.id
                ] || []
              }
              chargementMembres={
                Boolean(
                  chargementMembres[
                    kourelSelectionne.id
                  ]
                )
              }
              onFermer={() => {
                setKourelSelectionne(
                  null
                );

                setActiviteSelectionnee(
                  null
                );

                setProgrammeSelectionne(
                  null
                );

                setRepetitions([]);
                setKhassidas([]);
                setDeclamations([]);
              }}
              onOuvrirActivite={
                ouvrirActivite
              }
            />
          )}


        {/* ====================================================
            MODAL ACTIVITÉ
            ==================================================== */}

        {kourelSelectionne &&
          activiteSelectionnee && (
            <ActivitesKourel
              kourel={
                kourelSelectionne
              }
              activite={
                activiteSelectionnee
              }
              programme={
                programmeSelectionne
              }
              repetitions={
                repetitions
              }
              khassidas={
                khassidas
              }
              declamations={
                declamations
              }
              chargements={
                chargementsActivites
              }
              erreurs={
                erreursActivites
              }
              actualiserActivite={
                actualiserActivite
              }
              onFermer={() => {
                setActiviteSelectionnee(
                  null
                );

                setRepetitions([]);
                setKhassidas([]);
                setDeclamations([]);
              }}
            />
          )}
      </div>
    </div>
  );
}