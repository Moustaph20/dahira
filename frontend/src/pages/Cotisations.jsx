import {
  creerCotisation,
  modifierCotisation,
  supprimerCotisation,
  getCotisations,
  ajouterPaiement,
} from "../api/cotisations";

import { getMembres } from "../api/membres";

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Edit,
  Eye,
  Loader2,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Wallet,
  X,
} from "lucide-react";

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

const ANNEE_ACTUELLE = new Date().getFullYear();

const formaterMontant = (montant) =>
  `${Number(montant || 0).toLocaleString("fr-FR")} FCFA`;

const obtenirMontantPaye = (cotisation) => {
  if (!cotisation) return 0;

  if (Array.isArray(cotisation.paiements)) {
    return cotisation.paiements
      .filter((paiement) => paiement?.actif !== false)
      .reduce(
        (total, paiement) => total + Number(paiement?.montant || 0),
        0
      );
  }

  return Number(cotisation.montant_cotise || 0);
};

const obtenirMontantFixe = (membre, cotisation = null) => {
  if (cotisation) {
    return Number(
      cotisation.montant ??
        membre?.montant_cotisation ??
        0
    );
  }

  return Number(membre?.montant_cotisation || 0);
};

const calculerStatut = (montantFixe, montantPaye) => {
  const fixe = Number(montantFixe || 0);
  const paye = Number(montantPaye || 0);

  if (paye <= 0) {
    return "impayee";
  }

  if (paye >= fixe) {
    return "payee";
  }

  return "partielle";
};

const libelleStatut = (statut) => {
  switch (statut) {
    case "payee":
      return "Payée";
    case "partielle":
      return "Partielle";
    case "impayee":
      return "Impayée";
    default:
      return statut;
  }
};

