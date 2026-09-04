import { useEffect, useState } from "react";

import {
  getKourels,
  creerKourel,
  modifierKourel,
  desactiverKourel,
  activerKourel,
} from "../services/kourels";

export default function Kourels() {
  // ============================================================
  // ÉTATS
  // ============================================================

  const [kourels, setKourels] = useState([]);

  const [chargement, setChargement] = useState(true);

  const [erreur, setErreur] = useState("");

  const [modalOuverte, setModalOuverte] = useState(false);

  const [modeEdition, setModeEdition] = useState(false);

  const [kourelSelectionne, setKourelSelectionne] =
    useState(null);

  const [nom, setNom] = useState("");

  const [description, setDescription] = useState("");

  const [enregistrement, setEnregistrement] =
    useState(false);

  const [actionEnCours, setActionEnCours] =
    useState(null);

  // ============================================================
  // CHARGER LES KOURELS
  // ============================================================

  async function chargerKourels() {
    try {
      setChargement(true);
      setErreur("");

      const data = await getKourels();

      /*
       * Selon la forme de ta réponse API :
       *
       * [
       *   {...},
       *   {...}
       * ]
       *
       * ou
       *
       * {
       *   items: [...]
       * }
       */

      if (Array.isArray(data)) {
        setKourels(data);
      } else if (Array.isArray(data.items)) {
        setKourels(data.items);
      } else {
        setKourels([]);
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement des Kourels :",
        error
      );

      setErreur(
        error?.response?.data?.detail ||
          "Impossible de charger les Kourels."
      );
    } finally {
      setChargement(false);
    }
  }

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================

  useEffect(() => {
    chargerKourels();
  }, []);

  // ============================================================
  // OUVRIR MODAL CRÉATION
  // ============================================================

  function ouvrirCreation() {
    setModeEdition(false);

    setKourelSelectionne(null);

    setNom("");

    setDescription("");

    setErreur("");

    setModalOuverte(true);
  }

  // ============================================================
  // OUVRIR MODAL MODIFICATION
  // ============================================================

  function ouvrirModification(kourel) {
    setModeEdition(true);

    setKourelSelectionne(kourel);

    setNom(kourel.nom || "");

    setDescription(kourel.description || "");

    setErreur("");

    setModalOuverte(true);
  }

  // ============================================================
  // FERMER MODAL
  // ============================================================

  function fermerModal() {
    if (enregistrement) {
      return;
    }

    setModalOuverte(false);

    setModeEdition(false);

    setKourelSelectionne(null);

    setNom("");

    setDescription("");

    setErreur("");
  }

  // ============================================================
  // ENREGISTRER
  // ============================================================

  async function handleSubmit(e) {
    e.preventDefault();

    setErreur("");

    if (!nom.trim()) {
      setErreur("Le nom du Kourel est obligatoire.");

      return;
    }

    try {
      setEnregistrement(true);

      if (modeEdition && kourelSelectionne) {
        await modifierKourel(
          kourelSelectionne.id,
          {
            nom,
            description,
          }
        );
      } else {
        await creerKourel({
          nom,
          description,
        });
      }

      await chargerKourels();

      fermerModal();
    } catch (error) {
      console.error(
        "Erreur lors de l'enregistrement :",
        error
      );

      setErreur(
        error?.response?.data?.detail ||
          "Une erreur est survenue lors de l'enregistrement."
      );
    } finally {
      setEnregistrement(false);
    }
  }

  // ============================================================
  // DÉSACTIVER
  // ============================================================

  async function handleDesactiver(kourel) {
    const confirmation = window.confirm(
      `Voulez-vous vraiment désactiver le Kourel "${kourel.nom}" ?`
    );

    if (!confirmation) {
      return;
    }

    try {
      setActionEnCours(kourel.id);

      await desactiverKourel(kourel.id);

      await chargerKourels();
    } catch (error) {
      console.error(
        "Erreur lors de la désactivation :",
        error
      );

      setErreur(
        error?.response?.data?.detail ||
          "Impossible de désactiver ce Kourel."
      );
    } finally {
      setActionEnCours(null);
    }
  }

  // ============================================================
  // RÉACTIVER
  // ============================================================

  async function handleActiver(kourel) {
    try {
      setActionEnCours(kourel.id);

      await activerKourel(kourel.id);

      await chargerKourels();
    } catch (error) {
      console.error(
        "Erreur lors de la réactivation :",
        error
      );

      setErreur(
        error?.response?.data?.detail ||
          "Impossible de réactiver ce Kourel."
      );
    } finally {
      setActionEnCours(null);
    }
  }

  // ============================================================
  // AFFICHAGE
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-50 p-6">

      {/* ======================================================
          EN-TÊTE
      ====================================================== */}

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Kourels
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Gestion des Kourels du Dahira
          </p>
        </div>

        <button
          type="button"
          onClick={ouvrirCreation}
          className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
        >
          + Ajouter un Kourel
        </button>

      </div>

      {/* ======================================================
          ERREUR
      ====================================================== */}

      {erreur && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erreur}
        </div>
      )}

      {/* ======================================================
          STATISTIQUES
      ====================================================== */}

      {!chargement && (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Total Kourels
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {kourels.length}
            </p>

          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Kourels actifs
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-700">
              {
                kourels.filter(
                  (kourel) => kourel.actif
                ).length
              }
            </p>

          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Kourels inactifs
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-500">
              {
                kourels.filter(
                  (kourel) => !kourel.actif
                ).length
              }
            </p>

          </div>

        </div>
      )}

      {/* ======================================================
          CHARGEMENT
      ====================================================== */}

      {chargement && (
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-20">

          <div className="text-center">

            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700" />

            <p className="mt-4 text-sm text-slate-500">
              Chargement des Kourels...
            </p>

          </div>

        </div>
      )}

      {/* ======================================================
          LISTE VIDE
      ====================================================== */}

      {!chargement && kourels.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl">
            ♪
          </div>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Aucun Kourel
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Aucun Kourel n'a encore été enregistré.
          </p>

          <button
            type="button"
            onClick={ouvrirCreation}
            className="mt-5 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Ajouter le premier Kourel
          </button>

        </div>
      )}

      {/* ======================================================
          TABLEAU
      ====================================================== */}

      {!chargement && kourels.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="border-b border-slate-200 bg-slate-50">

                <tr>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Kourel
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Description
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Statut
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {kourels.map((kourel) => (

                  <tr
                    key={kourel.id}
                    className="transition hover:bg-slate-50"
                  >

                    {/* NOM */}

                    <td className="px-6 py-5">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">
                          {kourel.nom
                            ?.charAt(0)
                            ?.toUpperCase()}
                        </div>

                        <div>

                          <p className="font-semibold text-slate-900">
                            {kourel.nom}
                          </p>

                          <p className="text-xs text-slate-400">
                            ID : {kourel.id}
                          </p>

                        </div>

                      </div>

                    </td>

                    {/* DESCRIPTION */}

                    <td className="max-w-md px-6 py-5">

                      <p className="truncate text-sm text-slate-600">
                        {kourel.description ||
                          "Aucune description"}
                      </p>

                    </td>

                    {/* STATUT */}

                    <td className="px-6 py-5">

                      {kourel.actif ? (
                        <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                          Inactif
                        </span>
                      )}

                    </td>

                    {/* ACTIONS */}

                    <td className="px-6 py-5">

                      <div className="flex justify-end gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            ouvrirModification(kourel)
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Modifier
                        </button>

                        {kourel.actif ? (

                          <button
                            type="button"
                            disabled={
                              actionEnCours ===
                              kourel.id
                            }
                            onClick={() =>
                              handleDesactiver(
                                kourel
                              )
                            }
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {actionEnCours ===
                            kourel.id
                              ? "..."
                              : "Désactiver"}
                          </button>

                        ) : (

                          <button
                            type="button"
                            disabled={
                              actionEnCours ===
                              kourel.id
                            }
                            onClick={() =>
                              handleActiver(
                                kourel
                              )
                            }
                            className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                          >
                            {actionEnCours ===
                            kourel.id
                              ? "..."
                              : "Réactiver"}
                          </button>

                        )}

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>
      )}

      {/* ======================================================
          MODAL CRÉATION / MODIFICATION
      ====================================================== */}

      {modalOuverte && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

            {/* EN-TÊTE MODAL */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <h2 className="text-lg font-bold text-slate-900">
                  {modeEdition
                    ? "Modifier le Kourel"
                    : "Ajouter un Kourel"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {modeEdition
                    ? "Modifiez les informations du Kourel."
                    : "Enregistrez un nouveau Kourel."}
                </p>

              </div>

              <button
                type="button"
                onClick={fermerModal}
                className="text-xl text-slate-400 hover:text-slate-700"
              >
                ×
              </button>

            </div>

            {/* FORMULAIRE */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >

              {/* NOM */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nom du Kourel
                </label>

                <input
                  type="text"
                  value={nom}
                  onChange={(e) =>
                    setNom(e.target.value)
                  }
                  placeholder="Ex : Kourel Khassida"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  required
                />

              </div>

              {/* DESCRIPTION */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  placeholder="Description du Kourel..."
                  rows={4}
                  className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />

              </div>

              {/* ERREUR MODAL */}

              {erreur && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  {erreur}
                </div>
              )}

              {/* BOUTONS */}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">

                <button
                  type="button"
                  onClick={fermerModal}
                  disabled={enregistrement}
                  className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={enregistrement}
                  className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {enregistrement
                    ? "Enregistrement..."
                    : modeEdition
                    ? "Enregistrer les modifications"
                    : "Créer le Kourel"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}