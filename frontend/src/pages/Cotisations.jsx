import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  Edit3,
  Eye,
  FileText,
  Loader2,
  Plus,
  Receipt,
  Search,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import api from "../api/client";

import {
  creerCotisation,
  modifierCotisation,
  ajouterPaiement,
  getCotisations,
} from "../api/cotisations";

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
  { value: "espèce", label: "Espèces" },
  { value: "wave", label: "Wave" },
  { value: "orange_money", label: "Orange Money" },
  { value: "virement", label: "Virement" },
  { value: "chèque", label: "Chèque" },
  { value: "autre", label: "Autre" },
];

const STATUTS = [
  { value: "tous", label: "Tous" },
  { value: "payee", label: "Payées" },
  { value: "partielle", label: "Partielles" },
  { value: "impayee", label: "Impayées" },
];

const normaliserNombre = (value) => {
  const nombre = Number(value);
  return Number.isFinite(nombre) ? nombre : 0;
};

const formatMontant = (value) =>
  new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(normaliserNombre(value));

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getMoisActuel = () => {
  return MOIS[new Date().getMonth()];
};

const getAnneeActuelle = () => {
  return new Date().getFullYear();
};

const normaliserTexte = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const getNomMembre = (membre) => {
  if (!membre) return "Membre inconnu";

  const nom = membre.nom ?? "";
  const prenom = membre.prenom ?? "";

  const complet = `${prenom} ${nom}`.trim();

  return complet || membre.nom_complet || membre.telephone || `Membre #${membre.id}`;
};

const getMembreIdDepuisUtilisateur = (utilisateur) => {
  return (
    utilisateur?.membre_id ??
    utilisateur?.membre?.id ??
    utilisateur?.membreId ??
    null
  );
};

const getMembreDepuisCotisation = (cotisation) => {
  if (cotisation?.membre) return cotisation.membre;

  return {
    id: cotisation?.membre_id,
    nom: cotisation?.membre_nom ?? "",
    prenom: cotisation?.membre_prenom ?? "",
    telephone: cotisation?.membre_telephone ?? "",
    montant_cotisation:
      cotisation?.montant_cotisation ??
      cotisation?.membre?.montant_cotisation ??
      0,
  };
};

const calculerStatut = (montant, montantPaye) => {
  const fixe = normaliserNombre(montant);
  const paye = normaliserNombre(montantPaye);

  if (paye <= 0) return "impayee";
  if (paye >= fixe && fixe > 0) return "payee";
  return "partielle";
};

const statutLabel = (statut) => {
  switch (statut) {
    case "payee":
      return "Payée";
    case "partielle":
      return "Partielle";
    case "impayee":
      return "Impayée";
    default:
      return "—";
  }
};

