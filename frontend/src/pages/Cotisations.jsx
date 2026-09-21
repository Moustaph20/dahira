import { useEffect, useMemo, useState } from "react";
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

const formaterMontant = (montant) => {
  const valeur = Number(montant || 0);

  return `${valeur.toLocaleString("fr-FR")} FCFA`;
};


const formaterDate = (date) => {
  if (!date) return "-";

  try {
    return new Date(date).toLocaleDateString("fr-FR");
  } catch {
    return "-";
  }
};


const obtenirMoisActuel = () => {
  const mois = new Date().getMonth();

  return MOIS[mois];
};


const obtenirNumeroMois = (mois) => {
  if (!mois) return 0;

  const index = MOIS.findIndex(
    (item) =>
      item.toLowerCase() === String(mois).toLowerCase()
  );

  return index >= 0 ? index + 1 : 0;
};


const calculerReste = (cotisation) => {
  if (!cotisation) return 0;

  const montant = Number(cotisation.montant || 0);
  const montantCotise = Number(cotisation.montant_cotise || 0);

  return Math.max(0, montant - montantCotise);
};


const getStatut = (cotisation) => {
  const montant = Number(cotisation?.montant || 0);
  const montantCotise = Number(
    cotisation?.montant_cotise || 0
  );

  if (montant <= 0) {
    return {
      label: "Invalide",
      couleur: "bg-slate-100 text-slate-600",
      icone: AlertCircle,
    };
  }

  if (montantCotise >= montant) {
    return {
      label: "Payée",
      couleur: "bg-emerald-100 text-emerald-700",
      icone: CheckCircle2,
    };
  }

  if (montantCotise > 0) {
    return {
      label: "Partielle",
      couleur: "bg-amber-100 text-amber-700",
      icone: Clock,
    };
  }

  return {
    label: "Impayée",
    couleur: "bg-red-100 text-red-700",
    icone: AlertCircle,
  };
};


// ============================================================
// COMPOSANT
// ============================================================

