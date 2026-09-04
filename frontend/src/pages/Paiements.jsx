import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  WalletCards,
  Plus,
  RefreshCw,
  Search,
  X,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Banknote,
  Filter,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import {
  getPaiements,
  creerPaiement,
  getPaiement,
} from "../api/paiements";

import {
  getCotisations,
} from "../api/cotisations";

import {
  getMembres,
} from "../api/membres";


export default function Paiements() {

  const { utilisateur } = useAuth();

  // ============================================================
  // ÉTATS
  // ============================================================

  const [paiements, setPaiements] = useState([]);
  const [cotisations, setCotisations] = useState([]);
  const [membres, setMembres] = useState([]);

  const [chargement, setChargement] =
    useState(true);

  const [erreur, setErreur] =
    useState("");

  const [recherche, setRecherche] =
    useState("");

  // Filtres
  const [filtreMois, setFiltreMois] =
    useState("");

  const [filtreAnnee, setFiltreAnnee] =
    useState("");

  const [filtreMode, setFiltreMode] =
    useState("");

  const [modalCreation, setModalCreation] =
    useState(false);

  const [modalDetail, setModalDetail] =
    useState(false);

  const [
    paiementSelectionne,
    setPaiementSelectionne,
  ] = useState(null);

  // ============================================================
  // MOIS
  // ============================================================

  const MOIS = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  // ============================================================
  // PERMISSIONS
  // ============================================================

  const permissions =
    utilisateur?.permissions || [];

  const peutConsulter =
    permissions.some(
      (permission) =>
        permission.code ===
        "PAIEMENT_CONSULTER"
    );

  const peutCreer =
    permissions.some(
      (permission) =>
        permission.code ===
        "PAIEMENT_CREER"
    );

  const membreId =
    utilisateur?.membre_id;

  // ============================================================
  // FORMULAIRE
  // ============================================================

  const aujourdHui = new Date()
    .toISOString()
    .split("T")[0];

  const [formulaire, setFormulaire] =
    useState({
      cotisation_id: "",
      membre_id: "",
      montant: "",
      mode_paiement: "espèce",
      date_paiement: aujourdHui,
      reference: "",
    });

  // ============================================================
  // FORMATAGE
  // ============================================================

  const formaterMontant = (montant) => {

    return (
      Number(montant || 0)
        .toLocaleString("fr-FR") +
      " FCFA"
    );
  };


  const formaterDate = (date) => {

    if (!date) {
      return "-";
    }

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString("fr-FR");
  };


  // ============================================================
  // TROUVER MEMBRE
  // ============================================================

  const trouverMembre = (id) => {

    return membres.find(
      (membre) =>
        Number(membre.id) ===
        Number(id)
    );
  };


  const nomMembre = (id) => {

    const membre =
      trouverMembre(id);

    if (!membre) {
      return `Membre #${id}`;
    }

    return (
      `${membre.prenom || ""} ${
        membre.nom || ""
      }`
    ).trim();
  };


  // ============================================================
  // TROUVER COTISATION
  // ============================================================

  const trouverCotisation = (id) => {

    return cotisations.find(
      (cotisation) =>
        Number(cotisation.id) ===
        Number(id)
    );
  };


  // ============================================================
  // CHARGER MEMBRES
  // ============================================================

  const chargerMembres = async () => {

    if (!peutCreer) {
      return [];
    }

    const data =
      await getMembres();

    const liste =
      Array.isArray(data)
        ? data
        : data?.membres || [];

    setMembres(liste);

    return liste;
  };


  // ============================================================
  // CHARGER COTISATIONS
  // ============================================================

  const chargerCotisations = async () => {

    const params = {};

    if (!peutCreer && membreId) {
      params.membre_id =
        membreId;
    }

    const data =
      await getCotisations(
        params
      );

    const liste =
      data?.cotisations || [];

    setCotisations(liste);

    return liste;
  };


  // ============================================================
  // CHARGER PAIEMENTS
  // ============================================================

  const chargerPaiements =
    async () => {

      try {

        setChargement(true);
        setErreur("");

        if (peutCreer) {
          await chargerMembres();
        }

        await chargerCotisations();

        const params = {};

        if (
          !peutCreer &&
          membreId
        ) {
          params.membre_id =
            membreId;
        }

        const data =
          await getPaiements(
            params
          );

        setPaiements(
          data?.paiements || []
        );

      } catch (error) {

        console.error(
          "ERREUR CHARGEMENT PAIEMENTS :",
          error
        );

        setErreur(
          error?.response?.data
            ?.detail ||
            "Impossible de charger les paiements."
        );

      } finally {

        setChargement(false);
      }
    };


  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================

  useEffect(() => {

    if (!utilisateur) {
      return;
    }

    if (!peutConsulter) {

      setErreur(
        "Vous n'avez pas la permission de consulter les paiements."
      );

      setChargement(false);

      return;
    }

    chargerPaiements();

  }, [
    utilisateur,
    membreId,
    peutCreer,
    peutConsulter,
  ]);


  // ============================================================
  // MES PAIEMENTS
  // ============================================================

  const mesPaiements =
    useMemo(() => {

      return paiements.filter(
        (paiement) =>
          Number(
            paiement.membre_id
          ) === Number(membreId)
      );

    }, [
      paiements,
      membreId,
    ]);


  const totalMesPaiements =
    mesPaiements.reduce(
      (total, paiement) =>
        total +
        Number(
          paiement.montant || 0
        ),
      0
    );


  // ============================================================
  // OBTENIR NUMÉRO DU MOIS
  // ============================================================

  const obtenirNumeroMois = (mois) => {

    if (!mois) {
      return 0;
    }

    const moisNormalise =
      String(mois)
        .trim()
        .toLowerCase();

    const index =
      MOIS.findIndex(
        (item) =>
          item.toLowerCase() ===
          moisNormalise
      );

    return index + 1;
  };


  // ============================================================
  // ANNÉES DISPONIBLES
  // ============================================================

  const anneesDisponibles =
    useMemo(() => {

      const annees =
        paiements
          .map((paiement) =>
            Number(
              paiement.cotisation
                ?.annee
            )
          )
          .filter(
            (annee) =>
              Number.isFinite(annee) &&
              annee > 0
          );

      return [
        ...new Set(annees),
      ].sort(
        (a, b) => b - a
      );

    }, [
      paiements,
    ]);


  // ============================================================
  // MODES DISPONIBLES
  // ============================================================

  const modesDisponibles =
    useMemo(() => {

      const modes =
        paiements
          .map(
            (paiement) =>
              paiement.mode_paiement
          )
          .filter(Boolean);

      return [
        ...new Set(modes),
      ].sort(
        (a, b) =>
          String(a).localeCompare(
            String(b),
            "fr"
          )
      );

    }, [
      paiements,
    ]);


  // ============================================================
  // PAIEMENTS FILTRÉS
  // ============================================================

  const paiementsFiltres =
    useMemo(() => {

      const terme =
        recherche
          .trim()
          .toLowerCase();

      return paiements.filter(
        (paiement) => {

          const mois =
            paiement.cotisation
              ?.mois_concerne || "";

          const annee =
            Number(
              paiement.cotisation
                ?.annee || 0
            );

          const mode =
            paiement.mode_paiement ||
            "";

          // ----------------------------------------------------
          // FILTRE MOIS
          // ----------------------------------------------------

          if (
            filtreMois &&
            mois.toLowerCase() !==
              filtreMois.toLowerCase()
          ) {
            return false;
          }

          // ----------------------------------------------------
          // FILTRE ANNÉE
          // ----------------------------------------------------

          if (
            filtreAnnee &&
            annee !==
              Number(filtreAnnee)
          ) {
            return false;
          }

          // ----------------------------------------------------
          // FILTRE MODE
          // ----------------------------------------------------

          if (
            filtreMode &&
            mode.toLowerCase() !==
              filtreMode.toLowerCase()
          ) {
            return false;
          }

          // ----------------------------------------------------
          // RECHERCHE
          // ----------------------------------------------------

          if (terme) {

            const membre =
              trouverMembre(
                paiement.membre_id
              );

            const nom =
              membre?.nom || "";

            const prenom =
              membre?.prenom || "";

            const telephone =
              membre?.telephone || "";

            const reference =
              paiement.reference ||
              "";

            const texte =
              `${prenom} ${nom} ${telephone} ${mode} ${reference} ${mois} ${annee}`
                .toLowerCase();

            if (
              !texte.includes(
                terme
              )
            ) {
              return false;
            }
          }

          return true;
        }
      );

    }, [
      paiements,
      recherche,
      filtreMois,
      filtreAnnee,
      filtreMode,
      membres,
    ]);


  // ============================================================
  // GROUPER PAR MOIS
  // ============================================================

  const paiementsParMois =
    useMemo(() => {

      const groupes = {};

      paiementsFiltres.forEach(
        (paiement) => {

          const mois =
            paiement.cotisation
              ?.mois_concerne ||
            "Mois inconnu";

          const annee =
            Number(
              paiement.cotisation
                ?.annee || 0
            );

          const numeroMois =
            obtenirNumeroMois(
              mois
            );

          const cle =
            `${annee}-${String(
              numeroMois
            ).padStart(2, "0")}`;

          if (!groupes[cle]) {

            groupes[cle] = {
              mois,
              annee,
              cotisations: [],
              paiements: [],
            };
          }

          groupes[cle].paiements.push(
            paiement
          );
        }
      );

      return Object.values(
        groupes
      ).sort(
        (a, b) => {

          if (
            Number(b.annee) !==
            Number(a.annee)
          ) {
            return (
              Number(b.annee) -
              Number(a.annee)
            );
          }

          return (
            obtenirNumeroMois(
              b.mois
            ) -
            obtenirNumeroMois(
              a.mois
            )
          );
        }
      );

    }, [
      paiementsFiltres,
    ]);


  // ============================================================
  // RÉSUMÉ GLOBAL
  // ============================================================

  const totalPaiementsFiltres =
    paiementsFiltres.reduce(
      (total, paiement) =>
        total +
        Number(
          paiement.montant || 0
        ),
      0
    );


  // ============================================================
  // RÉINITIALISER FILTRES
  // ============================================================

  const reinitialiserFiltres =
    () => {

      setRecherche("");
      setFiltreMois("");
      setFiltreAnnee("");
      setFiltreMode("");
    };


  const filtresActifs =
    Boolean(
      recherche ||
      filtreMois ||
      filtreAnnee ||
      filtreMode
    );


  // ============================================================
  // OUVRIR FORMULAIRE
  // ============================================================

  const ouvrirFormulaire =
    async () => {

      try {

        setErreur("");

        if (!peutCreer) {

          setErreur(
            "Vous n'avez pas la permission de créer un paiement."
          );

          return;
        }

        await chargerMembres();

        await chargerCotisations();

        setFormulaire({
          cotisation_id: "",
          membre_id: "",
          montant: "",
          mode_paiement: "espèce",
          date_paiement:
            new Date()
              .toISOString()
              .split("T")[0],
          reference: "",
        });

        setModalCreation(true);

      } catch (error) {

        console.error(error);

        setErreur(
          error?.response?.data
            ?.detail ||
            "Impossible de préparer le formulaire."
        );
      }
    };


  // ============================================================
  // FERMER FORMULAIRE
  // ============================================================

  const fermerFormulaire =
    () => {

      setModalCreation(false);

      setFormulaire({
        cotisation_id: "",
        membre_id: "",
        montant: "",
        mode_paiement: "espèce",
        date_paiement:
          new Date()
            .toISOString()
            .split("T")[0],
        reference: "",
      });
    };


  // ============================================================
  // MODIFIER FORMULAIRE
  // ============================================================

  const modifierFormulaire =
    (champ, valeur) => {

      setFormulaire(
        (ancien) => ({
          ...ancien,
          [champ]: valeur,
        })
      );
    };


  // ============================================================
  // CHANGER MEMBRE
  // ============================================================

  const changerMembre =
    (id) => {

      setFormulaire(
        (ancien) => ({
          ...ancien,
          membre_id: id,
          cotisation_id: "",
          montant: "",
        })
      );
    };


  // ============================================================
  // CHANGER COTISATION
  // ============================================================

  const changerCotisation =
    (id) => {

      const cotisation =
        trouverCotisation(id);

      if (!cotisation) {

        setFormulaire(
          (ancien) => ({
            ...ancien,
            cotisation_id: id,
            montant: "",
          })
        );

        return;
      }

      const reste =
        Math.max(
          0,
          Number(
            cotisation.montant_du ||
            0
          )
        );

      setFormulaire(
        (ancien) => ({
          ...ancien,
          cotisation_id: id,
          membre_id:
            cotisation.membre_id,
          montant:
            reste > 0
              ? reste
              : "",
        })
      );
    };


  // ============================================================
  // COTISATIONS DISPONIBLES
  // ============================================================

  const cotisationsDisponibles =
    useMemo(() => {

      if (!formulaire.membre_id) {
        return [];
      }

      return cotisations.filter(
        (cotisation) =>
          Number(
            cotisation.membre_id
          ) ===
            Number(
              formulaire.membre_id
            ) &&
          Number(
            cotisation.montant_du ||
            0
          ) > 0
      );

    }, [
      cotisations,
      formulaire.membre_id,
    ]);


  // ============================================================
  // ENREGISTRER PAIEMENT
  // ============================================================

  const enregistrerPaiement =
    async (e) => {

      e.preventDefault();

      setErreur("");

      if (!peutCreer) {

        setErreur(
          "Vous n'avez pas la permission de créer un paiement."
        );

        return;
      }

      if (!formulaire.membre_id) {

        setErreur(
          "Veuillez sélectionner un membre."
        );

        return;
      }

      if (!formulaire.cotisation_id) {

        setErreur(
          "Veuillez sélectionner une cotisation."
        );

        return;
      }

      if (
        !formulaire.montant ||
        Number(formulaire.montant) <= 0
      ) {

        setErreur(
          "Veuillez saisir un montant valide."
        );

        return;
      }

      const cotisation =
        trouverCotisation(
          formulaire.cotisation_id
        );

      if (!cotisation) {

        setErreur(
          "Cotisation introuvable."
        );

        return;
      }

      const reste =
        Number(
          cotisation.montant_du ||
          0
        );

      if (
        Number(formulaire.montant) >
        reste
      ) {

        setErreur(
          `Le montant maximum autorisé est ${formaterMontant(
            reste
          )}.`
        );

        return;
      }

      try {

        await creerPaiement({
          cotisation_id:
            Number(
              formulaire.cotisation_id
            ),

          montant:
            Number(
              formulaire.montant
            ),

          mode_paiement:
            formulaire.mode_paiement,

          date_paiement:
            formulaire.date_paiement,

          reference:
            formulaire.reference ||
            null,
        });

        fermerFormulaire();

        await chargerPaiements();

      } catch (error) {

        console.error(error);

        setErreur(
          error?.response?.data
            ?.detail ||
            "Impossible d'enregistrer le paiement."
        );
      }
    };


  // ============================================================
  // DÉTAIL
  // ============================================================

  const ouvrirDetail =
    async (id) => {

      try {

        setErreur("");

        const data =
          await getPaiement(id);

        setPaiementSelectionne(
          data
        );

        setModalDetail(true);

      } catch (error) {

        console.error(error);

        setErreur(
          error?.response?.data
            ?.detail ||
            "Impossible de consulter ce paiement."
        );
      }
    };


  // ============================================================
  // ACCÈS REFUSÉ
  // ============================================================

  if (!peutConsulter) {

    return (
      <div className="p-4 md:p-6">

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">

          Vous n'avez pas accès
          aux paiements.

        </div>

      </div>
    );
  }


  // ============================================================
  // AFFICHAGE
  // ============================================================

  return (

    <div className="min-h-full space-y-6 bg-slate-50/50 p-3 sm:p-4 md:space-y-8 md:p-6">

      {/* ======================================================
          EN-TÊTE
      ====================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div className="flex items-center gap-3 sm:gap-4">

          <div className="shrink-0 rounded-2xl bg-emerald-100 p-3">

            <WalletCards
              size={26}
              className="text-emerald-700"
            />

          </div>

          <div>

            <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
              Paiements
            </h1>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Gestion et suivi des paiements
            </p>

          </div>

        </div>


        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">

          <button
            onClick={chargerPaiements}
            disabled={chargement}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
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


          {peutCreer && (

            <button
              onClick={ouvrirFormulaire}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 sm:w-auto"
            >

              <Plus size={18} />

              Nouveau paiement

            </button>

          )}

        </div>

      </div>


      {/* ======================================================
          ERREUR
      ====================================================== */}

      {erreur && (

        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0"
          />

          <span>
            {erreur}
          </span>

        </div>

      )}


      {/* ======================================================
          MES PAIEMENTS
      ====================================================== */}

      <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">

        <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-white p-4 sm:p-5">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-emerald-100 p-2.5">

              <Banknote
                size={20}
                className="text-emerald-700"
              />

            </div>

            <div>

              <h2 className="text-lg font-bold text-slate-800">
                Mes paiements
              </h2>

              <p className="text-xs text-slate-500 sm:text-sm">
                Historique de vos paiements
              </p>

            </div>

          </div>

        </div>


        <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 md:grid-cols-2">

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">

            <p className="text-sm text-emerald-700">
              Total payé
            </p>

            <p className="mt-2 text-xl font-bold text-emerald-700">
              {formaterMontant(
                totalMesPaiements
              )}
            </p>

          </div>


          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

            <p className="text-sm text-slate-500">
              Nombre de paiements
            </p>

            <p className="mt-2 text-xl font-bold text-slate-800">
              {mesPaiements.length}
            </p>

          </div>

        </div>


        <div className="overflow-x-auto">

          {chargement ? (

            <div className="flex justify-center p-12">

              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700" />

            </div>

          ) : (

            <table className="w-full min-w-[750px]">

              <thead className="border-y bg-slate-50">

                <tr>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Date
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Cotisation
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Montant
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Mode
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                    Action
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y">

                {mesPaiements.length === 0 ? (

                  <tr>

                    <td
                      colSpan="5"
                      className="p-10 text-center text-slate-500"
                    >
                      Vous n'avez encore effectué aucun paiement.
                    </td>

                  </tr>

                ) : (

                  mesPaiements.map(
                    (paiement) => (

                      <tr
                        key={paiement.id}
                        className="transition hover:bg-slate-50"
                      >

                        <td className="px-5 py-4">
                          {formaterDate(
                            paiement.date_paiement
                          )}
                        </td>

                        <td className="px-5 py-4">

                          <p className="font-semibold text-slate-800">

                            {paiement.cotisation
                              ?.mois_concerne ||
                              "-"}

                          </p>

                          <p className="text-xs text-slate-400">

                            {paiement.cotisation
                              ?.annee ||
                              "-"}

                          </p>

                        </td>

                        <td className="px-5 py-4 font-bold text-emerald-700">

                          {formaterMontant(
                            paiement.montant
                          )}

                        </td>

                        <td className="px-5 py-4">

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">

                            {paiement.mode_paiement ||
                              "-"}

                          </span>

                        </td>

                        <td className="px-5 py-4 text-right">

                          <button
                            onClick={() =>
                              ouvrirDetail(
                                paiement.id
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                          >

                            <Eye size={16} />

                            Voir

                          </button>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          )}

        </div>

      </section>


      {/* ======================================================
          TOUS LES PAIEMENTS
      ====================================================== */}

      {peutCreer && (

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* ====================================================
              HEADER
          ==================================================== */}

          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 sm:p-5">

            <div className="flex flex-col gap-4">

              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div>

                  <h2 className="text-lg font-bold text-slate-800">
                    Paiements du Dahira
                  </h2>

                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    Ensemble des paiements enregistrés
                  </p>

                </div>


                {/* RECHERCHE */}

                <div className="relative w-full lg:w-80">

                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={recherche}
                    onChange={(e) =>
                      setRecherche(
                        e.target.value
                      )
                    }
                    placeholder="Nom, téléphone, mode..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />

                </div>

              </div>


              {/* =================================================
                  FILTRES
              ================================================= */}

              <div className="rounded-2xl border border-slate-200 bg-white p-3">

                <div className="mb-3 flex items-center gap-2">

                  <Filter
                    size={17}
                    className="text-emerald-700"
                  />

                  <span className="text-sm font-semibold text-slate-700">
                    Filtrer les paiements
                  </span>

                </div>


                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

                  {/* MOIS */}

                  <div>

                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                      Mois
                    </label>

                    <select
                      value={filtreMois}
                      onChange={(e) =>
                        setFiltreMois(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    >

                      <option value="">
                        Tous les mois
                      </option>

                      {MOIS.map(
                        (mois) => (

                          <option
                            key={mois}
                            value={mois}
                          >
                            {mois}
                          </option>

                        )
                      )}

                    </select>

                  </div>


                  {/* ANNÉE */}

                  <div>

                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                      Année
                    </label>

                    <select
                      value={filtreAnnee}
                      onChange={(e) =>
                        setFiltreAnnee(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    >

                      <option value="">
                        Toutes les années
                      </option>

                      {anneesDisponibles.map(
                        (annee) => (

                          <option
                            key={annee}
                            value={annee}
                          >
                            {annee}
                          </option>

                        )
                      )}

                    </select>

                  </div>


                  {/* MODE */}

                  <div>

                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                      Mode de paiement
                    </label>

                    <select
                      value={filtreMode}
                      onChange={(e) =>
                        setFiltreMode(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    >

                      <option value="">
                        Tous les modes
                      </option>

                      {modesDisponibles.map(
                        (mode) => (

                          <option
                            key={mode}
                            value={mode}
                          >
                            {mode}
                          </option>

                        )
                      )}

                    </select>

                  </div>


                  {/* RESET */}

                  <div className="flex items-end">

                    <button
                      type="button"
                      onClick={
                        reinitialiserFiltres
                      }
                      disabled={
                        !filtresActifs
                      }
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >

                      <X size={16} />

                      Réinitialiser

                    </button>

                  </div>

                </div>

              </div>


              {/* =================================================
                  RÉSUMÉ GLOBAL
              ================================================= */}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                  <p className="text-xs font-medium text-emerald-700">
                    Nombre de paiements
                  </p>

                  <p className="mt-1 text-xl font-bold text-emerald-700">
                    {paiementsFiltres.length}
                  </p>

                </div>


                <div className="rounded-xl border border-slate-200 bg-white p-4">

                  <p className="text-xs font-medium text-slate-500">
                    Total payé
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-800">
                    {formaterMontant(
                      totalPaiementsFiltres
                    )}
                  </p>

                </div>

              </div>

            </div>

          </div>


          {/* ====================================================
              CONTENU PAR MOIS
          ==================================================== */}

          <div className="space-y-5 p-4 sm:p-5">

            {chargement ? (

              <div className="flex justify-center p-12">

                <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700" />

              </div>

            ) : paiementsFiltres.length === 0 ? (

              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">

                <Banknote
                  size={38}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 font-medium text-slate-600">
                  Aucun paiement trouvé.
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Modifiez vos critères de recherche ou réinitialisez les filtres.
                </p>

                {filtresActifs && (

                  <button
                    type="button"
                    onClick={
                      reinitialiserFiltres
                    }
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
                  >

                    <X size={16} />

                    Réinitialiser les filtres

                  </button>

                )}

              </div>

            ) : (

              paiementsParMois.map(
                (groupe) => {

                  const liste =
                    groupe.paiements;

                  const totalMois =
                    liste.reduce(
                      (total, paiement) =>
                        total +
                        Number(
                          paiement.montant ||
                            0
                        ),
                      0
                    );

                  return (

                    <div
                      key={`${groupe.annee}-${groupe.mois}`}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                    >

                      {/* ========================================
                          HEADER DU MOIS
                      ======================================== */}

                      <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-white p-4">

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">

                              <Banknote
                                size={19}
                                className="text-emerald-700"
                              />

                            </div>

                            <div>

                              <h3 className="font-bold text-slate-800">

                                {groupe.mois}

                                {" "}

                                {groupe.annee ||
                                  ""}

                              </h3>

                              <p className="text-xs text-slate-500">

                                {liste.length}

                                {" "}

                                {liste.length > 1
                                  ? "paiements"
                                  : "paiement"}

                              </p>

                            </div>

                          </div>


                          <div className="rounded-xl border border-emerald-200 bg-white px-4 py-2.5">

                            <p className="text-xs text-slate-500">
                              Total du mois
                            </p>

                            <p className="text-sm font-bold text-emerald-700">

                              {formaterMontant(
                                totalMois
                              )}

                            </p>

                          </div>

                        </div>

                      </div>


                      {/* ========================================
                          TABLE
                      ======================================== */}

                      <div className="overflow-x-auto">

                        <table className="w-full min-w-[900px]">

                          <thead className="border-b bg-slate-50">

                            <tr>

                              <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                                Membre
                              </th>

                              <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                                Cotisation
                              </th>

                              <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                                Montant
                              </th>

                              <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                                Mode
                              </th>

                              <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                                Date
                              </th>

                              <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                                Action
                              </th>

                            </tr>

                          </thead>


                          <tbody className="divide-y">

                            {liste.map(
                              (paiement) => {

                                const membre =
                                  trouverMembre(
                                    paiement.membre_id
                                  );

                                const estMonPaiement =
                                  Number(
                                    paiement.membre_id
                                  ) ===
                                  Number(
                                    membreId
                                  );

                                return (

                                  <tr
                                    key={
                                      paiement.id
                                    }
                                    className={`transition hover:bg-slate-50 ${
                                      estMonPaiement
                                        ? "bg-emerald-50/30"
                                        : ""
                                    }`}
                                  >

                                    {/* MEMBRE */}

                                    <td className="px-5 py-4">

                                      <div className="flex items-center gap-3">

                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">

                                          {(
                                            membre
                                              ?.prenom?.[0] ||
                                            membre
                                              ?.nom?.[0] ||
                                            "M"
                                          ).toUpperCase()}

                                        </div>

                                        <div>

                                          <p className="font-semibold text-slate-800">

                                            {nomMembre(
                                              paiement.membre_id
                                            )}

                                          </p>

                                          {membre?.telephone && (

                                            <p className="text-xs text-slate-400">

                                              {
                                                membre.telephone
                                              }

                                            </p>

                                          )}

                                        </div>

                                      </div>

                                    </td>


                                    {/* COTISATION */}

                                    <td className="px-5 py-4">

                                      <p className="font-medium text-slate-800">

                                        {paiement.cotisation
                                          ?.mois_concerne ||
                                          "-"}

                                      </p>

                                      <p className="text-xs text-slate-400">

                                        {paiement.cotisation
                                          ?.annee ||
                                          "-"}

                                      </p>

                                    </td>


                                    {/* MONTANT */}

                                    <td className="px-5 py-4 font-bold text-emerald-700">

                                      {formaterMontant(
                                        paiement.montant
                                      )}

                                    </td>


                                    {/* MODE */}

                                    <td className="px-5 py-4">

                                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">

                                        {paiement.mode_paiement ||
                                          "-"}

                                      </span>

                                    </td>


                                    {/* DATE */}

                                    <td className="px-5 py-4 text-sm text-slate-600">

                                      {formaterDate(
                                        paiement.date_paiement
                                      )}

                                    </td>


                                    {/* ACTION */}

                                    <td className="px-5 py-4 text-right">

                                      <button
                                        onClick={() =>
                                          ouvrirDetail(
                                            paiement.id
                                          )
                                        }
                                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                                      >

                                        <Eye size={16} />

                                        Voir

                                      </button>

                                    </td>

                                  </tr>

                                );
                              }
                            )}

                          </tbody>

                        </table>

                      </div>

                    </div>

                  );
                }
              )

            )}

          </div>

        </section>

      )}


      {/* ======================================================
          MODAL NOUVEAU PAIEMENT
      ====================================================== */}

      {modalCreation && peutCreer && (

        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:p-4">

          <div className="flex min-h-full items-center justify-center py-4 sm:py-8">

            <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="flex items-start justify-between gap-4 border-b bg-slate-50 p-4 sm:p-5">

                <div>

                  <h2 className="text-lg font-bold text-slate-800 sm:text-xl">
                    Nouveau paiement
                  </h2>

                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    Enregistrer un versement pour une cotisation
                  </p>

                </div>

                <button
                  onClick={fermerFormulaire}
                  className="shrink-0 rounded-xl p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                >

                  <X size={20} />

                </button>

              </div>


              {/* FORMULAIRE */}

              <form
                onSubmit={enregistrerPaiement}
                className="space-y-5 p-4 sm:p-6"
              >

                {/* MEMBRE */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Membre
                  </label>

                  <select
                    value={
                      formulaire.membre_id
                    }
                    onChange={(e) =>
                      changerMembre(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >

                    <option value="">
                      Sélectionner un membre
                    </option>

                    {membres.map(
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

                </div>


                {/* COTISATION */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Cotisation
                  </label>

                  <select
                    value={
                      formulaire.cotisation_id
                    }
                    onChange={(e) =>
                      changerCotisation(
                        e.target.value
                      )
                    }
                    disabled={
                      !formulaire.membre_id
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >

                    <option value="">

                      {!formulaire.membre_id
                        ? "Sélectionnez d'abord un membre"
                        : "Sélectionner une cotisation"}

                    </option>

                    {cotisationsDisponibles.map(
                      (cotisation) => (

                        <option
                          key={cotisation.id}
                          value={cotisation.id}
                        >

                          {cotisation.mois_concerne}{" "}
                          {cotisation.annee}
                          {" — reste "}
                          {formaterMontant(
                            cotisation.montant_du
                          )}

                        </option>

                      )
                    )}

                  </select>

                  {formulaire.membre_id &&
                    cotisationsDisponibles.length ===
                      0 && (

                      <p className="mt-2 text-xs text-amber-600">

                        Ce membre n'a aucune cotisation
                        avec un reste à payer.

                      </p>

                    )}

                </div>


                {/* INFORMATIONS COTISATION */}

                {formulaire.cotisation_id && (

                  <div className="grid grid-cols-1 gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 sm:grid-cols-3">

                    <div>

                      <p className="text-xs text-slate-500">
                        Montant fixé
                      </p>

                      <p className="mt-1 font-bold text-slate-800">

                        {formaterMontant(
                          trouverCotisation(
                            formulaire.cotisation_id
                          )?.montant
                        )}

                      </p>

                    </div>


                    <div>

                      <p className="text-xs text-emerald-700">
                        Déjà payé
                      </p>

                      <p className="mt-1 font-bold text-emerald-700">

                        {formaterMontant(
                          Number(
                            trouverCotisation(
                              formulaire.cotisation_id
                            )?.montant
                          ) -
                            Number(
                              trouverCotisation(
                                formulaire.cotisation_id
                              )?.montant_du
                            )
                        )}

                      </p>

                    </div>


                    <div>

                      <p className="text-xs text-amber-700">
                        Reste
                      </p>

                      <p className="mt-1 font-bold text-amber-700">

                        {formaterMontant(
                          trouverCotisation(
                            formulaire.cotisation_id
                          )?.montant_du
                        )}

                      </p>

                    </div>

                  </div>

                )}


                {/* MONTANT */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Montant du paiement
                  </label>

                  <div className="relative">

                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={
                        formulaire.montant
                      }
                      onChange={(e) =>
                        modifierFormulaire(
                          "montant",
                          e.target.value
                        )
                      }
                      placeholder="Ex : 3000"
                      className="w-full rounded-xl border border-emerald-200 px-4 py-3 pr-20 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      FCFA
                    </span>

                  </div>

                </div>


                {/* MODE + DATE */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Mode de paiement
                    </label>

                    <select
                      value={
                        formulaire.mode_paiement
                      }
                      onChange={(e) =>
                        modifierFormulaire(
                          "mode_paiement",
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    >

                      <option value="espèce">
                        Espèce
                      </option>

                      <option value="wave">
                        Wave
                      </option>

                      <option value="orange money">
                        Orange Money
                      </option>

                      <option value="virement">
                        Virement
                      </option>

                      <option value="chèque">
                        Chèque
                      </option>

                      <option value="autre">
                        Autre
                      </option>

                    </select>

                  </div>


                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Date du paiement
                    </label>

                    <input
                      type="date"
                      value={
                        formulaire.date_paiement
                      }
                      onChange={(e) =>
                        modifierFormulaire(
                          "date_paiement",
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />

                  </div>

                </div>


                {/* REFERENCE */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">

                    Référence

                    <span className="ml-1 font-normal text-slate-400">
                      (facultatif)
                    </span>

                  </label>

                  <input
                    type="text"
                    value={
                      formulaire.reference
                    }
                    onChange={(e) =>
                      modifierFormulaire(
                        "reference",
                        e.target.value
                      )
                    }
                    placeholder="Ex : TXN-2026-001"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />

                </div>


                {/* ACTIONS */}

                <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    onClick={fermerFormulaire}
                    className="w-full rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:w-auto"
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 sm:w-auto"
                  >
                    Enregistrer le paiement
                  </button>

                </div>

              </form>

            </div>

          </div>

        </div>

      )}


      {/* ======================================================
          MODAL DÉTAIL
      ====================================================== */}

      {modalDetail &&
        paiementSelectionne && (

          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:p-4">

            <div className="flex min-h-full items-center justify-center py-4">

              <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

                <div className="flex items-start justify-between gap-4 border-b bg-slate-50 p-5">

                  <div>

                    <h2 className="text-lg font-bold text-slate-800">
                      Détail du paiement
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Informations du paiement
                    </p>

                  </div>

                  <button
                    onClick={() =>
                      setModalDetail(
                        false
                      )
                    }
                    className="rounded-xl p-2 hover:bg-slate-200"
                  >

                    <X size={20} />

                  </button>

                </div>


                <div className="space-y-4 p-5 sm:p-6">

                  {/* MEMBRE */}

                  <div className="rounded-xl bg-slate-50 p-4">

                    <p className="text-xs font-medium uppercase text-slate-400">
                      Membre
                    </p>

                    <p className="mt-1 font-semibold text-slate-800">

                      {paiementSelectionne
                        .membre
                        ? `${paiementSelectionne.membre.prenom || ""} ${paiementSelectionne.membre.nom || ""}`.trim()
                        : nomMembre(
                            paiementSelectionne.membre_id
                          )}

                    </p>

                  </div>


                  {/* COTISATION */}

                  <div className="rounded-xl bg-slate-50 p-4">

                    <p className="text-xs font-medium uppercase text-slate-400">
                      Cotisation
                    </p>

                    <p className="mt-1 font-semibold text-slate-800">

                      {paiementSelectionne
                        .cotisation
                        ?.mois_concerne ||
                        "-"}{" "}

                      {paiementSelectionne
                        .cotisation
                        ?.annee ||
                        ""}

                    </p>

                  </div>


                  {/* MONTANT */}

                  <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-4">

                    <span className="text-sm text-emerald-700">
                      Montant payé
                    </span>

                    <span className="font-bold text-emerald-700">

                      {formaterMontant(
                        paiementSelectionne
                          .montant
                      )}

                    </span>

                  </div>


                  {/* MODE */}

                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">

                    <span className="text-sm text-slate-500">
                      Mode
                    </span>

                    <span className="font-semibold capitalize text-slate-800">

                      {paiementSelectionne
                        .mode_paiement ||
                        "-"}

                    </span>

                  </div>


                  {/* DATE */}

                  <div className="flex items-center justify-between border-t pt-4">

                    <span className="text-sm text-slate-500">
                      Date
                    </span>

                    <span className="font-medium text-slate-700">

                      {formaterDate(
                        paiementSelectionne
                          .date_paiement
                      )}

                    </span>

                  </div>


                  {/* REFERENCE */}

                  {paiementSelectionne
                    .reference && (

                    <div className="flex items-center justify-between">

                      <span className="text-sm text-slate-500">
                        Référence
                      </span>

                      <span className="max-w-[55%] break-all text-right font-medium text-slate-700">

                        {paiementSelectionne
                          .reference}

                      </span>

                    </div>

                  )}


                  {/* STATUT */}

                  {paiementSelectionne
                    .cotisation && (

                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">

                      <span className="text-sm text-slate-500">
                        Statut cotisation
                      </span>

                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">

                        {paiementSelectionne
                          .cotisation
                          .statut ===
                        "Payée" ? (
                          <CheckCircle2
                            size={14}
                          />
                        ) : (
                          <Clock
                            size={14}
                          />
                        )}

                        {paiementSelectionne
                          .cotisation
                          .statut ||
                          "-"}

                      </span>

                    </div>

                  )}

                </div>

              </div>

            </div>

          </div>

        )}

    </div>
  );
}