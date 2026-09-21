import { useEffect, useMemo, useState } from "react";

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

/*
|--------------------------------------------------------------------------
| CONSTANTES
|--------------------------------------------------------------------------
*/

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

const formaterMontant = (montant) => {
  const valeur = Number(montant || 0);

  return new Intl.NumberFormat("fr-FR").format(valeur);
};

const obtenirIndexMois = (mois) => {
  const index = MOIS.findIndex(
    (item) =>
      item.toLowerCase() === String(mois || "").toLowerCase()
  );

  return index;
};

/*
|--------------------------------------------------------------------------
| CALCUL DU MONTANT RÉELLEMENT PAYÉ
|--------------------------------------------------------------------------
|
| IMPORTANT :
| cotisation.montant = montant fixe/dû
| paiement.montant   = argent réellement reçu
|
|--------------------------------------------------------------------------
*/

const obtenirMontantPaye = (cotisation) => {
  if (!cotisation) {
    return 0;
  }

  if (
    Array.isArray(cotisation.paiements)
  ) {
    return cotisation.paiements
      .filter((paiement) => paiement?.actif !== false)
      .reduce(
        (total, paiement) =>
          total + Number(paiement?.montant || 0),
        0
      );
  }

  return Number(
    cotisation.montant_cotise || 0
  );
};

/*
|--------------------------------------------------------------------------
| MONTANT FIXE
|--------------------------------------------------------------------------
*/

const obtenirMontantFixe = (
  membre,
  cotisation
) => {
  if (cotisation) {
    return Number(cotisation.montant || 0);
  }

  return Number(
    membre?.montant_cotisation || 0
  );
};

/*
|--------------------------------------------------------------------------
| STATUT
|--------------------------------------------------------------------------
*/