const getStatutClasses = (statut) => {
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

const extraireListe = (data, cle = null) => {
  if (Array.isArray(data)) return data;

  if (cle && Array.isArray(data?.[cle])) {
    return data[cle];
  }

  if (Array.isArray(data?.cotisations)) {
    return data.cotisations;
  }

  if (Array.isArray(data?.membres)) {
    return data.membres;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
};

const construireCleMois = (mois, annee) =>
  `${normaliserTexte(mois)}-${Number(annee)}`;

export default function Cotisations() {
  const { utilisateur, aPermission } = useAuth();

  /*
   * RÈGLE D'ACCÈS :
   *
   * COTISATION_CREER = accès aux cotisations du Dahira.
   *
   * MEMBRE_CONSULTER n'est volontairement PAS utilisé ici.
   */
  const peutConsulterDahira = aPermission("COTISATION_CREER");

  const peutCreerCotisation =
    aPermission("COTISATION_CREER") ||
    aPermission("COTISATION_ENREGISTRER");

  const peutModifierCotisation = aPermission("COTISATION_MODIFIER");

  const peutConsulterPaiements = aPermission("PAIEMENT_CONSULTER");

  const peutCreerPaiement =
    aPermission("PAIEMENT_CREER") ||
    aPermission("PAIEMENT_ENREGISTRER");

  const [cotisations, setCotisations] = useState([]);
  const [membresActifs, setMembresActifs] = useState([]);

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [recherche, setRecherche] = useState("");
  const [moisSelectionne, setMoisSelectionne] = useState("");
  const [anneeSelectionnee, setAnneeSelectionnee] = useState("");
  const [statutSelectionne, setStatutSelectionne] = useState("tous");

  const [modalCotisation, setModalCotisation] = useState(false);
  const [modalPaiement, setModalPaiement] = useState(false);
  const [modalPaiements, setModalPaiements] = useState(false);

  const [cotisationSelectionnee, setCotisationSelectionnee] =
    useState(null);

  const [chargementAction, setChargementAction] = useState(false);
  const [messageAction, setMessageAction] = useState("");
  const [erreurAction, setErreurAction] = useState("");

  const [formCotisation, setFormCotisation] = useState({
    id: null,
    membre_id: "",
    montant: "",
    mois_concerne: getMoisActuel(),
    annee: getAnneeActuelle(),
    date_cotisation: "",
  });

  const [formPaiement, setFormPaiement] = useState({
    montant: "",
    mode_paiement: "espèce",
    date_paiement: "",
    reference: "",
  });

  /*
   * Chargement des données.
   *
   * IMPORTANT :
   * On ne fait JAMAIS getMembres().
   *
   * Pour les cotisations du Dahira, on utilise :
   * GET /cotisations/membres-actifs
   *
   * Cette route doit être protégée par COTISATION_CREER.
   */
  const chargerDonnees = async () => {
    setChargement(true);
    setErreur("");

    try {
      const demandes = [getCotisations()];

      if (peutConsulterDahira) {
        demandes.push(api.get("/cotisations/membres-actifs"));
      }

      const resultats = await Promise.all(demandes);

      const cotisationsData = resultats[0]?.data ?? resultats[0];

      const listeCotisations = extraireListe(
        cotisationsData,
        "cotisations"
      );

      setCotisations(
        Array.isArray(listeCotisations) ? listeCotisations : []
      );

      if (peutConsulterDahira) {
        const membresData = resultats[1]?.data ?? resultats[1];

        const listeMembres = extraireListe(membresData, "membres");

        setMembresActifs(
          Array.isArray(listeMembres) ? listeMembres : []
        );
      } else {
        setMembresActifs([]);
      }
    } catch (error) {
      console.error("ERREUR CHARGEMENT COTISATIONS :", error);

      const status = error?.response?.status;

      if (status === 403) {
        setErreur(
          "Vous n'avez pas les permissions nécessaires pour consulter ces données."
        );
      } else {
        setErreur(
          error?.response?.data?.detail ||
            "Impossible de charger les cotisations."
        );
      }
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, [peutConsulterDahira]);

  /*
   * Les mois disponibles sont UNIQUEMENT ceux pour lesquels
   * au moins une cotisation a réellement été enregistrée.
   */
  const moisDisponibles = useMemo(() => {
    const map = new Map();

    cotisations.forEach((cotisation) => {
      const mois = cotisation?.mois_concerne;
      const annee = Number(cotisation?.annee);

      if (!mois || !Number.isFinite(annee)) return;

      const cle = construireCleMois(mois, annee);

      if (!map.has(cle)) {
        map.set(cle, {
          mois,
          annee,
          cle,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.annee !== b.annee) {
        return b.annee - a.annee;
      }

      return (
        MOIS.indexOf(b.mois) -
        MOIS.indexOf(a.mois)
      );
    });
  }, [cotisations]);

  /*
   * Sélection automatique :
   * 1. mois actuel s'il existe ;
   * 2. sinon dernier mois réellement enregistré.
   */
  useEffect(() => {
    if (!peutConsulterDahira) return;
    if (!moisDisponibles.length) return;

    const moisActuel = getMoisActuel();
    const anneeActuelle = getAnneeActuelle();

    const moisActuelExiste = moisDisponibles.some(
      (item) =>
        normaliserTexte(item.mois) ===
          normaliserTexte(moisActuel) &&
        Number(item.annee) === anneeActuelle
    );

    if (moisActuelExiste) {
      setMoisSelectionne(moisActuel);
      setAnneeSelectionnee(anneeActuelle);
      return;
    }

    setMoisSelectionne(moisDisponibles[0].mois);
    setAnneeSelectionnee(moisDisponibles[0].annee);
  }, [moisDisponibles, peutConsulterDahira]);

  /*
   * Membre connecté.
   *
   * On essaie d'abord de le retrouver dans la liste des membres
   * spécifique aux cotisations.
   *
   * Cela ne nécessite PAS MEMBRE_CONSULTER.
   */
  const membreConnecte = useMemo(() => {
    const membreId = getMembreIdDepuisUtilisateur(utilisateur);

    if (membreId !== null && membreId !== undefined) {
      const membre = membresActifs.find(
        (item) => Number(item.id) === Number(membreId)
      );

      if (membre) return membre;
    }

    if (utilisateur?.membre) {
      return utilisateur.membre;
    }

    return {
      id: membreId,
      nom:
        utilisateur?.nom ??
        utilisateur?.membre_nom ??
        "",
      prenom:
        utilisateur?.prenom ??
        utilisateur?.membre_prenom ??
        "",
      telephone:
        utilisateur?.telephone ??
        "",
      montant_cotisation:
        utilisateur?.membre?.montant_cotisation ??
        utilisateur?.montant_cotisation ??
        0,
    };
  }, [utilisateur, membresActifs]);

  /*
   * Cotisations du membre connecté.
   */
  const mesCotisations = useMemo(() => {
    const membreId = getMembreIdDepuisUtilisateur(utilisateur);

    if (membreId === null || membreId === undefined) {
      return [];
    }

    return cotisations
      .filter(
        (cotisation) =>
          Number(cotisation?.membre_id) === Number(membreId)
      )
      .sort((a, b) => {
        const anneeA = Number(a?.annee) || 0;
        const anneeB = Number(b?.annee) || 0;

        if (anneeA !== anneeB) {
          return anneeB - anneeA;
        }

        return (
          MOIS.indexOf(b?.mois_concerne) -
          MOIS.indexOf(a?.mois_concerne)
        );
      });
  }, [cotisations, utilisateur]);

  /*
   * Situation complète du mois sélectionné.
   *
   * IMPORTANT :
   * Pour "Impayées", on construit une ligne même lorsqu'aucune
   * cotisation n'existe encore pour le membre.
   */
  const situationMensuelle = useMemo(() => {
    if (!peutConsulterDahira) return [];

    if (!moisSelectionne || !anneeSelectionnee) return [];

    const membres = Array.isArray(membresActifs)
      ? membresActifs.filter((membre) => membre?.actif !== false)
      : [];

    const cotisationsDuMois = cotisations.filter(
      (cotisation) =>
        normaliserTexte(cotisation?.mois_concerne) ===
          normaliserTexte(moisSelectionne) &&
        Number(cotisation?.annee) ===
          Number(anneeSelectionnee)
    );

    return membres.map((membre) => {
      const cotisationsMembre = cotisationsDuMois.filter(
        (cotisation) =>
          Number(cotisation?.membre_id) ===
          Number(membre?.id)
      );

      /*
       * Une seule cotisation mensuelle est normalement attendue.
       * Si plusieurs existent, on prend la première et on cumule
       * quand même les paiements.
       */
      const cotisation =
        cotisationsMembre.length > 0
          ? cotisationsMembre[0]
          : null;

      const montantFixe = cotisation
        ? normaliserNombre(cotisation.montant)
        : normaliserNombre(membre.montant_cotisation);

      const montantPaye = cotisation
        ? normaliserNombre(cotisation.montant_cotise)
        : 0;

      const montantDu = Math.max(
        montantFixe - montantPaye,
        0
      );

      const statut = calculerStatut(
        montantFixe,
        montantPaye
      );

      return {
        id:
          cotisation?.id ??
          `missing-${membre.id}-${anneeSelectionnee}-${moisSelectionne}`,

        membre_id: membre.id,

        membre,

        cotisation,

        existe: Boolean(cotisation),

        montant: montantFixe,

        montant_cotise: montantPaye,

        montant_du: montantDu,

        statut,
      };
    });
  }, [
    peutConsulterDahira,
    membresActifs,
    cotisations,
    moisSelectionne,
    anneeSelectionnee,
  ]);

  /*
   * Lignes réellement enregistrées.
   *
   * "Tous" ne doit PAS afficher les lignes synthétiques
   * des membres sans cotisation.
   */
  const lignesToutes = useMemo(() => {
    return situationMensuelle.filter(
      (ligne) => ligne.existe
    );
  }, [situationMensuelle]);

  const lignesFiltrees = useMemo(() => {
    let lignes =
      statutSelectionne === "tous"
        ? lignesToutes
        : situationMensuelle;

    const rechercheNormalisee =
      normaliserTexte(recherche);

    if (rechercheNormalisee) {
      lignes = lignes.filter((ligne) => {
        const nom = normaliserTexte(
          getNomMembre(ligne.membre)
        );

        const telephone = normaliserTexte(
          ligne.membre?.telephone
        );

        return (
          nom.includes(rechercheNormalisee) ||
          telephone.includes(rechercheNormalisee)
        );
      });
    }

    if (statutSelectionne !== "tous") {
      lignes = lignes.filter(
        (ligne) =>
          ligne.statut === statutSelectionne
      );
    }

    return lignes;
  }, [
    situationMensuelle,
    lignesToutes,
    recherche,
    statutSelectionne,
  ]);

  /*
   * Statistiques mensuelles.
   */
  const statistiques = useMemo(() => {
    if (!peutConsulterDahira) {
      return {
        estimation: 0,
        totalPaye: 0,
        reste: 0,
        payees: 0,
        partielles: 0,
        impayees: 0,
      };
    }

    const estimation = situationMensuelle.reduce(
      (total, ligne) =>
        total + normaliserNombre(ligne.montant),
      0
    );

    const totalPaye = situationMensuelle.reduce(
      (total, ligne) =>
        total +
        normaliserNombre(ligne.montant_cotise),
      0
    );

    return {
      estimation,
      totalPaye,
      reste: Math.max(estimation - totalPaye, 0),

      payees: situationMensuelle.filter(
        (ligne) => ligne.statut === "payee"
      ).length,

      partielles: situationMensuelle.filter(
        (ligne) => ligne.statut === "partielle"
      ).length,

      impayees: situationMensuelle.filter(
        (ligne) => ligne.statut === "impayee"
      ).length,
    };
  }, [situationMensuelle, peutConsulterDahira]);

  /*
   * Statistiques personnelles.
   */
  const statistiquesPersonnelles = useMemo(() => {
    const totalDu = mesCotisations.reduce(
      (total, cotisation) =>
        total + normaliserNombre(cotisation.montant),
      0
    );

    const totalPaye = mesCotisations.reduce(
      (total, cotisation) =>
        total +
        normaliserNombre(cotisation.montant_cotise),
      0
    );

    return {
      totalDu,
      totalPaye,
      reste: Math.max(totalDu - totalPaye, 0),
    };
  }, [mesCotisations]);

  const ouvrirNouvelleCotisation = () => {
    setErreurAction("");
    setMessageAction("");

    const premierMembre =
      peutConsulterDahira && membresActifs.length
        ? membresActifs[0]
        : membreConnecte;

    setFormCotisation({
      id: null,
      membre_id: premierMembre?.id ?? "",
      montant:
        premierMembre?.montant_cotisation ??
        "",
      mois_concerne:
        moisSelectionne ||
        getMoisActuel(),
      annee:
        anneeSelectionnee ||
        getAnneeActuelle(),
      date_cotisation: "",
    });

    setCotisationSelectionnee(null);
    setModalCotisation(true);
  };

  const ouvrirModificationCotisation = (
    ligne
  ) => {
    if (!ligne?.cotisation) return;

    const cotisation = ligne.cotisation;

    setErreurAction("");
    setMessageAction("");

    setFormCotisation({
      id: cotisation.id,
      membre_id: cotisation.membre_id ?? "",
      montant: cotisation.montant ?? "",
      mois_concerne:
        cotisation.mois_concerne ??
        getMoisActuel(),
      annee:
        cotisation.annee ??
        getAnneeActuelle(),
      date_cotisation:
        cotisation.date_cotisation
          ? String(cotisation.date_cotisation).slice(
              0,
              10
            )
          : "",
    });

    setCotisationSelectionnee(cotisation);
    setModalCotisation(true);
  };

  const ouvrirPaiement = (ligne) => {
    if (!ligne?.cotisation) return;

    setCotisationSelectionnee(
      ligne.cotisation
    );

    setFormPaiement({
      montant:
        ligne.montant_du > 0
          ? ligne.montant_du
          : "",
      mode_paiement: "espèce",
      date_paiement: "",
      reference: "",
    });

    setErreurAction("");
    setMessageAction("");

    setModalPaiement(true);
  };

  const ouvrirHistoriquePaiements = (
    cotisation
  ) => {
    setCotisationSelectionnee(cotisation);
    setModalPaiements(true);
  };

  const fermerModals = () => {
    if (chargementAction) return;

    setModalCotisation(false);
    setModalPaiement(false);
    setModalPaiements(false);
    setCotisationSelectionnee(null);
    setErreurAction("");
    setMessageAction("");
  };

  const handleMembreChange = (event) => {
    const membreId = event.target.value;

    const membre = membresActifs.find(
      (item) =>
        Number(item.id) ===
        Number(membreId)
    );

    setFormCotisation((ancien) => ({
      ...ancien,
      membre_id: membreId,
      montant:
        membre?.montant_cotisation ??
        ancien.montant,
    }));
  };

  const enregistrerCotisation = async (
    event
  ) => {
    event.preventDefault();

    setErreurAction("");
    setMessageAction("");

    if (!formCotisation.membre_id) {
      setErreurAction(
        "Veuillez sélectionner un membre."
      );
      return;
    }

    if (
      !formCotisation.montant ||
      Number(formCotisation.montant) <= 0
    ) {
      setErreurAction(
        "Le montant de la cotisation doit être supérieur à 0."
      );
      return;
    }

    setChargementAction(true);

    try {
      if (formCotisation.id) {
        await modifierCotisation(
          formCotisation.id,
          {
            membre_id:
              formCotisation.membre_id,
            montant:
              formCotisation.montant,
            mois_concerne:
              formCotisation.mois_concerne,
            annee:
              formCotisation.annee,
            date_cotisation:
              formCotisation.date_cotisation ||
              null,
          }
        );

        setMessageAction(
          "Cotisation modifiée avec succès."
        );
      } else {
        await creerCotisation({
          membre_id:
            formCotisation.membre_id,
          montant:
            formCotisation.montant,
          mois_concerne:
            formCotisation.mois_concerne,
          annee:
            formCotisation.annee,
          date_cotisation:
            formCotisation.date_cotisation ||
            null,
        });

        setMessageAction(
          "Cotisation enregistrée avec succès."
        );
      }

      await chargerDonnees();

      setTimeout(() => {
        setModalCotisation(false);
        setCotisationSelectionnee(null);
        setMessageAction("");
      }, 700);
    } catch (error) {
      console.error(
        "ERREUR ENREGISTREMENT COTISATION :",
        error
      );

      setErreurAction(
        error?.response?.data?.detail ||
          "Impossible d'enregistrer la cotisation."
      );
    } finally {
      setChargementAction(false);
    }
  };

  const enregistrerPaiement = async (
    event
  ) => {
    event.preventDefault();

    setErreurAction("");
    setMessageAction("");

    if (!cotisationSelectionnee?.id) {
      setErreurAction(
        "Cotisation introuvable."
      );
      return;
    }

    const montant = Number(
      formPaiement.montant
    );

    if (!Number.isFinite(montant) || montant <= 0) {
      setErreurAction(
        "Le montant du paiement doit être supérieur à 0."
      );
      return;
    }

    setChargementAction(true);

    try {
      await ajouterPaiement(
        cotisationSelectionnee.id,
        {
          montant,
          mode_paiement:
            formPaiement.mode_paiement,
          date_paiement:
            formPaiement.date_paiement ||
            null,
          reference:
            formPaiement.reference ||
            null,
        }
      );

      setMessageAction(
        "Paiement enregistré avec succès."
      );

      await chargerDonnees();

      setTimeout(() => {
        setModalPaiement(false);
        setCotisationSelectionnee(null);
        setMessageAction("");
      }, 700);
    } catch (error) {
      console.error(
        "ERREUR ENREGISTREMENT PAIEMENT :",
        error
      );

      setErreurAction(
        error?.response?.data?.detail ||
          "Impossible d'enregistrer le paiement."
      );
    } finally {
      setChargementAction(false);
    }
  };

  const getPaiements = (cotisation) => {
    if (!cotisation) return [];

    if (Array.isArray(cotisation.paiements)) {
      return cotisation.paiements;
    }

    return [];
  };

  if (chargement) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-slate-600" />
          <span className="text-sm font-medium text-slate-600">
            Chargement des cotisations...
          </span>
        </div>
      </div>
    );
  }

  if (erreur) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div>
              <h2 className="font-semibold text-red-800">
                Impossible de charger les cotisations
              </h2>

              <p className="mt-1 text-sm text-red-700">
                {erreur}
              </p>

              <button
                type="button"
                onClick={chargerDonnees}
                className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* =========================================================
          EN-TÊTE
      ========================================================= */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <Receipt className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Cotisations
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Suivi des cotisations et des paiements.
              </p>
            </div>
          </div>
        </div>

        {peutCreerCotisation && (
          <button
            type="button"
            onClick={ouvrirNouvelleCotisation}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Enregistrer une cotisation
          </button>
        )}
      </div>

      {/* =========================================================
          MA COTISATION
      ========================================================= */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-slate-700" />

          <h2 className="text-lg font-bold text-slate-900">
            Ma cotisation
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Total dû
              </span>

              <CircleDollarSign className="h-5 w-5 text-slate-400" />
            </div>

            <p className="mt-3 text-2xl font-bold text-slate-900">
              {formatMontant(
                statistiquesPersonnelles.totalDu
              )}{" "}
              FCFA
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-emerald-700">
                Total payé
              </span>

              <Check className="h-5 w-5 text-emerald-600" />
            </div>

            <p className="mt-3 text-2xl font-bold text-emerald-800">
              {formatMontant(
                statistiquesPersonnelles.totalPaye
              )}{" "}
              FCFA
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-amber-700">
                Reste
              </span>

              <ArrowDownCircle className="h-5 w-5 text-amber-600" />
            </div>

            <p className="mt-3 text-2xl font-bold text-amber-800">
              {formatMontant(
                statistiquesPersonnelles.reste
              )}{" "}
              FCFA
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {mesCotisations.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <FileText className="h-10 w-10 text-slate-300" />

              <h3 className="mt-4 font-semibold text-slate-800">
                Aucune cotisation enregistrée
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                Vous n'avez pas encore de cotisation enregistrée.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-slate-600">
                      Période
                    </th>

                    <th className="px-5 py-3 font-semibold text-slate-600">
                      Cotisation
                    </th>

                    <th className="px-5 py-3 font-semibold text-slate-600">
                      Payé
                    </th>

                    <th className="px-5 py-3 font-semibold text-slate-600">
                      Reste
                    </th>

                    <th className="px-5 py-3 font-semibold text-slate-600">
                      Statut
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {mesCotisations.map((cotisation) => (
                    <tr
                      key={cotisation.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">
                          {cotisation.mois_concerne}{" "}
                          {cotisation.annee}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {formatDate(
                            cotisation.date_cotisation
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-900">
                        {formatMontant(
                          cotisation.montant
                        )}{" "}
                        FCFA
                      </td>

                      <td className="px-5 py-4 font-medium text-emerald-700">
                        {formatMontant(
                          cotisation.montant_cotise
                        )}{" "}
                        FCFA
                      </td>

                      <td className="px-5 py-4 font-medium text-amber-700">
                        {formatMontant(
                          cotisation.montant_du
                        )}{" "}
                        FCFA
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatutClasses(
                            cotisation.statut
                          )}`}
                        >
                          {statutLabel(
                            cotisation.statut
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================
          COTISATIONS DU DAHIRA
          UNIQUEMENT COTISATION_CREER
      ========================================================= */}
      {peutConsulterDahira && (
        <section className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-700" />

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Cotisations du Dahira
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  Situation des cotisations des membres actifs.
                </p>
              </div>
            </div>
          </div>

          {/* =====================================================
              STATISTIQUES
          ===================================================== */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Estimation mensuelle
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {formatMontant(
                      statistiques.estimation
                    )}{" "}
                    FCFA
                  </p>
                </div>

                <div className="rounded-xl bg-slate-100 p-3">
                  <Wallet className="h-5 w-5 text-slate-600" />
                </div>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Total attendu auprès des membres actifs
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-700">
                    Total encaissé
                  </p>

                  <p className="mt-2 text-2xl font-bold text-emerald-800">
                    {formatMontant(
                      statistiques.totalPaye
                    )}{" "}
                    FCFA
                  </p>
                </div>

                <div className="rounded-xl bg-white/70 p-3">
                  <Check className="h-5 w-5 text-emerald-600" />
                </div>
              </div>

              <p className="mt-2 text-xs text-emerald-700">
                Paiements réellement enregistrés
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-700">
                    Reste à encaisser
                  </p>

                  <p className="mt-2 text-2xl font-bold text-amber-800">
                    {formatMontant(
                      statistiques.reste
                    )}{" "}
                    FCFA
                  </p>
                </div>

                <div className="rounded-xl bg-white/70 p-3">
                  <ArrowDownCircle className="h-5 w-5 text-amber-600" />
                </div>
              </div>

              <p className="mt-2 text-xs text-amber-700">
                Estimation moins paiements encaissés
              </p>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700">
                    Impayées
                  </p>

                  <p className="mt-2 text-2xl font-bold text-red-800">
                    {statistiques.impayees}
                  </p>
                </div>

                <div className="rounded-xl bg-white/70 p-3">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>

              <p className="mt-2 text-xs text-red-700">
                Membres sans paiement complet
              </p>
            </div>
          </div>

          {/* =====================================================
              FILTRES
          ===================================================== */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_130px_170px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={recherche}
                  onChange={(event) =>
                    setRecherche(event.target.value)
                  }
                  placeholder="Rechercher un membre..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <select
                  value={moisSelectionne}
                  onChange={(event) =>
                    setMoisSelectionne(
                      event.target.value
                    )
                  }
                  className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  <option value="">
                    Mois
                  </option>

                  {moisDisponibles.map((item) => (
                    <option
                      key={item.cle}
                      value={item.mois}
                    >
                      {item.mois} {item.annee}
                    </option>
                  ))}
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>

              <select
                value={anneeSelectionnee}
                onChange={(event) =>
                  setAnneeSelectionnee(
                    event.target.value
                      ? Number(event.target.value)
                      : ""
                  )
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              >
                <option value="">
                  Année
                </option>

                {[
                  ...new Set(
                    moisDisponibles.map(
                      (item) => item.annee
                    )
                  ),
                ].map((annee) => (
                  <option
                    key={annee}
                    value={annee}
                  >
                    {annee}
                  </option>
                ))}
              </select>

              <select
                value={statutSelectionne}
                onChange={(event) =>
                  setStatutSelectionne(
                    event.target.value
                  )
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              >
                {STATUTS.map((statut) => (
                  <option
                    key={statut.value}
                    value={statut.value}
                  >
                    {statut.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {STATUTS.map((statut) => (
                <button
                  key={statut.value}
                  type="button"
                  onClick={() =>
                    setStatutSelectionne(
                      statut.value
                    )
                  }
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    statutSelectionne ===
                    statut.value
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {statut.label}
                </button>
              ))}
            </div>
          </div>

          {/* =====================================================
              TABLEAU
          ===================================================== */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">
                  {moisSelectionne
                    ? `${moisSelectionne} ${anneeSelectionnee}`
                    : "Situation mensuelle"}
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  {lignesFiltrees.length} membre
                  {lignesFiltrees.length > 1
                    ? "s"
                    : ""}
                </p>
              </div>

              <div className="text-xs text-slate-500">
                {statutSelectionne ===
                "tous"
                  ? "Cotisations enregistrées uniquement"
                  : "Situation calculée pour tous les membres actifs"}
              </div>
            </div>

            {lignesFiltrees.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                <FileText className="h-10 w-10 text-slate-300" />

                <h3 className="mt-4 font-semibold text-slate-800">
                  Aucune donnée
                </h3>

                <p className="mt-1 max-w-md text-sm text-slate-500">
                  Aucune cotisation ne correspond aux filtres sélectionnés.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[950px] w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 font-semibold text-slate-600">
                        Membre
                      </th>

                      <th className="px-5 py-3 font-semibold text-slate-600">
                        Cotisation
                      </th>

                      <th className="px-5 py-3 font-semibold text-slate-600">
                        Payé
                      </th>

                      <th className="px-5 py-3 font-semibold text-slate-600">
                        Reste
                      </th>

                      <th className="px-5 py-3 font-semibold text-slate-600">
                        Statut
                      </th>

                      <th className="px-5 py-3 text-right font-semibold text-slate-600">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {lignesFiltrees.map((ligne) => {
                      const cotisation =
                        ligne.cotisation;

                      return (
                        <tr
                          key={ligne.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                                <User className="h-4 w-4" />
                              </div>

                              <div>
                                <div className="font-semibold text-slate-900">
                                  {getNomMembre(
                                    ligne.membre
                                  )}
                                </div>

                                {ligne.membre
                                  ?.telephone && (
                                  <div className="mt-0.5 text-xs text-slate-500">
                                    {
                                      ligne.membre
                                        .telephone
                                    }
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-900">
                              {formatMontant(
                                ligne.montant
                              )}{" "}
                              FCFA
                            </div>

                            {!ligne.existe && (
                              <div className="mt-1 text-xs text-slate-400">
                                Cotisation non enregistrée
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span className="font-semibold text-emerald-700">
                              {formatMontant(
                                ligne.montant_cotise
                              )}{" "}
                              FCFA
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`font-semibold ${
                                ligne.montant_du >
                                0
                                  ? "text-amber-700"
                                  : "text-emerald-700"
                              }`}
                            >
                              {formatMontant(
                                ligne.montant_du
                              )}{" "}
                              FCFA
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatutClasses(
                                ligne.statut
                              )}`}
                            >
                              {statutLabel(
                                ligne.statut
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              {ligne.existe &&
                                peutConsulterPaiements && (
                                  <button
                                    type="button"
                                    title="Voir les paiements"
                                    onClick={() =>
                                      ouvrirHistoriquePaiements(
                                        cotisation
                                      )
                                    }
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                )}

                              {ligne.existe &&
                                peutModifierCotisation && (
                                  <button
                                    type="button"
                                    title="Modifier"
                                    onClick={() =>
                                      ouvrirModificationCotisation(
                                        ligne
                                      )
                                    }
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                )}

                              {ligne.existe &&
                                peutCreerPaiement &&
                                ligne.montant_du >
                                  0 && (
                                  <button
                                    type="button"
                                    title="Enregistrer un paiement"
                                    onClick={() =>
                                      ouvrirPaiement(
                                        ligne
                                      )
                                    }
                                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-800"
                                  >
                                    <CreditCard className="h-4 w-4" />
                                    Payer
                                  </button>
                                )}

                              {!ligne.existe &&
                                peutCreerCotisation && (
                                  <button
                                    type="button"
                                    title="Enregistrer la cotisation"
                                    onClick={() => {
                                      setFormCotisation({
                                        id: null,
                                        membre_id:
                                          ligne.membre_id,
                                        montant:
                                          ligne.montant ||
                                          ligne.membre
                                            ?.montant_cotisation ||
                                          "",
                                        mois_concerne:
                                          moisSelectionne,
                                        annee:
                                          anneeSelectionnee,
                                        date_cotisation:
                                          "",
                                      });

                                      setCotisationSelectionnee(
                                        null
                                      );

                                      setErreurAction(
                                        ""
                                      );

                                      setMessageAction(
                                        ""
                                      );

                                      setModalCotisation(
                                        true
                                      );
                                    }}
                                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-800"
                                  >
                                    <Plus className="h-4 w-4" />
                                    Enregistrer
                                  </button>
                                )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* =========================================================
          MODAL COTISATION
      ========================================================= */}
      {modalCotisation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {formCotisation.id
                    ? "Modifier la cotisation"
                    : "Enregistrer une cotisation"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Le paiement sera enregistré séparément.
                </p>
              </div>

              <button
                type="button"
                onClick={fermerModals}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={enregistrerCotisation}
              className="space-y-5 p-5"
            >
              {erreurAction && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {erreurAction}
                </div>
              )}

              {messageAction && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  {messageAction}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Membre
                </label>

                {peutConsulterDahira ? (
                  <select
                    value={
                      formCotisation.membre_id
                    }
                    onChange={handleMembreChange}
                    disabled={Boolean(
                      formCotisation.id
                    )}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
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
                          {getNomMembre(membre)}
                        </option>
                      )
                    )}
                  </select>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">
                    {getNomMembre(
                      membreConnecte
                    )}
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Mois
                  </label>

                  <select
                    value={
                      formCotisation.mois_concerne
                    }
                    onChange={(event) =>
                      setFormCotisation(
                        (ancien) => ({
                          ...ancien,
                          mois_concerne:
                            event.target.value,
                        })
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
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
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Année
                  </label>

                  <input
                    type="number"
                    value={
                      formCotisation.annee
                    }
                    onChange={(event) =>
                      setFormCotisation(
                        (ancien) => ({
                          ...ancien,
                          annee:
                            Number(
                              event.target.value
                            ),
                        })
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Montant de la cotisation
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={
                      formCotisation.montant
                    }
                    onChange={(event) =>
                      setFormCotisation(
                        (ancien) => ({
                          ...ancien,
                          montant:
                            event.target.value,
                        })
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pr-16 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    FCFA
                  </span>
                </div>

                <p className="mt-1.5 text-xs text-slate-500">
                  Ce montant représente la cotisation due. Le paiement réel est enregistré séparément.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Date de cotisation
                </label>

                <input
                  type="date"
                  value={
                    formCotisation.date_cotisation
                  }
                  onChange={(event) =>
                    setFormCotisation(
                      (ancien) => ({
                        ...ancien,
                        date_cotisation:
                          event.target.value,
                      })
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={fermerModals}
                  disabled={chargementAction}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={chargementAction}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {chargementAction && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {formCotisation.id
                    ? "Modifier"
                    : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL PAIEMENT
      ========================================================= */}
      {modalPaiement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Enregistrer un paiement
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {cotisationSelectionnee?.mois_concerne}{" "}
                  {cotisationSelectionnee?.annee}
                </p>
              </div>

              <button
                type="button"
                onClick={fermerModals}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={enregistrerPaiement}
              className="space-y-5 p-5"
            >
              {erreurAction && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {erreurAction}
                </div>
              )}

              {messageAction && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  {messageAction}
                </div>
              )}

              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    Cotisation
                  </span>

                  <span className="font-semibold text-slate-900">
                    {formatMontant(
                      cotisationSelectionnee?.montant
                    )}{" "}
                    FCFA
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    Déjà payé
                  </span>

                  <span className="font-semibold text-emerald-700">
                    {formatMontant(
                      cotisationSelectionnee?.montant_cotise
                    )}{" "}
                    FCFA
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 text-sm">
                  <span className="font-semibold text-slate-700">
                    Reste
                  </span>

                  <span className="font-bold text-amber-700">
                    {formatMontant(
                      cotisationSelectionnee?.montant_du
                    )}{" "}
                    FCFA
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Montant payé
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={
                      formPaiement.montant
                    }
                    onChange={(event) =>
                      setFormPaiement(
                        (ancien) => ({
                          ...ancien,
                          montant:
                            event.target.value,
                        })
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pr-16 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
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
                    formPaiement.mode_paiement
                  }
                  onChange={(event) =>
                    setFormPaiement(
                      (ancien) => ({
                        ...ancien,
                        mode_paiement:
                          event.target.value,
                      })
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  {MODES_PAIEMENT.map(
                    (mode) => (
                      <option
                        key={mode.value}
                        value={mode.value}
                      >
                        {mode.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Date
                  </label>

                  <input
                    type="date"
                    value={
                      formPaiement.date_paiement
                    }
                    onChange={(event) =>
                      setFormPaiement(
                        (ancien) => ({
                          ...ancien,
                          date_paiement:
                            event.target.value,
                        })
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Référence
                  </label>

                  <input
                    type="text"
                    value={
                      formPaiement.reference
                    }
                    onChange={(event) =>
                      setFormPaiement(
                        (ancien) => ({
                          ...ancien,
                          reference:
                            event.target.value,
                        })
                      )
                    }
                    placeholder="Facultatif"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={fermerModals}
                  disabled={chargementAction}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={chargementAction}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {chargementAction && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  Enregistrer le paiement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL HISTORIQUE PAIEMENTS
      ========================================================= */}
      {modalPaiements && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Paiements
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {cotisationSelectionnee
                    ?.mois_concerne}{" "}
                  {cotisationSelectionnee?.annee}
                </p>
              </div>

              <button
                type="button"
                onClick={fermerModals}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              {getPaiements(
                cotisationSelectionnee
              ).length === 0 ? (
                <div className="py-10 text-center">
                  <CreditCard className="mx-auto h-10 w-10 text-slate-300" />

                  <p className="mt-3 font-semibold text-slate-700">
                    Aucun paiement enregistré
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-slate-600">
                            Date
                          </th>

                          <th className="px-4 py-3 font-semibold text-slate-600">
                            Montant
                          </th>

                          <th className="px-4 py-3 font-semibold text-slate-600">
                            Mode
                          </th>

                          <th className="px-4 py-3 font-semibold text-slate-600">
                            Référence
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {getPaiements(
                          cotisationSelectionnee
                        ).map(
                          (paiement) => (
                            <tr
                              key={
                                paiement.id
                              }
                            >
                              <td className="px-4 py-3 text-slate-700">
                                {formatDate(
                                  paiement.date_paiement
                                )}
                              </td>

                              <td className="px-4 py-3 font-semibold text-emerald-700">
                                {formatMontant(
                                  paiement.montant
                                )}{" "}
                                FCFA
                              </td>

                              <td className="px-4 py-3 capitalize text-slate-700">
                                {paiement.mode_paiement ||
                                  "—"}
                              </td>

                              <td className="px-4 py-3 text-slate-500">
                                {paiement.reference ||
                                  "—"}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={fermerModals}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
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