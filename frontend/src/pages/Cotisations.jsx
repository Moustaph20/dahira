import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Wallet,
  Plus,
  RefreshCw,
  Search,
  X,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  CreditCard,
  History,
  Filter,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import {
  getCotisations,
  creerCotisation,
  getCotisation,
  ajouterPaiement,
} from "../api/cotisations";

import { getMembres } from "../api/membres";

// ============================================================
// CONSTANTES
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

const MODES_PAIEMENT = [
  "espèce",
  "wave",
  "orange money",
  "virement",
  "chèque",
];

// ============================================================
// HELPERS
// ============================================================

function formaterMontant(montant) {
  return (
    Number(montant || 0).toLocaleString("fr-FR") +
    " FCFA"
  );
}

function formaterDate(date) {
  if (!date) return "-";

  try {
    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString("fr-FR");
  } catch {
    return date;
  }
}

function obtenirMoisActuel() {
  const mois = new Date().toLocaleDateString(
    "fr-FR",
    {
      month: "long",
    }
  );

  return (
    mois.charAt(0).toUpperCase() +
    mois.slice(1)
  );
}

function obtenirNumeroMois(mois) {
  const valeur = String(mois || "")
    .trim()
    .toLowerCase();

  const index = MOIS.findIndex(
    (item) =>
      item.toLowerCase() === valeur
  );

  return index >= 0 ? index + 1 : 0;
}

function calculerReste(cotisation) {
  const montant = Number(
    cotisation?.montant || 0
  );

  const cotise = Number(
    cotisation?.montant_cotise || 0
  );

  return Math.max(0, montant - cotise);
}

function getStatut(cotisation) {
  const fixe = Number(
    cotisation?.montant || 0
  );

  const cotise = Number(
    cotisation?.montant_cotise || 0
  );

  if (cotise >= fixe && fixe > 0) {
    return {
      label: "Payée",
      classe:
        "bg-emerald-100 text-emerald-700",
      icon: CheckCircle2,
    };
  }

  if (cotise > 0) {
    return {
      label: "Partiellement payée",
      classe:
        "bg-amber-100 text-amber-700",
      icon: Clock,
    };
  }

  return {
    label: "Impayée",
    classe: "bg-red-100 text-red-700",
    icon: AlertCircle,
  };
}

// ============================================================
// COMPOSANT
// ============================================================

