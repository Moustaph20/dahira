import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getKourel,
  getMembresKourel,
  ajouterMembreKourel,
  retirerMembreKourel,
} from "../api/kourels";

import { getMembres } from "../api/membres";

import { useAuth } from "../context/AuthContext";


export default function KourelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { aPermission } = useAuth();

  /* ==========================================================
     PERMISSIONS
  ========================================================== */

  const peutConsulter =
    aPermission("KOUREL_CONSULTER");

  const peutModifier =
    aPermission("KOUREL_MODIFIER");

  const peutConsulterMembres =
    aPermission("KOUREL_MEMBRE_CONSULTER");

  const peutAjouterMembre =
    aPermission("KOUREL_MEMBRE_AJOUTER");

  const peutRetirerMembre =
    aPermission("KOUREL_MEMBRE_RETIRER");

  /* ==========================================================
     ETATS
  ========================================================== */

  const [kourel, setKourel] = useState(null);

  const [membresKourel, setMembresKourel] =
    useState([]);

  const [tousLesMembres, setTousLesMembres] =
    useState([]);

  const [chargement, setChargement] =
    useState(true);

  const [chargementMembres, setChargementMembres] =
    useState(false);

  const [modalAjout, setModalAjout] =
    useState(false);

  const [membreSelectionne, setMembreSelectionne] =
    useState("");

  const [dateEntree, setDateEntree] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [rechercheMembre, setRechercheMembre] =
    useState("");

  const [ajoutEnCours, setAjoutEnCours] =
    useState(false);

  const [retraitEnCours, setRetraitEnCours] =
    useState(null);

  const [erreur, setErreur] = useState("");

  const [message, setMessage] = useState("");

  /* ==========================================================
     CHARGEMENT
  ========================================================== */

  useEffect(() => {
    if (!peutConsulter) {
      setChargement(false);
      return;
    }

    chargerKourel();
  }, [id, peutConsulter]);

  useEffect(() => {
    if (
      peutConsulter &&
      peutConsulterMembres &&
      id
    ) {
      chargerMembresKourel();
    }
  }, [
    id,
    peutConsulter,
    peutConsulterMembres,
  ]);

  /* ==========================================================
     CHARGER KOUREL
  ========================================================== */

  async function chargerKourel() {
    try {
      setChargement(true);
      setErreur("");

      const data = await getKourel(id);

      setKourel(data);
    } catch (error) {
      console.error(
        "Erreur chargement Kourel :",
        error
      );

      setErreur(
        error?.response?.data?.detail ||
          "Impossible de charger le Kourel."
      );
    } finally {
      setChargement(false);
    }
  }

  /* ==========================================================
     CHARGER MEMBRES DU KOUREL
  ========================================================== */

  async function chargerMembresKourel() {
    if (!peutConsulterMembres) {
      return;
    }

    try {
      setChargementMembres(true);

      const data =
        await getMembresKourel(id);

      setMembresKourel(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Erreur chargement membres Kourel :",
        error
      );

      setErreur(
        error?.response?.data?.detail ||
          "Impossible de charger les membres du Kourel."
      );
    } finally {
      setChargementMembres(false);
    }
  }

  /* ==========================================================
     CHARGER TOUS LES MEMBRES
  ========================================================== */

  async function chargerTousLesMembres() {
    try {
      const data = await getMembres(
        "",
        false
      );

      setTousLesMembres(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Erreur chargement membres :",
        error
      );

      setErreur(
        error?.response?.data?.detail ||
          "Impossible de charger les membres."
      );
    }
  }

  /* ==========================================================
     OUVRIR AJOUT MEMBRE
  ========================================================== */

  async function ouvrirAjoutMembre() {
    if (!peutAjouterMembre) {
      return;
    }

    setErreur("");
    setMessage("");

    setMembreSelectionne("");
    setRechercheMembre("");

    setDateEntree(
      new Date()
        .toISOString()
        .split("T")[0]
    );

    await chargerTousLesMembres();

    setModalAjout(true);
  }

  /* ==========================================================
     FERMER MODALE
  ========================================================== */

  function fermerModal() {
    if (ajoutEnCours) {
      return;
    }

    setModalAjout(false);
    setMembreSelectionne("");
    setRechercheMembre("");
  }

  /* ==========================================================
     MEMBRES DEJA PRESENTS
  ========================================================== */

  const idsMembresKourel = useMemo(() => {
    return new Set(
      membresKourel.map((item) =>
        Number(
          item.membre_id ||
            item.membre?.id ||
            item.id
        )
      )
    );
  }, [membresKourel]);

  /* ==========================================================
     MEMBRES DISPONIBLES
  ========================================================== */

  const membresDisponibles = useMemo(() => {
    const recherche =
      rechercheMembre
        .trim()
        .toLowerCase();

    return tousLesMembres.filter(
      (membre) => {
        if (
          idsMembresKourel.has(
            Number(membre.id)
          )
        ) {
          return false;
        }

        if (!recherche) {
          return true;
        }

        const nom =
          membre.nom || "";

        const prenom =
          membre.prenom || "";

        const telephone =
          membre.telephone || "";

        const texte =
          `${nom} ${prenom} ${telephone}`
            .toLowerCase();

        return texte.includes(
          recherche
        );
      }
    );
  }, [
    tousLesMembres,
    idsMembresKourel,
    rechercheMembre,
  ]);

  /* ==========================================================
     AJOUT MEMBRE
  ========================================================== */

  async function handleAjouterMembre(e) {
    e.preventDefault();

    if (!peutAjouterMembre) {
      return;
    }

    if (!membreSelectionne) {
      setErreur(
        "Veuillez sélectionner un membre."
      );

      return;
    }

    try {
      setAjoutEnCours(true);
      setErreur("");
      setMessage("");

      await ajouterMembreKourel(
        id,
        {
          membre_id:
            Number(membreSelectionne),

          date_entree:
            dateEntree || null,
        }
      );

      setMessage(
        "Le membre a été ajouté au Kourel avec succès."
      );

      setMembreSelectionne("");
      setRechercheMembre("");

      await chargerMembresKourel();

      setTimeout(() => {
        setModalAjout(false);
        setMessage("");
      }, 700);

    } catch (error) {
      console.error(
        "Erreur ajout membre :",
        error
      );

      setErreur(
        error?.response?.data?.detail ||
          "Impossible d'ajouter le membre au Kourel."
      );
    } finally {
      setAjoutEnCours(false);
    }
  }

  /* ==========================================================
     RETIRER MEMBRE
  ========================================================== */

  async function handleRetirerMembre(
    membre
  ) {
    if (!peutRetirerMembre) {
      return;
    }

    const membreData =
      membre.membre || membre;

    const membreId =
      membre.membre_id ||
      membreData.id;

    const nomComplet =
      `${membreData.prenom || ""} ${
        membreData.nom || ""
      }`.trim();

    const confirmation =
      window.confirm(
        `Voulez-vous vraiment retirer ${
          nomComplet || "ce membre"
        } du Kourel ?`
      );

    if (!confirmation) {
      return;
    }

    try {
      setRetraitEnCours(
        Number(membreId)
      );

      setErreur("");
      setMessage("");

      await retirerMembreKourel(
        id,
        membreId
      );

      setMessage(
        "Le membre a été retiré du Kourel."
      );

      await chargerMembresKourel();

    } catch (error) {
      console.error(
        "Erreur retrait membre :",
        error
      );

      setErreur(
        error?.response?.data?.detail ||
          "Impossible de retirer le membre du Kourel."
      );
    } finally {
      setRetraitEnCours(null);
    }
  }

  /* ==========================================================
     PAS DE PERMISSION
  ========================================================== */

  if (!peutConsulter) {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-3xl">

          <div className="rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600">
              !
            </div>

            <h1 className="mt-5 text-xl font-bold text-slate-800">
              Accès refusé
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Vous n'avez pas la permission de consulter les Kourels.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/mon-espace")
              }
              className="mt-6 rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
            >
              Retour à mon espace
            </button>

          </div>

        </div>
      </div>
    );
  }

  /* ==========================================================
     CHARGEMENT
  ========================================================== */

  if (chargement) {
    return (
      <div className="min-h-screen bg-slate-100 p-6">

        <div className="mx-auto max-w-7xl">

          <div className="flex min-h-[400px] items-center justify-center">

            <div className="text-center">

              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-800" />

              <p className="mt-4 text-sm text-slate-500">
                Chargement du Kourel...
              </p>

            </div>

          </div>

        </div>

      </div>
    );
  }

  /* ==========================================================
     KOUREL INTROUVABLE
  ========================================================== */

  if (!kourel) {
    return (
      <div className="min-h-screen bg-slate-100 p-6">

        <div className="mx-auto max-w-7xl">

          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
              !
            </div>

            <h1 className="mt-4 text-xl font-bold text-slate-800">
              Kourel introuvable
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {erreur ||
                "Le Kourel demandé n'existe pas."}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/kourels")
              }
              className="mt-6 rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-900"
            >
              Retour aux Kourels
            </button>

          </div>

        </div>

      </div>
    );
  }

  /* ==========================================================
     RENDU
  ========================================================== */

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">

      <div className="mx-auto max-w-7xl">

        {/* RETOUR */}

        <button
          type="button"
          onClick={() =>
            navigate("/kourels")
          }
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-800"
        >
          <span className="text-lg">
            ←
          </span>

          Retour aux Kourels
        </button>

        {/* EN-TETE */}

        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">

          <div className="bg-emerald-900 px-6 py-7 text-white md:px-8">

            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

              <div>

                <div className="mb-2 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-emerald-100">
                  Kourel
                </div>

                <h1 className="text-2xl font-bold md:text-3xl">
                  {kourel.nom}
                </h1>

                {kourel.description && (
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-100">
                    {kourel.description}
                  </p>
                )}

              </div>

              <div className="flex items-center gap-3">

                {peutConsulterMembres && (
                  <div className="rounded-xl bg-white/10 px-4 py-3 text-center">

                    <div className="text-2xl font-bold">
                      {membresKourel.length}
                    </div>

                    <div className="text-xs text-emerald-100">
                      membre
                      {membresKourel.length > 1
                        ? "s"
                        : ""}
                    </div>

                  </div>
                )}

                {peutAjouterMembre && (
                  <button
                    type="button"
                    onClick={
                      ouvrirAjoutMembre
                    }
                    className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-emerald-900 shadow-sm hover:bg-emerald-50"
                  >
                    + Ajouter un membre
                  </button>
                )}

              </div>

            </div>

          </div>

        </div>

        {/* MESSAGES */}

        {erreur && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

            <span className="font-bold">
              !
            </span>

            <span>
              {erreur}
            </span>

            <button
              type="button"
              onClick={() =>
                setErreur("")
              }
              className="ml-auto font-bold text-red-500 hover:text-red-700"
            >
              ×
            </button>

          </div>
        )}

        {message && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {message}
          </div>
        )}

        {/* MEMBRES */}

        {peutConsulterMembres && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 md:flex-row md:items-center md:justify-between">

              <div>

                <h2 className="text-lg font-bold text-slate-800">
                  Membres du Kourel
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Liste des membres actuellement affiliés à ce Kourel.
                </p>

              </div>

              {peutAjouterMembre && (
                <button
                  type="button"
                  onClick={
                    ouvrirAjoutMembre
                  }
                  className="rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
                >
                  + Ajouter un membre
                </button>
              )}

            </div>

            {chargementMembres ? (
              <div className="flex min-h-[250px] items-center justify-center">

                <div className="text-center">

                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-800" />

                  <p className="mt-3 text-sm text-slate-500">
                    Chargement des membres...
                  </p>

                </div>

              </div>
            ) : membresKourel.length === 0 ? (

              <div className="px-6 py-16 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl">
                  👥
                </div>

                <h3 className="mt-4 font-semibold text-slate-800">
                  Aucun membre dans ce Kourel
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  Ajoutez des membres existants du Dahira à ce Kourel.
                </p>

                {peutAjouterMembre && (
                  <button
                    type="button"
                    onClick={
                      ouvrirAjoutMembre
                    }
                    className="mt-5 rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
                  >
                    + Ajouter le premier membre
                  </button>
                )}

              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full min-w-[800px]">

                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left">

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Membre
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Téléphone
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Résidence
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Date d'entrée
                      </th>

                      {peutRetirerMembre && (
                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Action
                        </th>
                      )}

                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {membresKourel.map(
                      (item) => {

                        const membre =
                          item.membre ||
                          item;

                        const membreId =
                          item.membre_id ||
                          membre.id;

                        const nom =
                          membre.nom || "";

                        const prenom =
                          membre.prenom || "";

                        const telephone =
                          membre.telephone ||
                          "—";

                        const residence =
                          membre.lieu_residence ||
                          "—";

                        const date =
                          item.date_entree
                            ? new Date(
                                item.date_entree
                              ).toLocaleDateString(
                                "fr-FR"
                              )
                            : "—";

                        return (
                          <tr
                            key={
                              item.id ||
                              membreId
                            }
                            className="transition hover:bg-slate-50"
                          >

                            <td className="px-6 py-4">

                              <div className="flex items-center gap-3">

                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-800">
                                  {(
                                    prenom ||
                                    nom ||
                                    "M"
                                  )
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                                <div>

                                  <div className="font-semibold text-slate-800">
                                    {prenom}{" "}
                                    {nom}
                                  </div>

                                  <div className="text-xs text-slate-400">
                                    ID :{" "}
                                    {membreId}
                                  </div>

                                </div>

                              </div>

                            </td>

                            <td className="px-6 py-4 text-sm text-slate-600">
                              {telephone}
                            </td>

                            <td className="px-6 py-4 text-sm text-slate-600">
                              {residence}
                            </td>

                            <td className="px-6 py-4 text-sm text-slate-600">
                              {date}
                            </td>

                            {peutRetirerMembre && (
                              <td className="px-6 py-4 text-right">

                                <button
                                  type="button"
                                  disabled={
                                    retraitEnCours ===
                                    Number(
                                      membreId
                                    )
                                  }
                                  onClick={() =>
                                    handleRetirerMembre(
                                      item
                                    )
                                  }
                                  className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {retraitEnCours ===
                                  Number(
                                    membreId
                                  )
                                    ? "Retrait..."
                                    : "Retirer"}
                                </button>

                              </td>
                            )}

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </div>
        )}

      </div>

      {/* ======================================================
          MODALE AJOUT MEMBRE
      ====================================================== */}

      {modalAjout &&
        peutAjouterMembre && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">

            <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">

              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

                <div>

                  <h2 className="text-lg font-bold text-slate-800">
                    Ajouter un membre
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Sélectionnez un membre existant du Dahira.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    fermerModal
                  }
                  disabled={
                    ajoutEnCours
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >
                  ×
                </button>

              </div>

              <form
                onSubmit={
                  handleAjouterMembre
                }
                className="space-y-5 p-6"
              >

                {erreur && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {erreur}
                  </div>
                )}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Rechercher un membre
                  </label>

                  <input
                    type="text"
                    value={
                      rechercheMembre
                    }
                    onChange={(e) =>
                      setRechercheMembre(
                        e.target.value
                      )
                    }
                    placeholder="Nom, prénom ou téléphone..."
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Membre
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    value={
                      membreSelectionne
                    }
                    onChange={(e) =>
                      setMembreSelectionne(
                        e.target.value
                      )
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm"
                  >

                    <option value="">
                      -- Sélectionner un membre --
                    </option>

                    {membresDisponibles.map(
                      (membre) => (
                        <option
                          key={membre.id}
                          value={membre.id}
                        >
                          {membre.prenom}{" "}
                          {membre.nom}
                          {membre.telephone
                            ? ` — ${membre.telephone}`
                            : ""}
                        </option>
                      )
                    )}

                  </select>

                  {membresDisponibles.length ===
                    0 && (
                    <p className="mt-2 text-xs text-slate-500">
                      Aucun membre disponible à ajouter à ce Kourel.
                    </p>
                  )}

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Date d'entrée
                  </label>

                  <input
                    type="date"
                    value={dateEntree}
                    onChange={(e) =>
                      setDateEntree(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm"
                  />

                </div>

                {membreSelectionne && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">

                    {(() => {
                      const membre =
                        tousLesMembres.find(
                          (item) =>
                            Number(
                              item.id
                            ) ===
                            Number(
                              membreSelectionne
                            )
                        );

                      if (!membre) {
                        return null;
                      }

                      return (
                        <div className="flex items-center gap-4">

                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-200 font-bold text-emerald-900">
                            {(
                              membre.prenom ||
                              membre.nom ||
                              "M"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>

                            <p className="font-semibold text-slate-800">
                              {membre.prenom}{" "}
                              {membre.nom}
                            </p>

                            <p className="text-sm text-slate-600">
                              {membre.telephone ||
                                "Téléphone non renseigné"}
                            </p>

                            <p className="text-xs text-slate-500">
                              {membre.lieu_residence ||
                                "Résidence non renseignée"}
                            </p>

                          </div>

                        </div>
                      );
                    })()}

                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    onClick={
                      fermerModal
                    }
                    disabled={
                      ajoutEnCours
                    }
                    className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    disabled={
                      ajoutEnCours ||
                      !membreSelectionne
                    }
                    className="rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {ajoutEnCours
                      ? "Ajout en cours..."
                      : "Ajouter au Kourel"}
                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

    </div>
  );
}