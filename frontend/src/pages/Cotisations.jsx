import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Edit3,
  Eye,
  Loader2,
  Plus,
  Search,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import {
  ajouterPaiement,
  creerCotisation,
  getCotisations,
  modifierCotisation,
  supprimerCotisation,
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
  "autre",
];


// ============================================================
// OUTILS
// ============================================================

function nombre(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatMontant(value) {
  return `${new Intl.NumberFormat("fr-FR").format(
    Math.round(nombre(value))
  )} FCFA`;
}

function formatDate(date) {
  if (!date) return "—";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return date;
  }

  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function obtenirMoisIndex(mois) {
  return MOIS.findIndex(
    (item) =>
      String(item).toLowerCase() ===
      String(mois || "").toLowerCase()
  );
}

function obtenirMontantPaye(cotisation) {
  if (
    Array.isArray(cotisation?.paiements)
  ) {
    return cotisation.paiements
      .filter((paiement) => paiement?.actif !== false)
      .reduce(
        (total, paiement) =>
          total + nombre(paiement?.montant),
        0
      );
  }

  return nombre(cotisation?.montant_cotise);
}

function obtenirMontantFixe(cotisation, membre) {
  if (cotisation) {
    return nombre(cotisation.montant);
  }

  return nombre(
    membre?.montant_cotisation
  );
}

function calculerStatut(montantFixe, montantPaye) {
  const fixe = nombre(montantFixe);
  const paye = nombre(montantPaye);

  if (paye <= 0) {
    return "Impayée";
  }

  if (paye >= fixe) {
    return "Payée";
  }

  return "Partielle";
}

function couleurStatut(statut) {
  switch (statut) {
    case "Payée":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "Partielle":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "Impayée":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

function initiales(membre) {
  const prenom =
    membre?.prenom?.trim()?.charAt(0) || "";

  const nom =
    membre?.nom?.trim()?.charAt(0) || "";

  return `${prenom}${nom}`.toUpperCase() || "?";
}

function nomComplet(membre) {
  if (!membre) return "Membre inconnu";

  return (
    `${membre.prenom || ""} ${membre.nom || ""}`
      .trim() || "Membre inconnu"
  );
}


// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function Cotisations() {
  const {
    utilisateur,
    aPermission,
  } = useAuth();

  // ==========================================================
  // PERMISSIONS
  // ==========================================================

  const peutConsulterDahira =
    aPermission("COTISATION_CONSULTER");

  const peutCreerCotisation =
    aPermission("COTISATION_CREER") ||
    aPermission("COTISATION_ENREGISTRER");

  const peutModifierCotisation =
    aPermission("COTISATION_MODIFIER");

  const peutConsulterPaiements =
    aPermission("PAIEMENT_CONSULTER");

  const peutCreerPaiement =
    aPermission("PAIEMENT_CREER") ||
    aPermission("PAIEMENT_ENREGISTRER");

  const peutModifierPaiement =
    aPermission("PAIEMENT_MODIFIER");

  // ==========================================================
  // ÉTATS
  // ==========================================================

  const [cotisations, setCotisations] = useState([]);
  const [membres, setMembres] = useState([]);

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [recherche, setRecherche] = useState("");
  const [moisSelectionne, setMoisSelectionne] = useState("");
  const [anneeSelectionnee, setAnneeSelectionnee] =
    useState(new Date().getFullYear());
  const [statutSelectionne, setStatutSelectionne] =
    useState("Tous");

  // ==========================================================
  // MODAL COTISATION
  // ==========================================================

  const [modalCotisation, setModalCotisation] =
    useState(false);

  const [cotisationSelectionnee, setCotisationSelectionnee] =
    useState(null);

  const [formCotisation, setFormCotisation] = useState({
    membre_id: "",
    montant: "",
    mois_concerne: "",
    annee: new Date().getFullYear(),
    date_cotisation: "",
  });

  // ==========================================================
  // MODAL PAIEMENT
  // ==========================================================

  const [modalPaiement, setModalPaiement] =
    useState(false);

  const [cotisationPaiement, setCotisationPaiement] =
    useState(null);

  const [formPaiement, setFormPaiement] = useState({
    montant: "",
    mode_paiement: "espèce",
    date_paiement: "",
    reference: "",
  });

  // ==========================================================
  // CONFIRMATION SUPPRESSION
  // ==========================================================

  const [modalSuppression, setModalSuppression] =
    useState(false);

  const [cotisationASupprimer, setCotisationASupprimer] =
    useState(null);

  // ==========================================================
  // SAUVEGARDE
  // ==========================================================

  const [enregistrement, setEnregistrement] =
    useState(false);

  // ==========================================================
  // CHARGEMENT
  // ==========================================================

  async function chargerDonnees() {
    try {
      setChargement(true);
      setErreur("");

      const requetes = [
        getCotisations(),
      ];

      if (peutConsulterDahira) {
        requetes.push(getMembres());
      }

      const resultats =
        await Promise.all(requetes);

      setCotisations(
        Array.isArray(resultats[0])
          ? resultats[0]
          : resultats[0]?.cotisations || []
      );

      if (peutConsulterDahira) {
        const donneesMembres =
          resultats[1];

        setMembres(
          Array.isArray(donneesMembres)
            ? donneesMembres
            : donneesMembres?.membres || []
        );
      } else {
        setMembres([]);
      }
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
  }

  useEffect(() => {
    chargerDonnees();
  }, [peutConsulterDahira]);

  // ==========================================================
  // MEMBRE CONNECTÉ
  // ==========================================================

  const membreConnecte = useMemo(() => {
    if (!utilisateur?.membre_id) {
      return null;
    }

    return (
      membres.find(
        (membre) =>
          Number(membre.id) ===
          Number(utilisateur.membre_id)
      ) || {
        id: utilisateur.membre_id,
        nom:
          utilisateur.nom ||
          "",
        prenom:
          utilisateur.prenom ||
          "",
        montant_cotisation:
          utilisateur.montant_cotisation ||
          0,
      }
    );
  }, [utilisateur, membres]);

  // ==========================================================
  // MES COTISATIONS
  // ==========================================================

  const mesCotisations = useMemo(() => {
    if (!utilisateur?.membre_id) {
      return [];
    }

    return cotisations
      .filter(
        (cotisation) =>
          Number(cotisation.membre_id) ===
          Number(utilisateur.membre_id)
      )
      .sort((a, b) => {
        const anneeA = nombre(a.annee);
        const anneeB = nombre(b.annee);

        if (anneeA !== anneeB) {
          return anneeB - anneeA;
        }

        return (
          obtenirMoisIndex(b.mois_concerne) -
          obtenirMoisIndex(a.mois_concerne)
        );
      });
  }, [cotisations, utilisateur]);

  // ==========================================================
  // MOIS RÉELLEMENT ENREGISTRÉS
  // ==========================================================

  const moisEnregistres = useMemo(() => {
    const groupes = new Map();

    cotisations.forEach((cotisation) => {
      if (cotisation?.actif === false) {
        return;
      }

      const mois =
        cotisation?.mois_concerne;

      const annee =
        nombre(cotisation?.annee);

      if (!mois || !annee) {
        return;
      }

      const cle = `${annee}-${mois}`;

      if (!groupes.has(cle)) {
        groupes.set(cle, {
          mois,
          annee,
          index: obtenirMoisIndex(mois),
        });
      }
    });

    return Array.from(groupes.values()).sort(
      (a, b) => {
        if (a.annee !== b.annee) {
          return b.annee - a.annee;
        }

        return b.index - a.index;
      }
    );
  }, [cotisations]);

  // ==========================================================
  // ANNÉES DISPONIBLES
  // ==========================================================

  const anneesDisponibles = useMemo(() => {
    const annees = new Set();

    moisEnregistres.forEach(
      ({ annee }) => annees.add(annee)
    );

    if (annees.size === 0) {
      annees.add(
        new Date().getFullYear()
      );
    }

    return Array.from(annees).sort(
      (a, b) => b - a
    );
  }, [moisEnregistres]);

  // ==========================================================
  // INITIALISATION DU MOIS
  // ==========================================================

  useEffect(() => {
    if (moisEnregistres.length === 0) {
      setMoisSelectionne("");
      return;
    }

    const moisActuel =
      MOIS[new Date().getMonth()];

    const anneeActuelle =
      new Date().getFullYear();

    const moisActuelExiste =
      moisEnregistres.some(
        (item) =>
          item.mois === moisActuel &&
          item.annee === anneeActuelle
      );

    if (
      moisActuelExiste &&
      anneeSelectionnee === anneeActuelle
    ) {
      setMoisSelectionne(moisActuel);
      return;
    }

    const premierMoisAnnee =
      moisEnregistres.find(
        (item) =>
          item.annee ===
          Number(anneeSelectionnee)
      );

    if (premierMoisAnnee) {
      setMoisSelectionne(
        premierMoisAnnee.mois
      );
      return;
    }

    setMoisSelectionne(
      moisEnregistres[0].mois
    );

    setAnneeSelectionnee(
      moisEnregistres[0].annee
    );
  }, [
    moisEnregistres,
    anneeSelectionnee,
  ]);

  // ==========================================================
  // MOIS DE L'ANNÉE SÉLECTIONNÉE
  // ==========================================================

  const moisDisponiblesAnnee = useMemo(() => {
    return moisEnregistres
      .filter(
        (item) =>
          item.annee ===
          Number(anneeSelectionnee)
      )
      .sort(
        (a, b) => a.index - b.index
      );
  }, [
    moisEnregistres,
    anneeSelectionnee,
  ]);

  // ==========================================================
  // COTISATIONS DU MOIS
  // ==========================================================

  const cotisationsDuMois = useMemo(() => {
    if (
      !moisSelectionne ||
      !anneeSelectionnee
    ) {
      return [];
    }

    return cotisations.filter(
      (cotisation) =>
        cotisation?.actif !== false &&
        cotisation?.mois_concerne ===
          moisSelectionne &&
        Number(cotisation?.annee) ===
          Number(anneeSelectionnee)
    );
  }, [
    cotisations,
    moisSelectionne,
    anneeSelectionnee,
  ]);

  // ==========================================================
  // SITUATION MENSUELLE
  //
  // IMPORTANT :
  // - Les lignes synthétiques des membres sans cotisation
  //   servent uniquement à la vue "Impayées".
  // - Elles ne doivent PAS apparaître dans "Tous".
  // ==========================================================

  const situationsMensuelles = useMemo(() => {
    if (!peutConsulterDahira) {
      return [];
    }

    const membresActifs = membres.filter(
      (membre) =>
        membre?.actif !== false
    );

    return membresActifs.map((membre) => {
      const cotisation =
        cotisationsDuMois.find(
          (item) =>
            Number(item.membre_id) ===
            Number(membre.id)
        );

      const montantFixe =
        obtenirMontantFixe(
          cotisation,
          membre
        );

      const montantPaye =
        obtenirMontantPaye(
          cotisation
        );

      const statut =
        calculerStatut(
          montantFixe,
          montantPaye
        );

      return {
        membre,
        cotisation: cotisation || null,
        montantFixe,
        montantPaye,
        montantRestant: Math.max(
          montantFixe - montantPaye,
          0
        ),
        statut,
        enregistre: Boolean(cotisation),
      };
    });
  }, [
    membres,
    cotisationsDuMois,
    peutConsulterDahira,
  ]);

  // ==========================================================
  // SITUATIONS FILTRÉES
  // ==========================================================

  const situationsFiltrees = useMemo(() => {
    let resultat = [
      ...situationsMensuelles,
    ];

    const rechercheNormalisee =
      recherche.trim().toLowerCase();

    if (rechercheNormalisee) {
      resultat = resultat.filter(
        (situation) => {
          const nom =
            nomComplet(
              situation.membre
            ).toLowerCase();

          const telephone =
            String(
              situation.membre?.telephone ||
                ""
            ).toLowerCase();

          return (
            nom.includes(
              rechercheNormalisee
            ) ||
            telephone.includes(
              rechercheNormalisee
            )
          );
        }
      );
    }

    // --------------------------------------------------------
    // TOUS = uniquement les cotisations réellement enregistrées
    // --------------------------------------------------------

    if (statutSelectionne === "Tous") {
      resultat = resultat.filter(
        (situation) =>
          situation.enregistre
      );
    }

    // --------------------------------------------------------
    // PAYÉES / PARTIELLES
    // --------------------------------------------------------

    else if (
      statutSelectionne === "Payée" ||
      statutSelectionne === "Partielle"
    ) {
      resultat = resultat.filter(
        (situation) =>
          situation.enregistre &&
          situation.statut ===
            statutSelectionne
      );
    }

    // --------------------------------------------------------
    // IMPAYÉES
    //
    // Ici les membres sans cotisation sont inclus.
    // --------------------------------------------------------

    else if (
      statutSelectionne === "Impayée"
    ) {
      resultat = resultat.filter(
        (situation) =>
          situation.statut ===
          "Impayée"
      );
    }

    return resultat;
  }, [
    situationsMensuelles,
    recherche,
    statutSelectionne,
  ]);

  // ==========================================================
  // RÉSUMÉ DU MOIS
  // ==========================================================

  const resume = useMemo(() => {
    const estimation =
      situationsMensuelles.reduce(
        (total, situation) =>
          total +
          nombre(
            situation.montantFixe
          ),
        0
      );

    const encaisse =
      situationsMensuelles.reduce(
        (total, situation) =>
          total +
          nombre(
            situation.montantPaye
          ),
        0
      );

    const reste = Math.max(
      estimation - encaisse,
      0
    );

    const payees =
      situationsMensuelles.filter(
        (situation) =>
          situation.statut ===
          "Payée"
      ).length;

    const partielles =
      situationsMensuelles.filter(
        (situation) =>
          situation.statut ===
          "Partielle"
      ).length;

    const impayees =
      situationsMensuelles.filter(
        (situation) =>
          situation.statut ===
          "Impayée"
      ).length;

    return {
      estimation,
      encaisse,
      reste,
      payees,
      partielles,
      impayees,
    };
  }, [situationsMensuelles]);

  // ==========================================================
  // MODAL : NOUVELLE COTISATION
  // ==========================================================

  function ouvrirNouvelleCotisation(
    membre = null
  ) {
    if (!peutCreerCotisation) {
      return;
    }

    const membreParDefaut =
      membre || membreConnecte;

    setCotisationSelectionnee(null);

    setFormCotisation({
      membre_id:
        membreParDefaut?.id
          ? String(membreParDefaut.id)
          : "",
      montant:
        membreParDefaut?.montant_cotisation
          ? String(
              membreParDefaut.montant_cotisation
            )
          : "",
      mois_concerne:
        moisSelectionne ||
        MOIS[new Date().getMonth()],
      annee:
        Number(anneeSelectionnee) ||
        new Date().getFullYear(),
      date_cotisation:
        new Date()
          .toISOString()
          .slice(0, 10),
    });

    setModalCotisation(true);
  }

  // ==========================================================
  // MODAL : MODIFIER COTISATION
  // ==========================================================

  function ouvrirModificationCotisation(
    cotisation
  ) {
    if (!peutModifierCotisation) {
      return;
    }

    setCotisationSelectionnee(
      cotisation
    );

    setFormCotisation({
      membre_id:
        String(
          cotisation.membre_id || ""
        ),
      montant:
        String(
          cotisation.montant || ""
        ),
      mois_concerne:
        cotisation.mois_concerne ||
        "",
      annee:
        Number(cotisation.annee) ||
        new Date().getFullYear(),
      date_cotisation:
        cotisation.date_cotisation
          ? String(
              cotisation.date_cotisation
            ).slice(0, 10)
          : "",
    });

    setModalCotisation(true);
  }

  // ==========================================================
  // SAUVEGARDER COTISATION
  // ==========================================================

  async function sauvegarderCotisation(
    event
  ) {
    event.preventDefault();

    if (
      cotisationSelectionnee &&
      !peutModifierCotisation
    ) {
      return;
    }

    if (
      !cotisationSelectionnee &&
      !peutCreerCotisation
    ) {
      return;
    }

    try {
      setEnregistrement(true);
      setErreur("");

      const donnees = {
        membre_id:
          Number(
            formCotisation.membre_id
          ),
        montant:
          Number(
            formCotisation.montant
          ),
        mois_concerne:
          formCotisation.mois_concerne,
        annee:
          Number(
            formCotisation.annee
          ),
        date_cotisation:
          formCotisation.date_cotisation ||
          null,
      };

      if (cotisationSelectionnee) {
        await modifierCotisation(
          cotisationSelectionnee.id,
          donnees
        );
      } else {
        await creerCotisation(
          donnees
        );
      }

      setModalCotisation(false);
      setCotisationSelectionnee(null);

      await chargerDonnees();
    } catch (error) {
      console.error(
        "ERREUR ENREGISTREMENT COTISATION :",
        error
      );

      setErreur(
        error?.response?.data?.detail ||
          "Impossible d'enregistrer la cotisation."
      );
    } finally {
      setEnregistrement(false);
    }
  }

  // ==========================================================
  // MODAL PAIEMENT
  // ==========================================================

  function ouvrirPaiement(
    cotisation
  ) {
    if (!peutCreerPaiement) {
      return;
    }

    setCotisationPaiement(
      cotisation
    );

    const reste =
      Math.max(
        nombre(cotisation.montant) -
          obtenirMontantPaye(
            cotisation
          ),
        0
      );

    setFormPaiement({
      montant:
        reste > 0
          ? String(reste)
          : "",
      mode_paiement:
        "espèce",
      date_paiement:
        new Date()
          .toISOString()
          .slice(0, 10),
      reference: "",
    });

    setModalPaiement(true);
  }

  // ==========================================================
  // ENREGISTRER PAIEMENT
  // ==========================================================

  async function sauvegarderPaiement(
    event
  ) {
    event.preventDefault();

    if (
      !cotisationPaiement ||
      !peutCreerPaiement
    ) {
      return;
    }

    try {
      setEnregistrement(true);
      setErreur("");

      await ajouterPaiement(
        cotisationPaiement.id,
        {
          montant:
            Number(
              formPaiement.montant
            ),
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

      setModalPaiement(false);
      setCotisationPaiement(null);

      await chargerDonnees();
    } catch (error) {
      console.error(
        "ERREUR ENREGISTREMENT PAIEMENT :",
        error
      );

      setErreur(
        error?.response?.data?.detail ||
          "Impossible d'enregistrer le paiement."
      );
    } finally {
      setEnregistrement(false);
    }
  }

  // ==========================================================
  // SUPPRESSION
  //
  // IMPORTANT :
  // Ton backend actuel ne possède pas de permission
  // COTISATION_SUPPRIMER dans la liste fournie.
  //
  // Donc aucune suppression n'est proposée ici.
  // ==========================================================

  function ouvrirSuppression(
    cotisation
  ) {
    // volontairement désactivé
    // car aucune permission COTISATION_SUPPRIMER
    // n'existe actuellement.
    return;
  }

  // ==========================================================
  // CHANGEMENT D'ANNÉE
  // ==========================================================

  function changerAnnee(value) {
    const annee =
      Number(value);

    setAnneeSelectionnee(
      annee
    );

    const premierMois =
      moisEnregistres.find(
        (item) =>
          item.annee === annee
      );

    setMoisSelectionne(
      premierMois?.mois || ""
    );
  }

  // ==========================================================
  // CHANGEMENT DE MOIS
  // ==========================================================

  function changerMois(value) {
    setMoisSelectionne(
      value
    );
  }

  // ==========================================================
  // RENDU CHARGEMENT
  // ==========================================================

  if (chargement) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2
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

  // ==========================================================
  // RENDU
  // ==========================================================

  return (
    <div className="space-y-8 pb-10">
      {/* ==================================================== */}
      {/* EN-TÊTE                                             */}
      {/* ==================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Cotisations
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Suivez votre cotisation et,
            selon vos droits, la situation
            des cotisations du Dahira.
          </p>
        </div>

        {peutCreerCotisation && (
          <button
            type="button"
            onClick={() =>
              ouvrirNouvelleCotisation()
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus size={18} />
            Nouvelle cotisation
          </button>
        )}
      </div>

      {/* ==================================================== */}
      {/* ERREUR                                               */}
      {/* ==================================================== */}

      {erreur && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
            <X size={17} />
          </button>
        </div>
      )}

      {/* ==================================================== */}
      {/* MA COTISATION                                        */}
      {/* ==================================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <User size={19} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Ma cotisation
                  </h2>

                  <p className="text-xs text-slate-500">
                    Votre situation personnelle
                  </p>
                </div>
              </div>
            </div>

            {peutCreerCotisation && (
              <button
                type="button"
                onClick={() =>
                  ouvrirNouvelleCotisation(
                    membreConnecte
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Plus size={16} />
                Ajouter ma cotisation
              </button>
            )}
          </div>
        </div>

        <div className="p-5">
          {mesCotisations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
              <CircleDollarSign
                size={30}
                className="mx-auto mb-3 text-slate-400"
              />

              <p className="font-medium text-slate-700">
                Aucune cotisation enregistrée
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Votre cotisation apparaîtra ici
                lorsqu'elle sera enregistrée.
              </p>

              {peutCreerCotisation && (
                <button
                  type="button"
                  onClick={() =>
                    ouvrirNouvelleCotisation(
                      membreConnecte
                    )
                  }
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  <Plus size={16} />
                  Ajouter ma cotisation
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-3">
                      Période
                    </th>

                    <th className="px-3 py-3">
                      Montant dû
                    </th>

                    <th className="px-3 py-3">
                      Payé
                    </th>

                    <th className="px-3 py-3">
                      Reste
                    </th>

                    <th className="px-3 py-3">
                      Statut
                    </th>

                    <th className="px-3 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {mesCotisations.map(
                    (cotisation) => {
                      const montantFixe =
                        nombre(
                          cotisation.montant
                        );

                      const montantPaye =
                        obtenirMontantPaye(
                          cotisation
                        );

                      const reste =
                        Math.max(
                          montantFixe -
                            montantPaye,
                          0
                        );

                      const statut =
                        calculerStatut(
                          montantFixe,
                          montantPaye
                        );

                      return (
                        <tr
                          key={
                            cotisation.id
                          }
                          className="text-sm"
                        >
                          <td className="px-3 py-4 font-medium text-slate-800">
                            {cotisation.mois_concerne}{" "}
                            {cotisation.annee}
                          </td>

                          <td className="px-3 py-4 text-slate-700">
                            {formatMontant(
                              montantFixe
                            )}
                          </td>

                          <td className="px-3 py-4 font-semibold text-slate-800">
                            {formatMontant(
                              montantPaye
                            )}
                          </td>

                          <td className="px-3 py-4 text-slate-700">
                            {formatMontant(
                              reste
                            )}
                          </td>

                          <td className="px-3 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${couleurStatut(
                                statut
                              )}`}
                            >
                              {statut}
                            </span>
                          </td>

                          <td className="px-3 py-4">
                            <div className="flex justify-end gap-2">
                              {peutConsulterPaiements && (
                                <button
                                  type="button"
                                  title="Voir les paiements"
                                  className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                                >
                                  <Eye
                                    size={16}
                                  />
                                </button>
                              )}

                              {peutCreerPaiement &&
                                reste > 0 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      ouvrirPaiement(
                                        cotisation
                                      )
                                    }
                                    className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                                  >
                                    Payer
                                  </button>
                                )}

                              {peutModifierCotisation && (
                                <button
                                  type="button"
                                  title="Modifier"
                                  onClick={() =>
                                    ouvrirModificationCotisation(
                                      cotisation
                                    )
                                  }
                                  className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                                >
                                  <Edit3
                                    size={16}
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
          )}
        </div>
      </section>

      {/* ==================================================== */}
      {/* COTISATIONS DU DAHIRA                                */}
      {/* ==================================================== */}

      {peutConsulterDahira && (
        <section className="space-y-5">
          {/* ------------------------------------------------ */}
          {/* TITRE + FILTRES                                 */}
          {/* ------------------------------------------------ */}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                      <Users size={19} />
                    </div>

                    <div>
                      <h2 className="font-bold text-slate-900">
                        Cotisations du Dahira
                      </h2>

                      <p className="text-xs text-slate-500">
                        Situation des membres actifs
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  {/* RECHERCHE */}

                  <div className="relative">
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
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 sm:w-64"
                    />
                  </div>

                  {/* ANNÉE */}

                  <div className="relative">
                    <select
                      value={
                        anneeSelectionnee
                      }
                      onChange={(event) =>
                        changerAnnee(
                          event.target.value
                        )
                      }
                      className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-slate-400"
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

                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>

                  {/* MOIS */}

                  <div className="relative">
                    <select
                      value={
                        moisSelectionne
                      }
                      onChange={(event) =>
                        changerMois(
                          event.target.value
                        )
                      }
                      className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-slate-400"
                    >
                      {moisDisponiblesAnnee.length ===
                      0 ? (
                        <option value="">
                          Aucun mois
                        </option>
                      ) : (
                        moisDisponiblesAnnee.map(
                          (item) => (
                            <option
                              key={`${item.annee}-${item.mois}`}
                              value={
                                item.mois
                              }
                            >
                              {item.mois}
                            </option>
                          )
                        )
                      )}
                    </select>

                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------ */}
            {/* FILTRES STATUT                                  */}
            {/* ------------------------------------------------ */}

            <div className="flex flex-wrap gap-2 px-5 py-4">
              {[
                "Tous",
                "Payée",
                "Partielle",
                "Impayée",
              ].map((statut) => (
                <button
                  key={statut}
                  type="button"
                  onClick={() =>
                    setStatutSelectionne(
                      statut
                    )
                  }
                  className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                    statutSelectionne ===
                    statut
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {statut}
                </button>
              ))}
            </div>
          </div>

          {/* ------------------------------------------------ */}
          {/* RÉSUMÉ                                           */}
          {/* ------------------------------------------------ */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Estimation
                  </p>

                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {formatMontant(
                      resume.estimation
                    )}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Tous les membres actifs
                  </p>
                </div>

                <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
                  <CircleDollarSign
                    size={19}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Encaissé
                  </p>

                  <p className="mt-2 text-xl font-bold text-emerald-700">
                    {formatMontant(
                      resume.encaisse
                    )}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Paiements réellement reçus
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                  <CreditCard
                    size={19}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Reste à encaisser
                  </p>

                  <p className="mt-2 text-xl font-bold text-amber-700">
                    {formatMontant(
                      resume.reste
                    )}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Estimation − paiements
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
                  <Clock3
                    size={19}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Situation
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {resume.payees} payées
                    </span>

                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      {resume.partielles} partielles
                    </span>

                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                      {resume.impayees} impayées
                    </span>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
                  <CheckCircle2
                    size={19}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------ */}
          {/* TABLEAU                                          */}
          {/* ------------------------------------------------ */}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Situation mensuelle
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {moisSelectionne
                      ? `${moisSelectionne} ${anneeSelectionnee}`
                      : "Aucun mois sélectionné"}
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  {
                    situationsFiltrees.length
                  }{" "}
                  membre
                  {situationsFiltrees.length >
                  1
                    ? "s"
                    : ""}
                </span>
              </div>
            </div>

            {situationsFiltrees.length ===
            0 ? (
              <div className="px-5 py-12 text-center">
                <CalendarDays
                  size={32}
                  className="mx-auto mb-3 text-slate-300"
                />

                <p className="font-medium text-slate-700">
                  Aucune donnée à afficher
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Aucun résultat ne correspond
                  aux filtres sélectionnés.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-3">
                        Membre
                      </th>

                      <th className="px-3 py-3">
                        Cotisation
                      </th>

                      <th className="px-3 py-3">
                        Payé
                      </th>

                      <th className="px-3 py-3">
                        Reste
                      </th>

                      <th className="px-3 py-3">
                        Statut
                      </th>

                      <th className="px-5 py-3 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {situationsFiltrees.map(
                      (situation) => {
                        const {
                          membre,
                          cotisation,
                          montantFixe,
                          montantPaye,
                          montantRestant,
                          statut,
                          enregistre,
                        } = situation;

                        return (
                          <tr
                            key={membre.id}
                            className="text-sm transition hover:bg-slate-50/60"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                                  {initiales(
                                    membre
                                  )}
                                </div>

                                <div>
                                  <p className="font-semibold text-slate-800">
                                    {nomComplet(
                                      membre
                                    )}
                                  </p>

                                  {membre.telephone && (
                                    <p className="mt-0.5 text-xs text-slate-400">
                                      {
                                        membre.telephone
                                      }
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-3 py-4 font-medium text-slate-700">
                              {formatMontant(
                                montantFixe
                              )}
                            </td>

                            <td className="px-3 py-4 font-semibold text-slate-800">
                              {formatMontant(
                                montantPaye
                              )}
                            </td>

                            <td className="px-3 py-4 text-slate-700">
                              {formatMontant(
                                montantRestant
                              )}
                            </td>

                            <td className="px-3 py-4">
                              <div className="flex flex-col items-start gap-1.5">
                                <span
                                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${couleurStatut(
                                    statut
                                  )}`}
                                >
                                  {statut}
                                </span>

                                {!enregistre &&
                                  statut ===
                                    "Impayée" && (
                                    <span className="text-[11px] text-slate-400">
                                      Cotisation non
                                      enregistrée
                                    </span>
                                  )}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-2">
                                {/* MEMBRE SANS COTISATION */}

                                {!enregistre &&
                                  peutCreerCotisation && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        ouvrirNouvelleCotisation(
                                          membre
                                        )
                                      }
                                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                                    >
                                      <Plus
                                        size={14}
                                      />
                                      Enregistrer
                                    </button>
                                  )}

                                {/* COTISATION EXISTANTE */}

                                {enregistre &&
                                  peutConsulterPaiements && (
                                    <button
                                      type="button"
                                      title="Voir les paiements"
                                      className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                                    >
                                      <Eye
                                        size={16}
                                      />
                                    </button>
                                  )}

                                {enregistre &&
                                  peutCreerPaiement &&
                                  montantRestant >
                                    0 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        ouvrirPaiement(
                                          cotisation
                                        )
                                      }
                                      className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                                    >
                                      Paiement
                                    </button>
                                  )}

                                {enregistre &&
                                  peutModifierCotisation && (
                                    <button
                                      type="button"
                                      title="Modifier"
                                      onClick={() =>
                                        ouvrirModificationCotisation(
                                          cotisation
                                        )
                                      }
                                      className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                                    >
                                      <Edit3
                                        size={16}
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
            )}
          </div>
        </section>
      )}

      {/* ==================================================== */}
      {/* MODAL COTISATION                                    */}
      {/* ==================================================== */}

      {modalCotisation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-bold text-slate-900">
                  {cotisationSelectionnee
                    ? "Modifier la cotisation"
                    : "Nouvelle cotisation"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Montant dû pour la période
                  sélectionnée.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setModalCotisation(false)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={
                sauvegarderCotisation
              }
              className="space-y-5 p-5"
            >
              {/* MEMBRE */}

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Membre
                </label>

                <select
                  required
                  value={
                    formCotisation.membre_id
                  }
                  onChange={(event) =>
                    setFormCotisation(
                      (ancien) => ({
                        ...ancien,
                        membre_id:
                          event.target
                            .value,
                      })
                    )
                  }
                  disabled={
                    Boolean(
                      cotisationSelectionnee
                    ) ||
                    !peutConsulterDahira
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
                >
                  <option value="">
                    Sélectionner un membre
                  </option>

                  {(
                    peutConsulterDahira
                      ? membres.filter(
                          (membre) =>
                            membre?.actif !==
                            false
                        )
                      : membreConnecte
                        ? [membreConnecte]
                        : []
                  ).map((membre) => (
                    <option
                      key={membre.id}
                      value={membre.id}
                    >
                      {nomComplet(
                        membre
                      )}
                    </option>
                  ))}
                </select>
              </div>

              {/* MONTANT */}

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Montant de la cotisation
                </label>

                <div className="relative">
                  <input
                    required
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
                            event.target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-20 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                    FCFA
                  </span>
                </div>
              </div>

              {/* MOIS + ANNÉE */}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Mois
                  </label>

                  <select
                    required
                    value={
                      formCotisation.mois_concerne
                    }
                    onChange={(event) =>
                      setFormCotisation(
                        (ancien) => ({
                          ...ancien,
                          mois_concerne:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
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
                    Année
                  </label>

                  <input
                    required
                    type="number"
                    min="2000"
                    max="2100"
                    value={
                      formCotisation.annee
                    }
                    onChange={(event) =>
                      setFormCotisation(
                        (ancien) => ({
                          ...ancien,
                          annee:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              </div>

              {/* DATE */}

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
                          event.target
                            .value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* ACTIONS */}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setModalCotisation(false)
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={
                    enregistrement
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enregistrement && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {cotisationSelectionnee
                    ? "Enregistrer les modifications"
                    : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL PAIEMENT                                      */}
      {/* ==================================================== */}

      {modalPaiement &&
        cotisationPaiement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="font-bold text-slate-900">
                    Enregistrer un paiement
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {cotisationPaiement.mois_concerne}{" "}
                    {cotisationPaiement.annee}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setModalPaiement(false)
                  }
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={
                  sauvegarderPaiement
                }
                className="space-y-5 p-5"
              >
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      Cotisation
                    </span>

                    <strong className="text-slate-800">
                      {formatMontant(
                        cotisationPaiement.montant
                      )}
                    </strong>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      Déjà payé
                    </span>

                    <strong className="text-slate-800">
                      {formatMontant(
                        obtenirMontantPaye(
                          cotisationPaiement
                        )
                      )}
                    </strong>
                  </div>

                  <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 text-sm">
                    <span className="font-semibold text-slate-700">
                      Reste
                    </span>

                    <strong className="text-amber-700">
                      {formatMontant(
                        Math.max(
                          nombre(
                            cotisationPaiement.montant
                          ) -
                            obtenirMontantPaye(
                              cotisationPaiement
                            ),
                          0
                        )
                      )}
                    </strong>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Montant reçu
                  </label>

                  <div className="relative">
                    <input
                      required
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
                              event.target
                                .value,
                          })
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-20 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />

                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
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
                            event.target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
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
                              event.target
                                .value,
                          })
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
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
                              event.target
                                .value,
                          })
                        )
                      }
                      placeholder="Optionnel"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() =>
                      setModalPaiement(false)
                    }
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    disabled={
                      enregistrement
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {enregistrement && (
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

      {/* ==================================================== */}
      {/* MODAL SUPPRESSION                                   */}
      {/* ==================================================== */}

      {modalSuppression &&
        cotisationASupprimer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <Trash2 size={20} />
              </div>

              <h2 className="mt-4 text-lg font-bold text-slate-900">
                Supprimer la cotisation ?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Cette action désactivera la
                cotisation sélectionnée.
              </p>

              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setModalSuppression(false)
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setModalSuppression(false)
                  }
                  className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}