const classeStatut = (statut) => {
  switch (statut) {
    case "payee":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "partielle":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "impayee":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
};

const normaliserListe = (resultat, cle = null) => {
  if (Array.isArray(resultat)) {
    return resultat;
  }

  if (cle && Array.isArray(resultat?.[cle])) {
    return resultat[cle];
  }

  if (Array.isArray(resultat?.data)) {
    return resultat.data;
  }

  if (Array.isArray(resultat?.items)) {
    return resultat.items;
  }

  return [];
};

export default function Cotisations() {
  const [cotisations, setCotisations] = useState([]);
  const [membres, setMembres] = useState([]);

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [actualisation, setActualisation] = useState(false);

  const [recherche, setRecherche] = useState("");
  const [moisFiltre, setMoisFiltre] = useState("");
  const [anneeFiltre, setAnneeFiltre] = useState("");
  const [statutFiltre, setStatutFiltre] = useState("");

  const [modalCotisation, setModalCotisation] = useState(false);
  const [modalPaiement, setModalPaiement] = useState(false);
  const [modalDetails, setModalDetails] = useState(false);

  const [cotisationSelectionnee, setCotisationSelectionnee] =
    useState(null);

  const [membreSelectionne, setMembreSelectionne] =
    useState(null);

  const [edition, setEdition] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formulaire, setFormulaire] = useState({
    membre_id: "",
    montant: "",
    mois_concerne: MOIS[new Date().getMonth()],
    annee: ANNEE_ACTUELLE,
    date_cotisation: new Date().toISOString().slice(0, 10),
  });

  const [formulairePaiement, setFormulairePaiement] = useState({
    montant: "",
    mode_paiement: "espèce",
    date_paiement: new Date().toISOString().slice(0, 10),
    reference: "",
  });

  // ---------------------------------------------------------------------------
  // CHARGEMENT
  // ---------------------------------------------------------------------------

  const chargerDonnees = async (avecSpinner = true) => {
    try {
      if (avecSpinner) {
        setChargement(true);
      } else {
        setActualisation(true);
      }

      setErreur("");

      const [resultatCotisations, resultatMembres] =
        await Promise.all([
          getCotisations(),
          getMembres(),
        ]);

      setCotisations(
        normaliserListe(resultatCotisations, "cotisations")
      );

      setMembres(
        normaliserListe(resultatMembres, "membres")
      );
    } catch (error) {
      console.error("Erreur chargement cotisations :", error);

      setErreur(
        error?.response?.data?.detail ||
          error?.message ||
          "Impossible de charger les cotisations."
      );
    } finally {
      setChargement(false);
      setActualisation(false);
    }
  };

  useEffect(() => {
    chargerDonnees(true);
  }, []);

  // ---------------------------------------------------------------------------
  // MEMBRES ACTIFS
  // ---------------------------------------------------------------------------

  const membresActifs = useMemo(() => {
    return membres
      .filter((membre) => membre?.actif !== false)
      .sort((a, b) => {
        const nomA = `${a?.nom || ""} ${a?.prenom || ""}`.trim();
        const nomB = `${b?.nom || ""} ${b?.prenom || ""}`.trim();

        return nomA.localeCompare(nomB, "fr");
      });
  }, [membres]);

  // ---------------------------------------------------------------------------
  // MOIS RÉELLEMENT ENREGISTRÉS
  // ---------------------------------------------------------------------------
  //
  // IMPORTANT :
  // On ne crée aucun mois artificiellement.
  // Septembre existe parce qu'au moins une cotisation septembre existe.
  // Octobre ne doit pas apparaître si aucune cotisation octobre n'existe.
  //

  const moisEnregistres = useMemo(() => {
    const ensemble = new Set();

    cotisations.forEach((cotisation) => {
      if (!cotisation?.mois_concerne || !cotisation?.annee) {
        return;
      }

      ensemble.add(
        `${Number(cotisation.annee)}|${cotisation.mois_concerne}`
      );
    });

    return Array.from(ensemble)
      .map((cle) => {
        const [annee, mois] = cle.split("|");

        return {
          annee: Number(annee),
          mois,
          indexMois: MOIS.indexOf(mois),
        };
      })
      .sort((a, b) => {
        if (a.annee !== b.annee) {
          return b.annee - a.annee;
        }

        return b.indexMois - a.indexMois;
      });
  }, [cotisations]);

  const anneesDisponibles = useMemo(() => {
    const annees = new Set();

    cotisations.forEach((cotisation) => {
      if (cotisation?.annee) {
        annees.add(Number(cotisation.annee));
      }
    });

    if (annees.size === 0) {
      annees.add(ANNEE_ACTUELLE);
    }

    return Array.from(annees).sort((a, b) => b - a);
  }, [cotisations]);

  // ---------------------------------------------------------------------------
  // INDEX DES COTISATIONS
  // ---------------------------------------------------------------------------

  const cotisationsMap = useMemo(() => {
    const map = new Map();

    cotisations.forEach((cotisation) => {
      const cle = [
        Number(cotisation.membre_id),
        cotisation.mois_concerne,
        Number(cotisation.annee),
      ].join("|");

      map.set(cle, cotisation);
    });

    return map;
  }, [cotisations]);

  // ---------------------------------------------------------------------------
  // SITUATIONS MENSUELLES
  // ---------------------------------------------------------------------------
  //
  // On part de TOUS les membres actifs.
  //
  // C'est essentiel pour le filtre "Impayées".
  //
  // Exemple :
  //
  // Moustapha -> cotisation existe -> paiement 5000 -> Partielle
  // Mami       -> cotisation existe -> paiement 0    -> Impayée
  // Abdou      -> aucune cotisation -> paiement 0    -> Impayée
  //
  // Mais le filtre "Tous" masquera Abdou car sa cotisation n'existe pas.
  //

  const situationsMensuelles = useMemo(() => {
    const situations = [];

    moisEnregistres.forEach(({ mois, annee }) => {
      membresActifs.forEach((membre) => {
        const cle = [
          Number(membre.id),
          mois,
          Number(annee),
        ].join("|");

        const cotisation = cotisationsMap.get(cle);

        const montantFixe = obtenirMontantFixe(
          membre,
          cotisation || null
        );

        const montantPaye = cotisation
          ? obtenirMontantPaye(cotisation)
          : 0;

        const reste = Math.max(
          0,
          montantFixe - montantPaye
        );

        const statut = calculerStatut(
          montantFixe,
          montantPaye
        );

        situations.push({
          membre,
          cotisation: cotisation || null,
          cotisationExiste: Boolean(cotisation),
          mois,
          annee,
          montantFixe,
          montantPaye,
          reste,
          statut,
        });
      });
    });

    return situations;
  }, [
    moisEnregistres,
    membresActifs,
    cotisationsMap,
  ]);

  // ---------------------------------------------------------------------------
  // FILTRAGE
  // ---------------------------------------------------------------------------

  const situationsFiltrees = useMemo(() => {
    const rechercheNormalisee = recherche
      .trim()
      .toLowerCase();

    return situationsMensuelles.filter((situation) => {
      const membre = situation.membre;

      const nomComplet =
        `${membre?.prenom || ""} ${membre?.nom || ""}`
          .trim()
          .toLowerCase();

      const nomInverse =
        `${membre?.nom || ""} ${membre?.prenom || ""}`
          .trim()
          .toLowerCase();

      const telephone = String(
        membre?.telephone || ""
      ).toLowerCase();

      const correspondRecherche =
        !rechercheNormalisee ||
        nomComplet.includes(rechercheNormalisee) ||
        nomInverse.includes(rechercheNormalisee) ||
        telephone.includes(rechercheNormalisee);

      const correspondMois =
        !moisFiltre ||
        moisFiltre === "tous" ||
        situation.mois === moisFiltre;

      const correspondAnnee =
        !anneeFiltre ||
        anneeFiltre === "toutes" ||
        Number(situation.annee) === Number(anneeFiltre);

      // -----------------------------------------------------------------------
      // STATUT
      // -----------------------------------------------------------------------

      let correspondStatut = true;

      if (
        !statutFiltre ||
        statutFiltre === "tous"
      ) {
        // IMPORTANT :
        // "Tous" = uniquement les cotisations réellement enregistrées.
        //
        // Les membres sans cotisation ne doivent PAS apparaître ici.
        correspondStatut =
          situation.cotisationExiste;
      } else if (statutFiltre === "payee") {
        correspondStatut =
          situation.cotisationExiste &&
          situation.statut === "payee";
      } else if (statutFiltre === "partielle") {
        correspondStatut =
          situation.cotisationExiste &&
          situation.statut === "partielle";
      } else if (statutFiltre === "impayee") {
        // ---------------------------------------------------------------------
        // CORRECTION IMPORTANTE
        //
        // Une personne est "Impayée" si elle a versé 0 FCFA.
        //
        // Peu importe qu'une ligne cotisation existe ou non.
        //
        // On ne vérifie DONC PAS cotisationExiste ici.
        // ---------------------------------------------------------------------
        correspondStatut =
          situation.montantPaye <= 0;
      }

      return (
        correspondRecherche &&
        correspondMois &&
        correspondAnnee &&
        correspondStatut
      );
    });
  }, [
    situationsMensuelles,
    recherche,
    moisFiltre,
    anneeFiltre,
    statutFiltre,
  ]);

  // ---------------------------------------------------------------------------
  // GROUPES PAR MOIS
  // ---------------------------------------------------------------------------

  const groupesParMois = useMemo(() => {
    const groupes = new Map();

    situationsFiltrees.forEach((situation) => {
      const cle = `${situation.annee}|${situation.mois}`;

      if (!groupes.has(cle)) {
        groupes.set(cle, {
          mois: situation.mois,
          annee: situation.annee,
          situations: [],
        });
      }

      groupes
        .get(cle)
        .situations.push(situation);
    });

    return Array.from(groupes.values()).sort(
      (a, b) => {
        if (a.annee !== b.annee) {
          return b.annee - a.annee;
        }

        return (
          MOIS.indexOf(b.mois) -
          MOIS.indexOf(a.mois)
        );
      }
    );
  }, [situationsFiltrees]);

  // ---------------------------------------------------------------------------
  // MOIS / ANNÉE DU RÉSUMÉ
  // ---------------------------------------------------------------------------

  const moisResume =
    moisFiltre &&
    moisFiltre !== "tous"
      ? moisFiltre
      : groupesParMois[0]?.mois || "";

  const anneeResume =
    anneeFiltre &&
    anneeFiltre !== "toutes"
      ? Number(anneeFiltre)
      : groupesParMois[0]?.annee ||
        ANNEE_ACTUELLE;

  // ---------------------------------------------------------------------------
  // RÉSUMÉ GLOBAL DU MOIS
  // ---------------------------------------------------------------------------

  const resume = useMemo(() => {
    const estimation = membresActifs.reduce(
      (total, membre) =>
        total +
        Number(
          membre?.montant_cotisation || 0
        ),
      0
    );

    const situationsDuMois =
      situationsMensuelles.filter(
        (situation) =>
          situation.mois === moisResume &&
          Number(situation.annee) ===
            Number(anneeResume)
      );

    const cotisationsEnregistrees =
      situationsDuMois.filter(
        (situation) =>
          situation.cotisationExiste
      );

    const totalPaye =
      situationsDuMois.reduce(
        (total, situation) =>
          total +
          Number(situation.montantPaye || 0),
        0
      );

    const resteGlobal = Math.max(
      0,
      estimation - totalPaye
    );

    const payees =
      cotisationsEnregistrees.filter(
        (situation) =>
          situation.statut === "payee"
      ).length;

    const partielles =
      cotisationsEnregistrees.filter(
        (situation) =>
          situation.statut === "partielle"
      ).length;

    const impayees =
      situationsDuMois.filter(
        (situation) =>
          situation.montantPaye <= 0
      ).length;

    return {
      estimation,
      totalPaye,
      resteGlobal,
      nombreCotisations:
        cotisationsEnregistrees.length,
      payees,
      partielles,
      impayees,
      membresActifs: membresActifs.length,
    };
  }, [
    membresActifs,
    situationsMensuelles,
    moisResume,
    anneeResume,
  ]);

  // ---------------------------------------------------------------------------
  // MES COTISATIONS
  // ---------------------------------------------------------------------------

  const membreConnecteId =
    localStorage.getItem("membre_id") ||
    localStorage.getItem("user_membre_id");

  const mesCotisations = useMemo(() => {
    if (!membreConnecteId) {
      return [];
    }

    const id = Number(membreConnecteId);

    return cotisations
      .filter(
        (cotisation) =>
          Number(cotisation.membre_id) === id
      )
      .map((cotisation) => {
        const membre = membres.find(
          (m) =>
            Number(m.id) ===
            Number(cotisation.membre_id)
        );

        const montantFixe =
          obtenirMontantFixe(
            membre,
            cotisation
          );

        const montantPaye =
          obtenirMontantPaye(cotisation);

        const reste = Math.max(
          0,
          montantFixe - montantPaye
        );

        return {
          ...cotisation,
          membre,
          montantFixe,
          montantPaye,
          reste,
          statut: calculerStatut(
            montantFixe,
            montantPaye
          ),
        };
      })
      .sort((a, b) => {
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
          MOIS.indexOf(b.mois_concerne) -
          MOIS.indexOf(a.mois_concerne)
        );
      });
  }, [
    cotisations,
    membres,
    membreConnecteId,
  ]);

  // ---------------------------------------------------------------------------
  // FORMULAIRE
  // ---------------------------------------------------------------------------

  const ouvrirCreation = (
    membre = null,
    mois = null,
    annee = null
  ) => {
    const moisDefaut =
      mois ||
      moisFiltre ||
      moisResume ||
      MOIS[new Date().getMonth()];

    const anneeDefaut =
      annee ||
      (anneeFiltre &&
      anneeFiltre !== "toutes"
        ? Number(anneeFiltre)
        : anneeResume ||
          ANNEE_ACTUELLE);

    setEdition(false);
    setCotisationSelectionnee(null);

    setFormulaire({
      membre_id: membre?.id
        ? String(membre.id)
        : "",
      montant: membre?.montant_cotisation
        ? String(membre.montant_cotisation)
        : "",
      mois_concerne: moisDefaut,
      annee: anneeDefaut,
      date_cotisation: new Date()
        .toISOString()
        .slice(0, 10),
    });

    setModalCotisation(true);
  };

  const ouvrirModification = (cotisation) => {
    setEdition(true);
    setCotisationSelectionnee(
      cotisation
    );

    setFormulaire({
      membre_id: String(
        cotisation.membre_id
      ),
      montant: String(
        cotisation.montant || ""
      ),
      mois_concerne:
        cotisation.mois_concerne,
      annee: Number(
        cotisation.annee
      ),
      date_cotisation:
        cotisation.date_cotisation ||
        new Date()
          .toISOString()
          .slice(0, 10),
    });

    setModalCotisation(true);
  };

  const ouvrirPaiement = (
    situation
  ) => {
    // -------------------------------------------------------------------------
    // Si aucune cotisation n'existe :
    // on doit d'abord enregistrer la cotisation.
    // -------------------------------------------------------------------------

    if (!situation.cotisationExiste) {
      ouvrirCreation(
        situation.membre,
        situation.mois,
        situation.annee
      );

      return;
    }

    setCotisationSelectionnee(
      situation.cotisation
    );

    setFormulairePaiement({
      montant: String(
        Math.max(
          0,
          Number(situation.reste || 0)
        )
      ),
      mode_paiement: "espèce",
      date_paiement: new Date()
        .toISOString()
        .slice(0, 10),
      reference: "",
    });

    setModalPaiement(true);
  };

  // ---------------------------------------------------------------------------
  // CRÉER / MODIFIER UNE COTISATION
  // ---------------------------------------------------------------------------

  const soumettreCotisation = async (
    evenement
  ) => {
    evenement.preventDefault();

    if (!formulaire.membre_id) {
      setErreur(
        "Veuillez sélectionner un membre."
      );
      return;
    }

    if (
      !formulaire.montant ||
      Number(formulaire.montant) <= 0
    ) {
      setErreur(
        "Le montant de la cotisation doit être supérieur à 0."
      );
      return;
    }

    try {
      setSaving(true);
      setErreur("");

      const payload = {
        membre_id: Number(
          formulaire.membre_id
        ),
        montant: Number(
          formulaire.montant
        ),
        mois_concerne:
          formulaire.mois_concerne,
        annee: Number(
          formulaire.annee
        ),
        date_cotisation:
          formulaire.date_cotisation,
      };

      if (edition) {
        await modifierCotisation(
          cotisationSelectionnee.id,
          payload
        );
      } else {
        await creerCotisation(
          payload
        );
      }

      setModalCotisation(false);
      setCotisationSelectionnee(null);

      await chargerDonnees(false);
    } catch (error) {
      console.error(
        "Erreur cotisation :",
        error
      );

      setErreur(
        error?.response?.data?.detail ||
          error?.message ||
          "Impossible d'enregistrer la cotisation."
      );
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // AJOUTER UN PAIEMENT
  // ---------------------------------------------------------------------------

  const soumettrePaiement = async (
    evenement
  ) => {
    evenement.preventDefault();

    if (
      !cotisationSelectionnee
    ) {
      return;
    }

    const montant =
      Number(
        formulairePaiement.montant
      );

    if (!montant || montant <= 0) {
      setErreur(
        "Le montant du paiement doit être supérieur à 0."
      );
      return;
    }

    const montantFixe =
      Number(
        cotisationSelectionnee.montant ||
          0
      );

    const montantDejaPaye =
      obtenirMontantPaye(
        cotisationSelectionnee
      );

    const reste = Math.max(
      0,
      montantFixe -
        montantDejaPaye
    );

    if (montant > reste) {
      setErreur(
        `Le paiement ne peut pas dépasser le reste à payer de ${formaterMontant(
          reste
        )}.`
      );
      return;
    }

    try {
      setSaving(true);
      setErreur("");

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
      setCotisationSelectionnee(
        null
      );

      await chargerDonnees(false);
    } catch (error) {
      console.error(
        "Erreur paiement :",
        error
      );

      setErreur(
        error?.response?.data?.detail ||
          error?.message ||
          "Impossible d'enregistrer le paiement."
      );
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // SUPPRESSION
  // ---------------------------------------------------------------------------

  const supprimer = async (
    cotisation
  ) => {
    const confirmer = window.confirm(
      `Voulez-vous vraiment supprimer la cotisation de ${
        cotisation?.membre?.prenom ||
        ""
      } ${
        cotisation?.membre?.nom ||
        ""
      } pour ${
        cotisation?.mois_concerne
      } ${
        cotisation?.annee
      } ?`
    );

    if (!confirmer) {
      return;
    }

    try {
      setSaving(true);
      setErreur("");

      await supprimerCotisation(
        cotisation.id
      );

      await chargerDonnees(false);
    } catch (error) {
      console.error(
        "Erreur suppression :",
        error
      );

      setErreur(
        error?.response?.data?.detail ||
          error?.message ||
          "Impossible de supprimer la cotisation."
      );
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // RESET FILTRES
  // ---------------------------------------------------------------------------

  const reinitialiserFiltres = () => {
    setRecherche("");
    setMoisFiltre("");
    setAnneeFiltre("");
    setStatutFiltre("");
  };

  // ---------------------------------------------------------------------------
  // RENDU
  // ---------------------------------------------------------------------------

  if (chargement) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2
            className="animate-spin"
            size={22}
          />
          Chargement des cotisations...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* ------------------------------------------------------------------- */}
      {/* HEADER                                                             */}
      {/* ------------------------------------------------------------------- */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Cotisations
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Suivi des cotisations et des
            paiements des membres.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              chargerDonnees(false)
            }
            disabled={actualisation}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <Loader2
              size={17}
              className={
                actualisation
                  ? "animate-spin"
                  : ""
              }
            />
            Actualiser
          </button>

          <button
            type="button"
            onClick={() =>
              ouvrirCreation()
            }
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus size={17} />
            Nouvelle cotisation
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* ERREUR                                                             */}
      {/* ------------------------------------------------------------------- */}

      {erreur && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0"
          />

          <div className="flex-1">
            {erreur}
          </div>

          <button
            type="button"
            onClick={() => setErreur("")}
            className="text-red-500 hover:text-red-700"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MA COTISATION                                                      */}
      {/* ------------------------------------------------------------------- */}

      {mesCotisations.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-bold text-slate-900">
              Ma cotisation
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Vos cotisations enregistrées.
            </p>
          </div>

          {(() => {
            const derniere =
              mesCotisations[0];

            return (
              <div className="grid gap-4 p-5 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Montant fixé
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {formaterMontant(
                      derniere.montantFixe
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-xs font-medium text-emerald-600">
                    Total versé
                  </p>

                  <p className="mt-1 text-xl font-bold text-emerald-700">
                    {formaterMontant(
                      derniere.montantPaye
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="text-xs font-medium text-amber-600">
                    Reste à payer
                  </p>

                  <p className="mt-1 text-xl font-bold text-amber-700">
                    {formaterMontant(
                      derniere.reste
                    )}
                  </p>
                </div>
              </div>
            );
          })()}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-t border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">
                    Période
                  </th>
                  <th className="px-5 py-3">
                    Montant fixé
                  </th>
                  <th className="px-5 py-3">
                    Total versé
                  </th>
                  <th className="px-5 py-3">
                    Reste
                  </th>
                  <th className="px-5 py-3">
                    Statut
                  </th>
                  <th className="px-5 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {mesCotisations.map(
                  (cotisation) => (
                    <tr
                      key={
                        cotisation.id
                      }
                      className="border-t border-slate-100"
                    >
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {
                          cotisation.mois_concerne
                        }{" "}
                        {cotisation.annee}
                      </td>

                      <td className="px-5 py-4 font-semibold">
                        {formaterMontant(
                          cotisation.montantFixe
                        )}
                      </td>

                      <td className="px-5 py-4 text-emerald-700">
                        {formaterMontant(
                          cotisation.montantPaye
                        )}
                      </td>

                      <td className="px-5 py-4 text-amber-700">
                        {formaterMontant(
                          cotisation.reste
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${classeStatut(
                            cotisation.statut
                          )}`}
                        >
                          {cotisation.statut ===
                            "payee" && (
                            <CheckCircle2
                              size={14}
                            />
                          )}

                          {libelleStatut(
                            cotisation.statut
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setCotisationSelectionnee(
                              cotisation
                            );
                            setModalDetails(
                              true
                            );
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Eye size={15} />
                          Détail
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* FILTRES                                                            */}
      {/* ------------------------------------------------------------------- */}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-900">
            Cotisations du Dahira
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Situation globale des cotisations
            enregistrées.
          </p>
        </div>

        {/* ESTIMATION */}

        <div className="p-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Estimation mensuelle du Dahira
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Tous les membres actifs et leur
                  cotisation mensuelle fixe.
                </p>

                <p className="mt-4 text-3xl font-bold text-slate-900">
                  {formaterMontant(
                    resume.estimation
                  )}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {resume.membresActifs} membres
                  actifs
                </p>
              </div>

              <div className="rounded-xl bg-white p-3 shadow-sm">
                <Wallet
                  size={23}
                  className="text-slate-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* FILTRES */}

        <div className="border-t border-slate-100 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">
              Filtres
            </h3>

            <button
              type="button"
              onClick={
                reinitialiserFiltres
              }
              className="text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              Réinitialiser les filtres
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {/* RECHERCHE */}

            <div className="relative">
              <Search
                size={17}
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
                placeholder="Rechercher un membre..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-slate-400"
              />
            </div>

            {/* MOIS */}

            <div className="relative">
              <Calendar
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={moisFiltre}
                onChange={(e) =>
                  setMoisFiltre(
                    e.target.value
                  )
                }
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm outline-none focus:border-slate-400"
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

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            {/* ANNÉE */}

            <div className="relative">
              <select
                value={anneeFiltre}
                onChange={(e) =>
                  setAnneeFiltre(
                    e.target.value
                  )
                }
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-9 text-sm outline-none focus:border-slate-400"
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

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            {/* STATUT */}

            <div className="relative">
              <select
                value={statutFiltre}
                onChange={(e) =>
                  setStatutFiltre(
                    e.target.value
                  )
                }
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-9 text-sm outline-none focus:border-slate-400"
              >
                <option value="">
                  Tous les statuts
                </option>

                <option value="payee">
                  Payées
                </option>

                <option value="partielle">
                  Partielles
                </option>

                <option value="impayee">
                  Impayées
                </option>
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* RÉSUMÉ                                                             */}
      {/* ------------------------------------------------------------------- */}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Cotisations enregistrées
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {resume.nombreCotisations}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Estimation mensuelle
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formaterMontant(
              resume.estimation
            )}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Tous les membres actifs
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-emerald-700">
            Total versé
          </p>

          <p className="mt-2 text-2xl font-bold text-emerald-800">
            {formaterMontant(
              resume.totalPaye
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-amber-700">
            Total restant
          </p>

          <p className="mt-2 text-2xl font-bold text-amber-800">
            {formaterMontant(
              resume.resteGlobal
            )}
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* SITUATION                                                          */}
      {/* ------------------------------------------------------------------- */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700">
              Situation
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                {resume.payees} payées
              </span>

              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                {resume.partielles} partielles
              </span>

              <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                {resume.impayees} impayées
              </span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-500">
              Période
            </p>

            <p className="font-semibold text-slate-900">
              {moisResume || "—"}{" "}
              {anneeResume || ""}
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* LISTE DES SITUATIONS                                               */}
      {/* ------------------------------------------------------------------- */}

      <section className="space-y-5">
        {groupesParMois.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Wallet
              size={38}
              className="mx-auto text-slate-300"
            />

            <h3 className="mt-4 font-semibold text-slate-900">
              Aucune cotisation trouvée
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Aucun résultat ne correspond
              aux filtres sélectionnés.
            </p>
          </div>
        ) : (
          groupesParMois.map(
            (groupe) => {
              const situations =
                groupe.situations;

              const estimation =
                membresActifs.reduce(
                  (
                    total,
                    membre
                  ) =>
                    total +
                    Number(
                      membre?.montant_cotisation ||
                        0
                    ),
                  0
                );

              const totalPaye =
                situations.reduce(
                  (
                    total,
                    situation
                  ) =>
                    total +
                    Number(
                      situation.montantPaye ||
                        0
                    ),
                  0
                );

              const reste = Math.max(
                0,
                estimation -
                  totalPaye
              );

              const nombreEnregistrees =
                situations.filter(
                  (situation) =>
                    situation.cotisationExiste
                ).length;

              return (
                <div
                  key={`${groupe.annee}|${groupe.mois}`}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  {/* HEADER MOIS */}

                  <div className="border-b border-slate-100 bg-slate-50 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">
                          {groupe.mois}{" "}
                          {groupe.annee}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          {nombreEnregistrees}{" "}
                          cotisation
                          {nombreEnregistrees >
                          1
                            ? "s"
                            : ""}{" "}
                          enregistrée
                          {nombreEnregistrees >
                          1
                            ? "s"
                            : ""}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
                          <p className="text-xs text-slate-500">
                            Estimation
                          </p>

                          <p className="mt-1 font-bold text-slate-900">
                            {formaterMontant(
                              estimation
                            )}
                          </p>

                          <p className="text-[11px] text-slate-400">
                            Tous les membres
                            actifs
                          </p>
                        </div>

                        <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
                          <p className="text-xs text-slate-500">
                            Total versé
                          </p>

                          <p className="mt-1 font-bold text-emerald-700">
                            {formaterMontant(
                              totalPaye
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
                          <p className="text-xs text-slate-500">
                            Reste
                          </p>

                          <p className="mt-1 font-bold text-amber-700">
                            {formaterMontant(
                              reste
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TABLE */}

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <th className="px-5 py-3">
                            Membre
                          </th>

                          <th className="px-5 py-3">
                            Période
                          </th>

                          <th className="px-5 py-3">
                            Montant fixé
                          </th>

                          <th className="px-5 py-3">
                            Total versé
                          </th>

                          <th className="px-5 py-3">
                            Reste
                          </th>

                          <th className="px-5 py-3">
                            Statut
                          </th>

                          <th className="px-5 py-3 text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {situations.map(
                          (situation) => {
                            const membre =
                              situation.membre;

                            const nom =
                              `${membre?.prenom || ""} ${
                                membre?.nom || ""
                              }`.trim();

                            return (
                              <tr
                                key={`${membre.id}|${groupe.mois}|${groupe.annee}`}
                                className="border-b border-slate-100 last:border-b-0"
                              >
                                <td className="px-5 py-4">
                                  <div className="font-semibold text-slate-900">
                                    {nom ||
                                      "Membre sans nom"}
                                  </div>

                                  {membre?.telephone && (
                                    <div className="mt-0.5 text-xs text-slate-500">
                                      {
                                        membre.telephone
                                      }
                                    </div>
                                  )}
                                </td>

                                <td className="px-5 py-4 text-slate-600">
                                  {
                                    situation.mois
                                  }{" "}
                                  {
                                    situation.annee
                                  }
                                </td>

                                <td className="px-5 py-4 font-semibold text-slate-900">
                                  {formaterMontant(
                                    situation.montantFixe
                                  )}
                                </td>

                                <td className="px-5 py-4 font-semibold text-emerald-700">
                                  {formaterMontant(
                                    situation.montantPaye
                                  )}
                                </td>

                                <td className="px-5 py-4 font-semibold text-amber-700">
                                  {formaterMontant(
                                    situation.reste
                                  )}
                                </td>

                                <td className="px-5 py-4">
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${classeStatut(
                                      situation.statut
                                    )}`}
                                  >
                                    {situation.statut ===
                                      "payee" && (
                                      <CheckCircle2
                                        size={14}
                                      />
                                    )}

                                    {libelleStatut(
                                      situation.statut
                                    )}
                                  </span>
                                </td>

                                <td className="px-5 py-4">
                                  <div className="flex justify-end gap-2">
                                    {/* DÉTAILS : seulement si cotisation existe */}

                                    {situation.cotisationExiste && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCotisationSelectionnee(
                                            situation.cotisation
                                          );

                                          setModalDetails(
                                            true
                                          );
                                        }}
                                        title="Détails"
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                      >
                                        <Eye
                                          size={
                                            15
                                          }
                                        />
                                        Détails
                                      </button>
                                    )}

                                    {/* PAYER SI COTISATION EXISTE */}

                                    {situation.cotisationExiste &&
                                      situation.montantPaye <
                                        situation.montantFixe && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            ouvrirPaiement(
                                              situation
                                            )
                                          }
                                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                                        >
                                          <CreditCard
                                            size={
                                              15
                                            }
                                          />
                                          Payer
                                        </button>
                                      )}

                                    {/* SI AUCUNE COTISATION :
                                        on crée d'abord la cotisation */}

                                    {!situation.cotisationExiste && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          ouvrirCreation(
                                            membre,
                                            situation.mois,
                                            situation.annee
                                          )
                                        }
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                                      >
                                        <UserPlus
                                          size={
                                            15
                                          }
                                        />
                                        Enregistrer
                                      </button>
                                    )}

                                    {/* MODIFIER */}

                                    {situation.cotisationExiste && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          ouvrirModification(
                                            situation.cotisation
                                          )
                                        }
                                        title="Modifier"
                                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                                      >
                                        <Edit
                                          size={
                                            15
                                          }
                                        />
                                      </button>
                                    )}

                                    {/* SUPPRIMER */}

                                    {situation.cotisationExiste && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          supprimer(
                                            situation.cotisation
                                          )
                                        }
                                        title="Supprimer"
                                        className="inline-flex items-center justify-center rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"
                                      >
                                        <Trash2
                                          size={
                                            15
                                          }
                                        />
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
          )
        )}
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* MODAL COTISATION                                                   */}
      {/* ------------------------------------------------------------------- */}

      {modalCotisation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {edition
                    ? "Modifier la cotisation"
                    : "Nouvelle cotisation"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  La cotisation représente le
                  montant fixe dû. Le paiement est
                  enregistré séparément.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setModalCotisation(false)
                }
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={
                soumettreCotisation
              }
              className="space-y-5 p-5"
            >
              {/* MEMBRE */}

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Membre
                </label>

                <select
                  value={
                    formulaire.membre_id
                  }
                  onChange={(e) => {
                    const membre =
                      membresActifs.find(
                        (m) =>
                          Number(m.id) ===
                          Number(
                            e.target.value
                          )
                      );

                    setFormulaire(
                      (ancien) => ({
                        ...ancien,
                        membre_id:
                          e.target.value,
                        montant:
                          membre?.montant_cotisation
                            ? String(
                                membre.montant_cotisation
                              )
                            : ancien.montant,
                      })
                    );
                  }}
                  disabled={edition}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50"
                >
                  <option value="">
                    Sélectionner un membre
                  </option>

                  {membresActifs.map(
                    (membre) => (
                      <option
                        key={membre.id}
                        value={membre.id}
                      >
                        {membre.prenom}{" "}
                        {membre.nom}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* MONTANT */}

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Montant fixé
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={
                    formulaire.montant
                  }
                  onChange={(e) =>
                    setFormulaire(
                      (ancien) => ({
                        ...ancien,
                        montant:
                          e.target.value,
                      })
                    )
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                />
              </div>

              {/* MOIS */}

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Mois concerné
                </label>

                <select
                  value={
                    formulaire.mois_concerne
                  }
                  onChange={(e) =>
                    setFormulaire(
                      (ancien) => ({
                        ...ancien,
                        mois_concerne:
                          e.target.value,
                      })
                    )
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400"
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

              {/* ANNÉE */}

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Année
                </label>

                <input
                  type="number"
                  min="2020"
                  max="2100"
                  value={
                    formulaire.annee
                  }
                  onChange={(e) =>
                    setFormulaire(
                      (ancien) => ({
                        ...ancien,
                        annee:
                          e.target.value,
                      })
                    )
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                />
              </div>

              {/* DATE */}

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Date d'enregistrement
                </label>

                <input
                  type="date"
                  value={
                    formulaire.date_cotisation
                  }
                  onChange={(e) =>
                    setFormulaire(
                      (ancien) => ({
                        ...ancien,
                        date_cotisation:
                          e.target.value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                />
              </div>

              {/* INFO */}

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-700">
                <strong>Important :</strong>{" "}
                l'enregistrement de cette cotisation
                ne crée aucun paiement. Le montant
                réellement reçu doit être enregistré
                avec le bouton « Payer ».
              </div>

              {/* ACTIONS */}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setModalCotisation(
                      false
                    )
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {edition
                    ? "Enregistrer les modifications"
                    : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MODAL PAIEMENT                                                     */}
      {/* ------------------------------------------------------------------- */}

      {modalPaiement &&
        cotisationSelectionnee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 p-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Enregistrer un paiement
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Le paiement correspond à
                    l'argent réellement reçu.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setModalPaiement(
                      false
                    )
                  }
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X size={19} />
                </button>
              </div>

              <form
                onSubmit={
                  soumettrePaiement
                }
                className="space-y-5 p-5"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      Montant fixé
                    </p>

                    <p className="mt-1 font-bold text-slate-900">
                      {formaterMontant(
                        cotisationSelectionnee.montant
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-amber-50 p-4">
                    <p className="text-xs text-amber-600">
                      Reste à payer
                    </p>

                    <p className="mt-1 font-bold text-amber-700">
                      {formaterMontant(
                        Math.max(
                          0,
                          Number(
                            cotisationSelectionnee.montant ||
                              0
                          ) -
                            obtenirMontantPaye(
                              cotisationSelectionnee
                            )
                        )
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Montant reçu
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={
                      formulairePaiement.montant
                    }
                    onChange={(e) =>
                      setFormulairePaiement(
                        (ancien) => ({
                          ...ancien,
                          montant:
                            e.target.value,
                        })
                      )
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Mode de paiement
                  </label>

                  <select
                    value={
                      formulairePaiement.mode_paiement
                    }
                    onChange={(e) =>
                      setFormulairePaiement(
                        (ancien) => ({
                          ...ancien,
                          mode_paiement:
                            e.target.value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                  >
                    <option value="espèce">
                      Espèce
                    </option>

                    <option value="wave">
                      Wave
                    </option>

                    <option value="orange_money">
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
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Date du paiement
                  </label>

                  <input
                    type="date"
                    value={
                      formulairePaiement.date_paiement
                    }
                    onChange={(e) =>
                      setFormulairePaiement(
                        (ancien) => ({
                          ...ancien,
                          date_paiement:
                            e.target.value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Référence
                    <span className="ml-1 font-normal text-slate-400">
                      (facultatif)
                    </span>
                  </label>

                  <input
                    type="text"
                    value={
                      formulairePaiement.reference
                    }
                    onChange={(e) =>
                      setFormulairePaiement(
                        (ancien) => ({
                          ...ancien,
                          reference:
                            e.target.value,
                        })
                      )
                    }
                    placeholder="Référence du paiement"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() =>
                      setModalPaiement(
                        false
                      )
                    }
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {saving && (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    )}

                    Enregistrer le paiement
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* ------------------------------------------------------------------- */}
      {/* MODAL DÉTAILS                                                      */}
      {/* ------------------------------------------------------------------- */}

      {modalDetails &&
        cotisationSelectionnee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 p-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Détails de la cotisation
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {
                      cotisationSelectionnee.mois_concerne
                    }{" "}
                    {
                      cotisationSelectionnee.annee
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setModalDetails(
                      false
                    )
                  }
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="space-y-5 p-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      Montant fixé
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {formaterMontant(
                        cotisationSelectionnee.montant
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-emerald-50 p-4">
                    <p className="text-xs text-emerald-600">
                      Total versé
                    </p>

                    <p className="mt-1 text-lg font-bold text-emerald-700">
                      {formaterMontant(
                        obtenirMontantPaye(
                          cotisationSelectionnee
                        )
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold text-slate-900">
                    Historique des paiements
                  </h3>

                  {Array.isArray(
                    cotisationSelectionnee.paiements
                  ) &&
                  cotisationSelectionnee
                    .paiements.length >
                    0 ? (
                    <div className="space-y-2">
                      {cotisationSelectionnee.paiements
                        .filter(
                          (paiement) =>
                            paiement?.actif !==
                            false
                        )
                        .map(
                          (paiement) => (
                            <div
                              key={
                                paiement.id
                              }
                              className="flex items-center justify-between rounded-xl border border-slate-200 p-3"
                            >
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {formaterMontant(
                                    paiement.montant
                                  )}
                                </p>

                                <p className="mt-0.5 text-xs text-slate-500">
                                  {paiement.mode_paiement ||
                                    "—"}

                                  {paiement.date_paiement
                                    ? ` · ${paiement.date_paiement}`
                                    : ""}
                                </p>

                                {paiement.reference && (
                                  <p className="mt-0.5 text-xs text-slate-400">
                                    Réf. :{" "}
                                    {
                                      paiement.reference
                                    }
                                  </p>
                                )}
                              </div>

                              <CheckCircle2
                                size={18}
                                className="text-emerald-600"
                              />
                            </div>
                          )
                        )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center">
                      <CreditCard
                        size={28}
                        className="mx-auto text-slate-300"
                      />

                      <p className="mt-2 text-sm font-medium text-slate-600">
                        Aucun paiement enregistré.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() =>
                      setModalDetails(
                        false
                      )
                    }
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}