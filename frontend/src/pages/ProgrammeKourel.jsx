import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock3,
  Edit3,
  Loader2,
  MapPin,
  Music,
  Plus,
  Save,
  Trash2,
  X,
  BookOpen,
  Headphones,
  ListOrdered,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";


/* ============================================================
   UTILITAIRES
============================================================ */

function formaterDate(dateValue) {
  if (!dateValue) return "Date non définie";

  try {
    return new Date(dateValue).toLocaleDateString(
      "fr-FR",
      {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  } catch {
    return dateValue;
  }
}


function formaterHeure(value) {
  if (!value) return "";

  return String(value).substring(0, 5);
}


function messageErreur(error) {
  return (
    error?.response?.data?.detail ||
    error?.message ||
    "Une erreur est survenue."
  );
}


/* ============================================================
   COMPOSANT PRINCIPAL
============================================================ */

export default function ProgrammeKourel() {
  const { utilisateur, aPermission } = useAuth();

  const [programmes, setProgrammes] = useState([]);
  const [programmeSelectionne, setProgrammeSelectionne] =
    useState(null);

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [repetitionOuverte, setRepetitionOuverte] =
    useState(null);

  const [khassidas, setKhassidas] = useState([]);

  const [chargementKhassidas, setChargementKhassidas] =
    useState(false);

  const [message, setMessage] = useState("");

  const [modalRepetition, setModalRepetition] =
    useState(false);

  const [repetitionEnEdition, setRepetitionEnEdition] =
    useState(null);

  const [formRepetition, setFormRepetition] = useState({
    date_repetition: "",
    heure_debut: "",
    heure_fin: "",
    lieu: "",
  });

  const [modalKhassida, setModalKhassida] =
    useState(false);

  const [khassidaEnEdition, setKhassidaEnEdition] =
    useState(null);

  const [formKhassida, setFormKhassida] = useState({
    khassida_id: "",
    audio_id: "",
    ordre: 1,
  });

  const [listeKhassidas, setListeKhassidas] =
    useState([]);

  const [listeAudios, setListeAudios] =
    useState([]);

  const [chargementReferentiels, setChargementReferentiels] =
    useState(false);


  /* ==========================================================
     PERMISSIONS
  ========================================================== */

  const peutConsulter = useMemo(
    () =>
      aPermission
        ? aPermission("KOUREL_CONSULTER")
        : false,
    [aPermission]
  );

  const peutModifier = useMemo(
    () => {
      if (!aPermission) return false;

      return (
        aPermission("KOUREL_MODIFIER") ||
        aPermission("KOUREL_CREER")
      );
    },
    [aPermission]
  );


  /* ==========================================================
     CHARGER LES PROGRAMMES
  ========================================================== */

  async function chargerProgrammes() {
    setChargement(true);
    setErreur("");

    try {
      const response = await api.get(
        "/programmes-religieux"
      );

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setProgrammes(data);

      if (data.length > 0) {
        await chargerProgramme(data[0].id);
      } else {
        setProgrammeSelectionne(null);
      }
    } catch (error) {
      setErreur(messageErreur(error));
    } finally {
      setChargement(false);
    }
  }


  /* ==========================================================
     CHARGER UN PROGRAMME
  ========================================================== */

  async function chargerProgramme(programmeId) {
    try {
      const response = await api.get(
        `/programmes-religieux/${programmeId}`
      );

      setProgrammeSelectionne(response.data);
    } catch (error) {
      setErreur(messageErreur(error));
    }
  }


  useEffect(() => {
    if (peutConsulter) {
      chargerProgrammes();
    } else {
      setChargement(false);
      setErreur(
        "Vous n'avez pas la permission de consulter les programmes."
      );
    }
  }, [peutConsulter]);


  /* ==========================================================
     CHARGER LES KHASSIDAS
  ========================================================== */

  async function chargerKhassidas(repetitionId) {
    if (!programmeSelectionne?.id) return;

    setChargementKhassidas(true);
    setErreur("");

    try {
      const response = await api.get(
        `/programmes-religieux/${programmeSelectionne.id}/repetitions/${repetitionId}/khassidas`
      );

      setKhassidas(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error) {
      setErreur(messageErreur(error));
    } finally {
      setChargementKhassidas(false);
    }
  }


  /* ==========================================================
     OUVRIR / FERMER UNE RÉPÉTITION
  ========================================================== */

  async function toggleRepetition(repetitionId) {
    if (repetitionOuverte === repetitionId) {
      setRepetitionOuverte(null);
      setKhassidas([]);
      return;
    }

    setRepetitionOuverte(repetitionId);

    await chargerKhassidas(repetitionId);
  }


  /* ==========================================================
     CHARGER LES KHASSIDAS DISPONIBLES
  ========================================================== */

  async function chargerReferentiels() {
    setChargementReferentiels(true);

    try {
      const [khassidasResponse] =
        await Promise.all([
          api.get("/khassidas"),
        ]);

      const khassidasData =
        Array.isArray(khassidasResponse.data)
          ? khassidasResponse.data
          : [];

      setListeKhassidas(khassidasData);

      if (khassidasData.length > 0) {
        await chargerAudiosKhassida(
          khassidasData[0].id
        );
      }
    } catch (error) {
      setErreur(messageErreur(error));
    } finally {
      setChargementReferentiels(false);
    }
  }


  /* ==========================================================
     CHARGER LES AUDIOS D'UNE KHASSIDA
  ========================================================== */

  async function chargerAudiosKhassida(
    khassidaId
  ) {
    if (!khassidaId) {
      setListeAudios([]);
      return;
    }

    try {
      const response = await api.get(
        `/audios?khassida_id=${khassidaId}`
      );

      const audios = Array.isArray(response.data)
        ? response.data
        : [];

      setListeAudios(audios);

      setFormKhassida((ancien) => ({
        ...ancien,
        audio_id:
          ancien.audio_id &&
          audios.some(
            (audio) =>
              String(audio.id) ===
              String(ancien.audio_id)
          )
            ? ancien.audio_id
            : "",
      }));
    } catch (error) {
      setErreur(messageErreur(error));
      setListeAudios([]);
    }
  }


  /* ==========================================================
     MODAL RÉPÉTITION
  ========================================================== */

  function ouvrirAjoutRepetition() {
    setRepetitionEnEdition(null);

    setFormRepetition({
      date_repetition: "",
      heure_debut: "",
      heure_fin: "",
      lieu: "",
    });

    setModalRepetition(true);
  }


  function ouvrirModificationRepetition(
    repetition
  ) {
    setRepetitionEnEdition(repetition);

    setFormRepetition({
      date_repetition:
        repetition.date_repetition || "",
      heure_debut:
        formaterHeure(repetition.heure_debut),
      heure_fin:
        formaterHeure(repetition.heure_fin),
      lieu:
        repetition.lieu || "",
    });

    setModalRepetition(true);
  }


  function fermerModalRepetition() {
    setModalRepetition(false);
    setRepetitionEnEdition(null);
  }


  /* ==========================================================
     SAUVEGARDER RÉPÉTITION
  ========================================================== */

  async function sauvegarderRepetition(event) {
    event.preventDefault();

    if (!programmeSelectionne?.id) return;

    setErreur("");
    setMessage("");

    try {
      const params = new URLSearchParams();

      params.append(
        "date_repetition",
        formRepetition.date_repetition
      );

      if (formRepetition.heure_debut) {
        params.append(
          "heure_debut",
          formRepetition.heure_debut
        );
      }

      if (formRepetition.heure_fin) {
        params.append(
          "heure_fin",
          formRepetition.heure_fin
        );
      }

      if (formRepetition.lieu.trim()) {
        params.append(
          "lieu",
          formRepetition.lieu.trim()
        );
      }

      if (repetitionEnEdition) {
        await api.put(
          `/programmes-religieux/${programmeSelectionne.id}/repetitions/${repetitionEnEdition.id}?${params.toString()}`
        );

        setMessage(
          "Répétition modifiée avec succès."
        );
      } else {
        await api.post(
          `/programmes-religieux/${programmeSelectionne.id}/repetitions?${params.toString()}`
        );

        setMessage(
          "Répétition ajoutée avec succès."
        );
      }

      fermerModalRepetition();

      await chargerProgramme(
        programmeSelectionne.id
      );
    } catch (error) {
      setErreur(messageErreur(error));
    }
  }


  /* ==========================================================
     SUPPRIMER RÉPÉTITION
  ========================================================== */

  async function supprimerRepetition(
    repetitionId
  ) {
    if (
      !window.confirm(
        "Voulez-vous vraiment supprimer cette répétition ?"
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/programmes-religieux/${programmeSelectionne.id}/repetitions/${repetitionId}`
      );

      setMessage(
        "Répétition supprimée avec succès."
      );

      setRepetitionOuverte(null);

      await chargerProgramme(
        programmeSelectionne.id
      );
    } catch (error) {
      setErreur(messageErreur(error));
    }
  }


  /* ==========================================================
     MODAL KHASSIDA
  ========================================================== */

  async function ouvrirAjoutKhassida() {
    if (!repetitionOuverte) return;

    setKhassidaEnEdition(null);

    setFormKhassida({
      khassida_id: "",
      audio_id: "",
      ordre: khassidas.length + 1,
    });

    setModalKhassida(true);

    await chargerReferentiels();
  }


  async function ouvrirModificationKhassida(
    item
  ) {
    setKhassidaEnEdition(item);

    setFormKhassida({
      khassida_id:
        item.khassida_id || "",
      audio_id:
        item.audio_id || "",
      ordre:
        item.ordre || 1,
    });

    setModalKhassida(true);

    await chargerReferentiels();

    if (item.khassida_id) {
      await chargerAudiosKhassida(
        item.khassida_id
      );
    }
  }


  function fermerModalKhassida() {
    setModalKhassida(false);
    setKhassidaEnEdition(null);
    setListeAudios([]);
  }


  /* ==========================================================
     CHANGEMENT KHASSIDA
  ========================================================== */

  async function handleKhassidaChange(event) {
    const value = event.target.value;

    setFormKhassida((ancien) => ({
      ...ancien,
      khassida_id: value,
      audio_id: "",
    }));

    await chargerAudiosKhassida(value);
  }


  /* ==========================================================
     SAUVEGARDER KHASSIDA
  ========================================================== */

  async function sauvegarderKhassida(event) {
    event.preventDefault();

    if (
      !programmeSelectionne?.id ||
      !repetitionOuverte
    ) {
      return;
    }

    if (!formKhassida.khassida_id) {
      setErreur(
        "Veuillez sélectionner une Khassida."
      );
      return;
    }

    if (!formKhassida.audio_id) {
      setErreur(
        "Veuillez sélectionner un audio."
      );
      return;
    }

    if (
      !formKhassida.ordre ||
      Number(formKhassida.ordre) < 1
    ) {
      setErreur(
        "L'ordre doit être supérieur ou égal à 1."
      );
      return;
    }

    setErreur("");
    setMessage("");

    try {
      const params = new URLSearchParams();

      params.append(
        "khassida_id",
        formKhassida.khassida_id
      );

      params.append(
        "audio_id",
        formKhassida.audio_id
      );

      params.append(
        "ordre",
        String(formKhassida.ordre)
      );

      if (khassidaEnEdition) {
        await api.put(
          `/programmes-religieux/${programmeSelectionne.id}/repetitions/${repetitionOuverte}/khassidas/${khassidaEnEdition.id}?${params.toString()}`
        );

        setMessage(
          "Khassida modifiée avec succès."
        );
      } else {
        await api.post(
          `/programmes-religieux/${programmeSelectionne.id}/repetitions/${repetitionOuverte}/khassidas?${params.toString()}`
        );

        setMessage(
          "Khassida ajoutée à la répétition."
        );
      }

      fermerModalKhassida();

      await chargerKhassidas(
        repetitionOuverte
      );

      await chargerProgramme(
        programmeSelectionne.id
      );
    } catch (error) {
      setErreur(messageErreur(error));
    }
  }


  /* ==========================================================
     SUPPRIMER KHASSIDA
  ========================================================== */

  async function supprimerKhassida(
    item
  ) {
    if (
      !window.confirm(
        `Retirer "${item.khassida?.titre || "cette Khassida"}" de la répétition ?`
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/programmes-religieux/${programmeSelectionne.id}/repetitions/${repetitionOuverte}/khassidas/${item.id}`
      );

      setMessage(
        "Khassida retirée de la répétition."
      );

      await chargerKhassidas(
        repetitionOuverte
      );

      await chargerProgramme(
        programmeSelectionne.id
      );
    } catch (error) {
      setErreur(messageErreur(error));
    }
  }


  /* ==========================================================
     RENDU CHARGEMENT
  ========================================================== */

  if (chargement) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-emerald-700">
          <Loader2
            size={24}
            className="animate-spin"
          />
          <span className="font-semibold">
            Chargement du programme...
          </span>
        </div>
      </div>
    );
  }


  /* ==========================================================
     RENDU ERREUR PERMISSION
  ========================================================== */

  if (!peutConsulter) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle
            size={42}
            className="mx-auto text-red-500"
          />

          <h2 className="mt-4 text-xl font-black text-red-800">
            Accès refusé
          </h2>

          <p className="mt-2 text-sm text-red-600">
            Vous n'avez pas la permission de consulter
            le programme du Kourel.
          </p>
        </div>
      </div>
    );
  }


  /* ==========================================================
     PROGRAMME VIDE
  ========================================================== */

  if (!programmeSelectionne) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <CalendarDays
            size={50}
            className="mx-auto text-slate-300"
          />

          <h2 className="mt-5 text-xl font-black text-slate-800">
            Aucun programme religieux
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Aucun programme mensuel n'est actuellement
            disponible pour votre Kourel.
          </p>
        </div>
      </div>
    );
  }


  const repetitions =
    programmeSelectionne.repetitions || [];


  /* ==========================================================
     RENDU PRINCIPAL
  ========================================================== */

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">

      <div className="mx-auto max-w-7xl">

        {/* ====================================================
            EN-TÊTE
        ==================================================== */}

        <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 p-6 text-white shadow-xl sm:p-8">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <div className="mb-3 flex items-center gap-2 text-emerald-300">
                <CalendarDays size={18} />

                <span className="text-xs font-black uppercase tracking-[0.2em]">
                  Programme du Kourel
                </span>
              </div>

              <h1 className="text-3xl font-black sm:text-4xl">
                Programme religieux
              </h1>

              <p className="mt-3 text-sm text-emerald-100/70">
                Programme du mois{" "}
                <strong>
                  {String(
                    programmeSelectionne.mois
                  ).padStart(2, "0")}
                  /
                  {programmeSelectionne.annee}
                </strong>
              </p>
            </div>

            {peutModifier && (
              <button
                type="button"
                onClick={ouvrirAjoutRepetition}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <Plus size={18} />
                Ajouter une répétition
              </button>
            )}

          </div>
        </div>


        {/* ====================================================
            MESSAGES
        ==================================================== */}

        {message && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={18} />
            {message}

            <button
              type="button"
              className="ml-auto"
              onClick={() => setMessage("")}
            >
              <X size={16} />
            </button>
          </div>
        )}


        {erreur && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>{erreur}</span>

            <button
              type="button"
              className="ml-auto"
              onClick={() => setErreur("")}
            >
              <X size={16} />
            </button>
          </div>
        )}


        {/* ====================================================
            INFORMATIONS PROGRAMME
        ==================================================== */}

        <div className="mb-8 grid gap-4 sm:grid-cols-3">

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Début
            </p>

            <p className="mt-2 font-black text-slate-800">
              {formaterDate(
                programmeSelectionne.date_debut
              )}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Fin
            </p>

            <p className="mt-2 font-black text-slate-800">
              {formaterDate(
                programmeSelectionne.date_fin
              )}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Répétitions
            </p>

            <p className="mt-2 text-2xl font-black text-emerald-700">
              {repetitions.length}
            </p>
          </div>

        </div>


        {/* ====================================================
            RÉPÉTITIONS
        ==================================================== */}

        <div className="space-y-5">

          {repetitions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <CalendarDays
                size={42}
                className="mx-auto text-slate-300"
              />

              <p className="mt-4 font-bold text-slate-600">
                Aucune répétition programmée.
              </p>

              {peutModifier && (
                <button
                  type="button"
                  onClick={ouvrirAjoutRepetition}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white"
                >
                  <Plus size={17} />
                  Ajouter une répétition
                </button>
              )}
            </div>
          ) : (
            repetitions.map((repetition) => {

              const ouverte =
                repetitionOuverte ===
                repetition.id;

              return (
                <div
                  key={repetition.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >

                  {/* ==========================================
                      EN-TÊTE RÉPÉTITION
                  ========================================== */}

                  <div className="p-5 sm:p-6">

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                      <button
                        type="button"
                        onClick={() =>
                          toggleRepetition(
                            repetition.id
                          )
                        }
                        className="flex min-w-0 flex-1 items-center gap-4 text-left"
                      >

                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                          <CalendarDays
                            size={25}
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="text-lg font-black capitalize text-slate-900">
                            {formaterDate(
                              repetition.date_repetition
                            )}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">

                            {(repetition.heure_debut ||
                              repetition.heure_fin) && (
                              <span className="inline-flex items-center gap-1.5">
                                <Clock3 size={14} />

                                {formaterHeure(
                                  repetition.heure_debut
                                )}

                                {repetition.heure_fin &&
                                  ` - ${formaterHeure(
                                    repetition.heure_fin
                                  )}`}
                              </span>
                            )}

                            {repetition.lieu && (
                              <span className="inline-flex items-center gap-1.5">
                                <MapPin size={14} />
                                {repetition.lieu}
                              </span>
                            )}

                          </div>
                        </div>

                        <div className="ml-auto">
                          {ouverte ? (
                            <ChevronUp
                              size={20}
                              className="text-slate-400"
                            />
                          ) : (
                            <ChevronDown
                              size={20}
                              className="text-slate-400"
                            />
                          )}
                        </div>

                      </button>


                      {/* ACTIONS */}

                      {peutModifier && (
                        <div className="flex items-center gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              ouvrirModificationRepetition(
                                repetition
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                          >
                            <Edit3 size={15} />
                            Modifier
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              supprimerRepetition(
                                repetition.id
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
                          >
                            <Trash2 size={15} />
                            Supprimer
                          </button>

                        </div>
                      )}

                    </div>
                  </div>


                  {/* ==========================================
                      CONTENU RÉPÉTITION
                  ========================================== */}

                  {ouverte && (
                    <div className="border-t border-slate-100 bg-slate-50/70 p-5 sm:p-6">

                      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                          <div className="flex items-center gap-2">
                            <BookOpen
                              size={18}
                              className="text-emerald-700"
                            />

                            <h3 className="font-black text-slate-900">
                              Khassidas à répéter
                            </h3>
                          </div>

                          <p className="mt-1 text-xs text-slate-500">
                            Les Khassidas, leurs tons et
                            leurs audios pour cette répétition.
                          </p>
                        </div>

                        {peutModifier && (
                          <button
                            type="button"
                            onClick={
                              ouvrirAjoutKhassida
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-emerald-800"
                          >
                            <Plus size={16} />
                            Ajouter une Khassida
                          </button>
                        )}

                      </div>


                      {chargementKhassidas ? (
                        <div className="flex items-center justify-center py-10">
                          <Loader2
                            size={25}
                            className="animate-spin text-emerald-700"
                          />
                        </div>
                      ) : khassidas.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                          <BookOpen
                            size={35}
                            className="mx-auto text-slate-300"
                          />

                          <p className="mt-3 text-sm font-bold text-slate-600">
                            Aucune Khassida programmée
                            pour cette répétition.
                          </p>

                          {peutModifier && (
                            <button
                              type="button"
                              onClick={
                                ouvrirAjoutKhassida
                              }
                              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white"
                            >
                              <Plus size={15} />
                              Ajouter la première
                              Khassida
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">

                          {khassidas.map(
                            (item, index) => (
                              <div
                                key={item.id}
                                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                              >

                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">

                                  {/* ORDRE */}

                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-black text-emerald-700">
                                    {item.ordre ||
                                      index + 1}
                                  </div>


                                  {/* KHASSIDA */}

                                  <div className="min-w-0 flex-1">

                                    <div className="flex items-center gap-2">
                                      <BookOpen
                                        size={16}
                                        className="shrink-0 text-emerald-700"
                                      />

                                      <h4 className="truncate font-black text-slate-900">
                                        {
                                          item.khassida
                                            ?.titre
                                        }
                                      </h4>
                                    </div>

                                    {item.khassida
                                      ?.auteur && (
                                      <p className="mt-1 text-xs text-slate-400">
                                        {
                                          item.khassida
                                            .auteur
                                        }
                                      </p>
                                    )}

                                  </div>


                                  {/* TON */}

                                  <div className="rounded-xl bg-violet-50 px-3 py-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                                      Ton
                                    </p>

                                    <p className="mt-0.5 text-sm font-black text-violet-700">
                                      {item.ton
                                        ?.nom ||
                                        "Non défini"}
                                    </p>
                                  </div>


                                  {/* AUDIO */}

                                  <div className="min-w-[220px] rounded-xl bg-slate-50 px-3 py-2">

                                    <div className="flex items-center gap-2">
                                      <Headphones
                                        size={15}
                                        className="text-slate-500"
                                      />

                                      <span className="truncate text-xs font-bold text-slate-700">
                                        {item.audio
                                          ?.titre ||
                                          "Audio"}
                                      </span>
                                    </div>

                                    {item.audio
                                      ?.url && (
                                      <audio
                                        controls
                                        preload="none"
                                        className="mt-2 h-8 w-full"
                                      >
                                        <source
                                          src={
                                            item.audio
                                              .url
                                          }
                                        />

                                        Votre navigateur
                                        ne supporte pas
                                        l'audio.
                                      </audio>
                                    )}

                                  </div>


                                  {/* ACTIONS */}

                                  {peutModifier && (
                                    <div className="flex items-center gap-2">

                                      <button
                                        type="button"
                                        onClick={() =>
                                          ouvrirModificationKhassida(
                                            item
                                          )
                                        }
                                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                                        title="Modifier"
                                      >
                                        <Edit3
                                          size={15}
                                        />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          supprimerKhassida(
                                            item
                                          )
                                        }
                                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100"
                                        title="Retirer"
                                      >
                                        <Trash2
                                          size={15}
                                        />
                                      </button>

                                    </div>
                                  )}

                                </div>
                              </div>
                            )
                          )}

                        </div>
                      )}

                    </div>
                  )}

                </div>
              );
            })
          )}

        </div>

      </div>


      {/* ========================================================
          MODAL RÉPÉTITION
      ======================================================== */}

      {modalRepetition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-100 p-5">

              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {repetitionEnEdition
                    ? "Modifier la répétition"
                    : "Ajouter une répétition"}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Informations de la séance
                </p>
              </div>

              <button
                type="button"
                onClick={
                  fermerModalRepetition
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>

            </div>


            <form
              onSubmit={sauvegarderRepetition}
              className="space-y-5 p-5"
            >

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Date
                </label>

                <input
                  type="date"
                  required
                  value={
                    formRepetition.date_repetition
                  }
                  onChange={(event) =>
                    setFormRepetition(
                      (ancien) => ({
                        ...ancien,
                        date_repetition:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>


              <div className="grid gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Heure de début
                  </label>

                  <input
                    type="time"
                    value={
                      formRepetition.heure_debut
                    }
                    onChange={(event) =>
                      setFormRepetition(
                        (ancien) => ({
                          ...ancien,
                          heure_debut:
                            event.target.value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>


                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Heure de fin
                  </label>

                  <input
                    type="time"
                    value={
                      formRepetition.heure_fin
                    }
                    onChange={(event) =>
                      setFormRepetition(
                        (ancien) => ({
                          ...ancien,
                          heure_fin:
                            event.target.value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>

              </div>


              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Lieu
                </label>

                <input
                  type="text"
                  value={formRepetition.lieu}
                  onChange={(event) =>
                    setFormRepetition(
                      (ancien) => ({
                        ...ancien,
                        lieu: event.target.value,
                      })
                    )
                  }
                  placeholder="Ex. Castors"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>


              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={
                    fermerModalRepetition
                  }
                  className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white"
                >
                  <Save size={16} />
                  Enregistrer
                </button>

              </div>

            </form>

          </div>
        </div>
      )}


      {/* ========================================================
          MODAL KHASSIDA
      ======================================================== */}

      {modalKhassida && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-100 p-5">

              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {khassidaEnEdition
                    ? "Modifier la Khassida"
                    : "Ajouter une Khassida"}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Khassida, audio et ton de répétition
                </p>
              </div>

              <button
                type="button"
                onClick={
                  fermerModalKhassida
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>

            </div>


            <form
              onSubmit={sauvegarderKhassida}
              className="space-y-5 p-5"
            >

              {chargementReferentiels ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2
                    size={25}
                    className="animate-spin text-emerald-700"
                  />
                </div>
              ) : (
                <>

                  {/* KHASSIDA */}

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Khassida
                    </label>

                    <select
                      required
                      value={
                        formKhassida.khassida_id
                      }
                      onChange={
                        handleKhassidaChange
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:bg-white"
                    >
                      <option value="">
                        Sélectionner une Khassida
                      </option>

                      {listeKhassidas.map(
                        (khassida) => (
                          <option
                            key={khassida.id}
                            value={khassida.id}
                          >
                            {khassida.titre}
                          </option>
                        )
                      )}
                    </select>
                  </div>


                  {/* AUDIO */}

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Audio / Ton
                    </label>

                    <select
                      required
                      value={
                        formKhassida.audio_id
                      }
                      onChange={(event) =>
                        setFormKhassida(
                          (ancien) => ({
                            ...ancien,
                            audio_id:
                              event.target.value,
                          })
                        )
                      }
                      disabled={
                        !formKhassida.khassida_id ||
                        listeAudios.length === 0
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">
                        {listeAudios.length === 0
                          ? "Aucun audio disponible"
                          : "Sélectionner un audio"}
                      </option>

                      {listeAudios.map(
                        (audio) => (
                          <option
                            key={audio.id}
                            value={audio.id}
                          >
                            {audio.titre}
                            {audio.ton?.nom
                              ? ` — ${audio.ton.nom}`
                              : ""}
                          </option>
                        )
                      )}
                    </select>

                    {formKhassida.audio_id && (
                      <div className="mt-2 rounded-xl bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700">
                        Le ton est automatiquement
                        déterminé par l'audio sélectionné.
                      </div>
                    )}
                  </div>


                  {/* ORDRE */}

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Ordre
                    </label>

                    <div className="relative">

                      <ListOrdered
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="number"
                        min="1"
                        required
                        value={
                          formKhassida.ordre
                        }
                        onChange={(event) =>
                          setFormKhassida(
                            (ancien) => ({
                              ...ancien,
                              ordre:
                                event.target.value,
                            })
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-emerald-600 focus:bg-white"
                      />

                    </div>
                  </div>

                </>
              )}


              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={
                    fermerModalKhassida
                  }
                  className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={
                    chargementReferentiels
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={16} />
                  Enregistrer
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}