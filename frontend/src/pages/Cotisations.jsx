import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  CreditCard,
  FileText,
  Loader2,
  Plus,
  Receipt,
  Search,
  Wallet,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import api from "../api/client";

import {
  ajouterPaiement,
  creerCotisation,
  getCotisations,
  modifierCotisation,
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


const formaterMontant = (montant) => {
  const valeur = Number(montant || 0);

  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(valeur);
};


const formaterDate = (date) => {
  if (!date) return "—";

  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  } catch {
    return "—";
  }
};


const obtenirNomComplet = (membre) => {
  if (!membre) return "Membre inconnu";

  return [membre.prenom, membre.nom]
    .filter(Boolean)
    .join(" ")
    .trim() || "Membre inconnu";
};


const obtenirCleMois = (mois, annee) => {
  return `${mois}-${annee}`;
};


const obtenirIndexMois = (mois) => {
  return MOIS.findIndex(
    (item) =>
      item.toLowerCase() === String(mois || "").toLowerCase()
  );
};


const normaliserMois = (mois) => {
  if (!mois) return "";

  const valeur = String(mois).trim();

  const trouve = MOIS.find(
    (item) =>
      item.toLowerCase() === valeur.toLowerCase()
  );

  return trouve || valeur;
};


const trouverMembre = (membres, membreId) => {
  return (
    membres.find(
      (membre) => Number(membre.id) === Number(membreId)
    ) || null
  );
};


const obtenirStatutSituation = (
  montantDu,
  montantPaye
) => {
  const du = Number(montantDu || 0);
  const paye = Number(montantPaye || 0);

  if (paye <= 0) {
    return "Impayée";
  }

  if (paye >= du) {
    return "Payée";
  }

  return "Partiellement payée";
};


const badgeStatut = (statut) => {
  if (statut === "Payée") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (statut === "Partiellement payée") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  return "bg-red-50 text-red-700 border-red-200";
};


const iconStatut = (statut) => {
  if (statut === "Payée") {
    return <CheckCircle2 size={15} />;
  }

  if (statut === "Partiellement payée") {
    return <Clock3 size={15} />;
  }

  return <AlertCircle size={15} />;
};


