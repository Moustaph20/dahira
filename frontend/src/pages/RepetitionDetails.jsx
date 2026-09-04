import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Loader2,
  MapPin,
  Music,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getRepetition,
} from "../api/repetitions";

import {
  getKhassidasRepetition,
  ajouterKhassidaRepetition,
  supprimerKhassidaRepetition,
} from "../services/repetitionKhassidaService";

import api from "../api/client";

import { useAuth } from "../context/AuthContext";


const PERMISSIONS = {
  CONSULTER: "PROGRAMME_RELIGIEUX_CONSULTER",
  MODIFIER: "PROGRAMME_RELIGIEUX_MODIFIER",
  SUPPRIMER: "PROGRAMME_RELIGIEUX_SUPPRIMER",
};


function formaterDate(date) {
  if (!date) return "Date non renseignée";

  const valeur = String(date).includes("T")
    ? date
    : `${date}T00:00:00`;

  return new Date(valeur).toLocaleDateString(
    "fr-FR",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}


export default function RepetitionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { aPermission } = useAuth();

  const peutConsulter = aPermission(
    PERMISSIONS.CONSULTER
  );

  const peutModifier = aPermission(
    PERMISSIONS.MODIFIER
  );

  const peutSupprimer = aPermission(
    PERMISSIONS.SUPPRIMER
  );


  const [repetition, setRepetition] =
    useState(null);

  const [khassidas, setKhassidas] =
    useState([]);

  const [khassidasDisponibles, setKhassidasDisponibles] =
    useState([]);

  const [chargement, setChargement] =
    useState(true);

  const [chargementKhassidas, setChargementKhassidas] =
    useState(false);

  const [erreur, setErreur] =
    useState("");

  const [ajoutOuvert, setAjoutOuvert] =
    useState(false);

  const [khassidaSelectionnee, setKhassidaSelectionnee] =
    useState("");

  const [ajoutEnCours, setAjoutEnCours] =
    useState(false);


  async function charger() {
    try {
      setChargement(true);
      setErreur("");

      const [repetitionData, khassidasData] =
        await Promise.all([
          getRepetition(id),
          getKhassidasRepetition(id),
        ]);

      setRepetition(repetitionData);

      setKhassidas(
        Array.isArray(khassidasData)
          ? khassidasData
          : []
      );
    } catch (error) {
      console.error(error);

      setErreur(
        error?.response?.data?.detail ||
          "Impossible de charger la répétition."
      );
    } finally {
      setChargement(false);
    }
  }


  useEffect(() => {
    if (peutConsulter) {
      charger();
    } else {
      setChargement(false);
    }
  }, [id, peutConsulter]);


  async function ouvrirAjout() {
    if (!peutModifier) return;

    try {
      setChargementKhassidas(true);
      setErreur("");

      const response =
        await api.get("/khassidas");

      const toutes =
        Array.isArray(response.data)
          ? response.data
          : [];

      const idsExistants =
        khassidas.map(
          (item) =>
            Number(
              item.khassida_id ??
              item.khassida?.id ??
              item.id
            )
        );

      setKhassidasDisponibles(
        toutes.filter(
          (item) =>
            !idsExistants.includes(
              Number(item.id)
            )
        )
      );

      setKhassidaSelectionnee("");
      setAjoutOuvert(true);
    } catch (error) {
      console.error(error);

      setErreur(
        error?.response?.data?.detail ||
          "Impossible de charger les Khassidas."
      );
    } finally {
      setChargementKhassidas(false);
    }
  }


  async function ajouter() {
    if (
      !peutModifier ||
      !khassidaSelectionnee
    ) {
      return;
    }

    try {
      setAjoutEnCours(true);
      setErreur("");

      await ajouterKhassidaRepetition(
        Number(id),
        {
          khassida_id:
            Number(khassidaSelectionnee),
          ordre:
            khassidas.length + 1,
        }
      );

      setKhassidaSelectionnee("");
      setAjoutOuvert(false);

      await charger();
    } catch (error) {
      console.error(error);

      setErreur(
        error?.response?.data?.detail ||
          "Impossible d'ajouter la Khassida."
      );
    } finally {
      setAjoutEnCours(false);
    }
  }


  async function retirer(item) {
    if (!peutSupprimer) return;

    const khassidaId =
      item.khassida_id ??
      item.khassida?.id ??
      item.id;

    const confirmation =
      window.confirm(
        "Retirer cette Khassida de la répétition ?"
      );

    if (!confirmation) return;

    try {
      setErreur("");

      await supprimerKhassidaRepetition(
        Number(id),
        Number(khassidaId)
      );

      await charger();
    } catch (error) {
      console.error(error);

      setErreur(
        error?.response?.data?.detail ||
          "Impossible de retirer la Khassida."
      );
    }
  }


  if (!peutConsulter) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">

        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-xl font-bold text-red-600">
            !
          </div>

          <h1 className="mt-4 text-xl font-bold text-slate-800">
            Accès refusé
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Vous n'avez pas la permission de consulter
            cette répétition.
          </p>

        </div>

      </div>
    );
  }


  if (chargement) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">

        <div className="text-center">

          <Loader2
            className="mx-auto animate-spin text-emerald-700"
            size={32}
          />

          <p className="mt-3 text-sm text-slate-500">
            Chargement de la répétition...
          </p>

        </div>

      </div>
    );
  }


  if (!repetition) {
    return (
      <div className="p-6">

        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">

          <p className="font-semibold text-red-600">
            Répétition introuvable.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/programme-religieux")
            }
            className="mt-5 rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Retour au programme
          </button>

        </div>

      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">

      <div className="mx-auto max-w-6xl">

        {/* RETOUR */}

        <button
          type="button"
          onClick={() =>
            navigate("/programme-religieux")
          }
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-700"
        >
          <ArrowLeft size={18} />
          Retour au programme
        </button>


        {/* =====================================================
            INFORMATIONS DE LA REPETITION
        ===================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

            <div>

              <div className="flex items-center gap-2 text-emerald-700">

                <CalendarDays size={20} />

                <span className="text-sm font-semibold">
                  Répétition du Kourel
                </span>

              </div>

              <h1 className="mt-2 text-2xl font-bold capitalize text-slate-900">
                {formaterDate(
                  repetition.date_repetition
                )}
              </h1>

            </div>

            <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              Programmée
            </span>

          </div>


          <div className="mt-5 flex flex-wrap gap-5 text-sm text-slate-500">

            {repetition.heure_debut && (
              <div className="flex items-center gap-2">

                <Clock size={17} />

                <span>

                  {repetition.heure_debut.substring(
                    0,
                    5
                  )}

                  {repetition.heure_fin &&
                    ` - ${repetition.heure_fin.substring(
                      0,
                      5
                    )}`}

                </span>

              </div>
            )}


            {repetition.lieu && (
              <div className="flex items-center gap-2">

                <MapPin size={17} />

                <span>
                  {repetition.lieu}
                </span>

              </div>
            )}

          </div>

        </div>


        {/* ERREUR */}

        {erreur && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {erreur}
          </div>
        )}


        {/* =====================================================
            KHASSIDAS
        ===================================================== */}

        <div className="mt-6">

          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Khassidas de la répétition
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Khassidas prévues pour cette séance.
              </p>

            </div>

            {peutModifier && (
              <button
                type="button"
                onClick={ouvrirAjout}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                <Plus size={18} />
                Ajouter une Khassida
              </button>
            )}

          </div>


          {khassidas.length === 0 ? (

            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">

              <Music
                className="mx-auto text-slate-300"
                size={42}
              />

              <h3 className="mt-4 font-semibold text-slate-800">
                Aucune Khassida programmée
              </h3>

              {peutModifier && (
                <p className="mt-1 text-sm text-slate-500">
                  Ajoutez les Khassidas qui seront répétées.
                </p>
              )}

            </div>

          ) : (

            <div className="space-y-4">

              {khassidas.map(
                (item, index) => {

                  const khassida =
                    item.khassida ||
                    item;

                  const audios =
                    khassida.audios ||
                    item.audios ||
                    [];

                  return (
                    <div
                      key={
                        item.id ||
                        khassida.id
                      }
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div className="flex gap-4">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 font-bold text-emerald-700">
                            {index + 1}
                          </div>

                          <div>

                            <h3 className="text-lg font-bold text-slate-900">
                              {khassida.titre ||
                                khassida.nom ||
                                `Khassida #${khassida.id}`}
                            </h3>

                            {khassida.auteur && (
                              <p className="mt-1 text-sm text-slate-500">
                                {khassida.auteur}
                              </p>
                            )}

                          </div>

                        </div>

                        {peutSupprimer && (
                          <button
                            type="button"
                            onClick={() =>
                              retirer(item)
                            }
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={17} />
                          </button>
                        )}

                      </div>


                      {/* AUDIOS */}

                      {audios.length > 0 && (

                        <div className="mt-5 border-t border-slate-100 pt-4">

                          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">

                            <Music size={17} />

                            Tons et audios

                          </div>

                          <div className="space-y-2">

                            {audios.map(
                              (audio) => (

                                <div
                                  key={audio.id}
                                  className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3 md:flex-row md:items-center md:justify-between"
                                >

                                  <div>

                                    <p className="text-sm font-medium text-slate-800">
                                      {audio.titre ||
                                        audio.nom ||
                                        "Audio"}
                                    </p>

                                    {audio.ton && (
                                      <p className="mt-1 text-xs text-slate-500">
                                        Ton :{" "}
                                        {audio.ton.nom}
                                      </p>
                                    )}

                                  </div>

                                  {audio.fichier && (
                                    <audio
                                      controls
                                      preload="none"
                                      className="h-9 max-w-full"
                                      src={`${api.defaults.baseURL}/${String(audio.fichier).replace(/^\/+/, "")}`}
                                    />
                                  )}

                                </div>

                              )
                            )}

                          </div>

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


      {/* =====================================================
          MODALE AJOUT KHASSIDA
      ===================================================== */}

      {ajoutOuvert && peutModifier && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b px-5 py-4">

              <h2 className="text-lg font-bold text-slate-900">
                Ajouter une Khassida
              </h2>

              <button
                type="button"
                onClick={() =>
                  setAjoutOuvert(false)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={19} />
              </button>

            </div>

            <div className="p-5">

              {chargementKhassidas ? (

                <div className="flex justify-center py-8">

                  <Loader2
                    className="animate-spin text-emerald-700"
                    size={28}
                  />

                </div>

              ) : (

                <>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Khassida
                  </label>

                  <select
                    value={
                      khassidaSelectionnee
                    }
                    onChange={(e) =>
                      setKhassidaSelectionnee(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3"
                  >

                    <option value="">
                      Sélectionner une Khassida
                    </option>

                    {khassidasDisponibles.map(
                      (khassida) => (

                        <option
                          key={khassida.id}
                          value={khassida.id}
                        >
                          {khassida.titre ||
                            khassida.nom}
                        </option>

                      )
                    )}

                  </select>


                  {khassidasDisponibles.length ===
                    0 && (
                    <p className="mt-3 text-sm text-slate-500">
                      Toutes les Khassidas disponibles
                      sont déjà programmées.
                    </p>
                  )}


                  <div className="mt-6 flex justify-end gap-3">

                    <button
                      type="button"
                      onClick={() =>
                        setAjoutOuvert(false)
                      }
                      className="rounded-xl px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100"
                    >
                      Annuler
                    </button>

                    <button
                      type="button"
                      disabled={
                        !khassidaSelectionnee ||
                        ajoutEnCours
                      }
                      onClick={ajouter}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >

                      {ajoutEnCours && (
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                      )}

                      Ajouter

                    </button>

                  </div>

                </>

              )}

            </div>

          </div>

        </div>

      )}

    </div>
  );
}