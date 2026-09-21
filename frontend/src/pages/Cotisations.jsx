import { useEffect, useMemo, useState } from "react";

import {
  creerCotisation,
  modifierCotisation,
  supprimerCotisation,
  getCotisations,
  ajouterPaiement,
} from "../services/cotisationService";

import { getMembres } from "../services/membreService";

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


const formaterMontant = (montant) => {
  return `${Number(montant || 0).toLocaleString("fr-FR")} FCFA`;
};


const normaliserStatut = (statut) => {
  const valeur = String(statut || "")
    .trim()
    .toLowerCase();

  if (valeur === "payée" || valeur === "payee") {
    return "payee";
  }

  if (
    valeur === "partiellement payée" ||
    valeur === "partiellement payee" ||
    valeur === "partielle"
  ) {
    return "partielle";
  }

  return "impayee";
};


const obtenirMontantPaye = (cotisation) => {
  if (!cotisation) {
    return 0;
  }

  /*
   * PRIORITÉ :
   * 1. Les paiements réels renvoyés par l'API.
   * 2. montant_cotise comme secours.
   *
   * On ne doit jamais utiliser cotisation.montant
   * comme montant réellement payé.
   */
  if (Array.isArray(cotisation.paiements)) {
    return cotisation.paiements
      .filter(
        (paiement) =>
          paiement?.actif !== false
      )
      .reduce(
        (total, paiement) =>
          total +
          Number(paiement?.montant || 0),
        0
      );
  }

  return Number(
    cotisation.montant_cotise || 0
  );
};


const obtenirMontantFixe = (
  membre,
  cotisation
) => {
  if (cotisation) {
    return Number(
      cotisation.montant || 0
    );
  }

  return Number(
    membre?.montant_cotisation || 0
  );
};


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