export default function Cotisations() {
  const {
    utilisateur,
    aPermission,
  } = useAuth();


  /*
   * ============================================================
   * PERMISSIONS
   * ============================================================
   */

  const peutConsulterDahira =
    aPermission("COTISATION_CREER");

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


  /*
   * ============================================================
   * ÉTATS
   * ============================================================
   */

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [cotisations, setCotisations] = useState([]);
  const [membres, setMembres] = useState([]);

  const [recherche, setRecherche] = useState("");

  const [moisSelectionne, setMoisSelectionne] =
    useState("");

  const [anneeSelectionnee, setAnneeSelectionnee] =
    useState("");

  const [statutSelectionne, setStatutSelectionne] =
    useState("Tous");

  const [modalCotisation, setModalCotisation] =
    useState(false);

  const [modalPaiement, setModalPaiement] =
    useState(false);

  const [modalHistorique, setModalHistorique] =
    useState(false);

  const [cotisationSelectionnee, setCotisationSelectionnee] =
    useState(null);

  const [membreSelectionne, setMembreSelectionne] =
    useState(null);

  const [enregistrement, setEnregistrement] =
    useState(false);


  /*
   * FORMULAIRE COTISATION
   */

  const [formCotisation, setFormCotisation] =
    useState({
      membre_id: "",
      montant: "",
      mois_concerne: "",
      annee: new Date().getFullYear(),
      date_cotisation: "",
    });


  /*
   * FORMULAIRE PAIEMENT
   */

  const [formPaiement, setFormPaiement] =
    useState({
      montant: "",
      mode_paiement: "espèce",
      date_paiement: "",
      reference: "",
    });


  /*
   * ============================================================
   * CHARGEMENT
   * ============================================================
   */

  const chargerDonnees = async () => {
    try {
      setChargement(true);
      setErreur("");

      /*
       * Les cotisations existantes.
       *
       * Cette requête contient les paiements réellement
       * enregistrés.
       */
      const requeteCotisations = getCotisations();

      /*
       * IMPORTANT :
       *
       * On ne fait PAS :
       *
       * getMembres()
       *
       * car cela nécessiterait MEMBRE_CONSULTER.
       *
       * La gestion des cotisations utilise sa propre route
       * dédiée.
       */
      const requeteMembres = peutConsulterDahira
        ? api.get("/cotisations/membres-actifs")
        : Promise.resolve({
            data: {
              membres: [],
            },
          });

      const [resultatCotisations, resultatMembres] =
        await Promise.all([
          requeteCotisations,
          requeteMembres,
        ]);

      const listeCotisations =
        Array.isArray(resultatCotisations)
          ? resultatCotisations
          : resultatCotisations?.cotisations || [];

      const donneesMembres =
        resultatMembres?.data?.membres ||
        resultatMembres?.data ||
        [];

      setCotisations(
        Array.isArray(listeCotisations)
          ? listeCotisations
          : []
      );

      setMembres(
        Array.isArray(donneesMembres)
          ? donneesMembres
          : []
      );

    } catch (error) {
      console.error(
        "ERREUR CHARGEMENT COTISATIONS :",
        error
      );

      const detail =
        error?.response?.data?.detail ||
        "Impossible de charger les cotisations.";

      setErreur(detail);
    } finally {
      setChargement(false);
    }
  };


  useEffect(() => {
    chargerDonnees();
  }, [peutConsulterDahira]);


  /*
   * ============================================================
   * MOIS DISPONIBLES
   *
   * IMPORTANT :
   *
   * On n'affiche que les mois pour lesquels au moins une
   * cotisation a réellement été enregistrée.
   * ============================================================
   */

  const moisDisponibles = useMemo(() => {
    const uniques = new Map();

    cotisations.forEach((cotisation) => {
      const mois = normaliserMois(
        cotisation.mois_concerne
      );

      const annee = Number(
        cotisation.annee
      );

      if (!mois || !annee) return;

      const cle = obtenirCleMois(
        mois,
        annee
      );

      if (!uniques.has(cle)) {
        uniques.set(cle, {
          mois,
          annee,
        });
      }
    });

    return Array.from(uniques.values()).sort(
      (a, b) => {
        if (a.annee !== b.annee) {
          return b.annee - a.annee;
        }

        return (
          obtenirIndexMois(b.mois) -
          obtenirIndexMois(a.mois)
        );
      }
    );
  }, [cotisations]);


  /*
   * ============================================================
   * SÉLECTION DU MOIS PAR DÉFAUT
   * ============================================================
   */

  useEffect(() => {
    if (!moisDisponibles.length) {
      setMoisSelectionne("");
      setAnneeSelectionnee("");
      return;
    }

    const maintenant = new Date();

    const moisActuel =
      MOIS[maintenant.getMonth()];

    const anneeActuelle =
      maintenant.getFullYear();

    const moisActuelExiste =
      moisDisponibles.find(
        (item) =>
          item.mois === moisActuel &&
          item.annee === anneeActuelle
      );

    const selection =
      moisActuelExiste ||
      moisDisponibles[0];

    setMoisSelectionne(selection.mois);
    setAnneeSelectionnee(selection.annee);
  }, [moisDisponibles]);


  /*
   * ============================================================
   * ANNÉES DISPONIBLES
   * ============================================================
   */

  const anneesDisponibles = useMemo(() => {
    return Array.from(
      new Set(
        moisDisponibles.map(
          (item) => Number(item.annee)
        )
      )
    ).sort((a, b) => b - a);
  }, [moisDisponibles]);


  /*
   * ============================================================
   * COTISATIONS DU MOIS SÉLECTIONNÉ
   * ============================================================
   */

  const cotisationsDuMois = useMemo(() => {
    if (!moisSelectionne || !anneeSelectionnee) {
      return [];
    }

    return cotisations.filter(
      (cotisation) =>
        normaliserMois(
          cotisation.mois_concerne
        ) === moisSelectionne &&
        Number(cotisation.annee) ===
          Number(anneeSelectionnee)
    );
  }, [
    cotisations,
    moisSelectionne,
    anneeSelectionnee,
  ]);


  /*
   * ============================================================
   * SITUATION MENSUELLE
   *
   * C'est ici que la règle métier importante est appliquée :
   *
   * montant dû = Membre.montant_cotisation
   *
   * et NON :
   *
   * montant dû = Cotisation.montant
   *
   * pour les membres qui n'ont encore aucune cotisation
   * enregistrée.
   * ============================================================
   */

  const situationMensuelle = useMemo(() => {
    if (
      !moisSelectionne ||
      !anneeSelectionnee ||
      !membres.length
    ) {
      return [];
    }

    return membres
      .filter((membre) => membre.actif !== false)
      .map((membre) => {
        /*
         * Chercher la cotisation du membre pour le mois.
         */
        const cotisation =
          cotisationsDuMois.find(
            (item) =>
              Number(item.membre_id) ===
              Number(membre.id)
          ) || null;


        /*
         * LE MONTANT MENSUEL VIENT DU MEMBRE.
         *
         * C'est ce montant qui a été affecté lors
         * de la création du membre.
         */
        const montantMensuel = Number(
          membre.montant_cotisation || 0
        );


        /*
         * Si une cotisation existe, on utilise ses paiements.
         *
         * Sinon :
         *
         * payé = 0
         * reste = montant mensuel
         */
        const montantPaye = cotisation
          ? Number(
              cotisation.montant_cotise || 0
            )
          : 0;


        /*
         * Pour une cotisation existante, son montant
         * enregistré reste la référence de cette échéance.
         *
         * Mais lorsqu'aucune cotisation n'existe encore,
         * le montant dû provient directement du membre.
         */
        const montantDu =
          montantMensuel > 0
            ? montantMensuel
            : Number(
                cotisation?.montant || 0
              );


        const reste = Math.max(
          0,
          montantDu - montantPaye
        );


        const statut =
          obtenirStatutSituation(
            montantDu,
            montantPaye
          );


        return {
          membre,
          cotisation,
          montantDu,
          montantPaye,
          reste,
          statut,
          enregistre: Boolean(cotisation),
        };
      });
  }, [
    membres,
    cotisationsDuMois,
    moisSelectionne,
    anneeSelectionnee,
  ]);


  /*
   * ============================================================
   * RÉSUMÉ MENSUEL
   * ============================================================
   */

  const resumeMensuel = useMemo(() => {
    /*
     * Total dû :
     *
     * somme des montant_cotisation des membres actifs.
     */
    const totalDu = situationMensuelle.reduce(
      (total, situation) =>
        total + Number(situation.montantDu || 0),
      0
    );


    /*
     * Total encaissé :
     *
     * somme des paiements réellement effectués.
     */
    const totalPaye = situationMensuelle.reduce(
      (total, situation) =>
        total + Number(situation.montantPaye || 0),
      0
    );


    /*
     * Reste à encaisser.
     */
    const reste = Math.max(
      0,
      totalDu - totalPaye
    );


    const nombreMembres =
      situationMensuelle.length;


    const nombrePayes =
      situationMensuelle.filter(
        (item) => item.statut === "Payée"
      ).length;


    const nombrePartiels =
      situationMensuelle.filter(
        (item) =>
          item.statut ===
          "Partiellement payée"
      ).length;


    const nombreImpayes =
      situationMensuelle.filter(
        (item) =>
          item.statut === "Impayée"
      ).length;


    return {
      totalDu,
      totalPaye,
      reste,
      nombreMembres,
      nombrePayes,
      nombrePartiels,
      nombreImpayes,
    };
  }, [situationMensuelle]);


  /*
   * ============================================================
   * FILTRAGE
   *
   * TOUS :
   * uniquement les cotisations réellement enregistrées.
   *
   * IMPAYÉES :
   * tous les membres actifs, y compris ceux sans
   * cotisation enregistrée.
   * ============================================================
   */

  const lignesFiltrees = useMemo(() => {
    const terme =
      recherche.trim().toLowerCase();


    let lignes;


    if (statutSelectionne === "Tous") {
      /*
       * "Tous" ne doit afficher que les cotisations
       * réellement enregistrées.
       */
      lignes = situationMensuelle.filter(
        (situation) =>
          situation.enregistre
      );
    } else if (
      statutSelectionne === "Impayée"
    ) {
      /*
       * Impayées :
       *
       * inclut également les membres qui n'ont
       * aucune ligne Cotisation.
       */
      lignes =
        situationMensuelle.filter(
          (situation) =>
            situation.statut ===
            "Impayée"
        );
    } else {
      /*
       * Payées / Partiellement payées :
       *
       * uniquement les situations existantes.
       */
      lignes =
        situationMensuelle.filter(
          (situation) =>
            situation.enregistre &&
            situation.statut ===
              statutSelectionne
        );
    }


    if (!terme) {
      return lignes;
    }


    return lignes.filter(
      (situation) => {
        const nom =
          obtenirNomComplet(
            situation.membre
          ).toLowerCase();

        const telephone =
          String(
            situation.membre
              ?.telephone || ""
          ).toLowerCase();

        return (
          nom.includes(terme) ||
          telephone.includes(terme)
        );
      }
    );
  }, [
    situationMensuelle,
    recherche,
    statutSelectionne,
  ]);


  /*
   * ============================================================
   * COTISATION PERSONNELLE
   * ============================================================
   */

  const cotisationsPersonnelles =
    useMemo(() => {
      if (!utilisateur?.membre_id) {
        return [];
      }

      return cotisations.filter(
        (cotisation) =>
          Number(
            cotisation.membre_id
          ) ===
          Number(
            utilisateur.membre_id
          )
      );
    }, [
      cotisations,
      utilisateur,
    ]);


  const situationPersonnelle =
    useMemo(() => {
      if (!utilisateur?.membre_id) {
        return null;
      }

      const membre =
        trouverMembre(
          membres,
          utilisateur.membre_id
        );

      if (!membre) {
        return null;
      }

      const cotisation =
        cotisationsDuMois.find(
          (item) =>
            Number(item.membre_id) ===
            Number(utilisateur.membre_id)
        ) || null;

      const montantDu = Number(
        membre.montant_cotisation || 0
      );

      const montantPaye = cotisation
        ? Number(
            cotisation.montant_cotise || 0
          )
        : 0;

      const reste = Math.max(
        0,
        montantDu - montantPaye
      );

      return {
        membre,
        cotisation,
        montantDu,
        montantPaye,
        reste,
        statut:
          obtenirStatutSituation(
            montantDu,
            montantPaye
          ),
      };
    }, [
      utilisateur,
      membres,
      cotisationsDuMois,
    ]);


  /*
   * ============================================================
   * OUVRIR CRÉATION / MODIFICATION
   * ============================================================
   */

  const ouvrirNouvelleCotisation = (
    membre = null
  ) => {
    const maintenant = new Date();

    const moisDefaut =
      moisSelectionne ||
      MOIS[maintenant.getMonth()];

    const anneeDefaut =
      Number(
        anneeSelectionnee ||
          maintenant.getFullYear()
      );

    setCotisationSelectionnee(null);

    setFormCotisation({
      membre_id: membre?.id || "",
      montant:
        membre?.montant_cotisation || "",
      mois_concerne: moisDefaut,
      annee: anneeDefaut,
      date_cotisation:
        maintenant
          .toISOString()
          .slice(0, 10),
    });

    setModalCotisation(true);
  };


  const ouvrirModificationCotisation = (
    cotisation
  ) => {
    const membre =
      trouverMembre(
        membres,
        cotisation.membre_id
      );

    setCotisationSelectionnee(
      cotisation
    );

    setFormCotisation({
      membre_id:
        cotisation.membre_id || "",
      montant:
        membre?.montant_cotisation ??
        cotisation.montant ??
        "",
      mois_concerne:
        normaliserMois(
          cotisation.mois_concerne
        ),
      annee:
        Number(
          cotisation.annee
        ),
      date_cotisation:
        cotisation.date_cotisation
          ? String(
              cotisation.date_cotisation
            ).slice(0, 10)
          : "",
    });

    setModalCotisation(true);
  };


  /*
   * ============================================================
   * ENREGISTRER COTISATION
   * ============================================================
   */

  const enregistrerCotisation = async (
    event
  ) => {
    event.preventDefault();

    if (!formCotisation.membre_id) {
      setErreur(
        "Veuillez sélectionner un membre."
      );
      return;
    }

    if (
      !formCotisation.mois_concerne
    ) {
      setErreur(
        "Veuillez sélectionner un mois."
      );
      return;
    }

    const membre =
      trouverMembre(
        membres,
        formCotisation.membre_id
      );

    /*
     * Le montant mensuel vient du membre.
     *
     * On utilise cette valeur par défaut.
     */
    const montant =
      Number(
        membre?.montant_cotisation ||
          formCotisation.montant ||
          0
      );

    if (montant <= 0) {
      setErreur(
        "Le montant mensuel de ce membre est invalide."
      );
      return;
    }

    try {
      setEnregistrement(true);
      setErreur("");

      if (cotisationSelectionnee) {
        await modifierCotisation(
          cotisationSelectionnee.id,
          {
            membre_id:
              Number(
                formCotisation.membre_id
              ),
            montant,
            mois_concerne:
              formCotisation.mois_concerne,
            annee:
              Number(
                formCotisation.annee
              ),
            date_cotisation:
              formCotisation.date_cotisation ||
              null,
          }
        );
      } else {
        await creerCotisation({
          membre_id:
            Number(
              formCotisation.membre_id
            ),
          montant,
          mois_concerne:
            formCotisation.mois_concerne,
          annee:
            Number(
              formCotisation.annee
            ),
          date_cotisation:
            formCotisation.date_cotisation ||
            null,
        });
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
  };


  /*
   * ============================================================
   * OUVRIR PAIEMENT
   * ============================================================
   */

  const ouvrirPaiement = (
    situation
  ) => {
    if (!situation?.cotisation) {
      /*
       * Une ligne Cotisation doit d'abord être créée.
       */
      ouvrirNouvelleCotisation(
        situation.membre
      );
      return;
    }

    setCotisationSelectionnee(
      situation.cotisation
    );

    setMembreSelectionne(
      situation.membre
    );

    setFormPaiement({
      montant:
        situation.reste > 0
          ? String(situation.reste)
          : "",
      mode_paiement: "espèce",
      date_paiement:
        new Date()
          .toISOString()
          .slice(0, 10),
      reference: "",
    });

    setModalPaiement(true);
  };


  /*
   * ============================================================
   * ENREGISTRER PAIEMENT
   * ============================================================
   */

  const enregistrerPaiement = async (
    event
  ) => {
    event.preventDefault();

    if (
      !cotisationSelectionnee
    ) {
      return;
    }

    const montant =
      Number(
        formPaiement.montant
      );

    if (montant <= 0) {
      setErreur(
        "Le montant du paiement doit être supérieur à zéro."
      );
      return;
    }

    try {
      setEnregistrement(true);
      setErreur("");

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

      setModalPaiement(false);
      setCotisationSelectionnee(
        null
      );
      setMembreSelectionne(null);

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
  };


  /*
   * ============================================================
   * HISTORIQUE PAIEMENTS
   * ============================================================
   */

  const ouvrirHistorique = (
    situation
  ) => {
    if (!situation?.cotisation) {
      return;
    }

    setCotisationSelectionnee(
      situation.cotisation
    );

    setMembreSelectionne(
      situation.membre
    );

    setModalHistorique(true);
  };


  /*
   * ============================================================
   * SI PAS DE DROIT DE GESTION DU DAHIRA
   * ============================================================
   */

  if (!peutConsulterDahira) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <Wallet
              size={28}
              className="text-slate-500"
            />
          </div>

          <h2 className="text-xl font-bold text-slate-900">
            Accès limité
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Vous n'avez pas la permission de gérer
            les cotisations du Dahira.
          </p>
        </div>
      </div>
    );
  }


  /*
   * ============================================================
   * AFFICHAGE
   * ============================================================
   */

  return (
    <div className="space-y-6 p-4 md:p-6">

      {/* ======================================================
          EN-TÊTE
          ====================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Cotisations
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Suivi des cotisations mensuelles et des
            paiements réellement encaissés.
          </p>
        </div>

        {peutCreerCotisation && (
          <button
            type="button"
            onClick={() =>
              ouvrirNouvelleCotisation()
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus size={18} />
            Enregistrer une cotisation
          </button>
        )}
      </div>


      {/* ======================================================
          ERREUR
          ====================================================== */}

      {erreur && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <div className="flex-1">
            {erreur}
          </div>

          <button
            type="button"
            onClick={() => setErreur("")}
            className="rounded-lg p-1 hover:bg-red-100"
          >
            <X size={16} />
          </button>
        </div>
      )}


      {/* ======================================================
          CHARGEMENT
          ====================================================== */}

      {chargement ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Loader2
              size={20}
              className="animate-spin"
            />
            Chargement des cotisations...
          </div>
        </div>
      ) : (
        <>
          {/* ==================================================
              MA COTISATION
              ================================================== */}

          {situationPersonnelle && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Ma cotisation
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Votre situation pour{" "}
                    {moisSelectionne ||
                      "le mois sélectionné"}{" "}
                    {anneeSelectionnee || ""}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${badgeStatut(
                    situationPersonnelle.statut
                  )}`}
                >
                  {iconStatut(
                    situationPersonnelle.statut
                  )}

                  {situationPersonnelle.statut}
                </span>
              </div>


              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Montant mensuel
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {formaterMontant(
                      situationPersonnelle.montantDu
                    )}{" "}
                    FCFA
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-xs font-medium text-emerald-700">
                    Total payé
                  </p>

                  <p className="mt-1 text-lg font-bold text-emerald-800">
                    {formaterMontant(
                      situationPersonnelle.montantPaye
                    )}{" "}
                    FCFA
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="text-xs font-medium text-amber-700">
                    Reste
                  </p>

                  <p className="mt-1 text-lg font-bold text-amber-800">
                    {formaterMontant(
                      situationPersonnelle.reste
                    )}{" "}
                    FCFA
                  </p>
                </div>

              </div>
            </section>
          )}


          {/* ==================================================
              COTISATIONS DU DAHIRA
              ================================================== */}

          <section className="space-y-5">

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Cotisations du Dahira
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Le montant dû est basé sur la cotisation
                mensuelle affectée à chaque membre.
              </p>
            </div>


            {/* =================================================
                FILTRES
                ================================================= */}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">

                {/* Recherche */}

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
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>


                {/* Mois */}

                <div className="relative">
                  <CalendarDays
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    value={obtenirCleMois(
                      moisSelectionne,
                      anneeSelectionnee
                    )}
                    onChange={(event) => {
                      const valeur =
                        event.target.value;

                      const trouve =
                        moisDisponibles.find(
                          (item) =>
                            obtenirCleMois(
                              item.mois,
                              item.annee
                            ) === valeur
                        );

                      if (trouve) {
                        setMoisSelectionne(
                          trouve.mois
                        );

                        setAnneeSelectionnee(
                          trouve.annee
                        );
                      }
                    }}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  >
                    {moisDisponibles.length === 0 ? (
                      <option value="">
                        Aucun mois enregistré
                      </option>
                    ) : (
                      moisDisponibles.map(
                        (item) => (
                          <option
                            key={obtenirCleMois(
                              item.mois,
                              item.annee
                            )}
                            value={obtenirCleMois(
                              item.mois,
                              item.annee
                            )}
                          >
                            {item.mois}{" "}
                            {item.annee}
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


                {/* Année */}

                <div className="relative">
                  <select
                    value={
                      anneeSelectionnee || ""
                    }
                    onChange={(event) => {
                      const annee =
                        Number(
                          event.target.value
                        );

                      const moisDisponible =
                        moisDisponibles.find(
                          (item) =>
                            Number(
                              item.annee
                            ) === annee
                        );

                      if (
                        moisDisponible
                      ) {
                        setAnneeSelectionnee(
                          annee
                        );

                        setMoisSelectionne(
                          moisDisponible.mois
                        );
                      }
                    }}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-9 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
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


                {/* Statut */}

                <div className="relative">
                  <select
                    value={statutSelectionne}
                    onChange={(event) =>
                      setStatutSelectionne(
                        event.target.value
                      )
                    }
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-9 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  >
                    <option value="Tous">
                      Tous
                    </option>

                    <option value="Payée">
                      Payées
                    </option>

                    <option value="Partiellement payée">
                      Partielles
                    </option>

                    <option value="Impayée">
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


            {/* =================================================
                CARTES RÉSUMÉ
                ================================================= */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">
                      Total dû
                    </p>

                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {formaterMontant(
                        resumeMensuel.totalDu
                      )}{" "}
                      FCFA
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                    <CircleDollarSign
                      size={22}
                      className="text-slate-600"
                    />
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  Somme des cotisations mensuelles
                  des membres actifs
                </p>
              </div>


              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-700">
                      Total encaissé
                    </p>

                    <p className="mt-1 text-2xl font-bold text-emerald-800">
                      {formaterMontant(
                        resumeMensuel.totalPaye
                      )}{" "}
                      FCFA
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white">
                    <Wallet
                      size={22}
                      className="text-emerald-600"
                    />
                  </div>
                </div>

                <p className="mt-3 text-xs text-emerald-700">
                  Paiements réellement enregistrés
                </p>
              </div>


              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-700">
                      Reste à encaisser
                    </p>

                    <p className="mt-1 text-2xl font-bold text-amber-800">
                      {formaterMontant(
                        resumeMensuel.reste
                      )}{" "}
                      FCFA
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white">
                    <Receipt
                      size={22}
                      className="text-amber-600"
                    />
                  </div>
                </div>

                <p className="mt-3 text-xs text-amber-700">
                  Total dû moins les paiements reçus
                </p>
              </div>


              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">
                      Membres
                    </p>

                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {resumeMensuel.nombreMembres}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                    <FileText
                      size={22}
                      className="text-slate-600"
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                    {resumeMensuel.nombrePayes} payés
                  </span>

                  <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
                    {resumeMensuel.nombrePartiels} partiels
                  </span>

                  <span className="rounded-full bg-red-50 px-2.5 py-1 font-medium text-red-700">
                    {resumeMensuel.nombreImpayes} impayés
                  </span>
                </div>
              </div>

            </div>


            {/* =================================================
                TABLEAU
                ================================================= */}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 px-5 py-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Situation des cotisations
                    </h3>

                    <p className="text-xs text-slate-500">
                      {moisSelectionne}{" "}
                      {anneeSelectionnee}
                    </p>
                  </div>

                  <span className="text-xs text-slate-500">
                    {lignesFiltrees.length} résultat
                    {lignesFiltrees.length > 1
                      ? "s"
                      : ""}
                  </span>
                </div>
              </div>


              {lignesFiltrees.length === 0 ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <Receipt
                      size={22}
                      className="text-slate-400"
                    />
                  </div>

                  <p className="mt-3 font-semibold text-slate-700">
                    Aucune cotisation trouvée
                  </p>

                  <p className="mt-1 max-w-md text-sm text-slate-500">
                    {statutSelectionne ===
                    "Impayée"
                      ? "Aucun membre impayé pour ce mois."
                      : "Aucune donnée ne correspond aux filtres sélectionnés."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">

                  <table className="min-w-full">

                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Membre
                        </th>

                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Dû
                        </th>

                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Payé
                        </th>

                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Reste
                        </th>

                        <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Statut
                        </th>

                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Actions
                        </th>
                      </tr>
                    </thead>


                    <tbody className="divide-y divide-slate-100">

                      {lignesFiltrees.map(
                        (situation) => (
                          <tr
                            key={
                              situation.enregistre
                                ? `cotisation-${situation.cotisation.id}`
                                : `membre-${situation.membre.id}`
                            }
                            className="transition hover:bg-slate-50/70"
                          >

                            <td className="px-5 py-4">
                              <div className="font-semibold text-slate-900">
                                {obtenirNomComplet(
                                  situation.membre
                                )}
                              </div>

                              {situation.membre
                                ?.telephone && (
                                <div className="mt-0.5 text-xs text-slate-500">
                                  {
                                    situation.membre
                                      .telephone
                                  }
                                </div>
                              )}
                            </td>


                            <td className="px-5 py-4 text-right">
                              <span className="font-semibold text-slate-900">
                                {formaterMontant(
                                  situation.montantDu
                                )}{" "}
                                FCFA
                              </span>
                            </td>


                            <td className="px-5 py-4 text-right">
                              <span className="font-semibold text-emerald-700">
                                {formaterMontant(
                                  situation.montantPaye
                                )}{" "}
                                FCFA
                              </span>
                            </td>


                            <td className="px-5 py-4 text-right">
                              <span
                                className={
                                  situation.reste >
                                  0
                                    ? "font-semibold text-amber-700"
                                    : "font-semibold text-emerald-700"
                                }
                              >
                                {formaterMontant(
                                  situation.reste
                                )}{" "}
                                FCFA
                              </span>
                            </td>


                            <td className="px-5 py-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeStatut(
                                  situation.statut
                                )}`}
                              >
                                {iconStatut(
                                  situation.statut
                                )}

                                {situation.statut}
                              </span>
                            </td>


                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-2">

                                {situation.cotisation &&
                                  peutConsulterPaiements && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        ouvrirHistorique(
                                          situation
                                        )
                                      }
                                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                    >
                                      Historique
                                    </button>
                                  )}


                                {situation.cotisation &&
                                  peutCreerPaiement &&
                                  situation.reste >
                                    0 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        ouvrirPaiement(
                                          situation
                                        )
                                      }
                                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                                    >
                                      <CreditCard
                                        size={14}
                                      />
                                      Paiement
                                    </button>
                                  )}


                                {!situation.cotisation &&
                                  peutCreerCotisation && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      ouvrirNouvelleCotisation(
                                        situation.membre
                                      )
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                                  >
                                    <Plus
                                      size={14}
                                    />
                                    Enregistrer
                                  </button>
                                )}


                                {situation.cotisation &&
                                  peutModifierCotisation && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        ouvrirModificationCotisation(
                                          situation.cotisation
                                        )
                                      }
                                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                    >
                                      Modifier
                                    </button>
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
        </>
      )}


      {/* ======================================================
          MODAL COTISATION
          ====================================================== */}

      {modalCotisation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 p-5">

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {cotisationSelectionnee
                    ? "Modifier la cotisation"
                    : "Enregistrer une cotisation"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Le montant mensuel est défini sur
                  la fiche du membre.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setModalCotisation(false)
                }
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
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
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Membre
                </label>

                <select
                  value={
                    formCotisation.membre_id
                  }
                  onChange={(event) => {
                    const membre =
                      trouverMembre(
                        membres,
                        event.target.value
                      );

                    setFormCotisation(
                      (ancien) => ({
                        ...ancien,
                        membre_id:
                          event.target.value,
                        montant:
                          membre?.montant_cotisation ||
                          "",
                      })
                    );
                  }}
                  disabled={
                    Boolean(
                      cotisationSelectionnee
                    )
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
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
                        {obtenirNomComplet(
                          membre
                        )}
                      </option>
                    )
                  )}
                </select>
              </div>


              {/* Montant mensuel */}

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Montant mensuel
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={
                      formCotisation.montant
                    }
                    readOnly
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-20 text-sm font-semibold text-slate-700 outline-none"
                  />

                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                    FCFA
                  </span>
                </div>

                <p className="mt-1.5 text-xs text-slate-500">
                  Ce montant provient de la fiche du
                  membre.
                </p>
              </div>


              {/* Mois / année */}

              <div className="grid grid-cols-2 gap-3">

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
                    required
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
                            Number(
                              event.target.value
                            ),
                        })
                      )
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

              </div>


              {/* Date */}

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Date d'enregistrement
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>


              <div className="flex justify-end gap-3 pt-2">

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
                  disabled={enregistrement}
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


      {/* ======================================================
          MODAL PAIEMENT
          ====================================================== */}

      {modalPaiement &&
        cotisationSelectionnee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

              <div className="flex items-center justify-between border-b border-slate-200 p-5">

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Enregistrer un paiement
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {membreSelectionne
                      ? obtenirNomComplet(
                          membreSelectionne
                        )
                      : ""}
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
                  enregistrerPaiement
                }
                className="space-y-5 p-5"
              >

                <div className="grid grid-cols-3 gap-3">

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">
                      Dû
                    </p>

                    <p className="mt-1 font-bold text-slate-900">
                      {formaterMontant(
                        cotisationSelectionnee.montant
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-emerald-50 p-3">
                    <p className="text-xs text-emerald-700">
                      Payé
                    </p>

                    <p className="mt-1 font-bold text-emerald-800">
                      {formaterMontant(
                        cotisationSelectionnee.montant_cotise
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-amber-50 p-3">
                    <p className="text-xs text-amber-700">
                      Reste
                    </p>

                    <p className="mt-1 font-bold text-amber-800">
                      {formaterMontant(
                        cotisationSelectionnee.montant_du
                      )}
                    </p>
                  </div>

                </div>


                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Montant du paiement
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
                      required
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-20 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
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


                <div className="grid grid-cols-2 gap-3">

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
                              event.target.value,
                          })
                        )
                      }
                      placeholder="Optionnel"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />
                  </div>

                </div>


                <div className="flex justify-end gap-3 pt-2">

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
                    disabled={enregistrement}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
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


      {/* ======================================================
          MODAL HISTORIQUE
          ====================================================== */}

      {modalHistorique &&
        cotisationSelectionnee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

              <div className="flex items-center justify-between border-b border-slate-200 p-5">

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Historique des paiements
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {membreSelectionne
                      ? obtenirNomComplet(
                          membreSelectionne
                        )
                      : ""}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setModalHistorique(false)
                  }
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>

              </div>


              <div className="max-h-[60vh] overflow-y-auto p-5">

                {!cotisationSelectionnee
                  .paiements ||
                cotisationSelectionnee
                  .paiements.length === 0 ? (
                  <div className="py-10 text-center">

                    <CreditCard
                      size={30}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 font-semibold text-slate-700">
                      Aucun paiement enregistré
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Aucun versement n'a encore été
                      enregistré pour cette cotisation.
                    </p>

                  </div>
                ) : (
                  <div className="space-y-3">

                    {cotisationSelectionnee
                      .paiements
                      .map(
                        (paiement) => (
                          <div
                            key={
                              paiement.id
                            }
                            className="rounded-xl border border-slate-200 p-4"
                          >

                            <div className="flex items-center justify-between gap-3">

                              <div>
                                <p className="font-semibold text-slate-900">
                                  {formaterMontant(
                                    paiement.montant
                                  )}{" "}
                                  FCFA
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {formaterDate(
                                    paiement.date_paiement
                                  )}
                                </p>
                              </div>

                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                {
                                  paiement.mode_paiement
                                }
                              </span>

                            </div>

                            {paiement.reference && (
                              <p className="mt-2 text-xs text-slate-500">
                                Référence :{" "}
                                <span className="font-medium text-slate-700">
                                  {
                                    paiement.reference
                                  }
                                </span>
                              </p>
                            )}

                          </div>
                        )
                      )}

                  </div>
                )}

              </div>


              <div className="border-t border-slate-200 p-5">

                <div className="flex items-center justify-between text-sm">

                  <span className="text-slate-500">
                    Total encaissé
                  </span>

                  <span className="font-bold text-emerald-700">
                    {formaterMontant(
                      cotisationSelectionnee.montant_cotise
                    )}{" "}
                    FCFA
                  </span>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setModalHistorique(false)
                  }
                  className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Fermer
                </button>

              </div>

            </div>

          </div>
        )}

    </div>
  );
}