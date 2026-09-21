import { useEffect, useState } from "react";

import {
  Wallet,
  TrendingDown,
  HandCoins,
  Receipt,
  Plus,
  RefreshCw,
  X,
  CalendarDays,
  FileText,
  Building2,
  AlertCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  UserRound,
  Paperclip,
  ExternalLink,
} from "lucide-react";

import api from "../api/client";
import { useAuth } from "../context/AuthContext";


function Finances() {

  // ============================================================
  // AUTHENTIFICATION / PERMISSIONS
  // ============================================================

  const {
    utilisateur,
    aPermission,
  } = useAuth();


  const peutConsulterDepenses =
    aPermission("DEPENSE_CONSULTER");

  const peutCreerDepense =
    aPermission("DEPENSE_CREER");

  const peutConsulterAides =
    aPermission("AIDE_EXTERIEURE_CONSULTER");

  const peutCreerAide =
    aPermission("AIDE_EXTERIEURE_CREER");

  const peutConsulterCotisations =
    aPermission("COTISATION_CONSULTER");

  const peutCreerCotisation =
    aPermission("COTISATION_CREER");


  // ============================================================
  // ÉTATS
  // ============================================================

  const [depenses, setDepenses] = useState([]);

  const [aides, setAides] = useState([]);

  const [cotisations, setCotisations] = useState([]);

  const [membresActifs, setMembresActifs] = useState([]);

  const [chargement, setChargement] = useState(true);

  const [erreur, setErreur] = useState("");

  const [modal, setModal] = useState(null);

  const [enregistrement, setEnregistrement] =
    useState(false);

  const [messageSucces, setMessageSucces] =
    useState("");

  const [erreurFormulaire, setErreurFormulaire] =
    useState("");


  // ============================================================
  // FORMULAIRE SORTIE D'ARGENT
  // ============================================================

  const [formDepense, setFormDepense] = useState({

    motif: "",

    type_sortie: "",

    remis_a: "",

    piece_jointe: null,

    montant: "",

    date_depense:
      new Date()
        .toISOString()
        .split("T")[0],

    description: "",
  });


  // ============================================================
  // FORMULAIRE BARKELou / VERSEMENT
  // ============================================================

  const [formAide, setFormAide] = useState({

    source: "",

    montant: "",

    description: "",

    date_aide:
      new Date()
        .toISOString()
        .split("T")[0],

    membre_id: "",
  });


  // ============================================================
  // FORMATAGE MONTANT
  // ============================================================

  function formaterMontant(montant) {

    return new Intl.NumberFormat("fr-FR", {

      maximumFractionDigits: 0,

    }).format(
      Number(montant ?? 0)
    );

  }


  // ============================================================
  // NOM DU MEMBRE
  // ============================================================

  function obtenirNomMembre(membre) {

    if (!membre) {
      return "";
    }

    return [
      membre.prenom,
      membre.nom,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

  }


  // ============================================================
  // CHARGER LES MEMBRES ACTIFS
  // ============================================================

  async function chargerMembresActifs() {

    if (!peutCreerCotisation) {

      setMembresActifs([]);

      return;

    }


    try {

      const response =
        await api.get(
          "/cotisations/membres-actifs"
        );


      const membres =
        Array.isArray(response.data)
          ? response.data
          : [];


      setMembresActifs(membres);

    } catch (error) {

      console.error(
        "ERREUR CHARGEMENT MEMBRES ACTIFS :",
        error
      );


      setMembresActifs([]);

    }

  }


  // ============================================================
  // CHARGEMENT
  // ============================================================

  async function chargerDonnees() {

    try {

      setChargement(true);

      setErreur("");


      const requetes = [];


      // --------------------------------------------------------
      // DÉPENSES
      // --------------------------------------------------------

      if (peutConsulterDepenses) {

        requetes.push(
          api
            .get("/depenses")
            .then((response) => {

              console.log(
                "SORTIES D'ARGENT :",
                response.data
              );

              setDepenses(
                Array.isArray(response.data)
                  ? response.data
                  : []
              );

            })
        );

      } else {

        setDepenses([]);

      }


      // --------------------------------------------------------
      // BARKELou / AIDES EXTÉRIEURES
      // --------------------------------------------------------

      if (peutConsulterAides) {

        requetes.push(
          api
            .get("/aides-exterieures")
            .then((response) => {

              console.log(
                "AIDES EXTÉRIEURES :",
                response.data
              );

              setAides(
                Array.isArray(response.data)
                  ? response.data
                  : []
              );

            })
        );

      } else {

        setAides([]);

      }


      // --------------------------------------------------------
      // COTISATIONS / PAIEMENTS RÉELS
      // --------------------------------------------------------

      if (peutConsulterCotisations) {

        requetes.push(
          api
            .get("/cotisations")
            .then((response) => {

              console.log(
                "COTISATIONS / PAIEMENTS :",
                response.data
              );

              setCotisations(
                Array.isArray(
                  response.data?.cotisations
                )
                  ? response.data.cotisations
                  : []
              );

            })
        );

      } else {

        setCotisations([]);

      }


      // --------------------------------------------------------
      // MEMBRES ACTIFS
      // --------------------------------------------------------

      if (peutCreerCotisation) {

        requetes.push(
          api
            .get("/cotisations/membres-actifs")
            .then((response) => {

              console.log(
                "MEMBRES ACTIFS :",
                response.data
              );

              setMembresActifs(
                Array.isArray(response.data)
                  ? response.data
                  : []
              );

            })
            .catch((error) => {

              console.error(
                "ERREUR MEMBRES ACTIFS :",
                error
              );

              setMembresActifs([]);

            })
        );

      } else {

        setMembresActifs([]);

      }


      await Promise.all(requetes);

    } catch (error) {

      console.error(
        "ERREUR FINANCES :",
        error
      );


      if (
        error.response?.status === 401
      ) {

        setErreur(
          "Votre session a expiré. Veuillez vous reconnecter."
        );

      } else if (
        error.response?.status === 403
      ) {

        setErreur(
          "Vous n'avez pas la permission d'accéder à cette partie de la gestion financière."
        );

      } else {

        setErreur(
          error.response?.data?.detail ||
          "Impossible de charger les données financières."
        );

      }

    } finally {

      setChargement(false);

    }

  }


  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================

  useEffect(() => {

    if (!utilisateur) {
      return;
    }

    chargerDonnees();

  }, [
    utilisateur,
    peutConsulterDepenses,
    peutCreerDepense,
    peutConsulterAides,
    peutCreerAide,
    peutConsulterCotisations,
    peutCreerCotisation,
  ]);


  // ============================================================
  // OUVRIR MODAL
  // ============================================================

  async function ouvrirModal(type) {

    setErreurFormulaire("");

    setMessageSucces("");

    setModal(type);


    if (
      type === "aide" &&
      peutCreerCotisation
    ) {

      await chargerMembresActifs();

    }

  }


  // ============================================================
  // FERMER MODAL
  // ============================================================

  function fermerModal() {

    if (enregistrement) {

      return;

    }

    setModal(null);

    setErreurFormulaire("");

    setMessageSucces("");

  }


  // ============================================================
  // MODIFIER SORTIE
  // ============================================================

  function modifierDepense(
    champ,
    valeur
  ) {

    setFormDepense(
      (ancien) => ({

        ...ancien,

        [champ]: valeur,

      })
    );

  }


  // ============================================================
  // MODIFIER PIÈCE JOINTE
  // ============================================================

  function modifierPieceJointe(event) {

    const fichier =
      event.target.files?.[0] || null;

    modifierDepense(
      "piece_jointe",
      fichier
    );

  }


  // ============================================================
  // MODIFIER BARKELou
  // ============================================================

  function modifierAide(
    champ,
    valeur
  ) {

    setFormAide(
      (ancien) => ({

        ...ancien,

        [champ]: valeur,

      })
    );

  }


  // ============================================================
  // AJOUTER SORTIE D'ARGENT
  // ============================================================

  async function ajouterDepense(event) {

    event.preventDefault();

    setErreurFormulaire("");

    setMessageSucces("");


    if (!peutCreerDepense) {

      setErreurFormulaire(
        "Vous n'avez pas la permission d'enregistrer une sortie d'argent."
      );

      return;

    }


    if (!formDepense.motif.trim()) {

      setErreurFormulaire(
        "Veuillez saisir le motif de la sortie d'argent."
      );

      return;

    }


    if (!formDepense.type_sortie) {

      setErreurFormulaire(
        "Veuillez sélectionner le type de sortie."
      );

      return;

    }


    if (!formDepense.remis_a.trim()) {

      setErreurFormulaire(
        "Veuillez préciser à qui l'argent a été remis."
      );

      return;

    }


    if (
      !formDepense.montant ||
      Number(formDepense.montant) <= 0
    ) {

      setErreurFormulaire(
        "Le montant doit être supérieur à zéro."
      );

      return;

    }


    if (!formDepense.date_depense) {

      setErreurFormulaire(
        "Veuillez sélectionner une date."
      );

      return;

    }


    try {

      setEnregistrement(true);


      const donnees =
        new FormData();


      donnees.append(
        "motif",
        formDepense.motif.trim()
      );


      donnees.append(
        "type_sortie",
        formDepense.type_sortie
      );


      donnees.append(
        "remis_a",
        formDepense.remis_a.trim()
      );


      donnees.append(
        "montant",
        String(
          Number(formDepense.montant)
        )
      );


      donnees.append(
        "date_depense",
        formDepense.date_depense
      );


      if (
        formDepense.description.trim()
      ) {

        donnees.append(
          "description",
          formDepense.description.trim()
        );

      }


      if (
        formDepense.piece_jointe
      ) {

        donnees.append(
          "piece_jointe",
          formDepense.piece_jointe
        );

      }


      await api.post(
        "/depenses",
        donnees,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );


      setMessageSucces(
        "La sortie d'argent a été enregistrée avec succès."
      );


      setFormDepense({

        motif: "",

        type_sortie: "",

        remis_a: "",

        piece_jointe: null,

        montant: "",

        date_depense:
          new Date()
            .toISOString()
            .split("T")[0],

        description: "",

      });


      await chargerDonnees();


      setTimeout(() => {

        setModal(null);

        setMessageSucces("");

      }, 800);


    } catch (error) {

      console.error(
        "ERREUR AJOUT SORTIE :",
        error
      );


      if (
        error.response?.status === 403
      ) {

        setErreurFormulaire(
          "Vous n'avez pas la permission d'enregistrer une sortie d'argent."
        );

      } else {

        setErreurFormulaire(
          error.response?.data?.detail ||
          "Impossible d'enregistrer la sortie d'argent."
        );

      }

    } finally {

      setEnregistrement(false);

    }

  }


  // ============================================================
  // AJOUTER BARKELou / VERSEMENT
  // ============================================================

  async function ajouterAide(event) {

    event.preventDefault();

    setErreurFormulaire("");

    setMessageSucces("");


    if (!peutCreerAide) {

      setErreurFormulaire(
        "Vous n'avez pas la permission d'enregistrer une aide extérieure."
      );

      return;

    }


    if (
      !formAide.membre_id &&
      !formAide.source.trim()
    ) {

      setErreurFormulaire(
        "Veuillez sélectionner un membre ou saisir la source de la barkelou."
      );

      return;

    }


    if (
      formAide.membre_id &&
      !peutCreerCotisation
    ) {

      setErreurFormulaire(
        "Vous n'avez pas la permission d'enregistrer le versement d'un membre."
      );

      return;

    }


    if (
      !formAide.montant ||
      Number(formAide.montant) <= 0
    ) {

      setErreurFormulaire(
        "Le montant doit être supérieur à zéro."
      );

      return;

    }


    if (!formAide.date_aide) {

      setErreurFormulaire(
        "Veuillez sélectionner une date."
      );

      return;

    }


    try {

      setEnregistrement(true);


      // ========================================================
      // CAS 1 :
      // VERSEMENT D'UN MEMBRE NON COTISANT
      // ========================================================

      if (formAide.membre_id) {

        const membreId =
          Number(formAide.membre_id);


        const membre =
          membresActifs.find(
            (item) =>
              Number(item.id) === membreId
          );


        if (!membre) {

          throw new Error(
            "Le membre sélectionné est introuvable."
          );

        }


        const montantCotisation =
          Number(
            membre.montant_cotisation ?? 0
          );


        // ------------------------------------------------------
        // Un membre sélectionné ici doit être non cotisant.
        // ------------------------------------------------------

        if (montantCotisation > 0) {

          setErreurFormulaire(
            "Ce membre possède une cotisation mensuelle. Son versement doit être enregistré depuis la gestion des cotisations."
          );

          return;

        }


        const dateVersement =
          formAide.date_aide;


        const dateObjet =
          new Date(
            `${dateVersement}T12:00:00`
          );


        const mois = [
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
        ][
          dateObjet.getMonth()
        ];


        const annee =
          dateObjet.getFullYear();


        // ------------------------------------------------------
        // Chercher une cotisation 0 existante pour ce mois.
        // ------------------------------------------------------

        let cotisationExistante = null;


        try {

          const response =
            await api.get(
              "/cotisations",
              {
                params: {
                  membre_id: membreId,
                  mois_concerne: mois,
                  annee,
                },
              }
            );


          const liste =
            Array.isArray(
              response.data?.cotisations
            )
              ? response.data.cotisations
              : [];


          cotisationExistante =
            liste.find(
              (cotisation) =>
                Number(
                  cotisation.membre_id
                ) === membreId &&
                String(
                  cotisation.mois_concerne
                ).toLowerCase() ===
                  mois.toLowerCase() &&
                Number(
                  cotisation.annee
                ) === annee
            ) || null;

        } catch (error) {

          console.warn(
            "Impossible de rechercher la cotisation existante :",
            error
          );

        }


        // ------------------------------------------------------
        // Créer une cotisation à 0 si elle n'existe pas.
        // ------------------------------------------------------

        if (!cotisationExistante) {

          const response =
            await api.post(
              "/cotisations",
              null,
              {
                params: {
                  membre_id:
                    membreId,

                  montant: 0,

                  mois_concerne:
                    mois,

                  annee,

                  date_cotisation:
                    dateVersement,
                },
              }
            );


          cotisationExistante =
            response.data;

        }


        if (
          !cotisationExistante?.id
        ) {

          throw new Error(
            "Impossible de créer ou retrouver le versement du membre."
          );

        }


        // ------------------------------------------------------
        // Enregistrer le paiement réel.
        // ------------------------------------------------------

        await api.post(
          `/cotisations/${cotisationExistante.id}/paiements`,
          null,
          {
            params: {

              montant:
                Number(
                  formAide.montant
                ),

              mode_paiement:
                "espèce",

              date_paiement:
                dateVersement,

              reference:
                formAide.description.trim() ||
                null,

            },
          }
        );


        setMessageSucces(
          `Le versement de ${formaterMontant(
            formAide.montant
          )} FCFA de ${obtenirNomMembre(
            membre
          )} a été enregistré avec succès.`
        );


      } else {

        // ======================================================
        // CAS 2 :
        // BARKELou EXTÉRIEURE
        // ======================================================

        await api.post(
          "/aides-exterieures",
          {

            source:
              formAide.source.trim(),

            montant:
              Number(formAide.montant),

            description:
              formAide.description.trim() ||
              null,

            date_aide:
              formAide.date_aide,

          }
        );


        setMessageSucces(
          "La barkelou extérieure a été enregistrée avec succès."
        );

      }


      setFormAide({

        source: "",

        montant: "",

        description: "",

        date_aide:
          new Date()
            .toISOString()
            .split("T")[0],

        membre_id: "",

      });


      await chargerDonnees();


      setTimeout(() => {

        setModal(null);

        setMessageSucces("");

      }, 1000);


    } catch (error) {

      console.error(
        "ERREUR AJOUT BARKELou / VERSEMENT :",
        error
      );


      if (
        error.response?.status === 403
      ) {

        setErreurFormulaire(
          error.response?.data?.detail ||
          "Vous n'avez pas la permission d'enregistrer ce versement."
        );

      } else {

        setErreurFormulaire(
          error.response?.data?.detail ||
          error.message ||
          "Impossible d'enregistrer la barkelou ou le versement."
        );

      }

    } finally {

      setEnregistrement(false);

    }

  }


  // ============================================================
  // LABEL TYPE SORTIE
  // ============================================================

  function obtenirLabelTypeSortie(
    type
  ) {

    switch (type) {

      case "DEPENSE_SOCIALE":
        return "Dépense sociale";

      case "LOCATION_MATERIEL":
        return "Location matériel";

      case "AUTRE":
        return "Autre";

      default:
        return type || "Non précisé";

    }

  }


  // ============================================================
  // CHARGEMENT
  // ============================================================

  if (chargement) {

    return (

      <div className="flex min-h-[60vh] items-center justify-center">

        <div className="text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">

            <RefreshCw
              size={26}
              className="animate-spin text-emerald-700"
            />

          </div>

          <p className="mt-4 text-sm font-medium text-slate-500">
            Chargement de la situation financière...
          </p>

        </div>

      </div>

    );

  }


  // ============================================================
  // AUCUNE PERMISSION FINANCIÈRE
  // ============================================================

  const possedeUnePermissionFinance =
    peutConsulterDepenses ||
    peutCreerDepense ||
    peutConsulterAides ||
    peutCreerAide ||
    peutConsulterCotisations;


  if (!possedeUnePermissionFinance) {

    return (

      <div className="space-y-5">

        <div>

          <p className="text-sm font-medium text-emerald-700">
            Administration
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Gestion financière
          </h1>

        </div>


        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">

          <div className="flex items-start gap-3">

            <AlertCircle
              className="mt-0.5 shrink-0 text-amber-600"
              size={22}
            />

            <div>

              <p className="font-semibold text-amber-800">
                Accès limité
              </p>

              <p className="mt-1 text-sm text-amber-700">
                Vous ne disposez d'aucune permission permettant
                d'accéder à cette partie de la gestion financière.
              </p>

            </div>

          </div>

        </div>

      </div>

    );

  }


  // ============================================================
  // ERREUR
  // ============================================================

  if (erreur) {

    return (

      <div className="space-y-5">

        <div>

          <p className="text-sm font-medium text-emerald-700">
            Administration
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Gestion financière
          </h1>

        </div>


        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">

          <div className="flex items-start gap-3">

            <AlertCircle
              className="mt-0.5 shrink-0 text-red-600"
              size={22}
            />

            <div>

              <p className="font-semibold text-red-800">
                Impossible de charger les finances
              </p>

              <p className="mt-1 text-sm text-red-700">
                {erreur}
              </p>

            </div>

          </div>


          <button
            onClick={chargerDonnees}
            className="mt-5 flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >

            <RefreshCw size={17} />

            Réessayer

          </button>

        </div>

      </div>

    );

  }


  // ============================================================
  // DONNÉES FINANCIÈRES
  // ============================================================

  const totalDepenses =
    depenses.reduce(
      (total, depense) =>
        total +
        Number(depense?.montant ?? 0),
      0
    );


  const totalAides =
    aides.reduce(
      (total, aide) =>
        total +
        Number(aide?.montant ?? 0),
      0
    );


  const totalCotisationsPrevues =
    cotisations.reduce(
      (total, cotisation) =>
        total +
        Number(cotisation?.montant ?? 0),
      0
    );


  const totalPaiementsCotisations =
    cotisations.reduce(
      (total, cotisation) =>
        total +
        Number(
          cotisation?.montant_cotise ?? 0
        ),
      0
    );


  const totalRecettes =
    totalPaiementsCotisations +
    totalAides;


  const totalResteAEncaisser =
    Math.max(
      0,
      totalCotisationsPrevues -
      totalPaiementsCotisations
    );


  const solde =
    totalRecettes -
    totalDepenses;


  // ============================================================
  // RENDU
  // ============================================================

  return (

    <div className="space-y-8">

      {/* ======================================================
          EN-TÊTE
      ====================================================== */}

      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

        <div>

          <div className="mb-2 flex items-center gap-2">

            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
              Administration
            </span>

            <span className="text-xs text-slate-400">
              Gestion financière
            </span>

          </div>


          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Situation financière
          </h1>


          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Suivez les recettes réellement encaissées,
            les sorties d'argent et les barkelou enregistrées
            par le Dahira.
          </p>

        </div>


        <button
          type="button"
          onClick={chargerDonnees}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
        >

          <RefreshCw size={17} />

          Actualiser

        </button>

      </div>


      {/* ======================================================
          STATISTIQUES
      ====================================================== */}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

        {(peutConsulterCotisations ||
          peutConsulterAides) && (

          <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Recettes encaissées
                </p>

                <p className="mt-3 text-2xl font-bold text-slate-900">

                  {formaterMontant(
                    totalRecettes
                  )}

                  <span className="ml-1 text-sm font-semibold text-slate-400">
                    FCFA
                  </span>

                </p>

              </div>


              <div className="rounded-xl bg-emerald-50 p-3">

                <ArrowUpCircle
                  size={21}
                  className="text-emerald-600"
                />

              </div>

            </div>


            <div className="mt-5 text-xs text-slate-400">
              Cotisations encaissées + barkelou
            </div>

          </div>

        )}


        {peutConsulterDepenses && (

          <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Sorties d'argent
                </p>

                <p className="mt-3 text-2xl font-bold text-slate-900">

                  {formaterMontant(
                    totalDepenses
                  )}

                  <span className="ml-1 text-sm font-semibold text-slate-400">
                    FCFA
                  </span>

                </p>

              </div>


              <div className="rounded-xl bg-red-50 p-3">

                <TrendingDown
                  size={21}
                  className="text-red-600"
                />

              </div>

            </div>


            <div className="mt-5 flex items-center gap-2 text-xs text-slate-400">

              <ArrowDownCircle
                size={15}
                className="text-red-500"
              />

              Total des sorties enregistrées

            </div>

          </div>

        )}


        {peutConsulterAides && (

          <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Barkelou
                </p>

                <p className="mt-3 text-2xl font-bold text-slate-900">

                  {formaterMontant(
                    totalAides
                  )}

                  <span className="ml-1 text-sm font-semibold text-slate-400">
                    FCFA
                  </span>

                </p>

              </div>


              <div className="rounded-xl bg-amber-50 p-3">

                <HandCoins
                  size={21}
                  className="text-amber-600"
                />

              </div>

            </div>


            <div className="mt-5 flex items-center gap-2 text-xs text-slate-400">

              <ArrowUpCircle
                size={15}
                className="text-amber-500"
              />

              Total des barkelou enregistrées

            </div>

          </div>

        )}


        {(peutConsulterDepenses ||
          peutConsulterCotisations ||
          peutConsulterAides) && (

          <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Solde
                </p>

                <p
                  className={`mt-3 text-2xl font-bold ${
                    solde >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >

                  {formaterMontant(
                    solde
                  )}

                  <span className="ml-1 text-sm font-semibold text-slate-400">
                    FCFA
                  </span>

                </p>

              </div>


              <div
                className={`rounded-xl p-3 ${
                  solde >= 0
                    ? "bg-emerald-50"
                    : "bg-red-50"
                }`}
              >

                <Wallet
                  size={21}
                  className={
                    solde >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  }
                />

              </div>

            </div>


            <div className="mt-5 text-xs text-slate-400">
              Recettes réelles − sorties d'argent
            </div>

          </div>

        )}

      </div>


      {/* ======================================================
          DÉTAIL DES RECETTES
      ====================================================== */}

      {peutConsulterCotisations && (

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>

              <h2 className="font-bold text-slate-900">
                Situation des cotisations
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Distinction entre les cotisations dues et
                les paiements réellement encaissés.
              </p>

            </div>


            <div className="rounded-xl bg-emerald-50 px-4 py-3">

              <p className="text-xs font-medium text-emerald-700">
                Paiements encaissés
              </p>

              <p className="mt-1 text-lg font-bold text-emerald-700">

                {formaterMontant(
                  totalPaiementsCotisations
                )}{" "}

                <span className="text-xs">
                  FCFA
                </span>

              </p>

            </div>

          </div>


          <div className="mt-5 grid gap-4 sm:grid-cols-2">

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-xs font-medium text-slate-500">
                Cotisations prévues
              </p>

              <p className="mt-2 text-lg font-bold text-slate-800">

                {formaterMontant(
                  totalCotisationsPrevues
                )}{" "}

                <span className="text-xs font-semibold text-slate-400">
                  FCFA
                </span>

              </p>

              <p className="mt-1 text-xs text-slate-400">
                Montant dû, pas encore considéré comme une recette.
              </p>

            </div>


            <div className="rounded-xl bg-amber-50 p-4">

              <p className="text-xs font-medium text-amber-700">
                Reste à encaisser
              </p>

              <p className="mt-2 text-lg font-bold text-amber-700">

                {formaterMontant(
                  totalResteAEncaisser
                )}{" "}

                <span className="text-xs font-semibold text-amber-600">
                  FCFA
                </span>

              </p>

              <p className="mt-1 text-xs text-amber-600">
                Cotisations dues mais non encore encaissées.
              </p>

            </div>

          </div>

        </div>

      )}


      {/* ======================================================
          ACTIONS
      ====================================================== */}

      {(peutCreerDepense || peutCreerAide) && (

        <div className="grid gap-5 md:grid-cols-2">

          {peutCreerDepense && (

            <button
              type="button"
              onClick={() =>
                ouvrirModal("depense")
              }
              className="group relative overflow-hidden rounded-2xl border border-red-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-red-200 hover:shadow-lg"
            >

              <div className="absolute right-0 top-0 h-32 w-32 translate-x-12 -translate-y-12 rounded-full bg-red-50 transition group-hover:scale-125" />

              <div className="relative flex items-center justify-between">

                <div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">

                    <Plus
                      size={23}
                      className="text-red-600"
                    />

                  </div>


                  <h2 className="mt-5 text-lg font-bold text-slate-900">
                    Ajouter une sortie d'argent
                  </h2>


                  <p className="mt-1 text-sm text-slate-500">
                    Enregistrer une nouvelle sortie de caisse.
                  </p>

                </div>


                <ArrowDownCircle
                  size={30}
                  className="text-red-200 transition group-hover:text-red-400"
                />

              </div>

            </button>

          )}


          {peutCreerAide && (

            <button
              type="button"
              onClick={() =>
                ouvrirModal("aide")
              }
              className="group relative overflow-hidden rounded-2xl border border-amber-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-amber-200 hover:shadow-lg"
            >

              <div className="absolute right-0 top-0 h-32 w-32 translate-x-12 -translate-y-12 rounded-full bg-amber-50 transition group-hover:scale-125" />

              <div className="relative flex items-center justify-between">

                <div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">

                    <Plus
                      size={23}
                      className="text-amber-600"
                    />

                  </div>


                  <h2 className="mt-5 text-lg font-bold text-slate-900">
                    Ajouter une barkelou
                  </h2>


                  <p className="mt-1 text-sm text-slate-500">
                    Enregistrer une barkelou ou un versement membre.
                  </p>

                </div>


                <HandCoins
                  size={30}
                  className="text-amber-200 transition group-hover:text-amber-400"
                />

              </div>

            </button>

          )}

        </div>

      )}


      {/* ======================================================
          DERNIÈRES OPÉRATIONS
      ====================================================== */}

      <div
        className={`grid gap-6 ${
          peutConsulterDepenses &&
          peutConsulterAides
            ? "xl:grid-cols-2"
            : "xl:grid-cols-1"
        }`}
      >

        {peutConsulterDepenses && (

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-slate-100 p-6">

              <div>

                <h2 className="font-bold text-slate-900">
                  Dernières sorties d'argent
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Les dernières sorties enregistrées.
                </p>

              </div>


              <div className="rounded-xl bg-red-50 p-2.5">

                <Receipt
                  size={19}
                  className="text-red-600"
                />

              </div>

            </div>


            <div className="divide-y divide-slate-100">

              {depenses.length === 0 ? (

                <div className="p-8 text-center">

                  <Receipt
                    size={30}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-3 text-sm text-slate-400">
                    Aucune sortie d'argent enregistrée.
                  </p>

                </div>

              ) : (

                depenses
                  .slice(0, 5)
                  .map((depense) => (

                    <div
                      key={depense.id}
                      className="px-6 py-4"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div className="flex min-w-0 items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">

                            <ArrowDownCircle
                              size={18}
                              className="text-red-500"
                            />

                          </div>


                          <div className="min-w-0">

                            <p className="truncate text-sm font-semibold text-slate-800">
                              {depense.motif}
                            </p>


                            <p className="mt-1 text-xs text-slate-400">

                              {obtenirLabelTypeSortie(
                                depense.type_sortie
                              )}

                              {" · "}

                              {depense.date_depense}

                            </p>

                          </div>

                        </div>


                        <p className="shrink-0 text-sm font-bold text-red-600">

                          -{" "}

                          {formaterMontant(
                            depense.montant
                          )}{" "}

                          FCFA

                        </p>

                      </div>


                      <div className="ml-[52px] mt-2 flex flex-wrap items-center gap-3 text-xs">

                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">

                          <UserRound size={13} />

                          Remis à:{" "}

                          <span className="font-semibold">
                            {depense.remis_a}
                          </span>

                        </span>


                        {depense.piece_jointe_nom && (

                          <a
                            href={`${api.defaults.baseURL}/depenses/${depense.id}/piece-jointe`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-600 transition hover:bg-blue-100"
                          >

                            <Paperclip size={13} />

                            Pièce jointe

                            <ExternalLink size={12} />

                          </a>

                        )}

                      </div>

                    </div>

                  ))

              )}

            </div>

          </div>

        )}


        {peutConsulterAides && (

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-slate-100 p-6">

              <div>

                <h2 className="font-bold text-slate-900">
                  Dernières barkelou
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Les dernières recettes extérieures.
                </p>

              </div>


              <div className="rounded-xl bg-amber-50 p-2.5">

                <HandCoins
                  size={19}
                  className="text-amber-600"
                />

              </div>

            </div>


            <div className="divide-y divide-slate-100">

              {aides.length === 0 ? (

                <div className="p-8 text-center">

                  <HandCoins
                    size={30}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-3 text-sm text-slate-400">
                    Aucune barkelou enregistrée.
                  </p>

                </div>

              ) : (

                aides
                  .slice(0, 5)
                  .map((aide) => (

                    <div
                      key={aide.id}
                      className="flex items-center justify-between gap-4 px-6 py-4"
                    >

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">

                          <ArrowUpCircle
                            size={18}
                            className="text-amber-500"
                          />

                        </div>


                        <div className="min-w-0">

                          <p className="truncate text-sm font-semibold text-slate-800">
                            {aide.source}
                          </p>


                          <p className="mt-1 text-xs text-slate-400">
                            {aide.date_aide}
                          </p>

                        </div>

                      </div>


                      <p className="shrink-0 text-sm font-bold text-emerald-600">

                        +{" "}

                        {formaterMontant(
                          aide.montant
                        )}{" "}

                        FCFA

                      </p>

                    </div>

                  ))

              )}

            </div>

          </div>

        )}

      </div>


      {/* ======================================================
          MODAL
      ====================================================== */}

      {modal && (

        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"

          onMouseDown={(event) => {

            if (
              event.target === event.currentTarget &&
              !enregistrement
            ) {

              fermerModal();

            }

          }}
        >

          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">


            {/* HEADER */}

            <div className="border-b border-slate-100 px-6 py-5">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      modal === "depense"
                        ? "bg-red-50"
                        : "bg-amber-50"
                    }`}
                  >

                    {modal === "depense" ? (

                      <TrendingDown
                        size={21}
                        className="text-red-600"
                      />

                    ) : (

                      <HandCoins
                        size={21}
                        className="text-amber-600"
                      />

                    )}

                  </div>


                  <div>

                    <h2 className="font-bold text-slate-900">

                      {modal === "depense"
                        ? "Ajouter une sortie d'argent"
                        : "Ajouter une barkelou"}

                    </h2>


                    <p className="text-xs text-slate-400">
                      Les données seront enregistrées immédiatement.
                    </p>

                  </div>

                </div>


                <button
                  type="button"
                  onClick={fermerModal}
                  disabled={enregistrement}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
                >

                  <X size={20} />

                </button>

              </div>

            </div>


            {/* =================================================
                FORMULAIRE SORTIE
            ================================================= */}

            {modal === "depense" ? (

              <form
                onSubmit={ajouterDepense}
                className="max-h-[80vh] space-y-5 overflow-y-auto p-6"
              >

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Motif
                  </label>

                  <div className="relative">

                    <Receipt
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      value={formDepense.motif}
                      onChange={(event) =>
                        modifierDepense(
                          "motif",
                          event.target.value
                        )
                      }
                      placeholder="Ex : Aide à un membre"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"
                      disabled={enregistrement}
                    />

                  </div>

                </div>


                <div className="grid gap-5 sm:grid-cols-2">

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Type de sortie
                    </label>

                    <select
                      value={
                        formDepense.type_sortie
                      }
                      onChange={(event) =>
                        modifierDepense(
                          "type_sortie",
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"
                      disabled={enregistrement}
                    >

                      <option value="">
                        Sélectionner
                      </option>

                      <option value="DEPENSE_SOCIALE">
                        Dépense sociale
                      </option>

                      <option value="LOCATION_MATERIEL">
                        Location matériel
                      </option>

                      <option value="AUTRE">
                        Autre
                      </option>

                    </select>

                  </div>


                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Remis à
                    </label>

                    <div className="relative">

                      <UserRound
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="text"
                        value={formDepense.remis_a}
                        onChange={(event) =>
                          modifierDepense(
                            "remis_a",
                            event.target.value
                          )
                        }
                        placeholder="Nom de la personne"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"
                        disabled={enregistrement}
                      />

                    </div>

                  </div>

                </div>


                <div className="grid gap-5 sm:grid-cols-2">

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Montant
                    </label>

                    <div className="relative">

                      <Wallet
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={formDepense.montant}
                        onChange={(event) =>
                          modifierDepense(
                            "montant",
                            event.target.value
                          )
                        }
                        placeholder="0"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"
                        disabled={enregistrement}
                      />

                    </div>

                  </div>


                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Date
                    </label>

                    <div className="relative">

                      <CalendarDays
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="date"
                        value={
                          formDepense.date_depense
                        }
                        onChange={(event) =>
                          modifierDepense(
                            "date_depense",
                            event.target.value
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"
                        disabled={enregistrement}
                      />

                    </div>

                  </div>

                </div>


                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Pièce jointe
                    <span className="ml-1 font-normal text-slate-400">
                      (facultatif)
                    </span>
                  </label>

                  <div className="relative">

                    <Paperclip
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
                      onChange={modifierPieceJointe}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-red-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-red-600 hover:file:bg-red-100 focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"
                      disabled={enregistrement}
                    />

                  </div>


                  {formDepense.piece_jointe && (

                    <p className="mt-2 text-xs text-slate-500">

                      Fichier sélectionné:{" "}

                      <span className="font-semibold text-slate-700">
                        {formDepense.piece_jointe.name}
                      </span>

                    </p>

                  )}


                  <p className="mt-1 text-xs text-slate-400">
                    PDF, image ou document — 10 Mo maximum.
                  </p>

                </div>


                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">

                    Description

                    <span className="ml-1 font-normal text-slate-400">
                      (facultatif)
                    </span>

                  </label>

                  <div className="relative">

                    <FileText
                      size={18}
                      className="absolute left-3 top-3 text-slate-400"
                    />

                    <textarea
                      value={
                        formDepense.description
                      }
                      onChange={(event) =>
                        modifierDepense(
                          "description",
                          event.target.value
                        )
                      }
                      placeholder="Informations complémentaires..."
                      rows={3}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"
                      disabled={enregistrement}
                    />

                  </div>

                </div>


                {erreurFormulaire && (

                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {erreurFormulaire}
                  </div>

                )}


                {messageSucces && (

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {messageSucces}
                  </div>

                )}


                <button
                  type="submit"
                  disabled={enregistrement}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {enregistrement ? (

                    <>
                      <RefreshCw
                        size={18}
                        className="animate-spin"
                      />

                      Enregistrement...
                    </>

                  ) : (

                    <>
                      <Plus size={18} />

                      Enregistrer la sortie d'argent
                    </>

                  )}

                </button>

              </form>


            ) : (

              /* =================================================
                 FORMULAIRE BARKELou / VERSEMENT
              ================================================= */

              <form
                onSubmit={ajouterAide}
                className="max-h-[80vh] space-y-5 overflow-y-auto p-6"
              >

                {/* ------------------------------------------------
                    MEMBRE NON COTISANT
                ------------------------------------------------- */}

                {peutCreerCotisation && (

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Versement d'un membre non cotisant

                      <span className="ml-1 font-normal text-slate-400">
                        (facultatif)
                      </span>
                    </label>


                    <div className="relative">

                      <UserRound
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />


                      <select
                        value={
                          formAide.membre_id
                        }
                        onChange={(event) => {

                          const membreId =
                            event.target.value;

                          modifierAide(
                            "membre_id",
                            membreId
                          );


                          if (membreId) {

                            modifierAide(
                              "source",
                              ""
                            );

                          }

                        }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                        disabled={enregistrement}
                      >

                        <option value="">
                          Aucun membre — barkelou extérieure
                        </option>


                        {membresActifs
                          .filter(
                            (membre) =>
                              Number(
                                membre.montant_cotisation ?? 0
                              ) === 0
                          )
                          .map((membre) => (

                            <option
                              key={membre.id}
                              value={membre.id}
                            >

                              {obtenirNomMembre(
                                membre
                              )}

                              {" — Non cotisant"}

                            </option>

                          ))}

                      </select>

                    </div>


                    <p className="mt-2 text-xs text-slate-400">

                      Les membres ayant une cotisation mensuelle
                      supérieure à 0 ne sont pas proposés ici.
                      Leurs paiements se font depuis les cotisations.

                    </p>

                  </div>

                )}


                {/* ------------------------------------------------
                    SOURCE EXTÉRIEURE
                ------------------------------------------------- */}

                {!formAide.membre_id && (

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Source de la barkelou
                    </label>


                    <div className="relative">

                      <Building2
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />


                      <input
                        type="text"
                        value={formAide.source}
                        onChange={(event) =>
                          modifierAide(
                            "source",
                            event.target.value
                          )
                        }
                        placeholder="Ex : Partenaire, donateur..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                        disabled={enregistrement}
                      />

                    </div>

                  </div>

                )}


                {/* ------------------------------------------------
                    MEMBRE SÉLECTIONNÉ
                ------------------------------------------------- */}

                {formAide.membre_id && (

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">

                    <p className="text-xs font-medium text-emerald-700">
                      Versement volontaire
                    </p>


                    <p className="mt-1 text-sm font-semibold text-emerald-900">

                      {obtenirNomMembre(
                        membresActifs.find(
                          (membre) =>
                            Number(membre.id) ===
                            Number(formAide.membre_id)
                        )
                      )}

                    </p>


                    <p className="mt-1 text-xs text-emerald-700">
                      Ce membre n'a pas de cotisation mensuelle obligatoire.
                      Son versement sera enregistré comme une entrée d'argent réelle.
                    </p>

                  </div>

                )}


                {/* ------------------------------------------------
                    MONTANT + DATE
                ------------------------------------------------- */}

                <div className="grid gap-5 sm:grid-cols-2">

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Montant
                    </label>


                    <div className="relative">

                      <Wallet
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />


                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={formAide.montant}
                        onChange={(event) =>
                          modifierAide(
                            "montant",
                            event.target.value
                          )
                        }
                        placeholder="0"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                        disabled={enregistrement}
                      />

                    </div>

                  </div>


                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Date
                    </label>


                    <div className="relative">

                      <CalendarDays
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />


                      <input
                        type="date"
                        value={formAide.date_aide}
                        onChange={(event) =>
                          modifierAide(
                            "date_aide",
                            event.target.value
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                        disabled={enregistrement}
                      />

                    </div>

                  </div>

                </div>


                {/* ------------------------------------------------
                    DESCRIPTION
                ------------------------------------------------- */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">

                    Description

                    <span className="ml-1 font-normal text-slate-400">
                      (facultatif)
                    </span>

                  </label>


                  <div className="relative">

                    <FileText
                      size={18}
                      className="absolute left-3 top-3 text-slate-400"
                    />


                    <textarea
                      value={
                        formAide.description
                      }
                      onChange={(event) =>
                        modifierAide(
                          "description",
                          event.target.value
                        )
                      }
                      placeholder="Informations complémentaires..."
                      rows={3}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                      disabled={enregistrement}
                    />

                  </div>

                </div>


                {erreurFormulaire && (

                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {erreurFormulaire}
                  </div>

                )}


                {messageSucces && (

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {messageSucces}
                  </div>

                )}


                <button
                  type="submit"
                  disabled={enregistrement}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3.5 text-sm font-bold text-emerald-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {enregistrement ? (

                    <>

                      <RefreshCw
                        size={18}
                        className="animate-spin"
                      />

                      Enregistrement...

                    </>

                  ) : (

                    <>

                      <Plus size={18} />

                      {formAide.membre_id
                        ? "Enregistrer le versement"
                        : "Enregistrer la barkelou"}

                    </>

                  )}

                </button>

              </form>

            )}

          </div>

        </div>

      )}

    </div>

  );

}


export default Finances;