const Cotisations = () => {
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

  const [moisFiltre, setMoisFiltre] =
    useState("");

  const [anneeFiltre, setAnneeFiltre] =
    useState("");

  const [statutFiltre, setStatutFiltre] =
    useState("");

  const [modalCotisation, setModalCotisation] =
    useState(false);

  const [modalPaiement, setModalPaiement] =
    useState(false);

  const [modalDetails, setModalDetails] =
    useState(false);

  const [cotisationSelectionnee, setCotisationSelectionnee] =
    useState(null);

  const [membreSelectionne, setMembreSelectionne] =
    useState(null);

  const [edition, setEdition] =
    useState(false);

  const [enregistrement, setEnregistrement] =
    useState(false);

  const [formulaire, setFormulaire] =
    useState({
      membre_id: "",
      montant: "",
      mois_concerne: "",
      annee: ANNEE_ACTUELLE,
      date_cotisation:
        new Date()
          .toISOString()
          .split("T")[0],
    });

  const [formulairePaiement, setFormulairePaiement] =
    useState({
      montant: "",
      mode_paiement: "espèce",
      date_paiement:
        new Date()
          .toISOString()
          .split("T")[0],
      reference: "",
    });


  /* ==========================================================
     CHARGEMENT
  ========================================================== */

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
        Array.isArray(
          resultatCotisations
        )
          ? resultatCotisations
          : resultatCotisations?.cotisations ||
            [];

      const listeMembres =
        Array.isArray(resultatMembres)
          ? resultatMembres
          : resultatMembres?.membres ||
            [];

      setCotisations(
        listeCotisations
      );

      setMembres(
        listeMembres
      );
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


  /* ==========================================================
     MEMBRES ACTIFS
  ========================================================== */

  const membresActifs = useMemo(() => {
    return membres.filter(
      (membre) =>
        membre?.actif !== false
    );
  }, [membres]);


  /* ==========================================================
     MOIS ENREGISTRÉS
     
     IMPORTANT :
     On ne crée jamais Octobre, Novembre, etc.
     si aucune cotisation n'existe pour ces mois.
  ========================================================== */

  const moisEnregistres = useMemo(() => {
    const ensemble = new Set();

    cotisations.forEach(
      (cotisation) => {
        if (
          cotisation?.actif === false
        ) {
          return;
        }

        if (
          cotisation?.mois_concerne &&
          cotisation?.annee
        ) {
          ensemble.add(
            `${cotisation.annee}|${cotisation.mois_concerne}`
          );
        }
      }
    );

    return Array.from(ensemble);
  }, [cotisations]);


  /* ==========================================================
     ANNÉES DISPONIBLES
  ========================================================== */

  const anneesDisponibles = useMemo(() => {
    const annees = new Set();

    cotisations.forEach(
      (cotisation) => {
        if (
          cotisation?.annee
        ) {
          annees.add(
            Number(cotisation.annee)
          );
        }
      }
    );

    annees.add(ANNEE_ACTUELLE);

    return Array.from(annees).sort(
      (a, b) => b - a
    );
  }, [cotisations]);


  /* ==========================================================
     COTISATIONS INDEXÉES
     
     Une cotisation = membre + mois + année
  ========================================================== */

  const cotisationsMap = useMemo(() => {
    const map = new Map();

    cotisations.forEach(
      (cotisation) => {
        const cle = `${cotisation.membre_id}|${cotisation.mois_concerne}|${cotisation.annee}`;

        map.set(
          cle,
          cotisation
        );
      }
    );

    return map;
  }, [cotisations]);


  /* ==========================================================
     SITUATIONS MENSUELLES
     
     Pour chaque mois réellement enregistré :
     - Tous les membres actifs sont considérés.
     - Si cotisation existe : on l'utilise.
     - Sinon : membre = impayé avec son montant fixe.
  ========================================================== */

  const situationsMensuelles = useMemo(() => {
    const resultat = [];

    moisEnregistres.forEach(
      (cleMois) => {
        const [
          anneeTexte,
          mois,
        ] = cleMois.split("|");

        const annee = Number(
          anneeTexte
        );

        membresActifs.forEach(
          (membre) => {
            const cle =
              `${membre.id}|${mois}|${annee}`;

            const cotisation =
              cotisationsMap.get(cle) ||
              null;

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
              montantFixe -
                montantPaye
            );

            const statut =
              calculerStatut(
                montantFixe,
                montantPaye
              );

            resultat.push({
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
          }
        );
      }
    );

    return resultat;
  }, [
    moisEnregistres,
    membresActifs,
    cotisationsMap,
  ]);


  /* ==========================================================
     FILTRAGE
  ========================================================== */

  const situationsFiltrees = useMemo(() => {
    const rechercheNormalisee =
      recherche
        .trim()
        .toLowerCase();

    return situationsMensuelles.filter(
      (situation) => {
        const nomComplet =
          `${situation.membre?.prenom || ""} ${
            situation.membre?.nom || ""
          }`
            .trim()
            .toLowerCase();

        const telephone =
          String(
            situation.membre?.telephone ||
              ""
          ).toLowerCase();

        const correspondRecherche =
          !rechercheNormalisee ||
          nomComplet.includes(
            rechercheNormalisee
          ) ||
          telephone.includes(
            rechercheNormalisee
          );

        const correspondMois =
          !moisFiltre ||
          situation.mois ===
            moisFiltre;

        const correspondAnnee =
          !anneeFiltre ||
          Number(
            situation.annee
          ) ===
            Number(anneeFiltre);

        /*
         * RÈGLE IMPORTANTE :
         *
         * "Tous" ne montre que les cotisations
         * réellement enregistrées.
         *
         * "Impayées" montre tous ceux qui ont
         * 0 payé, même sans cotisation.
         */
        let correspondStatut = true;

        if (
          statutFiltre === "tous" ||
          !statutFiltre
        ) {
          correspondStatut =
            situation.cotisationExiste;
        } else if (
          statutFiltre === "payee"
        ) {
          correspondStatut =
            situation.cotisationExiste &&
            situation.statut ===
              "payee";
        } else if (
          statutFiltre === "partielle"
        ) {
          correspondStatut =
            situation.cotisationExiste &&
            situation.statut ===
              "partielle";
        } else if (
          statutFiltre === "impayee"
        ) {
          correspondStatut =
            situation.montantPaye <=
            0;
        }

        return (
          correspondRecherche &&
          correspondMois &&
          correspondAnnee &&
          correspondStatut
        );
      }
    );
  }, [
    situationsMensuelles,
    recherche,
    moisFiltre,
    anneeFiltre,
    statutFiltre,
  ]);


  /* ==========================================================
     GROUPES PAR MOIS
  ========================================================== */

  const groupesParMois = useMemo(() => {
    const groupes = {};

    situationsFiltrees.forEach(
      (situation) => {
        const cle =
          `${situation.annee}|${situation.mois}`;

        if (!groupes[cle]) {
          groupes[cle] = {
            mois: situation.mois,
            annee: situation.annee,
            situations: [],
          };
        }

        groupes[cle].situations.push(
          situation
        );
      }
    );

    return Object.values(
      groupes
    ).sort((a, b) => {
      if (a.annee !== b.annee) {
        return b.annee - a.annee;
      }

      return (
        MOIS.indexOf(b.mois) -
        MOIS.indexOf(a.mois)
      );
    });
  }, [situationsFiltrees]);


  /* ==========================================================
     MOIS / ANNÉE SÉLECTIONNÉS POUR LE RÉSUMÉ
  ========================================================== */

  const moisResume = useMemo(() => {
    if (moisFiltre) {
      return moisFiltre;
    }

    const premier =
      groupesParMois[0];

    return premier?.mois || null;
  }, [
    moisFiltre,
    groupesParMois,
  ]);


  const anneeResume = useMemo(() => {
    if (anneeFiltre) {
      return Number(
        anneeFiltre
      );
    }

    const premier =
      groupesParMois[0];

    return premier?.annee ||
      null;
  }, [
    anneeFiltre,
    groupesParMois,
  ]);


  /* ==========================================================
     RÉSUMÉ GLOBAL
     
     L'estimation est TOUJOURS basée sur
     tous les membres actifs.
     
     Le total versé est basé sur les paiements
     réellement encaissés pour le mois affiché.
  ========================================================== */

  const resume = useMemo(() => {
    if (
      !moisResume ||
      !anneeResume
    ) {
      return {
        nombreCotisations: 0,
        estimation: 0,
        totalPaye: 0,
        resteGlobal: 0,
        payees: 0,
        partielles: 0,
        impayees: 0,
      };
    }

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

    const situationsDuMois =
      situationsMensuelles.filter(
        (situation) =>
          situation.mois ===
            moisResume &&
          Number(
            situation.annee
          ) ===
            Number(anneeResume)
      );

    /*
     * Le nombre de cotisations correspond
     * uniquement aux cotisations réellement
     * enregistrées.
     */
    const nombreCotisations =
      situationsDuMois.filter(
        (situation) =>
          situation.cotisationExiste
      ).length;

    /*
     * Le total versé correspond uniquement
     * aux paiements effectifs.
     */
    const totalPaye =
      situationsDuMois.reduce(
        (total, situation) =>
          total +
          Number(
            situation.montantPaye ||
              0
          ),
        0
      );

    /*
     * Reste global :
     * estimation de TOUS les membres
     * moins paiements réellement reçus.
     */
    const resteGlobal =
      Math.max(
        0,
        estimation -
          totalPaye
      );

    /*
     * Les statistiques de statut
     * portent uniquement sur les cotisations
     * réellement enregistrées.
     */
    const cotisationsEnregistrees =
      situationsDuMois.filter(
        (situation) =>
          situation.cotisationExiste
      );

    const payees =
      cotisationsEnregistrees.filter(
        (situation) =>
          situation.statut ===
          "payee"
      ).length;

    const partielles =
      cotisationsEnregistrees.filter(
        (situation) =>
          situation.statut ===
          "partielle"
      ).length;

    const impayees =
      cotisationsEnregistrees.filter(
        (situation) =>
          situation.statut ===
          "impayee"
      ).length;

    return {
      nombreCotisations,
      estimation,
      totalPaye,
      resteGlobal,
      payees,
      partielles,
      impayees,
    };
  }, [
    moisResume,
    anneeResume,
    membresActifs,
    situationsMensuelles,
  ]);


  /* ==========================================================
     MES COTISATIONS
     
     On affiche d'abord les cotisations
     du membre connecté si l'information
     membre_id est disponible dans le stockage.
  ========================================================== */

  const mesCotisations = useMemo(() => {
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

    if (!membreConnecteId) {
      return [];
    }

    return cotisations
      .filter(
        (cotisation) =>
          Number(
            cotisation.membre_id
          ) ===
          membreConnecteId
      )
      .map(
        (cotisation) => ({
          ...cotisation,
          montantPaye:
            obtenirMontantPaye(
              cotisation
            ),
        })
      )
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
          MOIS.indexOf(
            b.mois_concerne
          ) -
          MOIS.indexOf(
            a.mois_concerne
          )
        );
      });
  }, [cotisations]);


  /* ==========================================================
     FORMULAIRE
  ========================================================== */

  const ouvrirCreation = (
    membre = null,
    mois = moisResume
  ) => {
    setEdition(false);
    setCotisationSelectionnee(
      null
    );

    setFormulaire({
      membre_id:
        membre?.id
          ? String(membre.id)
          : "",
      montant:
        membre?.montant_cotisation
          ? String(
              membre.montant_cotisation
            )
          : "",
      mois_concerne:
        mois || "",
      annee:
        anneeResume ||
        ANNEE_ACTUELLE,
      date_cotisation:
        new Date()
          .toISOString()
          .split("T")[0],
    });

    setModalCotisation(true);
  };


  const ouvrirModification = (
    cotisation
  ) => {
    setEdition(true);
    setCotisationSelectionnee(
      cotisation
    );

    setFormulaire({
      membre_id:
        String(
          cotisation.membre_id
        ),
      montant:
        String(
          cotisation.montant || ""
        ),
      mois_concerne:
        cotisation.mois_concerne ||
        "",
      annee:
        Number(
          cotisation.annee
        ),
      date_cotisation:
        cotisation.date_cotisation
          ?.split("T")[0] ||
        new Date()
          .toISOString()
          .split("T")[0],
    });

    setModalCotisation(true);
  };


  const fermerModalCotisation = () => {
    if (enregistrement) {
      return;
    }

    setModalCotisation(false);
    setEdition(false);
    setCotisationSelectionnee(
      null
    );
  };


  const ouvrirPaiement = (
    situation
  ) => {
    if (
      !situation.cotisation
    ) {
      /*
       * Pas de cotisation enregistrée :
       * on doit d'abord créer la cotisation.
       */
      ouvrirCreation(
        situation.membre,
        situation.mois
      );

      return;
    }

    setCotisationSelectionnee(
      situation.cotisation
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

    setModalPaiement(true);
  };


  /* ==========================================================
     ENREGISTRER / MODIFIER COTISATION
  ========================================================== */

  const soumettreCotisation = async (
    evenement
  ) => {
    evenement.preventDefault();

    try {
      setEnregistrement(true);
      setErreur("");

      if (
        !formulaire.membre_id
      ) {
        throw new Error(
          "Veuillez sélectionner un membre."
        );
      }

      if (
        !formulaire.montant ||
        Number(
          formulaire.montant
        ) <= 0
      ) {
        throw new Error(
          "Le montant doit être supérieur à zéro."
        );
      }

      /*
       * IMPORTANT :
       *
       * On ne transmet PAS montant_cotise
       * ici.
       *
       * La création d'une cotisation ne
       * constitue pas un paiement.
       */
      const payload = {
        membre_id:
          Number(
            formulaire.membre_id
          ),
        montant:
          Number(
            formulaire.montant
          ),
        mois_concerne:
          formulaire.mois_concerne,
        annee:
          Number(
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
      setEdition(false);
      setCotisationSelectionnee(
        null
      );

      await chargerDonnees();
    } catch (error) {
      console.error(error);

      setErreur(
        error?.response?.data?.detail ||
          error?.message ||
          "Impossible d'enregistrer la cotisation."
      );
    } finally {
      setEnregistrement(false);
    }
  };


  /* ==========================================================
     AJOUTER PAIEMENT
  ========================================================== */

  const soumettrePaiement = async (
    evenement
  ) => {
    evenement.preventDefault();

    try {
      setEnregistrement(true);
      setErreur("");

      const montant =
        Number(
          formulairePaiement.montant
        );

      if (
        !montant ||
        montant <= 0
      ) {
        throw new Error(
          "Le montant du paiement doit être supérieur à zéro."
        );
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
      setCotisationSelectionnee(
        null
      );

      await chargerDonnees();
    } catch (error) {
      console.error(error);

      setErreur(
        error?.response?.data?.detail ||
          error?.message ||
          "Impossible d'enregistrer le paiement."
      );
    } finally {
      setEnregistrement(false);
    }
  };


  /* ==========================================================
     SUPPRIMER
  ========================================================== */

  const supprimer = async (
    cotisation
  ) => {
    const confirmation =
      window.confirm(
        `Voulez-vous vraiment supprimer la cotisation de ${cotisation.mois_concerne} ${cotisation.annee} ?`
      );

    if (!confirmation) {
      return;
    }

    try {
      setEnregistrement(true);
      setErreur("");

      await supprimerCotisation(
        cotisation.id
      );

      await chargerDonnees();
    } catch (error) {
      console.error(error);

      setErreur(
        error?.response?.data?.detail ||
          "Impossible de supprimer la cotisation."
      );
    } finally {
      setEnregistrement(false);
    }
  };


  /* ==========================================================
     RÉINITIALISER FILTRES
  ========================================================== */

  const reinitialiserFiltres = () => {
    setRecherche("");
    setMoisFiltre("");
    setAnneeFiltre("");
    setStatutFiltre("");
  };


  /* ==========================================================
     RENDU
  ========================================================== */

  if (chargement) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }


  return (
    <div className="space-y-6">

      {/* ======================================================
          EN-TÊTE
      ====================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Cotisations
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Suivi des cotisations et des paiements réellement encaissés.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            ouvrirCreation()
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          Nouvelle cotisation
        </button>
      </div>


      {/* ======================================================
          ERREUR
      ====================================================== */}

      {erreur && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="flex-1">
            {erreur}
          </div>

          <button
            type="button"
            onClick={() =>
              setErreur("")
            }
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}


      {/* ======================================================
          MES COTISATIONS
      ====================================================== */}

      {mesCotisations.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-900">
              Ma cotisation
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Vos cotisations personnelles enregistrées.
            </p>
          </div>

          <div className="divide-y divide-slate-100">

            {mesCotisations.map(
              (cotisation) => {
                const montantPaye =
                  cotisation.montantPaye;

                const reste =
                  Math.max(
                    0,
                    Number(
                      cotisation.montant ||
                        0
                    ) -
                      montantPaye
                  );

                const statut =
                  calculerStatut(
                    cotisation.montant,
                    montantPaye
                  );

                return (
                  <div
                    key={
                      cotisation.id
                    }
                    className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between"
                  >

                    <div>
                      <p className="font-semibold text-slate-900">
                        {
                          cotisation.mois_concerne
                        }{" "}
                        {
                          cotisation.annee
                        }
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Cotisation :{" "}
                        {formaterMontant(
                          cotisation.montant
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm">

                      <span>
                        Versé :{" "}
                        <strong>
                          {formaterMontant(
                            montantPaye
                          )}
                        </strong>
                      </span>

                      <span>
                        Reste :{" "}
                        <strong>
                          {formaterMontant(
                            reste
                          )}
                        </strong>
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          statut ===
                          "payee"
                            ? "bg-green-100 text-green-700"
                            : statut ===
                              "partielle"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {statut ===
                        "payee"
                          ? "Payée"
                          : statut ===
                            "partielle"
                          ? "Partielle"
                          : "Impayée"}
                      </span>

                    </div>

                  </div>
                );
              }
            )}

          </div>
        </section>
      )}


      {/* ======================================================
          FILTRES
      ====================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="mb-4 flex items-center gap-2">
          <Search className="h-5 w-5 text-slate-500" />

          <h2 className="font-bold text-slate-900">
            Filtres
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">

          {/* Recherche */}

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={recherche}
              onChange={(e) =>
                setRecherche(
                  e.target.value
                )
              }
              placeholder="Rechercher un membre..."
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-slate-500"
            />
          </div>


          {/* Mois */}

          <select
            value={moisFiltre}
            onChange={(e) =>
              setMoisFiltre(
                e.target.value
              )
            }
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none"
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


          {/* Année */}

          <select
            value={anneeFiltre}
            onChange={(e) =>
              setAnneeFiltre(
                e.target.value
              )
            }
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none"
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


          {/* Statut */}

          <select
            value={statutFiltre}
            onChange={(e) =>
              setStatutFiltre(
                e.target.value
              )
            }
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none"
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


          {/* Reset */}

          <button
            type="button"
            onClick={
              reinitialiserFiltres
            }
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Réinitialiser les filtres
          </button>

        </div>

      </section>


      {/* ======================================================
          RÉSUMÉ
      ====================================================== */}

      {moisResume && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

          {/* Cotisations enregistrées */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Cotisations enregistrées
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {
                    resume.nombreCotisations
                  }
                </p>
              </div>

              <div className="rounded-xl bg-slate-100 p-3">
                <Calendar className="h-5 w-5 text-slate-600" />
              </div>

            </div>

          </div>


          {/* Estimation */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Estimation mensuelle
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formaterMontant(
                    resume.estimation
                  )}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Tous les membres actifs
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-3">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>

            </div>

          </div>


          {/* Total versé */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Total versé
                </p>

                <p className="mt-2 text-2xl font-bold text-green-600">
                  {formaterMontant(
                    resume.totalPaye
                  )}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Paiements réellement encaissés
                </p>
              </div>

              <div className="rounded-xl bg-green-50 p-3">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>

            </div>

          </div>


          {/* Reste global */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Reste global
                </p>

                <p className="mt-2 text-2xl font-bold text-orange-600">
                  {formaterMontant(
                    resume.resteGlobal
                  )}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Estimation − paiements reçus
                </p>
              </div>

              <div className="rounded-xl bg-orange-50 p-3">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>

            </div>

          </div>

        </section>
      )}


      {/* ======================================================
          SITUATION
      ====================================================== */}

      {moisResume && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex flex-wrap items-center gap-3">

            <span className="font-semibold text-slate-900">
              Situation
            </span>

            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              {resume.payees} payées
            </span>

            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
              {resume.partielles} partielles
            </span>

            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              {resume.impayees} impayées
            </span>

          </div>

        </div>
      )}


      {/* ======================================================
          LISTE
      ====================================================== */}

      {groupesParMois.length === 0 ? (

        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">

          <Calendar className="mx-auto h-10 w-10 text-slate-300" />

          <h3 className="mt-4 font-semibold text-slate-900">
            Aucune cotisation enregistrée
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Aucun mois ne sera affiché tant qu'aucune cotisation n'y aura été enregistrée.
          </p>

        </div>

      ) : (

        <div className="space-y-6">

          {groupesParMois.map(
            (groupe) => {

              /*
               * Estimation du mois =
               * tous les membres actifs.
               */

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
                groupe.situations.reduce(
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

              const resteGlobal =
                Math.max(
                  0,
                  estimation -
                    totalPaye
                );

              return (
                <section
                  key={`${groupe.annee}-${groupe.mois}`}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >

                  {/* En-tête mois */}

                  <div className="border-b border-slate-200 bg-slate-50 p-5">

                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                      <div>
                        <h2 className="text-lg font-bold text-slate-900">
                          {
                            groupe.mois
                          }{" "}
                          {
                            groupe.annee
                          }
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          {
                            groupe.situations.filter(
                              (
                                situation
                              ) =>
                                situation.cotisationExiste
                            ).length
                          }{" "}
                          cotisation(s) enregistrée(s)
                        </p>
                      </div>


                      <div className="flex flex-wrap gap-4 text-sm">

                        <div>
                          <span className="text-slate-500">
                            Estimation
                          </span>

                          <strong className="ml-2 text-slate-900">
                            {formaterMontant(
                              estimation
                            )}
                          </strong>
                        </div>

                        <div>
                          <span className="text-slate-500">
                            Total versé
                          </span>

                          <strong className="ml-2 text-green-600">
                            {formaterMontant(
                              totalPaye
                            )}
                          </strong>
                        </div>

                        <div>
                          <span className="text-slate-500">
                            Reste
                          </span>

                          <strong className="ml-2 text-orange-600">
                            {formaterMontant(
                              resteGlobal
                            )}
                          </strong>
                        </div>

                      </div>

                    </div>

                  </div>


                  {/* Tableau */}

                  <div className="overflow-x-auto">

                    <table className="min-w-full">

                      <thead className="border-b border-slate-200 bg-white">

                        <tr>

                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Membre
                          </th>

                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Mois
                          </th>

                          <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Cotisation
                          </th>

                          <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Versé
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

                        {groupe.situations.map(
                          (
                            situation
                          ) => {

                            const {
                              membre,
                              cotisation,
                              cotisationExiste,
                              montantFixe,
                              montantPaye,
                              reste,
                              statut,
                            } = situation;

                            return (
                              <tr
                                key={`${groupe.annee}-${groupe.mois}-${membre.id}`}
                                className="hover:bg-slate-50"
                              >

                                {/* Membre */}

                                <td className="px-5 py-4">

                                  <div className="font-semibold text-slate-900">
                                    {
                                      membre?.prenom
                                    }{" "}
                                    {
                                      membre?.nom
                                    }
                                  </div>

                                  {membre?.telephone && (
                                    <div className="mt-1 text-xs text-slate-500">
                                      {
                                        membre.telephone
                                      }
                                    </div>
                                  )}

                                </td>


                                {/* Mois */}

                                <td className="px-5 py-4 text-sm text-slate-600">
                                  {
                                    groupe.mois
                                  }{" "}
                                  {
                                    groupe.annee
                                  }
                                </td>


                                {/* Cotisation */}

                                <td className="px-5 py-4 text-right text-sm font-medium text-slate-900">
                                  {formaterMontant(
                                    montantFixe
                                  )}
                                </td>


                                {/* Versé */}

                                <td className="px-5 py-4 text-right text-sm font-semibold text-green-600">
                                  {formaterMontant(
                                    montantPaye
                                  )}
                                </td>


                                {/* Reste */}

                                <td className="px-5 py-4 text-right text-sm font-semibold text-orange-600">
                                  {formaterMontant(
                                    reste
                                  )}
                                </td>


                                {/* Statut */}

                                <td className="px-5 py-4 text-center">

                                  <span
                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                      statut ===
                                      "payee"
                                        ? "bg-green-100 text-green-700"
                                        : statut ===
                                          "partielle"
                                        ? "bg-orange-100 text-orange-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    {statut ===
                                    "payee"
                                      ? "Payée"
                                      : statut ===
                                        "partielle"
                                      ? "Partielle"
                                      : "Impayée"}
                                  </span>

                                </td>


                                {/* Actions */}

                                <td className="px-5 py-4">

                                  <div className="flex justify-end gap-2">

                                    {cotisationExiste ? (
                                      <>
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
                                          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                                          title="Détails"
                                        >
                                          <Eye className="h-4 w-4" />
                                        </button>


                                        {statut !==
                                          "payee" && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              ouvrirPaiement(
                                                situation
                                              )
                                            }
                                            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                                          >
                                            Payer
                                          </button>
                                        )}


                                        <button
                                          type="button"
                                          onClick={() =>
                                            ouvrirModification(
                                              cotisation
                                            )
                                          }
                                          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                                          title="Modifier"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </button>


                                        <button
                                          type="button"
                                          onClick={() =>
                                            supprimer(
                                              cotisation
                                            )
                                          }
                                          className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                                          title="Supprimer"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </>
                                    ) : (

                                      /*
                                       * Aucun enregistrement :
                                       * on ne propose PAS "Payer".
                                       * Il faut d'abord créer
                                       * la cotisation.
                                       */

                                      <button
                                        type="button"
                                        onClick={() =>
                                          ouvrirCreation(
                                            membre,
                                            groupe.mois
                                          )
                                        }
                                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                                      >
                                        <Plus className="h-3.5 w-3.5" />
                                        Enregistrer
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

                </section>
              );
            }
          )}

        </div>
      )}


      {/* ======================================================
          MODAL COTISATION
      ====================================================== */}

      {modalCotisation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-slate-200 p-5">

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {edition
                    ? "Modifier la cotisation"
                    : "Nouvelle cotisation"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Le paiement réel sera enregistré séparément.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  fermerModalCotisation
                }
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>

            </div>


            <form
              onSubmit={
                soumettreCotisation
              }
              className="space-y-4 p-5"
            >

              {/* Membre */}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Membre
                </label>

                <select
                  value={
                    formulaire.membre_id
                  }
                  onChange={(e) => {
                    const membre =
                      membresActifs.find(
                        (item) =>
                          String(
                            item.id
                          ) ===
                          e.target.value
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
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none"
                  required
                >

                  <option value="">
                    Sélectionner un membre
                  </option>

                  {membresActifs.map(
                    (membre) => (
                      <option
                        key={
                          membre.id
                        }
                        value={
                          membre.id
                        }
                      >
                        {
                          membre.prenom
                        }{" "}
                        {
                          membre.nom
                        }
                      </option>
                    )
                  )}

                </select>

              </div>


              {/* Montant */}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Montant de la cotisation
                </label>

                <input
                  type="number"
                  min="1"
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
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none"
                  required
                />

                <p className="mt-1 text-xs text-slate-500">
                  Il s'agit du montant fixe/dû, pas du paiement reçu.
                </p>

              </div>


              {/* Mois */}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
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
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none"
                  required
                >

                  <option value="">
                    Sélectionner un mois
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


              {/* Année */}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Année
                </label>

                <input
                  type="number"
                  min="2000"
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
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none"
                  required
                />
              </div>


              {/* Date */}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Date
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
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none"
                  required
                />
              </div>


              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={
                    fermerModalCotisation
                  }
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={
                    enregistrement
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {enregistrement && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {edition
                    ? "Modifier"
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

            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

              <div className="flex items-center justify-between border-b border-slate-200 p-5">

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Ajouter un paiement
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
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
                    setModalPaiement(
                      false
                    )
                  }
                  className="rounded-lg p-2 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>

              </div>


              <form
                onSubmit={
                  soumettrePaiement
                }
                className="space-y-4 p-5"
              >

                <div className="rounded-xl bg-slate-50 p-4">

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">
                      Cotisation
                    </span>

                    <strong>
                      {formaterMontant(
                        cotisationSelectionnee.montant
                      )}
                    </strong>
                  </div>

                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-slate-500">
                      Déjà versé
                    </span>

                    <strong className="text-green-600">
                      {formaterMontant(
                        obtenirMontantPaye(
                          cotisationSelectionnee
                        )
                      )}
                    </strong>
                  </div>

                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-slate-500">
                      Reste
                    </span>

                    <strong className="text-orange-600">
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
                    </strong>
                  </div>

                </div>


                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Montant du paiement
                  </label>

                  <input
                    type="number"
                    min="1"
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
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none"
                    required
                  />
                </div>


                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
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
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none"
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
                  </select>
                </div>


                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
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
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none"
                    required
                  />
                </div>


                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Référence
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
                    placeholder="Facultatif"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none"
                  />
                </div>


                <div className="flex justify-end gap-3 pt-2">

                  <button
                    type="button"
                    onClick={() =>
                      setModalPaiement(
                        false
                      )
                    }
                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700"
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    disabled={
                      enregistrement
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {enregistrement && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}

                    Enregistrer le paiement
                  </button>

                </div>

              </form>

            </div>

          </div>
        )}


      {/* ======================================================
          MODAL DÉTAILS
      ====================================================== */}

      {modalDetails &&
        cotisationSelectionnee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

              <div className="flex items-center justify-between border-b border-slate-200 p-5">

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Détails de la cotisation
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
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
                  className="rounded-lg p-2 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>

              </div>


              <div className="space-y-4 p-5">

                <div className="grid grid-cols-2 gap-3">

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      Montant fixe
                    </p>

                    <p className="mt-1 font-bold text-slate-900">
                      {formaterMontant(
                        cotisationSelectionnee.montant
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-green-50 p-4">
                    <p className="text-xs text-slate-500">
                      Total payé
                    </p>

                    <p className="mt-1 font-bold text-green-700">
                      {formaterMontant(
                        obtenirMontantPaye(
                          cotisationSelectionnee
                        )
                      )}
                    </p>
                  </div>

                </div>


                <div className="rounded-xl bg-orange-50 p-4">

                  <p className="text-xs text-slate-500">
                    Reste
                  </p>

                  <p className="mt-1 font-bold text-orange-700">
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


                <div>

                  <h3 className="mb-3 font-semibold text-slate-900">
                    Paiements enregistrés
                  </h3>

                  {Array.isArray(
                    cotisationSelectionnee.paiements
                  ) &&
                  cotisationSelectionnee
                    .paiements
                    .length > 0 ? (

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
                              <p className="font-medium text-slate-900">
                                {formaterMontant(
                                  paiement.montant
                                )}
                              </p>

                              <p className="text-xs text-slate-500">
                                {
                                  paiement.mode_paiement
                                }{" "}
                                •{" "}
                                {
                                  paiement.date_paiement
                                }
                              </p>
                            </div>

                          </div>
                        )
                      )}

                    </div>

                  ) : (

                    <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                      Aucun paiement enregistré.
                    </div>

                  )}

                </div>


                <div className="flex justify-end">

                  <button
                    type="button"
                    onClick={() =>
                      setModalDetails(
                        false
                      )
                    }
                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700"
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
};


export default Cotisations;