const calculerStatut = (
  montantFixe,
  montantPaye
) => {
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

/*
|--------------------------------------------------------------------------
| COMPOSANT
|--------------------------------------------------------------------------
*/

export default function Cotisations() {
  /*
  |--------------------------------------------------------------------------
  | ÉTATS
  |--------------------------------------------------------------------------
  */

  const [cotisations, setCotisations] =
    useState([]);

  const [membres, setMembres] =
    useState([]);

  const [chargement, setChargement] =
    useState(true);

  const [erreur, setErreur] =
    useState("");

  const [recherche, setRecherche] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | FILTRES
  |--------------------------------------------------------------------------
  */

  const [moisSelectionne, setMoisSelectionne] =
    useState("");

  const [anneeSelectionnee, setAnneeSelectionnee] =
    useState(String(ANNEE_ACTUELLE));

  const [statutSelectionne, setStatutSelectionne] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | MODALES
  |--------------------------------------------------------------------------
  */

  const [modalCotisation, setModalCotisation] =
    useState(false);

  const [modalPaiement, setModalPaiement] =
    useState(false);

  const [modalDetails, setModalDetails] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | SÉLECTION
  |--------------------------------------------------------------------------
  */

  const [
    cotisationSelectionnee,
    setCotisationSelectionnee,
  ] = useState(null);

  const [
    membreSelectionne,
    setMembreSelectionne,
  ] = useState(null);

  const [
    edition,
    setEdition,
  ] = useState(false);

  const [
    sauvegardeEnCours,
    setSauvegardeEnCours,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | FORMULAIRE COTISATION
  |--------------------------------------------------------------------------
  */

  const [
    formulaireCotisation,
    setFormulaireCotisation,
  ] = useState({
    membre_id: "",
    montant: "",
    mois_concerne: "",
    annee: ANNEE_ACTUELLE,
    date_cotisation:
      new Date().toISOString().split("T")[0],
  });

  /*
  |--------------------------------------------------------------------------
  | FORMULAIRE PAIEMENT
  |--------------------------------------------------------------------------
  */

  const [
    formulairePaiement,
    setFormulairePaiement,
  ] = useState({
    montant: "",
    mode_paiement: "espèce",
    date_paiement:
      new Date().toISOString().split("T")[0],
    reference: "",
  });

  /*
  |--------------------------------------------------------------------------
  | CHARGEMENT
  |--------------------------------------------------------------------------
  */

  const chargerDonnees = async () => {
    try {
      setChargement(true);
      setErreur("");

      const [
        resultatCotisations,
        resultatMembres,
      ] = await Promise.all([
        getCotisations(),
        getMembres(),
      ]);

      const listeCotisations =
        Array.isArray(resultatCotisations)
          ? resultatCotisations
          : resultatCotisations?.cotisations ||
            resultatCotisations?.data ||
            [];

      const listeMembres =
        Array.isArray(resultatMembres)
          ? resultatMembres
          : resultatMembres?.membres ||
            resultatMembres?.data ||
            [];

      setCotisations(listeCotisations);
      setMembres(listeMembres);
    } catch (error) {
      console.error(
        "Erreur chargement cotisations :",
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

  useEffect(() => {
    chargerDonnees();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | MEMBRES ACTIFS
  |--------------------------------------------------------------------------
  */

  const membresActifs = useMemo(() => {
    return membres.filter(
      (membre) => membre?.actif !== false
    );
  }, [membres]);

  /*
  |--------------------------------------------------------------------------
  | MOIS RÉELLEMENT ENREGISTRÉS
  |--------------------------------------------------------------------------
  |
  | Aucun mois fictif.
  | Un mois apparaît uniquement s'il existe au moins
  | une cotisation enregistrée pour ce mois.
  |
  |--------------------------------------------------------------------------
  */

  const moisEnregistres = useMemo(() => {
    const ensemble = new Set();

    cotisations.forEach((cotisation) => {
      if (
        !cotisation?.mois_concerne ||
        !cotisation?.annee
      ) {
        return;
      }

      ensemble.add(
        `${cotisation.annee}|${cotisation.mois_concerne}`
      );
    });

    return Array.from(ensemble)
      .map((cle) => {
        const [annee, mois] =
          cle.split("|");

        return {
          annee: Number(annee),
          mois,
        };
      })
      .sort((a, b) => {
        if (a.annee !== b.annee) {
          return b.annee - a.annee;
        }

        return (
          obtenirIndexMois(b.mois) -
          obtenirIndexMois(a.mois)
        );
      });
  }, [cotisations]);

  /*
  |--------------------------------------------------------------------------
  | INITIALISATION DU MOIS ACTUEL
  |--------------------------------------------------------------------------
  |
  | Si le mois actuel existe dans les cotisations,
  | on l'affiche par défaut.
  |
  | Sinon, on prend le mois enregistré le plus récent.
  |
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (moisEnregistres.length === 0) {
      return;
    }

    const maintenant = new Date();

    const moisActuel =
      MOIS[maintenant.getMonth()];

    const anneeActuelle =
      maintenant.getFullYear();

    const moisActuelExiste =
      moisEnregistres.some(
        (item) =>
          item.mois === moisActuel &&
          item.annee === anneeActuelle
      );

    if (moisActuelExiste) {
      setMoisSelectionne(moisActuel);
      setAnneeSelectionnee(
        String(anneeActuelle)
      );
      return;
    }

    const plusRecent =
      moisEnregistres[0];

    setMoisSelectionne(
      plusRecent.mois
    );

    setAnneeSelectionnee(
      String(plusRecent.annee)
    );
  }, [moisEnregistres]);

  /*
  |--------------------------------------------------------------------------
  | ANNÉES DISPONIBLES
  |--------------------------------------------------------------------------
  */

  const anneesDisponibles = useMemo(() => {
    const annees = new Set();

    cotisations.forEach((cotisation) => {
      if (cotisation?.annee) {
        annees.add(
          Number(cotisation.annee)
        );
      }
    });

    annees.add(ANNEE_ACTUELLE);

    return Array.from(annees).sort(
      (a, b) => b - a
    );
  }, [cotisations]);

  /*
  |--------------------------------------------------------------------------
  | INDEX DES COTISATIONS
  |--------------------------------------------------------------------------
  */

  const cotisationsMap = useMemo(() => {
    const map = new Map();

    cotisations.forEach((cotisation) => {
      const cle =
        `${cotisation.membre_id}|` +
        `${cotisation.mois_concerne}|` +
        `${cotisation.annee}`;

      map.set(cle, cotisation);
    });

    return map;
  }, [cotisations]);

  /*
  |--------------------------------------------------------------------------
  | SITUATIONS MENSUELLES
  |--------------------------------------------------------------------------
  |
  | Pour chaque mois réellement enregistré :
  | - tous les membres actifs peuvent être représentés
  | - une absence de cotisation signifie 0 paiement
  | - cette absence n'apparaît que dans "Impayées"
  |
  |--------------------------------------------------------------------------
  */

  const situationsMensuelles = useMemo(() => {
    const situations = [];

    moisEnregistres.forEach(
      ({ mois, annee }) => {
        membresActifs.forEach((membre) => {
          const cle =
            `${membre.id}|${mois}|${annee}`;

          const cotisation =
            cotisationsMap.get(cle) || null;

          const montantFixe =
            obtenirMontantFixe(
              membre,
              cotisation
            );

          const montantPaye =
            obtenirMontantPaye(
              cotisation
            );

          const reste = Math.max(
            0,
            montantFixe - montantPaye
          );

          const statut =
            calculerStatut(
              montantFixe,
              montantPaye
            );

          situations.push({
            membre,
            cotisation,
            cotisationExiste:
              Boolean(cotisation),
            mois,
            annee,
            montantFixe,
            montantPaye,
            reste,
            statut,
          });
        });
      }
    );

    return situations;
  }, [
    moisEnregistres,
    membresActifs,
    cotisationsMap,
  ]);

  /*
  |--------------------------------------------------------------------------
  | FILTRAGE
  |--------------------------------------------------------------------------
  */

  const situationsFiltrees =
    useMemo(() => {
      const terme =
        recherche
          .trim()
          .toLowerCase();

      return situationsMensuelles.filter(
        (situation) => {
          const {
            membre,
            cotisationExiste,
            montantPaye,
            statut,
          } = situation;

          /*
          | Recherche
          */

          const texteMembre =
            [
              membre?.nom,
              membre?.prenom,
              membre?.telephone,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          if (
            terme &&
            !texteMembre.includes(terme)
          ) {
            return false;
          }

          /*
          | Mois
          */

          if (
            moisSelectionne &&
            situation.mois !==
              moisSelectionne
          ) {
            return false;
          }

          /*
          | Année
          */

          if (
            anneeSelectionnee &&
            Number(situation.annee) !==
              Number(anneeSelectionnee)
          ) {
            return false;
          }

          /*
          |--------------------------------------------------------------------------
          | TOUS
          |--------------------------------------------------------------------------
          |
          | Seulement les cotisations réellement
          | enregistrées.
          |
          */

          if (
            !statutSelectionne ||
            statutSelectionne === "tous"
          ) {
            return cotisationExiste;
          }

          /*
          |--------------------------------------------------------------------------
          | IMPAYÉES
          |--------------------------------------------------------------------------
          |
          | Tous les membres actifs à 0 FCFA.
          | Même s'ils n'ont aucune ligne cotisation.
          |
          */

          if (
            statutSelectionne ===
            "impayee"
          ) {
            return (
              Number(montantPaye) <= 0
            );
          }

          /*
          | PAYÉES / PARTIELLES
          | uniquement avec cotisation existante
          */

          if (!cotisationExiste) {
            return false;
          }

          return (
            statut ===
            statutSelectionne
          );
        }
      );
    }, [
      situationsMensuelles,
      recherche,
      moisSelectionne,
      anneeSelectionnee,
      statutSelectionne,
    ]);

  /*
  |--------------------------------------------------------------------------
  | MOIS COURANT AFFICHÉ
  |--------------------------------------------------------------------------
  */

  const moisAffiche =
    moisSelectionne ||
    (moisEnregistres[0]?.mois ||
      "");

  const anneeAffiche =
    Number(
      anneeSelectionnee ||
        moisEnregistres[0]?.annee ||
        ANNEE_ACTUELLE
    );

  /*
  |--------------------------------------------------------------------------
  | SITUATIONS DU MOIS SÉLECTIONNÉ
  |--------------------------------------------------------------------------
  */

  const situationsDuMois =
    useMemo(() => {
      return situationsMensuelles.filter(
        (situation) =>
          situation.mois ===
            moisAffiche &&
          Number(situation.annee) ===
            Number(anneeAffiche)
      );
    }, [
      situationsMensuelles,
      moisAffiche,
      anneeAffiche,
    ]);

  /*
  |--------------------------------------------------------------------------
  | RÉSUMÉ DU MOIS
  |--------------------------------------------------------------------------
  */

  const resume = useMemo(() => {
    const estimation =
      membresActifs.reduce(
        (total, membre) =>
          total +
          Number(
            membre?.montant_cotisation ||
              0
          ),
        0
      );

    const totalPaye =
      situationsDuMois.reduce(
        (total, situation) =>
          total +
          Number(
            situation.montantPaye || 0
          ),
        0
      );

    const reste = Math.max(
      0,
      estimation - totalPaye
    );

    const cotisationsEnregistrees =
      situationsDuMois.filter(
        (situation) =>
          situation.cotisationExiste
      );

    const payees =
      cotisationsEnregistrees.filter(
        (situation) =>
          situation.statut === "payee"
      ).length;

    const partielles =
      cotisationsEnregistrees.filter(
        (situation) =>
          situation.statut ===
          "partielle"
      ).length;

    const impayees =
      situationsDuMois.filter(
        (situation) =>
          Number(
            situation.montantPaye || 0
          ) <= 0
      ).length;

    return {
      estimation,
      totalPaye,
      reste,
      nombreCotisations:
        cotisationsEnregistrees.length,
      payees,
      partielles,
      impayees,
    };
  }, [
    membresActifs,
    situationsDuMois,
  ]);

  /*
  |--------------------------------------------------------------------------
  | MES COTISATIONS
  |--------------------------------------------------------------------------
  */

  const membreConnecteId =
    Number(
      localStorage.getItem(
        "membre_id"
      ) ||
        localStorage.getItem(
          "user_membre_id"
        ) ||
        0
    );

  const mesCotisations =
    useMemo(() => {
      if (!membreConnecteId) {
        return [];
      }

      return cotisations
        .filter(
          (cotisation) =>
            Number(
              cotisation.membre_id
            ) === membreConnecteId
        )
        .map((cotisation) => {
          const membre =
            membres.find(
              (item) =>
                Number(item.id) ===
                membreConnecteId
            );

          const montantFixe =
            obtenirMontantFixe(
              membre,
              cotisation
            );

          const montantPaye =
            obtenirMontantPaye(
              cotisation
            );

          return {
            ...cotisation,
            montantFixe,
            montantPaye,
            reste: Math.max(
              0,
              montantFixe -
                montantPaye
            ),
            statut:
              calculerStatut(
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
            obtenirIndexMois(
              b.mois_concerne
            ) -
            obtenirIndexMois(
              a.mois_concerne
            )
          );
        });
    }, [
      cotisations,
      membres,
      membreConnecteId,
    ]);

  /*
  |--------------------------------------------------------------------------
  | MEMBRE CONNECTÉ
  |--------------------------------------------------------------------------
  */

  const membreConnecte =
    membres.find(
      (membre) =>
        Number(membre.id) ===
        membreConnecteId
    ) || null;

  /*
  |--------------------------------------------------------------------------
  | CRÉATION
  |--------------------------------------------------------------------------
  */

  const ouvrirCreation = (
    membre = null
  ) => {
    const membreCible =
      membre || membreConnecte;

    const mois =
      moisAffiche ||
      MOIS[new Date().getMonth()];

    const annee =
      anneeAffiche ||
      ANNEE_ACTUELLE;

    setEdition(false);

    setCotisationSelectionnee(
      null
    );

    setFormulaireCotisation({
      membre_id:
        membreCible?.id || "",
      montant:
        membreCible?.montant_cotisation ||
        "",
      mois_concerne: mois,
      annee,
      date_cotisation:
        new Date()
          .toISOString()
          .split("T")[0],
    });

    setModalCotisation(true);
  };

  /*
  |--------------------------------------------------------------------------
  | MODIFICATION
  |--------------------------------------------------------------------------
  */

  const ouvrirModification = (
    cotisation
  ) => {
    const membre =
      membres.find(
        (item) =>
          Number(item.id) ===
          Number(
            cotisation.membre_id
          )
      ) || null;

    setEdition(true);

    setCotisationSelectionnee(
      cotisation
    );

    setFormulaireCotisation({
      membre_id:
        cotisation.membre_id,
      montant:
        cotisation.montant || "",
      mois_concerne:
        cotisation.mois_concerne ||
        moisAffiche,
      annee:
        cotisation.annee ||
        anneeAffiche,
      date_cotisation:
        cotisation.date_cotisation ||
        new Date()
          .toISOString()
          .split("T")[0],
    });

    setMembreSelectionne(
      membre
    );

    setModalCotisation(true);
  };

  /*
  |--------------------------------------------------------------------------
  | PAIEMENT
  |--------------------------------------------------------------------------
  */

  const ouvrirPaiement = (
    situation
  ) => {
    /*
    | Pas encore de cotisation :
    | on commence par créer la cotisation.
    */

    if (!situation.cotisation) {
      ouvrirCreation(
        situation.membre
      );
      return;
    }

    const montantRestant =
      Math.max(
        0,
        Number(
          situation.montantFixe
        ) -
          Number(
            situation.montantPaye
          )
      );

    setCotisationSelectionnee(
      situation.cotisation
    );

    setFormulairePaiement({
      montant:
        montantRestant || "",
      mode_paiement: "espèce",
      date_paiement:
        new Date()
          .toISOString()
          .split("T")[0],
      reference: "",
    });

    setModalPaiement(true);
  };

  /*
  |--------------------------------------------------------------------------
  | DÉTAILS
  |--------------------------------------------------------------------------
  */

  const ouvrirDetails = (
    cotisation
  ) => {
    setCotisationSelectionnee(
      cotisation
    );

    setModalDetails(true);
  };

  /*
  |--------------------------------------------------------------------------
  | SOUMISSION COTISATION
  |--------------------------------------------------------------------------
  */

  const soumettreCotisation =
    async (event) => {
      event.preventDefault();

      try {
        setSauvegardeEnCours(true);
        setErreur("");

        const payload = {
          membre_id: Number(
            formulaireCotisation.membre_id
          ),
          montant: Number(
            formulaireCotisation.montant
          ),
          mois_concerne:
            formulaireCotisation.mois_concerne,
          annee: Number(
            formulaireCotisation.annee
          ),
          date_cotisation:
            formulaireCotisation.date_cotisation,
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

        await chargerDonnees();
      } catch (error) {
        console.error(
          "Erreur cotisation :",
          error
        );

        setErreur(
          error?.response?.data
            ?.detail ||
            "Impossible d'enregistrer la cotisation."
        );
      } finally {
        setSauvegardeEnCours(false);
      }
    };

  /*
  |--------------------------------------------------------------------------
  | SOUMISSION PAIEMENT
  |--------------------------------------------------------------------------
  */

  const soumettrePaiement =
    async (event) => {
      event.preventDefault();

      if (
        !cotisationSelectionnee
      ) {
        return;
      }

      try {
        setSauvegardeEnCours(true);
        setErreur("");

        await ajouterPaiement(
          cotisationSelectionnee.id,
          {
            montant: Number(
              formulairePaiement.montant
            ),
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

        await chargerDonnees();
      } catch (error) {
        console.error(
          "Erreur paiement :",
          error
        );

        setErreur(
          error?.response?.data
            ?.detail ||
            "Impossible d'enregistrer le paiement."
        );
      } finally {
        setSauvegardeEnCours(false);
      }
    };

  /*
  |--------------------------------------------------------------------------
  | SUPPRESSION
  |--------------------------------------------------------------------------
  */

  const supprimer = async (
    cotisation
  ) => {
    const confirmation =
      window.confirm(
        `Supprimer la cotisation de ${
          cotisation?.membre?.prenom ||
          ""
        } ${
          cotisation?.membre?.nom ||
          ""
        } pour ${
          cotisation?.mois_concerne ||
          ""
        } ${
          cotisation?.annee ||
          ""
        } ?`
      );

    if (!confirmation) {
      return;
    }

    try {
      setErreur("");

      await supprimerCotisation(
        cotisation.id
      );

      await chargerDonnees();
    } catch (error) {
      console.error(
        "Erreur suppression :",
        error
      );

      setErreur(
        error?.response?.data?.detail ||
          "Impossible de supprimer la cotisation."
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | COULEURS DES STATUTS
  |--------------------------------------------------------------------------
  */

  const badgeStatut = (
    statut
  ) => {
    if (statut === "payee") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (statut === "partielle") {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }

    return "bg-red-50 text-red-700 border-red-200";
  };

  const libelleStatut = (
    statut
  ) => {
    if (statut === "payee") {
      return "Payée";
    }

    if (statut === "partielle") {
      return "Partielle";
    }

    return "Impayée";
  };

  /*
  |--------------------------------------------------------------------------
  | AFFICHAGE CHARGEMENT
  |--------------------------------------------------------------------------
  */

  if (chargement) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2
            className="animate-spin"
            size={22}
          />
          <span>
            Chargement des cotisations...
          </span>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6 pb-10">

      {/* ================================================================
          EN-TÊTE
      ================================================================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Cotisations
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Suivi des cotisations et des
            paiements du Dahira.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">

          <button
            type="button"
            onClick={chargerDonnees}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Calendar size={17} />
            Actualiser
          </button>

          <button
            type="button"
            onClick={() =>
              ouvrirCreation()
            }
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            <Plus size={17} />
            Nouvelle cotisation
          </button>

        </div>
      </div>

      {/* ================================================================
          ERREUR
      ================================================================= */}

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
            onClick={() =>
              setErreur("")
            }
            className="text-red-500 hover:text-red-700"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* ================================================================
          MA COTISATION
      ================================================================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
          <div className="flex items-center justify-between gap-4">

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Ma cotisation
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Votre situation personnelle.
              </p>
            </div>

            {membreConnecte && (
              <div className="hidden rounded-xl bg-white px-3 py-2 text-right shadow-sm sm:block">
                <p className="text-xs text-slate-400">
                  Membre
                </p>

                <p className="text-sm font-semibold text-slate-800">
                  {membreConnecte.prenom}{" "}
                  {membreConnecte.nom}
                </p>
              </div>
            )}

          </div>
        </div>

        <div className="p-5">

          {mesCotisations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">

              <Wallet
                size={30}
                className="mx-auto mb-3 text-slate-400"
              />

              <p className="font-semibold text-slate-700">
                Aucune cotisation enregistrée
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Votre cotisation n'a pas encore
                été enregistrée.
              </p>

              <button
                type="button"
                onClick={() =>
                  ouvrirCreation(
                    membreConnecte
                  )
                }
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <Plus size={17} />
                Ajouter ma cotisation
              </button>

            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

              {mesCotisations.map(
                (cotisation) => (
                  <div
                    key={cotisation.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div>
                        <p className="font-bold text-slate-900">
                          {
                            cotisation.mois_concerne
                          }{" "}
                          {
                            cotisation.annee
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Montant fixé
                        </p>

                        <p className="text-lg font-bold text-slate-900">
                          {formaterMontant(
                            cotisation.montantFixe
                          )}{" "}
                          FCFA
                        </p>
                      </div>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeStatut(
                          cotisation.statut
                        )}`}
                      >
                        {libelleStatut(
                          cotisation.statut
                        )}
                      </span>

                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">

                      <div className="rounded-xl bg-emerald-50 p-3">
                        <p className="text-xs text-emerald-600">
                          Total versé
                        </p>

                        <p className="mt-1 font-bold text-emerald-800">
                          {formaterMontant(
                            cotisation.montantPaye
                          )}{" "}
                          FCFA
                        </p>
                      </div>

                      <div className="rounded-xl bg-amber-50 p-3">
                        <p className="text-xs text-amber-600">
                          Reste
                        </p>

                        <p className="mt-1 font-bold text-amber-800">
                          {formaterMontant(
                            cotisation.reste
                          )}{" "}
                          FCFA
                        </p>
                      </div>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        ouvrirDetails(
                          cotisation
                        )
                      }
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Eye size={16} />
                      Détail
                    </button>

                  </div>
                )
              )}

            </div>
          )}

        </div>
      </section>

      {/* ================================================================
          COTISATIONS DU DAHIRA
      ================================================================= */}

      <section className="space-y-5">

        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Cotisations du Dahira
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Situation mensuelle des membres actifs.
          </p>
        </div>

        {/* ================================================================
            SÉLECTION DU MOIS
        ================================================================= */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">

            <div className="flex-1">

              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Mois
              </label>

              <div className="relative">

                <select
                  value={
                    moisSelectionne
                  }
                  onChange={(event) =>
                    setMoisSelectionne(
                      event.target.value
                    )
                  }
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-semibold text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >

                  {moisEnregistres
                    .filter(
                      (item) =>
                        Number(
                          item.annee
                        ) ===
                        Number(
                          anneeSelectionnee
                        )
                    )
                    .map((item) => (
                      <option
                        key={`${item.annee}-${item.mois}`}
                        value={item.mois}
                      >
                        {item.mois}
                      </option>
                    ))}

                </select>

                <ChevronDown
                  size={18}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

              </div>
            </div>

            <div className="w-full lg:w-36">

              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Année
              </label>

              <select
                value={
                  anneeSelectionnee
                }
                onChange={(event) => {
                  setAnneeSelectionnee(
                    event.target.value
                  );

                  const moisDisponible =
                    moisEnregistres.find(
                      (item) =>
                        Number(
                          item.annee
                        ) ===
                        Number(
                          event.target.value
                        )
                    );

                  if (
                    moisDisponible
                  ) {
                    setMoisSelectionne(
                      moisDisponible.mois
                    );
                  } else {
                    setMoisSelectionne(
                      ""
                    );
                  }
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              >

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

            <div className="flex-1">

              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Rechercher
              </label>

              <div className="relative">

                <Search
                  size={18}
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
                  placeholder="Nom, prénom ou téléphone..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />

              </div>
            </div>

          </div>

          {/* ==============================================================
              STATUTS
          ============================================================== */}

          <div className="mt-4 flex flex-wrap gap-2">

            {[
              {
                valeur: "",
                label: "Tous",
              },
              {
                valeur: "payee",
                label: "Payées",
              },
              {
                valeur: "partielle",
                label: "Partielles",
              },
              {
                valeur: "impayee",
                label: "Impayées",
              },
            ].map((filtre) => (
              <button
                key={filtre.valeur}
                type="button"
                onClick={() =>
                  setStatutSelectionne(
                    filtre.valeur
                  )
                }
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  statutSelectionne ===
                  filtre.valeur
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {filtre.label}
              </button>
            ))}

          </div>
        </div>

        {/* ================================================================
            RÉSUMÉ
        ================================================================= */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Cotisations enregistrées
              </p>

              <Calendar
                size={20}
                className="text-slate-400"
              />
            </div>

            <p className="mt-3 text-2xl font-bold text-slate-900">
              {
                resume.nombreCotisations
              }
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {moisAffiche}{" "}
              {anneeAffiche}
            </p>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Estimation mensuelle
              </p>

              <Wallet
                size={20}
                className="text-slate-400"
              />
            </div>

            <p className="mt-3 text-2xl font-bold text-slate-900">
              {formaterMontant(
                resume.estimation
              )}{" "}
              <span className="text-sm font-semibold">
                FCFA
              </span>
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {membresActifs.length}{" "}
              membres actifs
            </p>

          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">

            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-emerald-700">
                Total versé
              </p>

              <CheckCircle2
                size={20}
                className="text-emerald-600"
              />
            </div>

            <p className="mt-3 text-2xl font-bold text-emerald-800">
              {formaterMontant(
                resume.totalPaye
              )}{" "}
              <span className="text-sm font-semibold">
                FCFA
              </span>
            </p>

            <p className="mt-1 text-xs text-emerald-600">
              Paiements réellement encaissés
            </p>

          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">

            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-amber-700">
                Reste à encaisser
              </p>

              <CreditCard
                size={20}
                className="text-amber-600"
              />
            </div>

            <p className="mt-3 text-2xl font-bold text-amber-800">
              {formaterMontant(
                resume.reste
              )}{" "}
              <span className="text-sm font-semibold">
                FCFA
              </span>
            </p>

            <p className="mt-1 text-xs text-amber-600">
              Estimation − paiements reçus
            </p>

          </div>

        </div>

        {/* ================================================================
            STATISTIQUES
        ================================================================= */}

        <div className="grid gap-3 sm:grid-cols-3">

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-xs font-medium text-emerald-600">
              Payées
            </p>

            <p className="mt-1 text-xl font-bold text-emerald-800">
              {resume.payees}
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs font-medium text-amber-600">
              Partielles
            </p>

            <p className="mt-1 text-xl font-bold text-amber-800">
              {resume.partielles}
            </p>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-xs font-medium text-red-600">
              Impayées
            </p>

            <p className="mt-1 text-xl font-bold text-red-800">
              {resume.impayees}
            </p>
          </div>

        </div>

        {/* ================================================================
            TABLEAU
        ================================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-5 py-4">

            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h3 className="font-bold text-slate-900">
                  {moisAffiche}{" "}
                  {anneeAffiche}
                </h3>

                <p className="text-sm text-slate-500">
                  Situation des membres actifs
                </p>
              </div>

              <span className="text-sm font-semibold text-slate-500">
                {
                  situationsFiltrees.length
                }{" "}
                résultat
                {situationsFiltrees.length >
                1
                  ? "s"
                  : ""}
              </span>

            </div>

          </div>

          {situationsFiltrees.length ===
          0 ? (
            <div className="p-10 text-center">

              <Wallet
                size={34}
                className="mx-auto mb-3 text-slate-300"
              />

              <p className="font-semibold text-slate-700">
                Aucune cotisation à afficher
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Modifiez les filtres ou
                enregistrez une cotisation.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[900px]">

                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                    <th className="px-5 py-3">
                      Membre
                    </th>

                    <th className="px-5 py-3">
                      Mois
                    </th>

                    <th className="px-5 py-3 text-right">
                      Montant fixé
                    </th>

                    <th className="px-5 py-3 text-right">
                      Total versé
                    </th>

                    <th className="px-5 py-3 text-right">
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

                  {situationsFiltrees.map(
                    (situation) => (
                      <tr
                        key={`${situation.membre.id}-${situation.mois}-${situation.annee}`}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                      >

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                              {(
                                situation
                                  .membre
                                  ?.prenom?.[0] ||
                                situation
                                  .membre
                                  ?.nom?.[0] ||
                                "M"
                              ).toUpperCase()}
                            </div>

                            <div>

                              <p className="font-semibold text-slate-900">
                                {
                                  situation
                                    .membre
                                    ?.prenom
                                }{" "}
                                {
                                  situation
                                    .membre
                                    ?.nom
                                }
                              </p>

                              {situation
                                .membre
                                ?.telephone && (
                                <p className="text-xs text-slate-500">
                                  {
                                    situation
                                      .membre
                                      .telephone
                                  }
                                </p>
                              )}

                            </div>

                          </div>

                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {situation.mois}{" "}
                          {situation.annee}
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-semibold text-slate-800">
                          {formaterMontant(
                            situation.montantFixe
                          )}{" "}
                          FCFA
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-semibold text-emerald-700">
                          {formaterMontant(
                            situation.montantPaye
                          )}{" "}
                          FCFA
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-semibold text-amber-700">
                          {formaterMontant(
                            situation.reste
                          )}{" "}
                          FCFA
                        </td>

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeStatut(
                              situation.statut
                            )}`}
                          >
                            {libelleStatut(
                              situation.statut
                            )}
                          </span>

                        </td>

                        <td className="px-5 py-4">

                          <div className="flex items-center justify-end gap-2">

                            {situation.cotisation && (
                              <button
                                type="button"
                                onClick={() =>
                                  ouvrirDetails(
                                    situation.cotisation
                                  )
                                }
                                title="Détails"
                                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                              >
                                <Eye
                                  size={16}
                                />
                              </button>
                            )}

                            {situation.cotisation &&
                              situation.statut !==
                                "payee" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    ouvrirPaiement(
                                      situation
                                    )
                                  }
                                  title="Enregistrer un paiement"
                                  className="rounded-lg bg-emerald-600 p-2 text-white hover:bg-emerald-700"
                                >
                                  <CreditCard
                                    size={16}
                                  />
                                </button>
                              )}

                            {!situation.cotisation && (
                              <button
                                type="button"
                                onClick={() =>
                                  ouvrirCreation(
                                    situation.membre
                                  )
                                }
                                title="Enregistrer la cotisation"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                              >
                                <Plus
                                  size={14}
                                />
                                Enregistrer
                              </button>
                            )}

                            {situation.cotisation && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    ouvrirModification(
                                      situation.cotisation
                                    )
                                  }
                                  title="Modifier"
                                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                                >
                                  <Edit
                                    size={16}
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    supprimer(
                                      situation.cotisation
                                    )
                                  }
                                  title="Supprimer"
                                  className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                                >
                                  <Trash2
                                    size={16}
                                  />
                                </button>
                              </>
                            )}

                          </div>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </section>

      {/* ================================================================
          MODALE COTISATION
      ================================================================= */}

      {modalCotisation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {edition
                    ? "Modifier la cotisation"
                    : "Nouvelle cotisation"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Définissez le montant dû pour
                  le membre et la période.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setModalCotisation(
                    false
                  )
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={
                soumettreCotisation
              }
              className="space-y-4 p-5"
            >

              <div>

                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Membre
                </label>

                <select
                  required
                  value={
                    formulaireCotisation.membre_id
                  }
                  onChange={(event) => {
                    const membre =
                      membresActifs.find(
                        (item) =>
                          Number(item.id) ===
                          Number(
                            event.target
                              .value
                          )
                      );

                    setFormulaireCotisation(
                      (ancien) => ({
                        ...ancien,
                        membre_id:
                          event.target
                            .value,
                        montant:
                          membre?.montant_cotisation ||
                          ancien.montant,
                      })
                    );
                  }}
                  disabled={edition}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 disabled:bg-slate-100"
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

              <div className="grid gap-4 sm:grid-cols-2">

                <div>

                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Montant fixé
                  </label>

                  <div className="relative">

                    <input
                      type="number"
                      min="0"
                      required
                      value={
                        formulaireCotisation.montant
                      }
                      onChange={(event) =>
                        setFormulaireCotisation(
                          (ancien) => ({
                            ...ancien,
                            montant:
                              event.target
                                .value,
                          })
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-16 text-sm outline-none focus:border-slate-400"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      FCFA
                    </span>

                  </div>

                </div>

                <div>

                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Année
                  </label>

                  <input
                    type="number"
                    required
                    value={
                      formulaireCotisation.annee
                    }
                    onChange={(event) =>
                      setFormulaireCotisation(
                        (ancien) => ({
                          ...ancien,
                          annee:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                  />

                </div>

              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                <div>

                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Mois
                  </label>

                  <select
                    required
                    value={
                      formulaireCotisation.mois_concerne
                    }
                    onChange={(event) =>
                      setFormulaireCotisation(
                        (ancien) => ({
                          ...ancien,
                          mois_concerne:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
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

                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Date
                  </label>

                  <input
                    type="date"
                    required
                    value={
                      formulaireCotisation.date_cotisation
                    }
                    onChange={(event) =>
                      setFormulaireCotisation(
                        (ancien) => ({
                          ...ancien,
                          date_cotisation:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                  />

                </div>

              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">
                Le montant ci-dessus représente
                le montant dû. Le paiement réel
                sera enregistré séparément.
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">

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
                  disabled={
                    sauvegardeEnCours
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {sauvegardeEnCours && (
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

      {/* ================================================================
          MODALE PAIEMENT
      ================================================================= */}

      {modalPaiement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Enregistrer un paiement
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Paiement réellement encaissé.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setModalPaiement(false)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={
                soumettrePaiement
              }
              className="space-y-4 p-5"
            >

              {cotisationSelectionnee && (
                <div className="rounded-xl bg-slate-50 p-4">

                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-slate-500">
                      Montant fixé
                    </span>

                    <strong className="text-slate-800">
                      {formaterMontant(
                        cotisationSelectionnee.montant
                      )}{" "}
                      FCFA
                    </strong>
                  </div>

                  <div className="mt-2 flex justify-between gap-3 text-sm">
                    <span className="text-slate-500">
                      Déjà versé
                    </span>

                    <strong className="text-emerald-700">
                      {formaterMontant(
                        obtenirMontantPaye(
                          cotisationSelectionnee
                        )
                      )}{" "}
                      FCFA
                    </strong>
                  </div>

                </div>
              )}

              <div>

                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Montant du paiement
                </label>

                <div className="relative">

                  <input
                    type="number"
                    min="1"
                    required
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
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-16 text-sm outline-none focus:border-slate-400"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    FCFA
                  </span>

                </div>

              </div>

              <div>

                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
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
                          event.target
                            .value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                >
                  <option value="espèce">
                    Espèces
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
                </select>

              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                <div>

                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Date
                  </label>

                  <input
                    type="date"
                    required
                    value={
                      formulairePaiement.date_paiement
                    }
                    onChange={(event) =>
                      setFormulairePaiement(
                        (ancien) => ({
                          ...ancien,
                          date_paiement:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                  />

                </div>

                <div>

                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Référence
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
                            event.target
                              .value,
                        })
                      )
                    }
                    placeholder="Optionnel"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                  />

                </div>

              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">

                <button
                  type="button"
                  onClick={() =>
                    setModalPaiement(false)
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={
                    sauvegardeEnCours
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {sauvegardeEnCours && (
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

      {/* ================================================================
          MODALE DÉTAILS
      ================================================================= */}

      {modalDetails &&
        cotisationSelectionnee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Détail de la cotisation
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
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>

              </div>

              <div className="space-y-4 p-5">

                <div className="grid grid-cols-2 gap-3">

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      Montant fixé
                    </p>

                    <p className="mt-1 font-bold text-slate-900">
                      {formaterMontant(
                        cotisationSelectionnee.montant
                      )}{" "}
                      FCFA
                    </p>
                  </div>

                  <div className="rounded-xl bg-emerald-50 p-4">
                    <p className="text-xs text-emerald-600">
                      Total versé
                    </p>

                    <p className="mt-1 font-bold text-emerald-800">
                      {formaterMontant(
                        obtenirMontantPaye(
                          cotisationSelectionnee
                        )
                      )}{" "}
                      FCFA
                    </p>
                  </div>

                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

                  <div className="flex items-center justify-between">

                    <span className="text-sm font-medium text-amber-700">
                      Reste à payer
                    </span>

                    <strong className="text-amber-800">
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
                      )}{" "}
                      FCFA
                    </strong>

                  </div>

                </div>

                <div>

                  <div className="mb-3 flex items-center justify-between">

                    <h3 className="font-bold text-slate-900">
                      Historique des paiements
                    </h3>

                    <span className="text-xs text-slate-400">
                      {
                        cotisationSelectionnee
                          .paiements
                          ?.length || 0
                      }{" "}
                      paiement
                      {(
                        cotisationSelectionnee
                          .paiements
                          ?.length || 0
                      ) > 1
                        ? "s"
                        : ""}
                    </span>

                  </div>

                  {Array.isArray(
                    cotisationSelectionnee.paiements
                  ) &&
                  cotisationSelectionnee
                    .paiements.length > 0 ? (
                    <div className="space-y-2">

                      {cotisationSelectionnee.paiements.map(
                        (paiement) => (
                          <div
                            key={
                              paiement.id
                            }
                            className="flex items-center justify-between rounded-xl border border-slate-200 p-3"
                          >

                            <div>

                              <p className="font-semibold text-slate-800">
                                {formaterMontant(
                                  paiement.montant
                                )}{" "}
                                FCFA
                              </p>

                              <p className="text-xs text-slate-500">
                                {
                                  paiement.mode_paiement
                                }

                                {paiement.date_paiement &&
                                  ` • ${paiement.date_paiement}`}
                              </p>

                            </div>

                            {paiement.reference && (
                              <span className="text-xs text-slate-400">
                                {
                                  paiement.reference
                                }
                              </span>
                            )}

                          </div>
                        )
                      )}

                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">
                      Aucun paiement enregistré.
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
                    className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
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