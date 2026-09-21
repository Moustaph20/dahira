import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Loader2,
  Plus,
  Search,
  UserRound,
  Wallet,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import {
  getCotisations,
  ajouterPaiement,
} from "../api/cotisations";

/* =========================================================
   CONSTANTES
========================================================= */

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

const FILTRES_STATUT = [
  { value: "TOUS", label: "Tous" },
  { value: "PAYEE", label: "Payées" },
  { value: "PARTIELLE", label: "Partielles" },
  { value: "IMPAYEE", label: "Impayées" },
];

/* =========================================================
   OUTILS
========================================================= */

const normaliserNombre = (valeur) => {
  const nombre = Number(valeur);
  return Number.isFinite(nombre) ? nombre : 0;
};

const formaterMontant = (valeur) =>
  `${new Intl.NumberFormat("fr-FR").format(
    Math.max(normaliserNombre(valeur), 0)
  )} FCFA`;

const formaterDate = (date) => {
  if (!date) return "—";

  const valeur = new Date(date);

  if (Number.isNaN(valeur.getTime())) {
    return date;
  }

  return valeur.toLocaleDateString("fr-FR");
};

const obtenirNomMembre = (membre) => {
  if (!membre) return "Membre";

  const prenom = membre.prenom || "";
  const nom = membre.nom || "";

  const nomComplet = `${prenom} ${nom}`.trim();

  return nomComplet || membre.telephone || "Membre";
};

const obtenirInitiales = (membre) => {
  if (!membre) return "M";

  const prenom = String(membre.prenom || "").trim();
  const nom = String(membre.nom || "").trim();

  if (prenom && nom) {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  }

  if (prenom) {
    return prenom.substring(0, 2).toUpperCase();
  }

  if (nom) {
    return nom.substring(0, 2).toUpperCase();
  }

  return "M";
};

const getMembreIdDepuisUtilisateur = (utilisateur) => {
  if (!utilisateur) return null;

  return (
    utilisateur.membre_id ??
    utilisateur.membre?.id ??
    utilisateur.membreId ??
    null
  );
};

/* =========================================================
   STATUT
========================================================= */

const calculerStatut = (montantDu, montantPaye) => {
  const du = normaliserNombre(montantDu);
  const paye = normaliserNombre(montantPaye);

  if (du <= 0) return "PAYEE";

  if (paye <= 0) {
    return "IMPAYEE";
  }

  if (paye >= du) {
    return "PAYEE";
  }

  return "PARTIELLE";
};

const getStatutLabel = (statut) => {
  switch (statut) {
    case "PAYEE":
      return "Payée";

    case "PARTIELLE":
      return "Partielle";

    case "IMPAYEE":
      return "Impayée";

    default:
      return "—";
  }
};

/* =========================================================
   COMPOSANT
========================================================= */