export default function Cotisations() {
  const { utilisateur } = useAuth();

  // ==========================================================
  // ETATS
  // ==========================================================

  const [cotisations, setCotisations] =
    useState([]);

  const [membres, setMembres] = useState([]);

  const [chargement, setChargement] =
    useState(true);

  const [erreur, setErreur] =
    useState("");

  const [recherche, setRecherche] =
    useState("");

  // ------------------------------
  // FILTRES
  // ------------------------------

  const [filtreMois, setFiltreMois] =
    useState("");

  const [filtreAnnee, setFiltreAnnee] =
    useState("");

  const [filtreStatut, setFiltreStatut] =
    useState("");

  // ------------------------------
  // MODALES
  // ------------------------------

  const [modalCreation, setModalCreation] =
    useState(false);

  const [modalDetail, setModalDetail] =
    useState(false);

  const [modalPaiement, setModalPaiement] =
    useState(false);

  const [
    cotisationSelectionnee,
    setCotisationSelectionnee,
  ] = useState(null);

  // ==========================================================
  // FORMULAIRE CREATION
  // ==========================================================

  const maintenant = new Date();

  const [formulaire, setFormulaire] =
    useState({
      membre_id: "",
      montant: "",
      montant_cotise: "",
      mois_concerne:
        obtenirMoisActuel(),
      annee: maintenant.getFullYear(),
      mode_paiement: "espèce",
      date_cotisation:
        maintenant
          .toISOString()
          .split("T")[0],
      reference: "",
    });

  // ==========================================================
  // FORMULAIRE PAIEMENT
  // ==========================================================

  const [
    formulairePaiement,
    setFormulairePaiement,
  ] = useState({
    montant: "",
    mode_paiement: "espèce",
    date_paiement:
      maintenant
        .toISOString()
        .split("T")[0],
    reference: "",
  });

  // ==========================================================
  // PERMISSIONS
  // ==========================================================

  const permissions =
    utilisateur?.permissions || [];

  const peutConsulter =
    permissions.some(
      (permission) =>
        permission.code ===
        "COTISATION_CONSULTER"
    );

  const peutCreer =
    permissions.some(
      (permission) =>
        permission.code ===
        "COTISATION_CREER"
    );

  const membreId =
    utilisateur?.membre_id;

  // ==========================================================
  // MEMBRES
  // ==========================================================

  const trouverMembre = (id) => {
    return membres.find(
      (membre) =>
        Number(membre.id) ===
        Number(id)
    );
  };

  const nomMembre = (id) => {
    const membre = trouverMembre(id);

    if (!membre) {
      return `Membre #${id}`;
    }

    return `${membre.prenom || ""} ${
      membre.nom || ""
    }`.trim();
  };

  const obtenirMontantFixeMembre = (
    membre
  ) => {
    if (!membre) return 0;

    return Number(
      membre.montant_cotisation ??
        membre.montant_mensuel ??
        membre.cotisation_mensuelle ??
        membre.montant_fixe ??
        membre.montant ??
        0
    );
  };

  // ==========================================================
  // CHARGER LES MEMBRES
  // ==========================================================

  const chargerMembres = async () => {
    if (!peutCreer) return [];

    const data = await getMembres();

    const liste = Array.isArray(data)
      ? data
      : data?.membres || [];

    setMembres(liste);

    return liste;
  };

  // ==========================================================
  // CHARGER LES COTISATIONS
  // ==========================================================

  const chargerCotisations = async () => {
    try {
      setChargement(true);
      setErreur("");

      if (peutCreer) {
        await chargerMembres();
      }

      let params = {};

      if (!peutCreer && membreId) {
        params.membre_id = membreId;
      }

      const data =
        await getCotisations(params);

      const liste =
        data?.cotisations || [];

      setCotisations(liste);
    } catch (error) {
      console.error(
        "ERREUR CHARGEMENT COTISATIONS :",
        error
      );

      setErreur(
        error?.response?.data?.detail ||
          "Impossible de charger les cotisations."
      );
    } finally {
      setChargement(false);
    }
  };

  // ==========================================================
  // CHARGEMENT INITIAL
  // ==========================================================

  useEffect(() => {
    if (!utilisateur) return;

    if (!peutConsulter) {
      setErreur(
        "Vous n'avez pas la permission de consulter les cotisations."
      );

      setChargement(false);
      return;
    }

    chargerCotisations();
  }, [
    utilisateur,
    membreId,
    peutCreer,
    peutConsulter,
  ]);

  // ==========================================================
  // MES COTISATIONS
  // ==========================================================

  const mesCotisations = useMemo(() => {
    return cotisations.filter(
      (cotisation) =>
        Number(cotisation.membre_id) ===
        Number(membreId)
    );
  }, [cotisations, membreId]);

  const totalMesMontantsFixes =
    mesCotisations.reduce(
      (somme, cotisation) =>
        somme +
        Number(cotisation.montant || 0),
      0
    );

  const totalMesCotisations =
    mesCotisations.reduce(
      (somme, cotisation) =>
        somme +
        Number(
          cotisation.montant_cotise || 0
        ),
      0
    );

  const totalMesRestes =
    mesCotisations.reduce(
      (somme, cotisation) =>
        somme +
        calculerReste(cotisation),
      0
    );

  // ==========================================================
  // ANNEES DISPONIBLES
  // ==========================================================

  const anneesDisponibles = useMemo(() => {
    const annees = cotisations
      .map((cotisation) =>
        Number(cotisation.annee)
      )
      .filter(
        (annee) =>
          Number.isFinite(annee) &&
          annee > 0
      );

    const uniques = [
      ...new Set(annees),
    ];

    return uniques.sort(
      (a, b) => b - a
    );
  }, [cotisations]);

  // ==========================================================
  // FILTRAGE
  // ==========================================================

  const cotisationsFiltrees = useMemo(() => {
    const terme =
      recherche
        .trim()
        .toLowerCase();

    return cotisations.filter(
      (cotisation) => {
        // ------------------------------
        // MOIS
        // ------------------------------

        if (
          filtreMois &&
          String(
            cotisation.mois_concerne || ""
          ).toLowerCase() !==
            filtreMois.toLowerCase()
        ) {
          return false;
        }

        // ------------------------------
        // ANNEE
        // ------------------------------

        if (
          filtreAnnee &&
          Number(cotisation.annee) !==
            Number(filtreAnnee)
        ) {
          return false;
        }

        // ------------------------------
        // STATUT
        // ------------------------------

        if (filtreStatut) {
          const statut =
            getStatut(cotisation)
              .label;

          if (
            statut !== filtreStatut
          ) {
            return false;
          }
        }

        // ------------------------------
        // RECHERCHE
        // ------------------------------

        if (terme) {
          const membre =
            membres.find(
              (item) =>
                Number(item.id) ===
                Number(
                  cotisation.membre_id
                )
            );

          const nom =
            membre?.nom || "";

          const prenom =
            membre?.prenom || "";

          const telephone =
            membre?.telephone || "";

          const nomComplet =
            `${prenom} ${nom}`;

          const texte = `
            ${nom}
            ${prenom}
            ${nomComplet}
            ${telephone}
          `.toLowerCase();

          if (
            !texte.includes(terme)
          ) {
            return false;
          }
        }

        return true;
      }
    );
  }, [
    cotisations,
    membres,
    recherche,
    filtreMois,
    filtreAnnee,
    filtreStatut,
  ]);

  // ==========================================================
  // GROUPEMENT PAR MOIS
  // ==========================================================

  const cotisationsParMois =
    useMemo(() => {
      const groupes = {};

      cotisationsFiltrees.forEach(
        (cotisation) => {
          const mois =
            cotisation.mois_concerne ||
            "Mois inconnu";

          const annee = Number(
            cotisation.annee || 0
          );

          const numeroMois =
            obtenirNumeroMois(mois);

          const cle =
            `${annee}-${String(
              numeroMois
            ).padStart(2, "0")}`;

          if (!groupes[cle]) {
            groupes[cle] = {
              mois,
              annee,
              cotisations: [],
            };
          }

          groupes[
            cle
          ].cotisations.push(
            cotisation
          );
        }
      );

      return Object.values(
        groupes
      ).sort((a, b) => {
        if (
          Number(a.annee) !==
          Number(b.annee)
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
      });
    }, [cotisationsFiltrees]);

  // ==========================================================
  // STATISTIQUES FILTREES
  // ==========================================================

  const totalFiltreFixe =
    cotisationsFiltrees.reduce(
      (somme, cotisation) =>
        somme +
        Number(cotisation.montant || 0),
      0
    );

  const totalFiltreCotise =
    cotisationsFiltrees.reduce(
      (somme, cotisation) =>
        somme +
        Number(
          cotisation.montant_cotise ||
            0
        ),
      0
    );

  const totalFiltreReste =
    cotisationsFiltrees.reduce(
      (somme, cotisation) =>
        somme +
        calculerReste(cotisation),
      0
    );

  const nombrePayees =
    cotisationsFiltrees.filter(
      (cotisation) =>
        getStatut(cotisation)
          .label === "Payée"
    ).length;

  const nombrePartielles =
    cotisationsFiltrees.filter(
      (cotisation) =>
        getStatut(cotisation)
          .label ===
        "Partiellement payée"
    ).length;

  const nombreImpayees =
    cotisationsFiltrees.filter(
      (cotisation) =>
        getStatut(cotisation)
          .label === "Impayée"
    ).length;

  // ==========================================================
  // RESET FILTRES
  // ==========================================================

  const filtresActifs =
    Boolean(
      recherche ||
        filtreMois ||
        filtreAnnee ||
        filtreStatut
    );

  const reinitialiserFiltres = () => {
    setRecherche("");
    setFiltreMois("");
    setFiltreAnnee("");
    setFiltreStatut("");
  };

  // ==========================================================
  // FORMULAIRE CREATION
  // ==========================================================

  const ouvrirFormulaire = () => {
    const date = new Date();

    setFormulaire({
      membre_id: "",
      montant: "",
      montant_cotise: "",
      mois_concerne:
        obtenirMoisActuel(),
      annee: date.getFullYear(),
      mode_paiement: "espèce",
      date_cotisation:
        date
          .toISOString()
          .split("T")[0],
      reference: "",
    });

    setErreur("");
    setModalCreation(true);
  };

  const fermerFormulaire = () => {
    setModalCreation(false);
  };

  const modifierFormulaire = (
    event
  ) => {
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
  };

  const changerMembre = (event) => {
    const membre_id =
      event.target.value;

    const membre =
      trouverMembre(membre_id);

    const montant =
      obtenirMontantFixeMembre(
        membre
      );

    setFormulaire(
      (ancien) => ({
        ...ancien,
        membre_id,
        montant:
          montant > 0
            ? montant
            : "",
      })
    );
  };

  // ==========================================================
  // ENREGISTRER COTISATION
  // ==========================================================

  const enregistrerCotisation =
    async (event) => {
      event.preventDefault();

      try {
        setErreur("");

        if (
          !formulaire.membre_id
        ) {
          setErreur(
            "Veuillez sélectionner un membre."
          );
          return;
        }

        const montant = Number(
          formulaire.montant
        );

        const montantCotise =
          Number(
            formulaire.montant_cotise ||
              0
          );

        if (
          !Number.isFinite(
            montant
          ) ||
          montant <= 0
        ) {
          setErreur(
            "Le montant mensuel fixé doit être supérieur à 0."
          );
          return;
        }

        if (
          !Number.isFinite(
            montantCotise
          ) ||
          montantCotise < 0
        ) {
          setErreur(
            "Le premier paiement est invalide."
          );
          return;
        }

        if (
          montantCotise >
          montant
        ) {
          setErreur(
            "Le premier paiement ne peut pas dépasser le montant fixé."
          );
          return;
        }

        await creerCotisation({
          membre_id: Number(
            formulaire.membre_id
          ),
          montant,
          montant_cotise:
            montantCotise,
          mois_concerne:
            formulaire.mois_concerne,
          annee: Number(
            formulaire.annee
          ),
          mode_paiement:
            formulaire.mode_paiement,
          date_cotisation:
            formulaire.date_cotisation,
          reference:
            formulaire.reference
              ?.trim() || null,
        });

        setModalCreation(false);

        await chargerCotisations();
      } catch (error) {
        console.error(
          "ERREUR CREATION COTISATION :",
          error
        );

        setErreur(
          error?.response?.data
            ?.detail ||
            "Impossible d'enregistrer la cotisation."
        );
      }
    };

  // ==========================================================
  // PAIEMENT
  // ==========================================================

  const ouvrirPaiement = (
    cotisation
  ) => {
    setCotisationSelectionnee(
      cotisation
    );

    setFormulairePaiement({
      montant: "",
      mode_paiement: "espèce",
      date_paiement:
        new Date()
          .toISOString()
          .split("T")[0],
      reference: "",
    });

    setErreur("");
    setModalPaiement(true);
  };

  const fermerPaiement = () => {
    setModalPaiement(false);
  };

  const enregistrerPaiement =
    async (event) => {
      event.preventDefault();

      try {
        setErreur("");

        if (
          !cotisationSelectionnee
        ) {
          return;
        }

        const reste =
          calculerReste(
            cotisationSelectionnee
          );

        const montant = Number(
          formulairePaiement.montant
        );

        if (
          !Number.isFinite(
            montant
          ) ||
          montant <= 0
        ) {
          setErreur(
            "Le montant du paiement doit être supérieur à 0."
          );
          return;
        }

        if (montant > reste) {
          setErreur(
            "Le paiement ne peut pas dépasser le reste à payer."
          );
          return;
        }

        await ajouterPaiement(
          cotisationSelectionnee.id,
          {
            montant,
            mode_paiement:
              formulairePaiement.mode_paiement,
            date_paiement:
              formulairePaiement.date_paiement,
            reference:
              formulairePaiement.reference
                ?.trim() || null,
          }
        );

        setModalPaiement(false);

        await chargerCotisations();

        if (modalDetail) {
          try {
            const detail =
              await getCotisation(
                cotisationSelectionnee.id
              );

            setCotisationSelectionnee(
              detail?.cotisation ||
                detail
            );
          } catch (detailError) {
            console.error(
              "Erreur actualisation détail :",
              detailError
            );
          }
        }
      } catch (error) {
        console.error(
          "ERREUR AJOUT PAIEMENT :",
          error
        );

        setErreur(
          error?.response?.data
            ?.detail ||
            "Impossible d'enregistrer le paiement."
        );
      }
    };

  // ==========================================================
  // DETAIL
  // ==========================================================

  const ouvrirDetail = async (
    cotisation
  ) => {
    try {
      setErreur("");

      const data =
        await getCotisation(
          cotisation.id
        );

      setCotisationSelectionnee(
        data?.cotisation || data
      );

      setModalDetail(true);
    } catch (error) {
      console.error(
        "ERREUR DETAIL COTISATION :",
        error
      );

      setCotisationSelectionnee(
        cotisation
      );

      setModalDetail(true);
    }
  };

  // ==========================================================
  // AFFICHAGE STATUT
  // ==========================================================

  const AffichageStatut = ({
    cotisation,
  }) => {
    const statut =
      getStatut(cotisation);

    const Icon =
      statut.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${statut.classe}`}
      >
        <Icon size={14} />
        {statut.label}
      </span>
    );
  };

  // ==========================================================
  // RENDU
  // ==========================================================

  if (!utilisateur) {
    return null;
  }

  return (
    <div className="min-h-full space-y-6 bg-slate-50/50 p-4 sm:p-6">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Wallet size={24} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Gestion financière
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
                Cotisations
              </h1>
            </div>
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
            Suivez les cotisations mensuelles
            des membres du Dahira, les
            paiements effectués et les
            restes à payer.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={
              chargerCotisations
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
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
              type="button"
              onClick={
                ouvrirFormulaire
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-950 focus:outline-none focus:ring-4 focus:ring-emerald-900/20"
            >
              <Plus size={18} />
              Nouvelle cotisation
            </button>
          )}
        </div>
      </div>

      {/* ======================================================
          ERREUR
      ====================================================== */}

      {erreur && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex gap-3">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>{erreur}</span>
          </div>

          <button
            type="button"
            onClick={() =>
              setErreur("")
            }
            className="text-red-500 hover:text-red-800"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* ======================================================
          CHARGEMENT
      ====================================================== */}

      {chargement ? (
        <div className="flex min-h-[350px] items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-emerald-700" />
            Chargement des cotisations...
          </div>
        </div>
      ) : (
        <>
          {/* ==================================================
              MES COTISATIONS
          ================================================== */}

          <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <CreditCard size={20} />
                </div>

                <div>
                  <h2 className="font-bold text-gray-900">
                    Mes cotisations
                  </h2>

                  <p className="mt-0.5 text-sm text-gray-500">
                    Votre situation
                    personnelle
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
              <div className="rounded-2xl border border-gray-100 bg-slate-50 p-5">
                <p className="text-sm font-medium text-gray-500">
                  Montant fixé
                </p>

                <p className="mt-3 text-2xl font-bold text-gray-900">
                  {formaterMontant(
                    totalMesMontantsFixes
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                <p className="text-sm font-medium text-emerald-700">
                  Total cotisé
                </p>

                <p className="mt-3 text-2xl font-bold text-emerald-900">
                  {formaterMontant(
                    totalMesCotisations
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                <p className="text-sm font-medium text-amber-700">
                  Reste à payer
                </p>

                <p className="mt-3 text-2xl font-bold text-amber-900">
                  {formaterMontant(
                    totalMesRestes
                  )}
                </p>
              </div>
            </div>

            {mesCotisations.length ===
            0 ? (
              <div className="border-t border-gray-100 px-6 py-12 text-center">
                <Wallet
                  size={40}
                  className="mx-auto text-gray-300"
                />

                <p className="mt-4 font-semibold text-gray-700">
                  Aucune cotisation
                </p>

                <p className="mt-1 text-sm text-gray-400">
                  Aucune cotisation
                  enregistrée pour votre
                  compte.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border-t border-gray-100">
                <table className="w-full min-w-[780px]">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-100">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Période
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Montant fixé
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Cotisé
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Reste
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Statut
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {mesCotisations.map(
                      (cotisation) => (
                        <tr
                          key={
                            cotisation.id
                          }
                          className="transition hover:bg-gray-50"
                        >
                          <td className="px-6 py-5">
                            <p className="font-semibold text-gray-900">
                              {
                                cotisation.mois_concerne
                              }
                            </p>

                            <p className="mt-0.5 text-xs text-gray-400">
                              {
                                cotisation.annee
                              }
                            </p>
                          </td>

                          <td className="px-6 py-5 text-sm font-semibold text-gray-700">
                            {formaterMontant(
                              cotisation.montant
                            )}
                          </td>

                          <td className="px-6 py-5 text-sm font-semibold text-emerald-700">
                            {formaterMontant(
                              cotisation.montant_cotise
                            )}
                          </td>

                          <td className="px-6 py-5 text-sm font-semibold text-amber-700">
                            {formaterMontant(
                              calculerReste(
                                cotisation
                              )
                            )}
                          </td>

                          <td className="px-6 py-5">
                            <AffichageStatut
                              cotisation={
                                cotisation
                              }
                            />
                          </td>

                          <td className="px-6 py-5 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                ouvrirDetail(
                                  cotisation
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                            >
                              <Eye
                                size={15}
                              />
                              Voir
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ==================================================
              COTISATIONS DU DAHIRA
          ================================================== */}

          {peutCreer && (
            <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <h2 className="font-bold text-gray-900">
                      Cotisations du Dahira
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Cotisations regroupées
                      par mois et année
                    </p>
                  </div>

                  {/* RECHERCHE */}
                  <div className="relative w-full xl:max-w-sm">
                    <Search
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="text"
                      value={recherche}
                      onChange={(event) =>
                        setRecherche(
                          event.target.value
                        )
                      }
                      placeholder="Nom, prénom ou téléphone..."
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-10 text-sm text-gray-900 outline-none transition focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10"
                    />

                    {recherche && (
                      <button
                        type="button"
                        onClick={() =>
                          setRecherche("")
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* ==================================================
                    FILTRES
                ================================================== */}

                <div className="mt-5 rounded-2xl border border-gray-100 bg-slate-50 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Filter
                        size={17}
                        className="text-emerald-700"
                      />

                      <p className="text-sm font-semibold text-gray-800">
                        Filtres
                      </p>
                    </div>

                    {filtresActifs && (
                      <button
                        type="button"
                        onClick={
                          reinitialiserFiltres
                        }
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                      >
                        Réinitialiser
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    {/* MOIS */}
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                        Mois
                      </label>

                      <select
                        value={filtreMois}
                        onChange={(event) =>
                          setFiltreMois(
                            event.target.value
                          )
                        }
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
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

                    {/* ANNEE */}
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                        Année
                      </label>

                      <select
                        value={filtreAnnee}
                        onChange={(event) =>
                          setFiltreAnnee(
                            event.target.value
                          )
                        }
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
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

                    {/* STATUT */}
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                        Statut
                      </label>

                      <select
                        value={filtreStatut}
                        onChange={(event) =>
                          setFiltreStatut(
                            event.target.value
                          )
                        }
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
                      >
                        <option value="">
                          Tous les statuts
                        </option>

                        <option value="Payée">
                          Payée
                        </option>

                        <option value="Partiellement payée">
                          Partiellement
                          payée
                        </option>

                        <option value="Impayée">
                          Impayée
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* ==================================================
                  STATISTIQUES
              ================================================== */}

              <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-5 sm:p-6">
                <div className="rounded-2xl border border-gray-100 bg-slate-50 p-5">
                  <p className="text-sm font-medium text-gray-500">
                    Cotisations
                  </p>

                  <p className="mt-3 text-2xl font-bold text-gray-900">
                    {
                      cotisationsFiltrees.length
                    }
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    après filtrage
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5">
                  <p className="text-sm font-medium text-gray-500">
                    Montant fixé
                  </p>

                  <p className="mt-3 text-xl font-bold text-gray-900">
                    {formaterMontant(
                      totalFiltreFixe
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                  <p className="text-sm font-medium text-emerald-700">
                    Total cotisé
                  </p>

                  <p className="mt-3 text-xl font-bold text-emerald-900">
                    {formaterMontant(
                      totalFiltreCotise
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                  <p className="text-sm font-medium text-amber-700">
                    Total restant
                  </p>

                  <p className="mt-3 text-xl font-bold text-amber-900">
                    {formaterMontant(
                      totalFiltreReste
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5">
                  <p className="text-sm font-medium text-gray-500">
                    Situation
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {nombrePayees} payées
                    </span>

                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      {nombrePartielles} partielles
                    </span>

                    <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                      {nombreImpayees} impayées
                    </span>
                  </div>
                </div>
              </div>

              {/* ==================================================
                  LISTE PAR MOIS
              ================================================== */}

              <div className="border-t border-gray-100">
                {cotisationsParMois.length ===
                0 ? (
                  <div className="px-6 py-16 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                      <Search
                        size={26}
                      />
                    </div>

                    <h3 className="mt-5 font-semibold text-gray-900">
                      Aucune cotisation
                      trouvée
                    </h3>

                    <p className="mt-2 text-sm text-gray-500">
                      Aucune cotisation ne
                      correspond aux filtres
                      sélectionnés.
                    </p>

                    {filtresActifs && (
                      <button
                        type="button"
                        onClick={
                          reinitialiserFiltres
                        }
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-950"
                      >
                        <X size={16} />
                        Réinitialiser les
                        filtres
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6 p-5 sm:p-6">
                    {cotisationsParMois.map(
                      (groupe) => {
                        const totalFixe =
                          groupe.cotisations.reduce(
                            (
                              somme,
                              cotisation
                            ) =>
                              somme +
                              Number(
                                cotisation.montant ||
                                  0
                              ),
                            0
                          );

                        const totalCotise =
                          groupe.cotisations.reduce(
                            (
                              somme,
                              cotisation
                            ) =>
                              somme +
                              Number(
                                cotisation.montant_cotise ||
                                  0
                              ),
                            0
                          );

                        const totalReste =
                          groupe.cotisations.reduce(
                            (
                              somme,
                              cotisation
                            ) =>
                              somme +
                              calculerReste(
                                cotisation
                              ),
                            0
                          );

                        return (
                          <div
                            key={`${groupe.annee}-${groupe.mois}`}
                            className="overflow-hidden rounded-2xl border border-gray-100"
                          >
                            {/* EN-TETE MOIS */}
                            <div className="flex flex-col gap-4 border-b border-gray-100 bg-slate-50 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 font-bold text-emerald-700">
                                  {obtenirNumeroMois(
                                    groupe.mois
                                  )}
                                </div>

                                <div>
                                  <h3 className="font-bold text-gray-900">
                                    {
                                      groupe.mois
                                    }{" "}
                                    {
                                      groupe.annee
                                    }
                                  </h3>

                                  <p className="mt-0.5 text-xs text-gray-500">
                                    {
                                      groupe
                                        .cotisations
                                        .length
                                    }{" "}
                                    cotisation
                                    {groupe
                                      .cotisations
                                      .length >
                                    1
                                      ? "s"
                                      : ""}{" "}
                                    enregistrée
                                    {groupe
                                      .cotisations
                                      .length >
                                    1
                                      ? "s"
                                      : ""}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-3">
                                <div className="rounded-xl bg-white px-3 py-2 text-center shadow-sm">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                    Fixé
                                  </p>

                                  <p className="mt-1 text-xs font-bold text-gray-800">
                                    {formaterMontant(
                                      totalFixe
                                    )}
                                  </p>
                                </div>

                                <div className="rounded-xl bg-white px-3 py-2 text-center shadow-sm">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                    Cotisé
                                  </p>

                                  <p className="mt-1 text-xs font-bold text-emerald-700">
                                    {formaterMontant(
                                      totalCotise
                                    )}
                                  </p>
                                </div>

                                <div className="rounded-xl bg-white px-3 py-2 text-center shadow-sm">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                    Reste
                                  </p>

                                  <p className="mt-1 text-xs font-bold text-amber-700">
                                    {formaterMontant(
                                      totalReste
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* TABLE */}
                            <div className="overflow-x-auto">
                              <table className="w-full min-w-[1100px]">
                                <thead className="bg-white">
                                  <tr className="border-b border-gray-100">
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                      Membre
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                      Période
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                      Montant fixé
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                      Cotisé
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                      Reste
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                      Statut
                                    </th>

                                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                      Actions
                                    </th>
                                  </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                  {groupe.cotisations.map(
                                    (
                                      cotisation
                                    ) => {
                                      const membre =
                                        trouverMembre(
                                          cotisation.membre_id
                                        );

                                      const nom =
                                        membre
                                          ? `${membre.prenom || ""} ${membre.nom || ""}`.trim()
                                          : `Membre #${cotisation.membre_id}`;

                                      const reste =
                                        calculerReste(
                                          cotisation
                                        );

                                      const estMoi =
                                        Number(
                                          cotisation.membre_id
                                        ) ===
                                        Number(
                                          membreId
                                        );

                                      return (
                                        <tr
                                          key={
                                            cotisation.id
                                          }
                                          className={`transition hover:bg-gray-50 ${
                                            estMoi
                                              ? "bg-emerald-50/30"
                                              : ""
                                          }`}
                                        >
                                          {/* MEMBRE */}
                                          <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
                                                {nom
                                                  .split(
                                                    /\s+/
                                                  )
                                                  .filter(
                                                    Boolean
                                                  )
                                                  .map(
                                                    (
                                                      mot
                                                    ) =>
                                                      mot
                                                        .charAt(
                                                          0
                                                        )
                                                        .toUpperCase()
                                                  )
                                                  .slice(
                                                    0,
                                                    2
                                                  )
                                                  .join(
                                                    ""
                                                  ) ||
                                                  "M"}
                                              </div>

                                              <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                  <p className="truncate font-semibold text-gray-900">
                                                    {
                                                      nom
                                                    }
                                                  </p>

                                                  {estMoi && (
                                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                                      Moi
                                                    </span>
                                                  )}
                                                </div>

                                                <p className="mt-0.5 text-xs text-gray-400">
                                                  {membre?.telephone ||
                                                    `ID #${cotisation.membre_id}`}
                                                </p>
                                              </div>
                                            </div>
                                          </td>

                                          {/* PERIODE */}
                                          <td className="px-6 py-5">
                                            <p className="font-semibold text-gray-800">
                                              {
                                                cotisation.mois_concerne
                                              }
                                            </p>

                                            <p className="mt-0.5 text-xs text-gray-400">
                                              {
                                                cotisation.annee
                                              }
                                            </p>
                                          </td>

                                          {/* FIXE */}
                                          <td className="px-6 py-5 text-sm font-semibold text-gray-700">
                                            {formaterMontant(
                                              cotisation.montant
                                            )}
                                          </td>

                                          {/* COTISE */}
                                          <td className="px-6 py-5 text-sm font-semibold text-emerald-700">
                                            {formaterMontant(
                                              cotisation.montant_cotise
                                            )}
                                          </td>

                                          {/* RESTE */}
                                          <td className="px-6 py-5 text-sm font-semibold text-amber-700">
                                            {formaterMontant(
                                              reste
                                            )}
                                          </td>

                                          {/* STATUT */}
                                          <td className="px-6 py-5">
                                            <AffichageStatut
                                              cotisation={
                                                cotisation
                                              }
                                            />
                                          </td>

                                          {/* ACTIONS */}
                                          <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  ouvrirDetail(
                                                    cotisation
                                                  )
                                                }
                                                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                                              >
                                                <Eye
                                                  size={
                                                    15
                                                  }
                                                />
                                                Voir
                                              </button>

                                              {reste >
                                                0 && (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    ouvrirPaiement(
                                                      cotisation
                                                    )
                                                  }
                                                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800"
                                                >
                                                  <CreditCard
                                                    size={
                                                      15
                                                    }
                                                  />
                                                  Paiement
                                                </button>
                                              )}
                                            </div>
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
                    )}
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}

      {/* ========================================================
          MODALE CREATION
      ======================================================== */}

      {modalCreation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Nouvelle cotisation
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Enregistrer la cotisation
                  mensuelle d'un membre.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  fermerFormulaire
                }
                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={
                enregistrerCotisation
              }
              className="space-y-5 p-6"
            >
              {/* MEMBRE */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Membre
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <select
                  name="membre_id"
                  value={
                    formulaire.membre_id
                  }
                  onChange={
                    changerMembre
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10"
                >
                  <option value="">
                    Sélectionner un membre
                  </option>

                  {membres.map(
                    (membre) => (
                      <option
                        key={
                          membre.id
                        }
                        value={
                          membre.id
                        }
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

              {/* MOIS + ANNEE */}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Mois concerné
                  </label>

                  <select
                    name="mois_concerne"
                    value={
                      formulaire.mois_concerne
                    }
                    onChange={
                      modifierFormulaire
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10"
                  >
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

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Année
                  </label>

                  <input
                    type="number"
                    name="annee"
                    value={
                      formulaire.annee
                    }
                    onChange={
                      modifierFormulaire
                    }
                    min="2000"
                    max="2100"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10"
                  />
                </div>
              </div>

              {/* SITUATION */}

              <div className="rounded-2xl border border-gray-100 bg-slate-50 p-5">
                <p className="mb-4 text-sm font-bold text-gray-800">
                  Situation de la
                  cotisation
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Montant mensuel fixé
                    </label>

                    <input
                      type="number"
                      name="montant"
                      value={
                        formulaire.montant
                      }
                      onChange={
                        modifierFormulaire
                      }
                      min="0"
                      step="1"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Premier paiement
                    </label>

                    <input
                      type="number"
                      name="montant_cotise"
                      value={
                        formulaire.montant_cotise
                      }
                      onChange={
                        modifierFormulaire
                      }
                      min="0"
                      step="1"
                      placeholder="0"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-white p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400">
                      Fixé
                    </p>

                    <p className="mt-1 text-xs font-bold text-gray-800">
                      {formaterMontant(
                        formulaire.montant
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-emerald-50 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wide text-emerald-600">
                      Premier paiement
                    </p>

                    <p className="mt-1 text-xs font-bold text-emerald-800">
                      {formaterMontant(
                        formulaire.montant_cotise
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-amber-50 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wide text-amber-600">
                      Reste
                    </p>

                    <p className="mt-1 text-xs font-bold text-amber-800">
                      {formaterMontant(
                        Math.max(
                          0,
                          Number(
                            formulaire.montant ||
                              0
                          ) -
                            Number(
                              formulaire.montant_cotise ||
                                0
                            )
                        )
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* PAIEMENT */}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Mode de paiement
                  </label>

                  <select
                    name="mode_paiement"
                    value={
                      formulaire.mode_paiement
                    }
                    onChange={
                      modifierFormulaire
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10"
                  >
                    {MODES_PAIEMENT.map(
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

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Date d'enregistrement
                  </label>

                  <input
                    type="date"
                    name="date_cotisation"
                    value={
                      formulaire.date_cotisation
                    }
                    onChange={
                      modifierFormulaire
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10"
                  />
                </div>
              </div>

              {/* REFERENCE */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Référence
                  <span className="ml-1 text-xs font-normal text-gray-400">
                    (optionnel)
                  </span>
                </label>

                <input
                  type="text"
                  name="reference"
                  value={
                    formulaire.reference
                  }
                  onChange={
                    modifierFormulaire
                  }
                  placeholder="Ex. WAVE-123456"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10"
                />
              </div>

              {/* BOUTONS */}

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={
                    fermerFormulaire
                  }
                  className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-950"
                >
                  <CheckCircle2
                    size={17}
                  />
                  Enregistrer la
                  cotisation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODALE PAIEMENT
      ======================================================== */}

      {modalPaiement &&
        cotisationSelectionnee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Ajouter un paiement
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {nomMembre(
                      cotisationSelectionnee.membre_id
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    fermerPaiement
                  }
                  className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={
                  enregistrerPaiement
                }
                className="space-y-5 p-6"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-gray-400">
                      Montant fixé
                    </p>

                    <p className="mt-1 font-bold text-gray-900">
                      {formaterMontant(
                        cotisationSelectionnee.montant
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-amber-50 p-4">
                    <p className="text-xs text-amber-600">
                      Reste à payer
                    </p>

                    <p className="mt-1 font-bold text-amber-900">
                      {formaterMontant(
                        calculerReste(
                          cotisationSelectionnee
                        )
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Montant du paiement
                  </label>

                  <input
                    type="number"
                    value={
                      formulairePaiement.montant
                    }
                    onChange={(event) =>
                      setFormulairePaiement(
                        (ancien) => ({
                          ...ancien,
                          montant:
                            event.target
                              .value,
                        })
                      )
                    }
                    min="1"
                    max={calculerReste(
                      cotisationSelectionnee
                    )}
                    step="1"
                    placeholder="Ex. 5000"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Mode de paiement
                    </label>

                    <select
                      value={
                        formulairePaiement.mode_paiement
                      }
                      onChange={(event) =>
                        setFormulairePaiement(
                          (ancien) => ({
                            ...ancien,
                            mode_paiement:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10"
                    >
                      {MODES_PAIEMENT.map(
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

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Date du paiement
                    </label>

                    <input
                      type="date"
                      value={
                        formulairePaiement.date_paiement
                      }
                      onChange={(event) =>
                        setFormulairePaiement(
                          (ancien) => ({
                            ...ancien,
                            date_paiement:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Référence
                    <span className="ml-1 text-xs font-normal text-gray-400">
                      (optionnel)
                    </span>
                  </label>

                  <input
                    type="text"
                    value={
                      formulairePaiement.reference
                    }
                    onChange={(event) =>
                      setFormulairePaiement(
                        (ancien) => ({
                          ...ancien,
                          reference:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="Ex. WAVE-123456"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10"
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
                  <button
                    type="button"
                    onClick={
                      fermerPaiement
                    }
                    className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-950"
                  >
                    <CreditCard
                      size={17}
                    />
                    Enregistrer le
                    paiement
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* ========================================================
          MODALE DETAIL
      ======================================================== */}

      {modalDetail &&
        cotisationSelectionnee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <History size={21} />
                  </div>

                  <div>
                    <h2 className="font-bold text-gray-900">
                      Détail de la cotisation
                    </h2>

                    <p className="mt-0.5 text-sm text-gray-500">
                      {nomMembre(
                        cotisationSelectionnee.membre_id
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setModalDetail(
                      false
                    );
                    setCotisationSelectionnee(
                      null
                    );
                  }}
                  className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5 p-6">
                {/* PERIODE */}

                <div className="rounded-2xl border border-gray-100 bg-slate-50 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Période
                      </p>

                      <p className="mt-1 text-xl font-bold text-gray-900">
                        {
                          cotisationSelectionnee.mois_concerne
                        }{" "}
                        {
                          cotisationSelectionnee.annee
                        }
                      </p>
                    </div>

                    <AffichageStatut
                      cotisation={
                        cotisationSelectionnee
                      }
                    />
                  </div>
                </div>

                {/* MONTANTS */}

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-400">
                      Montant fixé
                    </p>

                    <p className="mt-2 font-bold text-gray-900">
                      {formaterMontant(
                        cotisationSelectionnee.montant
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-xs text-emerald-600">
                      Total cotisé
                    </p>

                    <p className="mt-2 font-bold text-emerald-900">
                      {formaterMontant(
                        cotisationSelectionnee.montant_cotise
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <p className="text-xs text-amber-600">
                      Reste
                    </p>

                    <p className="mt-2 font-bold text-amber-900">
                      {formaterMontant(
                        calculerReste(
                          cotisationSelectionnee
                        )
                      )}
                    </p>
                  </div>
                </div>

                {/* INFORMATIONS */}

                <div className="rounded-2xl border border-gray-100 p-5">
                  <h3 className="font-bold text-gray-900">
                    Informations
                  </h3>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-gray-400">
                        Date d'enregistrement
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-800">
                        {formaterDate(
                          cotisationSelectionnee.date_cotisation
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">
                        Mode de paiement
                      </p>

                      <p className="mt-1 text-sm font-semibold capitalize text-gray-800">
                        {cotisationSelectionnee.mode_paiement ||
                          "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">
                        Référence
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-800">
                        {cotisationSelectionnee.reference ||
                          "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">
                        Membre
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-800">
                        {nomMembre(
                          cotisationSelectionnee.membre_id
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* HISTORIQUE PAIEMENTS */}

                <div className="rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-gray-900">
                        Historique des
                        paiements
                      </h3>

                      <p className="mt-1 text-xs text-gray-400">
                        Les paiements enregistrés
                        pour cette cotisation.
                      </p>
                    </div>

                    <History
                      size={20}
                      className="text-gray-300"
                    />
                  </div>

                  {Array.isArray(
                    cotisationSelectionnee.paiements
                  ) &&
                  cotisationSelectionnee
                    .paiements.length >
                    0 ? (
                    <div className="mt-4 space-y-3">
                      {cotisationSelectionnee.paiements.map(
                        (
                          paiement,
                          index
                        ) => (
                          <div
                            key={
                              paiement.id ||
                              index
                            }
                            className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4"
                          >
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                {formaterDate(
                                  paiement.date_paiement
                                )}
                              </p>

                              <p className="mt-1 text-xs capitalize text-gray-400">
                                {paiement.mode_paiement ||
                                  "-"}
                                {paiement.reference
                                  ? ` • ${paiement.reference}`
                                  : ""}
                              </p>
                            </div>

                            <p className="font-bold text-emerald-700">
                              {formaterMontant(
                                paiement.montant
                              )}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-gray-400">
                      Aucun historique
                      détaillé disponible.
                    </div>
                  )}
                </div>

                {/* ACTION */}

                {peutCreer &&
                  calculerReste(
                    cotisationSelectionnee
                  ) > 0 && (
                    <div className="flex justify-end border-t border-gray-100 pt-5">
                      <button
                        type="button"
                        onClick={() => {
                          setModalDetail(
                            false
                          );

                          ouvrirPaiement(
                            cotisationSelectionnee
                          );
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-950"
                      >
                        <CreditCard
                          size={17}
                        />
                        Ajouter un
                        paiement
                      </button>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}