export default function Cotisations() {
  const { utilisateur } = useAuth();

  // ----------------------------------------------------------
  // ÉTATS
  // ----------------------------------------------------------

  const [cotisations, setCotisations] = useState([]);
  const [membres, setMembres] = useState([]);

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [recherche, setRecherche] = useState("");
  const [filtreMois, setFiltreMois] = useState("");
  const [filtreAnnee, setFiltreAnnee] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");

  const [modalCreation, setModalCreation] = useState(false);
  const [modalDetail, setModalDetail] = useState(false);
  const [modalPaiement, setModalPaiement] = useState(false);

  const [cotisationSelectionnee, setCotisationSelectionnee] =
    useState(null);

  // ----------------------------------------------------------
  // FORMULAIRE CRÉATION
  // ----------------------------------------------------------

  const maintenant = new Date();

  const [formulaire, setFormulaire] = useState({
    membre_id: "",
    montant: "",
    montant_cotise: "",
    mois_concerne: obtenirMoisActuel(),
    annee: maintenant.getFullYear(),
    mode_paiement: "espèce",
    date_cotisation: maintenant
      .toISOString()
      .split("T")[0],
    reference: "",
  });

  // ----------------------------------------------------------
  // FORMULAIRE PAIEMENT
  // ----------------------------------------------------------

  const [formulairePaiement, setFormulairePaiement] =
    useState({
      montant: "",
      mode_paiement: "espèce",
      date_paiement: maintenant
        .toISOString()
        .split("T")[0],
      reference: "",
    });


  // ==========================================================
  // PERMISSIONS
  // ==========================================================

  const permissions = utilisateur?.permissions || [];

  const peutConsulter = permissions.some(
    (permission) =>
      permission.code === "COTISATION_CONSULTER"
  );

  const peutCreer = permissions.some(
    (permission) =>
      permission.code === "COTISATION_CREER"
  );

  const membreId = utilisateur?.membre_id;


  // ==========================================================
  // MEMBRES
  // ==========================================================

  const trouverMembre = (id) => {
    return membres.find(
      (membre) =>
        Number(membre.id) === Number(id)
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


  const obtenirMontantFixeMembre = (membre) => {
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
  // MEMBRES ACTIFS
  // ==========================================================

  const membresActifs = useMemo(() => {
    return membres.filter(
      (membre) => membre.actif !== false
    );
  }, [membres]);


  // ==========================================================
  // ESTIMATION MENSUELLE DU DAHIRA
  //
  // IMPORTANT :
  // Cette estimation ne dépend PAS des lignes Cotisation.
  //
  // Exemple :
  // 35 membres actifs × 5 000 FCFA
  // = 175 000 FCFA estimés pour le mois.
  //
  // Même si seulement 20 cotisations sont créées,
  // l'estimation reste 175 000 FCFA.
  // ==========================================================

  const estimationMensuelle = useMemo(() => {
    return membresActifs.reduce(
      (total, membre) =>
        total + obtenirMontantFixeMembre(membre),
      0
    );
  }, [membresActifs]);


  // ==========================================================
  // CHARGEMENT DES MEMBRES
  // ==========================================================

  const chargerMembres = async () => {
    try {
      const data = await getMembres();

      const liste = Array.isArray(data)
        ? data
        : data?.membres || [];

      setMembres(liste);

      return liste;
    } catch (error) {
      console.error(
        "ERREUR CHARGEMENT MEMBRES :",
        error
      );

      throw error;
    }
  };


  // ==========================================================
  // CHARGEMENT DES COTISATIONS
  // ==========================================================

  const chargerCotisations = async () => {
    try {
      setChargement(true);
      setErreur("");

      /*
       * Pour la gestion du Dahira, on charge toujours
       * les membres afin de pouvoir calculer l'estimation
       * mensuelle à partir de leurs cotisations fixes.
       */
      if (peutCreer) {
        await chargerMembres();
      }

      let params = {};

      /*
       * Un membre simple ne voit que ses propres cotisations.
       */
      if (!peutCreer && membreId) {
        params.membre_id = membreId;
      }

      const data = await getCotisations(params);

      const liste = data?.cotisations || [];

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
    if (!membreId) return [];

    return cotisations.filter(
      (cotisation) =>
        Number(cotisation.membre_id) ===
        Number(membreId)
    );
  }, [cotisations, membreId]);


  const totalMesMontantsFixes = useMemo(() => {
    return mesCotisations.reduce(
      (total, cotisation) =>
        total + Number(cotisation.montant || 0),
      0
    );
  }, [mesCotisations]);


  const totalMesCotisations = useMemo(() => {
    return mesCotisations.reduce(
      (total, cotisation) =>
        total +
        Number(cotisation.montant_cotise || 0),
      0
    );
  }, [mesCotisations]);


  const totalMesRestes = useMemo(() => {
    return mesCotisations.reduce(
      (total, cotisation) =>
        total + calculerReste(cotisation),
      0
    );
  }, [mesCotisations]);


  // ==========================================================
  // ANNÉES DISPONIBLES
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

    /*
     * On ajoute l'année actuelle afin qu'elle puisse
     * apparaître même lorsqu'aucune cotisation n'a encore
     * été créée cette année.
     */
    const anneeActuelle =
      new Date().getFullYear();

    annees.push(anneeActuelle);

    return [
      ...new Set(annees),
    ].sort((a, b) => b - a);
  }, [cotisations]);


  // ==========================================================
  // FILTRAGE
  // ==========================================================

  const cotisationsFiltrees = useMemo(() => {
    return cotisations.filter((cotisation) => {
      if (
        filtreMois &&
        cotisation.mois_concerne !== filtreMois
      ) {
        return false;
      }

      if (
        filtreAnnee &&
        Number(cotisation.annee) !==
          Number(filtreAnnee)
      ) {
        return false;
      }

      if (filtreStatut) {
        const statut = getStatut(cotisation).label;

        if (statut !== filtreStatut) {
          return false;
        }
      }

      if (recherche.trim()) {
        const terme =
          recherche.trim().toLowerCase();

        const nom = nomMembre(
          cotisation.membre_id
        ).toLowerCase();

        const membre = trouverMembre(
          cotisation.membre_id
        );

        const telephone =
          membre?.telephone
            ?.toString()
            .toLowerCase() || "";

        if (
          !nom.includes(terme) &&
          !telephone.includes(terme)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    cotisations,
    filtreMois,
    filtreAnnee,
    filtreStatut,
    recherche,
    membres,
  ]);


  // ==========================================================
  // GROUPES MENSUELS
  //
  // Ici, contrairement à l'ancienne version, on crée
  // également les mois qui n'ont aucune ligne Cotisation.
  //
  // L'estimation du mois vient TOUJOURS des membres actifs.
  // ==========================================================

  const cotisationsParMois = useMemo(() => {
    const groupes = {};

    let anneesCibles = [];

    if (filtreAnnee) {
      anneesCibles = [
        Number(filtreAnnee),
      ];
    } else {
      anneesCibles = [
        ...anneesDisponibles,
      ];
    }

    /*
     * S'il n'y a absolument aucune année disponible,
     * on utilise l'année actuelle.
     */
    if (anneesCibles.length === 0) {
      anneesCibles = [
        new Date().getFullYear(),
      ];
    }

    /*
     * Création des 12 mois pour chaque année.
     *
     * Cela permet par exemple d'afficher :
     *
     * Janvier 2026
     * Février 2026
     * Mars 2026
     *
     * même si aucune Cotisation n'existe encore.
     */
    anneesCibles.forEach((annee) => {
      MOIS.forEach((mois, index) => {
        if (
          filtreMois &&
          filtreMois !== mois
        ) {
          return;
        }

        const numeroMois = index + 1;

        const cle = `${annee}-${String(
          numeroMois
        ).padStart(2, "0")}`;

        groupes[cle] = {
          mois,
          annee,
          cotisations: [],
        };
      });
    });

    /*
     * Ajout des cotisations existantes dans les bons mois.
     */
    cotisationsFiltrees.forEach((cotisation) => {
      const mois =
        cotisation.mois_concerne ||
        "Mois inconnu";

      const annee = Number(
        cotisation.annee || 0
      );

      const numeroMois =
        obtenirNumeroMois(mois);

      const cle = `${annee}-${String(
        numeroMois
      ).padStart(2, "0")}`;

      if (!groupes[cle]) {
        groupes[cle] = {
          mois,
          annee,
          cotisations: [],
        };
      }

      groupes[cle].cotisations.push(
        cotisation
      );
    });

    return Object.values(groupes).sort(
      (a, b) => {
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
          obtenirNumeroMois(b.mois) -
          obtenirNumeroMois(a.mois)
        );
      }
    );
  }, [
    cotisationsFiltrees,
    filtreAnnee,
    filtreMois,
    anneesDisponibles,
  ]);


  // ==========================================================
  // STATISTIQUES FILTRÉES
  // ==========================================================

  const totalFiltreCotise = useMemo(() => {
    return cotisationsFiltrees.reduce(
      (total, cotisation) =>
        total +
        Number(cotisation.montant_cotise || 0),
      0
    );
  }, [cotisationsFiltrees]);


  const totalFiltreReste = useMemo(() => {
    return cotisationsFiltrees.reduce(
      (total, cotisation) =>
        total + calculerReste(cotisation),
      0
    );
  }, [cotisationsFiltrees]);


  const nombrePayees = useMemo(() => {
    return cotisationsFiltrees.filter(
      (cotisation) =>
        getStatut(cotisation).label ===
        "Payée"
    ).length;
  }, [cotisationsFiltrees]);


  const nombrePartielles = useMemo(() => {
    return cotisationsFiltrees.filter(
      (cotisation) =>
        getStatut(cotisation).label ===
        "Partielle"
    ).length;
  }, [cotisationsFiltrees]);


  const nombreImpayees = useMemo(() => {
    return cotisationsFiltrees.filter(
      (cotisation) =>
        getStatut(cotisation).label ===
        "Impayée"
    ).length;
  }, [cotisationsFiltrees]);


  // ==========================================================
  // RESET FILTRES
  // ==========================================================

  const reinitialiserFiltres = () => {
    setRecherche("");
    setFiltreMois("");
    setFiltreAnnee("");
    setFiltreStatut("");
  };


  // ==========================================================
  // FORMULAIRE CRÉATION
  // ==========================================================

  const ouvrirFormulaire = () => {
    const date = new Date();

    setFormulaire({
      membre_id: "",
      montant: "",
      montant_cotise: "",
      mois_concerne: obtenirMoisActuel(),
      annee: date.getFullYear(),
      mode_paiement: "espèce",
      date_cotisation: date
        .toISOString()
        .split("T")[0],
      reference: "",
    });

    setModalCreation(true);
  };


  const fermerFormulaire = () => {
    setModalCreation(false);
  };


  const changerMembre = (event) => {
    const membreIdSelectionne =
      event.target.value;

    const membre = trouverMembre(
      membreIdSelectionne
    );

    const montantFixe =
      obtenirMontantFixeMembre(membre);

    setFormulaire((ancien) => ({
      ...ancien,
      membre_id: membreIdSelectionne,
      montant:
        montantFixe > 0
          ? montantFixe
          : "",
    }));
  };


  const enregistrerCotisation = async (
    event
  ) => {
    event.preventDefault();

    try {
      setErreur("");

      if (!formulaire.membre_id) {
        setErreur(
          "Veuillez sélectionner un membre."
        );
        return;
      }

      const montant = Number(
        formulaire.montant || 0
      );

      const montantCotise = Number(
        formulaire.montant_cotise || 0
      );

      if (montant <= 0) {
        setErreur(
          "Le montant de la cotisation doit être supérieur à zéro."
        );
        return;
      }

      if (montantCotise < 0) {
        setErreur(
          "Le montant cotisé ne peut pas être négatif."
        );
        return;
      }

      if (montantCotise > montant) {
        setErreur(
          "Le montant cotisé ne peut pas dépasser le montant fixé."
        );
        return;
      }

      await creerCotisation({
        membre_id: Number(
          formulaire.membre_id
        ),
        montant,
        montant_cotise: montantCotise,
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
          formulaire.reference || null,
      });

      setModalCreation(false);

      await chargerCotisations();
    } catch (error) {
      console.error(
        "ERREUR CRÉATION COTISATION :",
        error
      );

      setErreur(
        error?.response?.data?.detail ||
          "Impossible de créer la cotisation."
      );
    }
  };


  // ==========================================================
  // PAIEMENT
  // ==========================================================

  const ouvrirPaiement = (cotisation) => {
    setCotisationSelectionnee(
      cotisation
    );

    const date = new Date();

    setFormulairePaiement({
      montant: "",
      mode_paiement: "espèce",
      date_paiement: date
        .toISOString()
        .split("T")[0],
      reference: "",
    });

    setModalPaiement(true);
  };


  const fermerPaiement = () => {
    setModalPaiement(false);
    setCotisationSelectionnee(null);
  };


  const enregistrerPaiement = async (
    event
  ) => {
    event.preventDefault();

    if (!cotisationSelectionnee) {
      return;
    }

    try {
      setErreur("");

      const montant = Number(
        formulairePaiement.montant || 0
      );

      const reste = calculerReste(
        cotisationSelectionnee
      );

      if (montant <= 0) {
        setErreur(
          "Le montant du paiement doit être supérieur à zéro."
        );
        return;
      }

      if (montant > reste) {
        setErreur(
          `Le paiement ne peut pas dépasser le reste à payer de ${formaterMontant(
            reste
          )}.`
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
            formulairePaiement.reference ||
            null,
        }
      );

      setModalPaiement(false);
      setCotisationSelectionnee(null);

      await chargerCotisations();
    } catch (error) {
      console.error(
        "ERREUR AJOUT PAIEMENT :",
        error
      );

      setErreur(
        error?.response?.data?.detail ||
          "Impossible d'enregistrer le paiement."
      );
    }
  };


  // ==========================================================
  // DÉTAIL
  // ==========================================================

  const ouvrirDetail = async (
    cotisation
  ) => {
    try {
      setErreur("");

      const data = await getCotisation(
        cotisation.id
      );

      setCotisationSelectionnee(
        data?.cotisation || data
      );

      setModalDetail(true);
    } catch (error) {
      console.error(
        "ERREUR CHARGEMENT DÉTAIL :",
        error
      );

      /*
       * On garde tout de même la cotisation
       * déjà disponible si le détail backend
       * échoue.
       */
      setCotisationSelectionnee(
        cotisation
      );

      setModalDetail(true);
    }
  };


  const fermerDetail = () => {
    setModalDetail(false);
    setCotisationSelectionnee(null);
  };


  // ==========================================================
  // RENDU
  // ==========================================================

  if (chargement) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <RefreshCw
            size={22}
            className="animate-spin"
          />
          <span>
            Chargement des cotisations...
          </span>
        </div>
      </div>
    );
  }


  if (!peutConsulter) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle
            size={24}
            className="mt-0.5 text-red-600"
          />

          <div>
            <h2 className="font-semibold text-red-800">
              Accès refusé
            </h2>

            <p className="mt-1 text-sm text-red-700">
              Vous n'avez pas la permission de
              consulter les cotisations.
            </p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* =====================================================
          EN-TÊTE
      ====================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100">
              <Wallet
                size={23}
                className="text-emerald-700"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Cotisations
              </h1>

              <p className="text-sm text-slate-500">
                Gestion financière
              </p>
            </div>
          </div>

          <p className="mt-3 text-sm text-slate-600">
            Suivez les cotisations mensuelles des
            membres du Dahira, les paiements
            effectués et les restes à payer.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={chargerCotisations}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw size={17} />
            Actualiser
          </button>

          {peutCreer && (
            <button
              type="button"
              onClick={ouvrirFormulaire}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <Plus size={18} />
              Nouvelle cotisation
            </button>
          )}
        </div>
      </div>


      {/* =====================================================
          ERREUR
      ====================================================== */}

      {erreur && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0 text-red-600"
          />

          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              {erreur}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setErreur("")}
            className="text-red-500 transition hover:text-red-700"
          >
            <X size={18} />
          </button>
        </div>
      )}


      {/* =====================================================
          MES COTISATIONS
      ====================================================== */}

      {!peutCreer && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Mes cotisations
            </h2>

            <p className="text-sm text-slate-500">
              Consultez vos cotisations et vos
              paiements.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Montant fixé
              </p>

              <p className="mt-2 text-xl font-bold text-slate-900">
                {formaterMontant(
                  totalMesMontantsFixes
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Total cotisé
              </p>

              <p className="mt-2 text-xl font-bold text-emerald-600">
                {formaterMontant(
                  totalMesCotisations
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Reste à payer
              </p>

              <p className="mt-2 text-xl font-bold text-amber-600">
                {formaterMontant(
                  totalMesRestes
                )}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">
                      Période
                    </th>

                    <th className="px-4 py-3 text-right font-semibold text-slate-600">
                      Montant fixé
                    </th>

                    <th className="px-4 py-3 text-right font-semibold text-slate-600">
                      Total cotisé
                    </th>

                    <th className="px-4 py-3 text-right font-semibold text-slate-600">
                      Reste
                    </th>

                    <th className="px-4 py-3 text-center font-semibold text-slate-600">
                      Statut
                    </th>

                    <th className="px-4 py-3 text-right font-semibold text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {mesCotisations.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        Aucune cotisation enregistrée.
                      </td>
                    </tr>
                  ) : (
                    mesCotisations.map(
                      (cotisation) => {
                        const statut =
                          getStatut(
                            cotisation
                          );

                        const Icone =
                          statut.icone;

                        return (
                          <tr
                            key={cotisation.id}
                            className="hover:bg-slate-50"
                          >
                            <td className="px-4 py-4">
                              <div className="font-medium text-slate-900">
                                {
                                  cotisation.mois_concerne
                                }{" "}
                                {
                                  cotisation.annee
                                }
                              </div>
                            </td>

                            <td className="px-4 py-4 text-right font-medium text-slate-700">
                              {formaterMontant(
                                cotisation.montant
                              )}
                            </td>

                            <td className="px-4 py-4 text-right font-medium text-emerald-600">
                              {formaterMontant(
                                cotisation.montant_cotise
                              )}
                            </td>

                            <td className="px-4 py-4 text-right font-medium text-amber-600">
                              {formaterMontant(
                                calculerReste(
                                  cotisation
                                )
                              )}
                            </td>

                            <td className="px-4 py-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statut.couleur}`}
                              >
                                <Icone
                                  size={14}
                                />
                                {
                                  statut.label
                                }
                              </span>
                            </td>

                            <td className="px-4 py-4 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  ouvrirDetail(
                                    cotisation
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                              >
                                <Eye
                                  size={15}
                                />
                                Détail
                              </button>
                            </td>
                          </tr>
                        );
                      }
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}


      {/* =====================================================
          COTISATIONS DU DAHIRA
      ====================================================== */}

      {peutCreer && (
        <section className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Cotisations du Dahira
            </h2>

            <p className="text-sm text-slate-500">
              Suivez la situation globale des
              cotisations mensuelles.
            </p>
          </div>


          {/* =================================================
              ESTIMATION MENSUELLE
          ================================================== */}

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Wallet
                    size={20}
                    className="text-emerald-700"
                  />

                  <h3 className="font-bold text-emerald-900">
                    Estimation mensuelle du Dahira
                  </h3>
                </div>

                <p className="mt-1 text-sm text-emerald-700">
                  Calculée à partir de tous les
                  membres actifs et de leur
                  cotisation mensuelle fixe.
                </p>
              </div>

              <div className="text-left md:text-right">
                <p className="text-2xl font-bold text-emerald-800">
                  {formaterMontant(
                    estimationMensuelle
                  )}
                </p>

                <p className="mt-1 text-xs text-emerald-700">
                  {membresActifs.length}{" "}
                  membre
                  {membresActifs.length > 1
                    ? "s"
                    : ""}{" "}
                  pris en compte
                </p>
              </div>
            </div>
          </div>


          {/* =================================================
              RECHERCHE / FILTRES
          ================================================== */}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Filter
                size={18}
                className="text-slate-500"
              />

              <h3 className="font-semibold text-slate-800">
                Filtres
              </h3>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
              <div className="relative lg:col-span-2">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={recherche}
                  onChange={(event) =>
                    setRecherche(
                      event.target.value
                    )
                  }
                  placeholder="Rechercher un membre..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <select
                value={filtreMois}
                onChange={(event) =>
                  setFiltreMois(
                    event.target.value
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">
                  Tous les mois
                </option>

                {MOIS.map((mois) => (
                  <option
                    key={mois}
                    value={mois}
                  >
                    {mois}
                  </option>
                ))}
              </select>

              <select
                value={filtreAnnee}
                onChange={(event) =>
                  setFiltreAnnee(
                    event.target.value
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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

              <select
                value={filtreStatut}
                onChange={(event) =>
                  setFiltreStatut(
                    event.target.value
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">
                  Tous les statuts
                </option>

                <option value="Payée">
                  Payées
                </option>

                <option value="Partielle">
                  Partielles
                </option>

                <option value="Impayée">
                  Impayées
                </option>
              </select>
            </div>

            {(recherche ||
              filtreMois ||
              filtreAnnee ||
              filtreStatut) && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={
                    reinitialiserFiltres
                  }
                  className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>


          {/* =================================================
              STATISTIQUES
          ================================================== */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Cotisations
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {cotisationsFiltrees.length}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <p className="text-sm text-emerald-700">
                Estimation mensuelle
              </p>

              <p className="mt-2 text-xl font-bold text-emerald-800">
                {formaterMontant(
                  estimationMensuelle
                )}
              </p>

              <p className="mt-1 text-xs text-emerald-700">
                Tous les membres actifs
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Total cotisé
              </p>

              <p className="mt-2 text-xl font-bold text-emerald-600">
                {formaterMontant(
                  totalFiltreCotise
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Total restant
              </p>

              <p className="mt-2 text-xl font-bold text-amber-600">
                {formaterMontant(
                  totalFiltreReste
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Situation
              </p>

              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-700">
                  {nombrePayees} payées
                </span>

                <span className="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-700">
                  {nombrePartielles} partielles
                </span>

                <span className="rounded-full bg-red-100 px-2 py-1 font-semibold text-red-700">
                  {nombreImpayees} impayées
                </span>
              </div>
            </div>
          </div>


          {/* =================================================
              GROUPES PAR MOIS
          ================================================== */}

          <div className="space-y-5">
            {cotisationsParMois.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <Wallet
                  size={32}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 font-medium text-slate-700">
                  Aucun mois à afficher.
                </p>
              </div>
            ) : (
              cotisationsParMois.map(
                (groupe) => {
                  /*
                   * IMPORTANT :
                   *
                   * L'estimation du mois n'est PAS :
                   *
                   * SUM(cotisation.montant)
                   *
                   * Elle est :
                   *
                   * SUM(membre.montant_cotisation)
                   *
                   * pour tous les membres actifs.
                   */
                  const totalEstime =
                    estimationMensuelle;

                  /*
                   * Les montants réellement encaissés
                   * correspondent uniquement aux cotisations
                   * qui existent pour ce mois.
                   */
                  const totalCotise =
                    groupe.cotisations.reduce(
                      (total, cotisation) =>
                        total +
                        Number(
                          cotisation.montant_cotise ||
                            0
                        ),
                      0
                    );

                  /*
                   * Le reste correspond à :
                   *
                   * estimation mensuelle
                   * -
                   * montant réellement cotisé
                   *
                   * Il ne peut jamais être négatif.
                   */
                  const totalReste =
                    Math.max(
                      0,
                      totalEstime -
                        totalCotise
                    );

                  return (
                    <div
                      key={`${groupe.annee}-${groupe.mois}`}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >
                      {/* En-tête du mois */}
                      <div className="border-b border-slate-200 bg-slate-50 p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">
                              {groupe.mois}{" "}
                              {groupe.annee}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                              {
                                groupe.cotisations
                                  .length
                              }{" "}
                              cotisation
                              {groupe.cotisations
                                .length >
                              1
                                ? "s"
                                : ""}{" "}
                              enregistrée
                              {groupe.cotisations
                                .length >
                              1
                                ? "s"
                                : ""}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
                              <p className="text-xs text-slate-500">
                                Estimation
                              </p>

                              <p className="mt-1 font-bold text-emerald-700">
                                {formaterMontant(
                                  totalEstime
                                )}
                              </p>

                              <p className="mt-1 text-[11px] text-slate-400">
                                Tous les membres
                                actifs
                              </p>
                            </div>

                            <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
                              <p className="text-xs text-slate-500">
                                Total cotisé
                              </p>

                              <p className="mt-1 font-bold text-slate-900">
                                {formaterMontant(
                                  totalCotise
                                )}
                              </p>
                            </div>

                            <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
                              <p className="text-xs text-slate-500">
                                Reste
                              </p>

                              <p className="mt-1 font-bold text-amber-600">
                                {formaterMontant(
                                  totalReste
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>


                      {/* Liste des cotisations */}
                      {groupe.cotisations
                        .length === 0 ? (
                        <div className="p-8 text-center">
                          <Clock
                            size={30}
                            className="mx-auto text-slate-300"
                          />

                          <p className="mt-3 text-sm font-medium text-slate-700">
                            Aucune cotisation
                            enregistrée pour ce
                            mois.
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Estimation attendue :{" "}
                            {formaterMontant(
                              totalEstime
                            )}
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[900px] text-sm">
                            <thead className="border-b border-slate-200 bg-white">
                              <tr>
                                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                                  Membre
                                </th>

                                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                                  Période
                                </th>

                                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                                  Montant fixé
                                </th>

                                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                                  Total cotisé
                                </th>

                                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                                  Reste
                                </th>

                                <th className="px-4 py-3 text-center font-semibold text-slate-600">
                                  Statut
                                </th>

                                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                                  Actions
                                </th>
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                              {groupe.cotisations.map(
                                (
                                  cotisation
                                ) => {
                                  const statut =
                                    getStatut(
                                      cotisation
                                    );

                                  const Icone =
                                    statut.icone;

                                  const reste =
                                    calculerReste(
                                      cotisation
                                    );

                                  return (
                                    <tr
                                      key={
                                        cotisation.id
                                      }
                                      className="transition hover:bg-slate-50"
                                    >
                                      <td className="px-4 py-4">
                                        <div className="font-medium text-slate-900">
                                          {nomMembre(
                                            cotisation.membre_id
                                          )}
                                        </div>

                                        {(() => {
                                          const membre =
                                            trouverMembre(
                                              cotisation.membre_id
                                            );

                                          return membre?.telephone ? (
                                            <div className="mt-0.5 text-xs text-slate-400">
                                              {
                                                membre.telephone
                                              }
                                            </div>
                                          ) : null;
                                        })()}
                                      </td>

                                      <td className="px-4 py-4 text-slate-600">
                                        {
                                          cotisation.mois_concerne
                                        }{" "}
                                        {
                                          cotisation.annee
                                        }
                                      </td>

                                      <td className="px-4 py-4 text-right font-medium text-slate-700">
                                        {formaterMontant(
                                          cotisation.montant
                                        )}
                                      </td>

                                      <td className="px-4 py-4 text-right font-medium text-emerald-600">
                                        {formaterMontant(
                                          cotisation.montant_cotise
                                        )}
                                      </td>

                                      <td className="px-4 py-4 text-right font-medium text-amber-600">
                                        {formaterMontant(
                                          reste
                                        )}
                                      </td>

                                      <td className="px-4 py-4 text-center">
                                        <span
                                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statut.couleur}`}
                                        >
                                          <Icone
                                            size={
                                              14
                                            }
                                          />

                                          {
                                            statut.label
                                          }
                                        </span>
                                      </td>

                                      <td className="px-4 py-4">
                                        <div className="flex justify-end gap-2">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              ouvrirDetail(
                                                cotisation
                                              )
                                            }
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                          >
                                            <Eye
                                              size={
                                                15
                                              }
                                            />
                                            Détail
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
                                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                                            >
                                              <CreditCard
                                                size={
                                                  15
                                                }
                                              />
                                              Payer
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
                      )}
                    </div>
                  );
                }
              )
            )}
          </div>
        </section>
      )}


      {/* =====================================================
          MODAL CRÉATION
      ====================================================== */}

      {modalCreation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Nouvelle cotisation
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enregistrer une cotisation
                  mensuelle.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  fermerFormulaire
                }
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={
                enregistrerCotisation
              }
              className="space-y-5 p-5"
            >
              {/* Membre */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Membre
                </label>

                <select
                  value={
                    formulaire.membre_id
                  }
                  onChange={
                    changerMembre
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">
                    Sélectionner un membre
                  </option>

                  {membresActifs
                    .slice()
                    .sort((a, b) =>
                      `${a.prenom || ""} ${a.nom || ""}`
                        .trim()
                        .localeCompare(
                          `${b.prenom || ""} ${b.nom || ""}`.trim(),
                          "fr"
                        )
                    )
                    .map((membre) => (
                      <option
                        key={membre.id}
                        value={membre.id}
                      >
                        {`${membre.prenom || ""} ${
                          membre.nom || ""
                        }`.trim()}
                      </option>
                    ))}
                </select>
              </div>


              {/* Montant */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Montant mensuel fixé
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    formulaire.montant
                  }
                  onChange={(event) =>
                    setFormulaire(
                      (ancien) => ({
                        ...ancien,
                        montant:
                          event.target.value,
                      })
                    )
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                <p className="mt-1 text-xs text-slate-500">
                  Ce montant correspond à la
                  cotisation mensuelle fixe du
                  membre.
                </p>
              </div>


              {/* Somme réellement cotisée */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Somme réellement cotisée
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    formulaire.montant_cotise
                  }
                  onChange={(event) =>
                    setFormulaire(
                      (ancien) => ({
                        ...ancien,
                        montant_cotise:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>


              {/* Reste */}
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Reste à payer
                  </span>

                  <span className="font-bold text-amber-600">
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
                  </span>
                </div>
              </div>


              {/* Mois / année */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Mois
                  </label>

                  <select
                    value={
                      formulaire.mois_concerne
                    }
                    onChange={(event) =>
                      setFormulaire(
                        (ancien) => ({
                          ...ancien,
                          mois_concerne:
                            event.target.value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    {MOIS.map((mois) => (
                      <option
                        key={mois}
                        value={mois}
                      >
                        {mois}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Année
                  </label>

                  <input
                    type="number"
                    min="2000"
                    value={
                      formulaire.annee
                    }
                    onChange={(event) =>
                      setFormulaire(
                        (ancien) => ({
                          ...ancien,
                          annee:
                            event.target.value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>


              {/* Mode paiement */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Mode de paiement
                </label>

                <select
                  value={
                    formulaire.mode_paiement
                  }
                  onChange={(event) =>
                    setFormulaire(
                      (ancien) => ({
                        ...ancien,
                        mode_paiement:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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


              {/* Date */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Date de cotisation
                </label>

                <input
                  type="date"
                  value={
                    formulaire.date_cotisation
                  }
                  onChange={(event) =>
                    setFormulaire(
                      (ancien) => ({
                        ...ancien,
                        date_cotisation:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>


              {/* Référence */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Référence
                  <span className="ml-1 text-xs font-normal text-slate-400">
                    (optionnel)
                  </span>
                </label>

                <input
                  type="text"
                  value={
                    formulaire.reference
                  }
                  onChange={(event) =>
                    setFormulaire(
                      (ancien) => ({
                        ...ancien,
                        reference:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Ex : RECU-2026-001"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>


              {/* Boutons */}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={
                    fermerFormulaire
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* =====================================================
          MODAL PAIEMENT
      ====================================================== */}

      {modalPaiement &&
        cotisationSelectionnee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 p-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Enregistrer un paiement
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
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
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={
                  enregistrerPaiement
                }
                className="space-y-5 p-5"
              >
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500">
                        Montant fixé
                      </p>

                      <p className="mt-1 font-bold text-slate-900">
                        {formaterMontant(
                          cotisationSelectionnee.montant
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Déjà cotisé
                      </p>

                      <p className="mt-1 font-bold text-emerald-600">
                        {formaterMontant(
                          cotisationSelectionnee.montant_cotise
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <p className="text-xs text-slate-500">
                      Reste à payer
                    </p>

                    <p className="mt-1 text-xl font-bold text-amber-600">
                      {formaterMontant(
                        calculerReste(
                          cotisationSelectionnee
                        )
                      )}
                    </p>
                  </div>
                </div>


                {/* Montant */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Montant du paiement
                  </label>

                  <input
                    type="number"
                    min="1"
                    max={calculerReste(
                      cotisationSelectionnee
                    )}
                    step="1"
                    value={
                      formulairePaiement.montant
                    }
                    onChange={(event) =>
                      setFormulairePaiement(
                        (ancien) => ({
                          ...ancien,
                          montant:
                            event.target.value,
                        })
                      )
                    }
                    required
                    autoFocus
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>


                {/* Mode */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
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
                            event.target.value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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


                {/* Date */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
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
                            event.target.value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>


                {/* Référence */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Référence
                    <span className="ml-1 text-xs font-normal text-slate-400">
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
                            event.target.value,
                        })
                      )
                    }
                    placeholder="Ex : WAVE-123456"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>


                {/* Boutons */}
                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={
                      fermerPaiement
                    }
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <CreditCard
                      size={17}
                    />
                    Enregistrer le paiement
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


      {/* =====================================================
          MODAL DÉTAIL
      ====================================================== */}

      {modalDetail &&
        cotisationSelectionnee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 p-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Détail de la cotisation
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {nomMembre(
                      cotisationSelectionnee.membre_id
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fermerDetail}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5 p-5">
                {/* Informations principales */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      Membre
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {nomMembre(
                        cotisationSelectionnee.membre_id
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      Période
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {
                        cotisationSelectionnee.mois_concerne
                      }{" "}
                      {
                        cotisationSelectionnee.annee
                      }
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      Montant fixé
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {formaterMontant(
                        cotisationSelectionnee.montant
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      Total cotisé
                    </p>

                    <p className="mt-1 font-semibold text-emerald-600">
                      {formaterMontant(
                        cotisationSelectionnee.montant_cotise
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      Reste à payer
                    </p>

                    <p className="mt-1 font-semibold text-amber-600">
                      {formaterMontant(
                        calculerReste(
                          cotisationSelectionnee
                        )
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      Date
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {formaterDate(
                        cotisationSelectionnee.date_cotisation
                      )}
                    </p>
                  </div>
                </div>


                {/* Statut */}
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-800">
                    Statut
                  </p>

                  {(() => {
                    const statut =
                      getStatut(
                        cotisationSelectionnee
                      );

                    const Icone =
                      statut.icone;

                    return (
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${statut.couleur}`}
                      >
                        <Icone
                          size={16}
                        />

                        {
                          statut.label
                        }
                      </span>
                    );
                  })()}
                </div>


                {/* Historique des paiements */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <History
                      size={18}
                      className="text-slate-600"
                    />

                    <h3 className="font-semibold text-slate-900">
                      Historique des paiements
                    </h3>
                  </div>

                  {Array.isArray(
                    cotisationSelectionnee.paiements
                  ) &&
                  cotisationSelectionnee
                    .paiements.length > 0 ? (
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px] text-sm">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                                Date
                              </th>

                              <th className="px-4 py-3 text-right font-semibold text-slate-600">
                                Montant
                              </th>

                              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                                Mode
                              </th>

                              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                                Référence
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100">
                            {cotisationSelectionnee.paiements.map(
                              (paiement) => (
                                <tr
                                  key={
                                    paiement.id
                                  }
                                >
                                  <td className="px-4 py-3 text-slate-600">
                                    {formaterDate(
                                      paiement.date_paiement
                                    )}
                                  </td>

                                  <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                                    {formaterMontant(
                                      paiement.montant
                                    )}
                                  </td>

                                  <td className="px-4 py-3 capitalize text-slate-600">
                                    {paiement.mode_paiement ||
                                      "-"}
                                  </td>

                                  <td className="px-4 py-3 text-slate-500">
                                    {paiement.reference ||
                                      "-"}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                      <History
                        size={28}
                        className="mx-auto text-slate-300"
                      />

                      <p className="mt-2 text-sm text-slate-500">
                        Aucun paiement enregistré
                        pour cette cotisation.
                      </p>
                    </div>
                  )}
                </div>


                {/* Bouton paiement */}
                {calculerReste(
                  cotisationSelectionnee
                ) > 0 && (
                  <div className="flex justify-end border-t border-slate-100 pt-4">
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
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      <CreditCard
                        size={17}
                      />
                      Ajouter un paiement
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