export default function Cotisations() {
  const {
    utilisateur,
    aPermission,
  } = useAuth();

  /* =======================================================
     PERMISSIONS
  ======================================================= */

  const peutConsulter = aPermission("COTISATION_CONSULTER");
  const peutCreerPaiement =
    aPermission("PAIEMENT_CREER") ||
    aPermission("PAIEMENT_ENREGISTRER");

  /* =======================================================
     ETATS
  ======================================================= */

  const [cotisations, setCotisations] = useState([]);
  const [membresActifs, setMembresActifs] = useState([]);

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [moisSelectionne, setMoisSelectionne] = useState("");
  const [anneeSelectionnee, setAnneeSelectionnee] = useState(
    new Date().getFullYear()
  );

  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("TOUS");

  const [modalPaiement, setModalPaiement] = useState(false);
  const [lignePaiement, setLignePaiement] = useState(null);

  const [montantPaiement, setMontantPaiement] = useState("");
  const [modePaiement, setModePaiement] = useState("espèce");
  const [datePaiement, setDatePaiement] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [referencePaiement, setReferencePaiement] = useState("");

  const [enregistrementPaiement, setEnregistrementPaiement] =
    useState(false);

  const [messageSucces, setMessageSucces] = useState("");

  /* =======================================================
     ID DU MEMBRE CONNECTE
  ======================================================= */

  const membreIdConnecte = useMemo(
    () => getMembreIdDepuisUtilisateur(utilisateur),
    [utilisateur]
  );

  /* =======================================================
     CHARGEMENT
  ======================================================= */

  const chargerDonnees = async () => {
    try {
      setChargement(true);
      setErreur("");

      const demandes = [];

      if (peutConsulter) {
        demandes.push(getCotisations());
      }

      /*
       * Cette route permet de récupérer les membres actifs
       * sans donner nécessairement MEMBRE_CONSULTER.
       *
       * Elle est utilisée uniquement pour la vue "Dahira".
       */
      if (peutConsulter) {
        demandes.push(api.get("/cotisations/membres-actifs"));
      }

      if (demandes.length === 0) {
        setCotisations([]);
        setMembresActifs([]);
        return;
      }

      const resultats = await Promise.all(demandes);

      setCotisations(resultats[0]?.data || resultats[0] || []);

      if (resultats[1]) {
        setMembresActifs(
          resultats[1]?.data || resultats[1] || []
        );
      } else {
        setMembresActifs([]);
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement des cotisations :",
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
  }, [peutConsulter]);

  /* =======================================================
     ANNEES DISPONIBLES
  ======================================================= */

  const anneesDisponibles = useMemo(() => {
    const annees = new Set();

    annees.add(new Date().getFullYear());

    cotisations.forEach((cotisation) => {
      if (cotisation?.annee) {
        annees.add(Number(cotisation.annee));
      }
    });

    return Array.from(annees).sort((a, b) => b - a);
  }, [cotisations]);

  /* =======================================================
     MEMBRE CONNECTE
  ======================================================= */

  const membreConnecte = useMemo(() => {
    if (!membreIdConnecte) {
      return null;
    }

    const membreActif = membresActifs.find(
      (membre) =>
        Number(membre?.id) === Number(membreIdConnecte)
    );

    if (membreActif) {
      return membreActif;
    }

    if (
      utilisateur?.membre &&
      Number(utilisateur.membre.id) ===
        Number(membreIdConnecte)
    ) {
      return utilisateur.membre;
    }

    /*
     * Dernier secours si /auth/me ne contient pas encore
     * l'objet membre complet.
     */
    return {
      id: membreIdConnecte,
      nom:
        utilisateur?.nom ??
        utilisateur?.membre_nom ??
        "",
      prenom:
        utilisateur?.prenom ??
        utilisateur?.membre_prenom ??
        "",
      telephone: utilisateur?.telephone ?? "",
      montant_cotisation:
        utilisateur?.membre?.montant_cotisation ??
        utilisateur?.montant_cotisation ??
        0,
    };
  }, [
    membreIdConnecte,
    membresActifs,
    utilisateur,
  ]);

  /* =======================================================
     MONTANT MENSUEL DU MEMBRE CONNECTE
  ======================================================= */

  const montantMensuelMembre = useMemo(() => {
    return normaliserNombre(
      membreConnecte?.montant_cotisation
    );
  }, [membreConnecte]);

  /* =======================================================
     COTISATIONS PAR MEMBRE / MOIS
  ======================================================= */

  const trouverCotisation = (membreId, mois, annee) => {
    return cotisations.find(
      (cotisation) =>
        Number(cotisation?.membre_id) === Number(membreId) &&
        String(cotisation?.mois_concerne || "")
          .toLowerCase() ===
          String(mois || "").toLowerCase() &&
        Number(cotisation?.annee) === Number(annee)
    );
  };

  /* =======================================================
     PAIEMENTS D'UNE COTISATION
  ======================================================= */

  const calculerMontantPaye = (cotisation) => {
    if (!cotisation) return 0;

    if (
      cotisation.montant_cotise !== undefined &&
      cotisation.montant_cotise !== null
    ) {
      return normaliserNombre(cotisation.montant_cotise);
    }

    if (Array.isArray(cotisation.paiements)) {
      return cotisation.paiements.reduce(
        (total, paiement) =>
          total + normaliserNombre(paiement?.montant),
        0
      );
    }

    return 0;
  };

  /* =======================================================
     SITUATION MENSUELLE DU DAHIRA
  ======================================================= */

  const situationMensuelle = useMemo(() => {
    if (!moisSelectionne) {
      return [];
    }

    return membresActifs.map((membre) => {
      const cotisation = trouverCotisation(
        membre.id,
        moisSelectionne,
        anneeSelectionnee
      );

      /*
       * IMPORTANT :
       *
       * Le montant dû vient d'abord du montant mensuel
       * défini sur le membre.
       *
       * Une cotisation existante peut toutefois contenir
       * un montant historique explicite.
       */
      const montantMensuel = normaliserNombre(
        membre?.montant_cotisation
      );

      const montantDu =
        normaliserNombre(cotisation?.montant) > 0
          ? normaliserNombre(cotisation.montant)
          : montantMensuel;

      const montantPaye = calculerMontantPaye(cotisation);

      const reste = Math.max(
        montantDu - montantPaye,
        0
      );

      const statut = calculerStatut(
        montantDu,
        montantPaye
      );

      return {
        id: `membre-${membre.id}`,
        membre_id: membre.id,
        membre,
        cotisation,
        montantDu,
        montantPaye,
        reste,
        statut,
        mois_concerne: moisSelectionne,
        annee: anneeSelectionnee,
      };
    });
  }, [
    membresActifs,
    cotisations,
    moisSelectionne,
    anneeSelectionnee,
  ]);

  /* =======================================================
     MES COTISATIONS
  ======================================================= */

  const mesCotisations = useMemo(() => {
    if (!membreIdConnecte) {
      return [];
    }

    return cotisations
      .filter(
        (cotisation) =>
          Number(cotisation?.membre_id) ===
          Number(membreIdConnecte)
      )
      .map((cotisation) => {
        const montantEnregistre = normaliserNombre(
          cotisation?.montant
        );

        /*
         * Si une ancienne ligne de cotisation existe mais
         * que son montant est vide/0, on utilise le montant
         * mensuel du membre.
         */
        const montantDu =
          montantEnregistre > 0
            ? montantEnregistre
            : montantMensuelMembre;

        const montantPaye =
          calculerMontantPaye(cotisation);

        const reste = Math.max(
          montantDu - montantPaye,
          0
        );

        return {
          ...cotisation,
          montantDu,
          montantPaye,
          reste,
          statutCalcule: calculerStatut(
            montantDu,
            montantPaye
          ),
        };
      })
      .sort((a, b) => {
        const anneeA = Number(a.annee || 0);
        const anneeB = Number(b.annee || 0);

        if (anneeA !== anneeB) {
          return anneeB - anneeA;
        }

        return (
          MOIS.indexOf(b.mois_concerne) -
          MOIS.indexOf(a.mois_concerne)
        );
      });
  }, [
    cotisations,
    membreIdConnecte,
    montantMensuelMembre,
  ]);

  /* =======================================================
     STATISTIQUES PERSONNELLES
  ======================================================= */

  const statistiquesPersonnelles = useMemo(() => {
    /*
     * Même si aucune cotisation n'a encore été créée
     * techniquement en base, le membre a déjà une obligation
     * mensuelle définie par montant_cotisation.
     */

    const totalDuEnregistre = mesCotisations.reduce(
      (total, cotisation) =>
        total +
        normaliserNombre(cotisation?.montantDu),
      0
    );

    const totalPaye = mesCotisations.reduce(
      (total, cotisation) =>
        total +
        normaliserNombre(cotisation?.montantPaye),
      0
    );

    const totalDu =
      mesCotisations.length > 0
        ? totalDuEnregistre
        : montantMensuelMembre;

    return {
      totalDu,
      totalPaye,
      reste: Math.max(totalDu - totalPaye, 0),
    };
  }, [
    mesCotisations,
    montantMensuelMembre,
  ]);

  /* =======================================================
     MOIS DISPONIBLES POUR L'HISTORIQUE
  ======================================================= */

  const moisDisponibles = useMemo(() => {
    const mois = [];

    cotisations.forEach((cotisation) => {
      if (!cotisation?.mois_concerne) return;

      const existe = mois.some(
        (item) =>
          item.mois === cotisation.mois_concerne &&
          Number(item.annee) ===
            Number(cotisation.annee)
      );

      if (!existe) {
        mois.push({
          mois: cotisation.mois_concerne,
          annee: Number(cotisation.annee),
        });
      }
    });

    /*
     * Même sans ligne de cotisation créée, le mois actuel
     * doit pouvoir être consulté.
     */
    const moisActuel =
      MOIS[new Date().getMonth()];

    const anneeActuelle =
      new Date().getFullYear();

    if (
      !mois.some(
        (item) =>
          item.mois === moisActuel &&
          item.annee === anneeActuelle
      )
    ) {
      mois.push({
        mois: moisActuel,
        annee: anneeActuelle,
      });
    }

    return mois.sort((a, b) => {
      if (a.annee !== b.annee) {
        return b.annee - a.annee;
      }

      return (
        MOIS.indexOf(b.mois) -
        MOIS.indexOf(a.mois)
      );
    });
  }, [cotisations]);

  /* =======================================================
     INITIALISATION DU MOIS
  ======================================================= */

  useEffect(() => {
    if (!moisSelectionne && moisDisponibles.length > 0) {
      setMoisSelectionne(moisDisponibles[0].mois);
      setAnneeSelectionnee(moisDisponibles[0].annee);
    }
  }, [
    moisDisponibles,
    moisSelectionne,
  ]);

  /* =======================================================
     FILTRE DAHIRA
  ======================================================= */

  const lignesFiltrees = useMemo(() => {
    const rechercheNormalisee =
      recherche.trim().toLowerCase();

    return situationMensuelle.filter((ligne) => {
      const nom = obtenirNomMembre(
        ligne.membre
      ).toLowerCase();

      const telephone = String(
        ligne.membre?.telephone || ""
      ).toLowerCase();

      const correspondRecherche =
        !rechercheNormalisee ||
        nom.includes(rechercheNormalisee) ||
        telephone.includes(rechercheNormalisee);

      const correspondStatut =
        filtreStatut === "TOUS" ||
        ligne.statut === filtreStatut;

      return (
        correspondRecherche &&
        correspondStatut
      );
    });
  }, [
    situationMensuelle,
    recherche,
    filtreStatut,
  ]);

  /* =======================================================
     STATISTIQUES DU MOIS
  ======================================================= */

  const statistiquesMois = useMemo(() => {
    const estimation = situationMensuelle.reduce(
      (total, ligne) =>
        total + normaliserNombre(ligne.montantDu),
      0
    );

    const totalPaye = situationMensuelle.reduce(
      (total, ligne) =>
        total + normaliserNombre(ligne.montantPaye),
      0
    );

    const reste = Math.max(
      estimation - totalPaye,
      0
    );

    const payees = situationMensuelle.filter(
      (ligne) => ligne.statut === "PAYEE"
    ).length;

    const partielles = situationMensuelle.filter(
      (ligne) => ligne.statut === "PARTIELLE"
    ).length;

    const impayees = situationMensuelle.filter(
      (ligne) => ligne.statut === "IMPAYEE"
    ).length;

    return {
      estimation,
      totalPaye,
      reste,
      payees,
      partielles,
      impayees,
      totalMembres: situationMensuelle.length,
    };
  }, [situationMensuelle]);

  /* =======================================================
     OUVRIR MODAL PAIEMENT
  ======================================================= */

  const ouvrirPaiement = (ligne) => {
    if (!peutCreerPaiement) {
      return;
    }

    if (!ligne) {
      return;
    }

    if (!ligne.cotisation) {
      setErreur(
        "Cette cotisation n'est pas encore enregistrée. Le paiement ne peut être enregistré qu'après création de la cotisation correspondante."
      );
      return;
    }

    setErreur("");
    setMessageSucces("");

    setLignePaiement(ligne);

    setMontantPaiement(
      ligne.reste > 0
        ? String(ligne.reste)
        : ""
    );

    setModePaiement("espèce");

    setDatePaiement(
      new Date()
        .toISOString()
        .slice(0, 10)
    );

    setReferencePaiement("");

    setModalPaiement(true);
  };

  /* =======================================================
     FERMER MODAL
  ======================================================= */

  const fermerModalPaiement = () => {
    if (enregistrementPaiement) return;

    setModalPaiement(false);
    setLignePaiement(null);
    setMontantPaiement("");
    setReferencePaiement("");
  };

  /* =======================================================
     ENREGISTRER PAIEMENT
  ======================================================= */

  const enregistrerPaiement = async (event) => {
    event.preventDefault();

    if (!lignePaiement?.cotisation?.id) {
      setErreur(
        "Impossible d'enregistrer le paiement : cotisation introuvable."
      );
      return;
    }

    const montant = normaliserNombre(
      montantPaiement
    );

    if (montant <= 0) {
      setErreur(
        "Le montant du paiement doit être supérieur à 0."
      );
      return;
    }

    const resteAvantPaiement =
      normaliserNombre(
        lignePaiement.reste
      );

    if (montant > resteAvantPaiement) {
      setErreur(
        `Le paiement ne peut pas dépasser le reste à payer de ${formaterMontant(
          resteAvantPaiement
        )}.`
      );
      return;
    }

    try {
      setEnregistrementPaiement(true);
      setErreur("");
      setMessageSucces("");

      await ajouterPaiement(
        lignePaiement.cotisation.id,
        {
          montant,
          mode_paiement: modePaiement,
          date_paiement:
            datePaiement || null,
          reference:
            referencePaiement.trim() || null,
        }
      );

      fermerModalPaiement();

      setMessageSucces(
        "Le paiement a été enregistré avec succès."
      );

      await chargerDonnees();
    } catch (error) {
      console.error(
        "Erreur enregistrement paiement :",
        error
      );

      setErreur(
        error?.response?.data?.detail ||
          "Impossible d'enregistrer le paiement."
      );
    } finally {
      setEnregistrementPaiement(false);
    }
  };

  /* =======================================================
     ACCES
  ======================================================= */

  if (!peutConsulter) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-slate-400" />

          <h1 className="text-xl font-bold text-slate-900">
            Cotisations
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Vous n'avez pas la permission de consulter
            les cotisations du Dahira.
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDU
  ======================================================= */

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* =================================================
            EN-TETE
        ================================================= */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100">
                <Wallet className="h-6 w-6 text-emerald-600" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Cotisations
                </h1>

                <p className="text-sm text-slate-500">
                  Suivi des cotisations et des paiements.
                </p>
              </div>
            </div>
          </div>

          {messageSucces && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {messageSucces}
            </div>
          )}
        </div>

        {/* =================================================
            ERREUR
        ================================================= */}

        {erreur && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="flex-1">
              <p className="font-semibold">
                Une erreur est survenue
              </p>

              <p className="mt-1">
                {erreur}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setErreur("")}
              className="rounded-lg p-1 hover:bg-red-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* =================================================
            CHARGEMENT
        ================================================= */}

        {chargement ? (
          <div className="flex min-h-[350px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin" />

              <p className="text-sm">
                Chargement des cotisations...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* =============================================
                MA COTISATION
            ============================================= */}

            {membreIdConnecte && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                    <UserRound className="h-5 w-5 text-blue-600" />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Ma cotisation
                    </h2>

                    <p className="text-sm text-slate-500">
                      {obtenirNomMembre(
                        membreConnecte
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                  {/* Total dû */}

                  <div className="rounded-2xl bg-slate-50 p-5">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                      <CircleDollarSign className="h-4 w-4" />
                      Total dû
                    </div>

                    <p className="text-2xl font-bold text-slate-900">
                      {formaterMontant(
                        statistiquesPersonnelles.totalDu
                      )}
                    </p>
                  </div>

                  {/* Total payé */}

                  <div className="rounded-2xl bg-emerald-50 p-5">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Total payé
                    </div>

                    <p className="text-2xl font-bold text-emerald-700">
                      {formaterMontant(
                        statistiquesPersonnelles.totalPaye
                      )}
                    </p>
                  </div>

                  {/* Reste */}

                  <div className="rounded-2xl bg-amber-50 p-5">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-700">
                      <Clock3 className="h-4 w-4" />
                      Reste
                    </div>

                    <p className="text-2xl font-bold text-amber-700">
                      {formaterMontant(
                        statistiquesPersonnelles.reste
                      )}
                    </p>
                  </div>
                </div>

                {montantMensuelMembre > 0 && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    <CalendarDays className="h-4 w-4 shrink-0" />

                    <span>
                      Montant mensuel :
                      <strong className="ml-1">
                        {formaterMontant(
                          montantMensuelMembre
                        )}
                      </strong>
                    </span>
                  </div>
                )}
              </section>
            )}

            {/* =============================================
                SITUATION DU DAHIRA
            ============================================= */}

            {membresActifs.length > 0 && (
              <section className="space-y-5">

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Cotisations du Dahira
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Le montant dû est automatiquement calculé
                    à partir de la cotisation mensuelle de
                    chaque membre.
                  </p>
                </div>

                {/* =========================================
                    FILTRES MOIS
                ========================================= */}

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                    {/* Mois */}

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Mois
                      </label>

                      <div className="relative">
                        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <select
                          value={moisSelectionne}
                          onChange={(event) =>
                            setMoisSelectionne(
                              event.target.value
                            )
                          }
                          className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        >
                          {moisDisponibles.map(
                            (item) => (
                              <option
                                key={`${item.annee}-${item.mois}`}
                                value={item.mois}
                              >
                                {item.mois}{" "}
                                {item.annee}
                              </option>
                            )
                          )}
                        </select>

                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    {/* Année */}

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Année
                      </label>

                      <div className="relative">
                        <select
                          value={anneeSelectionnee}
                          onChange={(event) =>
                            setAnneeSelectionnee(
                              Number(
                                event.target.value
                              )
                            )
                          }
                          className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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

                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    {/* Recherche */}

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Rechercher
                      </label>

                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <input
                          type="text"
                          value={recherche}
                          onChange={(event) =>
                            setRecherche(
                              event.target.value
                            )
                          }
                          placeholder="Nom ou téléphone..."
                          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Filtres statut */}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {FILTRES_STATUT.map(
                      (filtre) => (
                        <button
                          key={filtre.value}
                          type="button"
                          onClick={() =>
                            setFiltreStatut(
                              filtre.value
                            )
                          }
                          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                            filtreStatut ===
                            filtre.value
                              ? "bg-slate-900 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {filtre.label}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* =========================================
                    STATISTIQUES MOIS
                ========================================= */}

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Prévision
                    </p>

                    <p className="mt-2 text-lg font-bold text-slate-900">
                      {formaterMontant(
                        statistiquesMois.estimation
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Encaissé
                    </p>

                    <p className="mt-2 text-lg font-bold text-emerald-600">
                      {formaterMontant(
                        statistiquesMois.totalPaye
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Reste
                    </p>

                    <p className="mt-2 text-lg font-bold text-amber-600">
                      {formaterMontant(
                        statistiquesMois.reste
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Payées
                    </p>

                    <p className="mt-2 text-lg font-bold text-emerald-600">
                      {statistiquesMois.payees}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Impayées
                    </p>

                    <p className="mt-2 text-lg font-bold text-red-600">
                      {statistiquesMois.impayees}
                    </p>
                  </div>
                </div>

                {/* =========================================
                    TABLEAU
                ========================================= */}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                      <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                          <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Membre
                          </th>

                          <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Dû
                          </th>

                          <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Encaissé
                          </th>

                          <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Reste
                          </th>

                          <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Statut
                          </th>

                          <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {lignesFiltrees.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-5 py-12 text-center"
                            >
                              <div className="mx-auto flex max-w-sm flex-col items-center">
                                <Search className="mb-3 h-10 w-10 text-slate-300" />

                                <p className="font-semibold text-slate-700">
                                  Aucun membre trouvé
                                </p>

                                <p className="mt-1 text-sm text-slate-400">
                                  Modifiez vos critères de
                                  recherche ou de filtrage.
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          lignesFiltrees.map(
                            (ligne) => (
                              <tr
                                key={ligne.id}
                                className="transition hover:bg-slate-50"
                              >
                                {/* Membre */}

                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                                      {obtenirInitiales(
                                        ligne.membre
                                      )}
                                    </div>

                                    <div>
                                      <p className="font-semibold text-slate-900">
                                        {obtenirNomMembre(
                                          ligne.membre
                                        )}
                                      </p>

                                      {ligne.membre
                                        ?.telephone && (
                                        <p className="text-xs text-slate-400">
                                          {
                                            ligne
                                              .membre
                                              .telephone
                                          }
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* Dû */}

                                <td className="px-5 py-4 text-right font-semibold text-slate-900">
                                  {formaterMontant(
                                    ligne.montantDu
                                  )}
                                </td>

                                {/* Encaissé */}

                                <td className="px-5 py-4 text-right font-semibold text-emerald-600">
                                  {formaterMontant(
                                    ligne.montantPaye
                                  )}
                                </td>

                                {/* Reste */}

                                <td className="px-5 py-4 text-right font-semibold text-amber-600">
                                  {formaterMontant(
                                    ligne.reste
                                  )}
                                </td>

                                {/* Statut */}

                                <td className="px-5 py-4 text-center">
                                  <span
                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                      ligne.statut ===
                                      "PAYEE"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : ligne.statut ===
                                          "PARTIELLE"
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    {getStatutLabel(
                                      ligne.statut
                                    )}
                                  </span>
                                </td>

                                {/* Action */}

                                <td className="px-5 py-4 text-right">
                                  {ligne.reste >
                                  0 &&
                                  ligne.cotisation &&
                                  peutCreerPaiement ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        ouvrirPaiement(
                                          ligne
                                        )
                                      }
                                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                    >
                                      <Plus className="h-4 w-4" />
                                      Paiement
                                    </button>
                                  ) : !ligne.cotisation ? (
                                    <span className="text-xs text-slate-400">
                                      En attente
                                    </span>
                                  ) : (
                                    <span className="text-xs text-slate-400">
                                      —
                                    </span>
                                  )}
                                </td>
                              </tr>
                            )
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <p className="text-xs text-slate-400">
                  {lignesFiltrees.length} membre
                  {lignesFiltrees.length > 1
                    ? "s"
                    : ""}{" "}
                  affiché
                  {lignesFiltrees.length > 1
                    ? "s"
                    : ""}{" "}
                  sur{" "}
                  {situationMensuelle.length}.
                </p>
              </section>
            )}

            {/* =================================================
                HISTORIQUE PERSONNEL
            ================================================= */}

            {membreIdConnecte && (
              <section className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Mon historique
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Historique des cotisations et paiements
                    enregistrés.
                  </p>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                          <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Période
                          </th>

                          <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Dû
                          </th>

                          <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Payé
                          </th>

                          <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Reste
                          </th>

                          <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Statut
                          </th>

                          <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Date
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {mesCotisations.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-5 py-12 text-center"
                            >
                              <div className="mx-auto max-w-sm">
                                <Wallet className="mx-auto mb-3 h-10 w-10 text-slate-300" />

                                <p className="font-semibold text-slate-700">
                                  Aucun historique enregistré
                                </p>

                                <p className="mt-1 text-sm text-slate-400">
                                  Votre montant mensuel reste
                                  défini dans votre fiche membre.
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          mesCotisations.map(
                            (cotisation) => (
                              <tr
                                key={
                                  cotisation.id
                                }
                                className="hover:bg-slate-50"
                              >
                                <td className="px-5 py-4">
                                  <p className="font-semibold text-slate-900">
                                    {
                                      cotisation.mois_concerne
                                    }
                                  </p>

                                  <p className="text-xs text-slate-400">
                                    {
                                      cotisation.annee
                                    }
                                  </p>
                                </td>

                                <td className="px-5 py-4 text-right font-semibold text-slate-900">
                                  {formaterMontant(
                                    cotisation.montantDu
                                  )}
                                </td>

                                <td className="px-5 py-4 text-right font-semibold text-emerald-600">
                                  {formaterMontant(
                                    cotisation.montantPaye
                                  )}
                                </td>

                                <td className="px-5 py-4 text-right font-semibold text-amber-600">
                                  {formaterMontant(
                                    cotisation.reste
                                  )}
                                </td>

                                <td className="px-5 py-4 text-center">
                                  <span
                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                      cotisation.statutCalcule ===
                                      "PAYEE"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : cotisation.statutCalcule ===
                                          "PARTIELLE"
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    {getStatutLabel(
                                      cotisation.statutCalcule
                                    )}
                                  </span>
                                </td>

                                <td className="px-5 py-4 text-sm text-slate-500">
                                  {formaterDate(
                                    cotisation.date_cotisation
                                  )}
                                </td>
                              </tr>
                            )
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* =====================================================
          MODAL PAIEMENT
      ===================================================== */}

      {modalPaiement && lignePaiement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* Header */}

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Enregistrer un paiement
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {obtenirNomMembre(
                    lignePaiement.membre
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={fermerModalPaiement}
                disabled={
                  enregistrementPaiement
                }
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Informations */}

            <div className="grid grid-cols-3 gap-3 border-b border-slate-100 bg-slate-50 p-5">
              <div>
                <p className="text-xs text-slate-400">
                  Dû
                </p>

                <p className="mt-1 text-sm font-bold text-slate-900">
                  {formaterMontant(
                    lignePaiement.montantDu
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Déjà payé
                </p>

                <p className="mt-1 text-sm font-bold text-emerald-600">
                  {formaterMontant(
                    lignePaiement.montantPaye
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Reste
                </p>

                <p className="mt-1 text-sm font-bold text-amber-600">
                  {formaterMontant(
                    lignePaiement.reste
                  )}
                </p>
              </div>
            </div>

            {/* Formulaire */}

            <form
              onSubmit={enregistrerPaiement}
              className="space-y-5 p-5"
            >
              {/* Montant */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Montant du paiement
                </label>

                <div className="relative">
                  <CreditCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={montantPaiement}
                    onChange={(event) =>
                      setMontantPaiement(
                        event.target.value
                      )
                    }
                    placeholder="Ex. 5000"
                    required
                    className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              {/* Mode */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Mode de paiement
                </label>

                <select
                  value={modePaiement}
                  onChange={(event) =>
                    setModePaiement(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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

              {/* Date */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Date du paiement
                </label>

                <input
                  type="date"
                  value={datePaiement}
                  onChange={(event) =>
                    setDatePaiement(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Référence */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Référence
                  <span className="ml-1 font-normal text-slate-400">
                    (facultatif)
                  </span>
                </label>

                <input
                  type="text"
                  value={referencePaiement}
                  onChange={(event) =>
                    setReferencePaiement(
                      event.target.value
                    )
                  }
                  placeholder="Référence Wave, Orange Money..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Boutons */}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    fermerModalPaiement
                  }
                  disabled={
                    enregistrementPaiement
                  }
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={
                    enregistrementPaiement
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enregistrementPaiement ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Enregistrer le paiement
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}