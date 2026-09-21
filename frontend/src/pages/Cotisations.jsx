import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Eye,
  FileText,
  Plus,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import {
  getCotisations,
  creerCotisation,
  modifierCotisation,
  supprimerCotisation,
  ajouterPaiement,
} from "../services/cotisationService";
import { getMembres } from "../services/membreService";


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

const statutLabels = {
  tous: "Toutes",
  payee: "Payées",
  partielle: "Partielles",
  impayee: "Impayées",
};

const formatMontant = (montant) => {
  return `${Number(montant || 0).toLocaleString("fr-FR")} F`;
};

const getMoisIndex = (mois) => {
  if (!mois) return -1;

  const valeur = String(mois).trim().toLowerCase();

  return MOIS.findIndex(
    (item) => item.toLowerCase() === valeur
  );
};

const normaliserMois = (mois) => {
  if (!mois) return "";

  const index = getMoisIndex(mois);

  if (index >= 0) {
    return MOIS[index];
  }

  return mois;
};

const getAnnee = (cotisation) => {
  return Number(
    cotisation?.annee ||
      (cotisation?.date_cotisation
        ? String(cotisation.date_cotisation).slice(0, 4)
        : 0)
  );
};

const getMoisCotisation = (cotisation) => {
  if (cotisation?.mois_concerne) {
    return normaliserMois(cotisation.mois_concerne);
  }

  if (cotisation?.date_cotisation) {
    const date = new Date(cotisation.date_cotisation);

    if (!Number.isNaN(date.getTime())) {
      return MOIS[date.getMonth()];
    }
  }

  return "";
};

const calculerMontantPaye = (cotisation) => {
  if (!cotisation) return 0;

  if (Array.isArray(cotisation.paiements)) {
    return cotisation.paiements
      .filter((paiement) => paiement?.actif !== false)
      .reduce(
        (total, paiement) =>
          total + Number(paiement?.montant || 0),
        0
      );
  }

  return Number(cotisation.montant_cotise || 0);
};

const getMontantAttendu = (cotisation, membre) => {
  if (cotisation) {
    return Number(
      cotisation.montant ??
        cotisation.montant_du ??
        membre?.montant_cotisation ??
        0
    );
  }

  return Number(membre?.montant_cotisation || 0);
};

const calculerStatut = (montantAttendu, montantPaye) => {
  const attendu = Number(montantAttendu || 0);
  const paye = Number(montantPaye || 0);

  if (paye <= 0) {
    return "impayee";
  }

  if (paye < attendu) {
    return "partielle";
  }

  return "payee";
};

const getNomMembre = (membre) => {
  if (!membre) return "Membre inconnu";

  return `${membre.prenom || ""} ${membre.nom || ""}`.trim() ||
    membre.telephone ||
    "Membre";
};

const getInitiales = (membre) => {
  const nom = getNomMembre(membre);

  return nom
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0])
    .join("")
    .toUpperCase();
};


export default function Cotisations() {
  const { utilisateur } = useAuth();

  const [membres, setMembres] = useState([]);
  const [cotisations, setCotisations] = useState([]);

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [recherche, setRecherche] = useState("");
  const [filtreMois, setFiltreMois] = useState("");
  const [filtreAnnee, setFiltreAnnee] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("tous");

  const [modalCotisation, setModalCotisation] = useState(false);
  const [modalPaiement, setModalPaiement] = useState(false);
  const [modalDetails, setModalDetails] = useState(false);

  const [cotisationSelectionnee, setCotisationSelectionnee] =
    useState(null);

  const [membreSelectionne, setMembreSelectionne] =
    useState(null);

  const [message, setMessage] = useState("");

  const [formCotisation, setFormCotisation] = useState({
    membre_id: "",
    montant: "",
    mois_concerne: "",
    annee: new Date().getFullYear(),
    date_cotisation: new Date().toISOString().slice(0, 10),
  });

  const [formPaiement, setFormPaiement] = useState({
    montant: "",
    mode_paiement: "especes",
    date_paiement: new Date().toISOString().slice(0, 10),
    reference: "",
  });

  const membreConnecteId =
    utilisateur?.membre_id ||
    utilisateur?.membre?.id ||
    null;

  const peutCreer =
    utilisateur?.permission_codes?.includes("COTISATION_CREER") ||
    utilisateur?.permissions?.includes("COTISATION_CREER") ||
    utilisateur?.permissions?.some?.(
      (permission) =>
        permission?.code === "COTISATION_CREER"
    );

  const membreConnecte = useMemo(() => {
    if (!membreConnecteId) return null;

    return membres.find(
      (membre) =>
        Number(membre.id) === Number(membreConnecteId)
    );
  }, [membres, membreConnecteId]);


  const chargerMembres = async () => {
    const resultat = await getMembres();

    const liste =
      Array.isArray(resultat)
        ? resultat
        : resultat?.membres ||
          resultat?.items ||
          [];

    setMembres(liste);
    return liste;
  };


  const chargerCotisations = async () => {
    try {
      setChargement(true);
      setErreur("");

      const [listeMembres, resultatCotisations] =
        await Promise.all([
          chargerMembres(),
          getCotisations({}),
        ]);

      const listeCotisations =
        Array.isArray(resultatCotisations)
          ? resultatCotisations
          : resultatCotisations?.cotisations ||
            resultatCotisations?.items ||
            [];

      setCotisations(listeCotisations);

      return {
        membres: listeMembres,
        cotisations: listeCotisations,
      };
    } catch (error) {
      console.error(error);
      setErreur(
        error?.response?.data?.detail ||
          "Impossible de charger les cotisations."
      );
    } finally {
      setChargement(false);
    }
  };


  useEffect(() => {
    chargerCotisations();
  }, []);


  /*
   * ============================================================
   *  COTISATIONS DE LA PERSONNE CONNECTÉE
   * ============================================================
   */

  const mesCotisations = useMemo(() => {
    if (!membreConnecteId) return [];

    return cotisations
      .filter(
        (cotisation) =>
          Number(cotisation.membre_id) ===
          Number(membreConnecteId)
      )
      .map((cotisation) => {
        const membre =
          membres.find(
            (item) =>
              Number(item.id) ===
              Number(cotisation.membre_id)
          ) || membreConnecte;

        const montantAttendu = getMontantAttendu(
          cotisation,
          membre
        );

        const montantPaye =
          calculerMontantPaye(cotisation);

        return {
          ...cotisation,
          membre,
          mois: getMoisCotisation(cotisation),
          annee: getAnnee(cotisation),
          montantAttendu,
          montantPaye,
          reste: Math.max(
            0,
            montantAttendu - montantPaye
          ),
          statut: calculerStatut(
            montantAttendu,
            montantPaye
          ),
        };
      })
      .sort((a, b) => {
        if (b.annee !== a.annee) {
          return b.annee - a.annee;
        }

        return (
          getMoisIndex(b.mois) -
          getMoisIndex(a.mois)
        );
      });
  }, [
    cotisations,
    membres,
    membreConnecte,
    membreConnecteId,
  ]);


  /*
   * ============================================================
   *  MOIS RÉELLEMENT ENREGISTRÉS
   *
   *  IMPORTANT :
   *  On ne crée jamais Octobre, Novembre, etc. simplement
   *  parce que l'année existe.
   *
   *  Un mois apparaît uniquement s'il existe au moins
   *  une cotisation enregistrée pour ce mois/année.
   * ============================================================
   */

  const moisEnregistres = useMemo(() => {
    const map = new Map();

    cotisations.forEach((cotisation) => {
      const mois = getMoisCotisation(cotisation);
      const annee = getAnnee(cotisation);

      if (!mois || !annee) return;

      const cle = `${annee}-${mois}`;

      if (!map.has(cle)) {
        map.set(cle, {
          mois,
          annee,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (b.annee !== a.annee) {
        return b.annee - a.annee;
      }

      return (
        getMoisIndex(b.mois) -
        getMoisIndex(a.mois)
      );
    });
  }, [cotisations]);


  /*
   * ============================================================
   *  CONSTRUCTION DE LA SITUATION MENSUELLE
   *
   *  C'est ici que la différence entre "Tous" et "Impayées"
   *  est importante.
   *
   *  Tous :
   *      seulement les cotisations existantes.
   *
   *  Impayées :
   *      tous les membres actifs, même sans cotisation.
   * ============================================================
   */

  const situationsMensuelles = useMemo(() => {
    const membresActifs = membres.filter(
      (membre) => membre?.actif !== false
    );

    const resultats = [];

    moisEnregistres.forEach((groupe) => {
      const cotisationsDuMois =
        cotisations.filter((cotisation) => {
          const mois = getMoisCotisation(cotisation);
          const annee = getAnnee(cotisation);

          return (
            mois === groupe.mois &&
            annee === groupe.annee
          );
        });

      /*
       * Map permettant de retrouver rapidement la cotisation
       * d'un membre pour le mois.
       */
      const cotisationsParMembre = new Map();

      cotisationsDuMois.forEach((cotisation) => {
        const membreId = Number(
          cotisation.membre_id
        );

        if (!cotisationsParMembre.has(membreId)) {
          cotisationsParMembre.set(
            membreId,
            cotisation
          );
        }
      });

      /*
       * Situation complète du mois :
       * tous les membres actifs.
       *
       * Mais cette liste sera ensuite filtrée :
       * - "Tous" => seulement cotisations existantes
       * - "Impayées" => tous ceux à 0
       */
      const lignesCompletes = membresActifs.map(
        (membre) => {
          const cotisation =
            cotisationsParMembre.get(
              Number(membre.id)
            ) || null;

          const montantAttendu =
            getMontantAttendu(
              cotisation,
              membre
            );

          const montantPaye =
            calculerMontantPaye(cotisation);

          const statut = calculerStatut(
            montantAttendu,
            montantPaye
          );

          return {
            id: cotisation?.id || null,

            membre_id: membre.id,

            membre,

            cotisation,

            mois: groupe.mois,

            annee: groupe.annee,

            /*
             * Cette propriété permet de distinguer :
             * - une cotisation réellement enregistrée
             * - un membre sans cotisation pour ce mois.
             */
            cotisationExiste: Boolean(
              cotisation
            ),

            montantAttendu,

            montantPaye,

            reste: Math.max(
              0,
              montantAttendu - montantPaye
            ),

            statut,
          };
        }
      );

      /*
       * Pour les statistiques globales du mois,
       * on utilise TOUS les membres actifs.
       */
      const estimation = membresActifs.reduce(
        (total, membre) =>
          total +
          Number(
            membre?.montant_cotisation || 0
          ),
        0
      );

      const totalPaye =
        lignesCompletes.reduce(
          (total, ligne) =>
            total + Number(ligne.montantPaye || 0),
          0
        );

      const reste = Math.max(
        0,
        estimation - totalPaye
      );

      resultats.push({
        ...groupe,

        lignesCompletes,

        estimation,

        totalPaye,

        reste,

        nombreMembres: membresActifs.length,

        nombreCotisationsEnregistrees:
          cotisationsDuMois.length,
      });
    });

    return resultats;
  }, [
    membres,
    cotisations,
    moisEnregistres,
  ]);


  /*
   * ============================================================
   *  FILTRES
   * ============================================================
   */

  const situationsFiltrees = useMemo(() => {
    const rechercheNormalisee =
      recherche.trim().toLowerCase();

    return situationsMensuelles
      .filter((groupe) => {
        if (
          filtreMois &&
          groupe.mois !== filtreMois
        ) {
          return false;
        }

        if (
          filtreAnnee &&
          Number(groupe.annee) !==
            Number(filtreAnnee)
        ) {
          return false;
        }

        return true;
      })
      .map((groupe) => {
        /*
         * ======================================================
         * CAS 1 : FILTRE "TOUS"
         *
         * On affiche uniquement les cotisations réellement
         * enregistrées.
         *
         * Les membres sans ligne cotisation ne doivent donc
         * PAS apparaître ici.
         * ======================================================
         */

        let lignes = groupe.lignesCompletes.filter(
          (ligne) => ligne.cotisationExiste
        );

        /*
         * ======================================================
         * CAS 2 : PAYÉES
         * ======================================================
         */

        if (filtreStatut === "payee") {
          lignes = groupe.lignesCompletes.filter(
            (ligne) =>
              ligne.cotisationExiste &&
              ligne.statut === "payee"
          );
        }

        /*
         * ======================================================
         * CAS 3 : PARTIELLES
         * ======================================================
         */

        if (filtreStatut === "partielle") {
          lignes = groupe.lignesCompletes.filter(
            (ligne) =>
              ligne.cotisationExiste &&
              ligne.statut === "partielle"
          );
        }

        /*
         * ======================================================
         * CAS 4 : IMPAYÉES
         *
         * TOUS les membres avec 0 F payé.
         *
         * Cela comprend :
         * - cotisation existante + paiement 0
         * - aucune cotisation + paiement 0
         * ======================================================
         */

        if (filtreStatut === "impayee") {
          lignes = groupe.lignesCompletes.filter(
            (ligne) =>
              Number(ligne.montantPaye || 0) <= 0
          );
        }

        /*
         * Recherche du membre après construction complète
         * de la situation.
         */
        if (rechercheNormalisee) {
          lignes = lignes.filter((ligne) => {
            const nom = getNomMembre(
              ligne.membre
            ).toLowerCase();

            const telephone = String(
              ligne.membre?.telephone || ""
            ).toLowerCase();

            return (
              nom.includes(
                rechercheNormalisee
              ) ||
              telephone.includes(
                rechercheNormalisee
              )
            );
          });
        }

        return {
          ...groupe,
          lignes,
        };
      })
      .filter(
        (groupe) => groupe.lignes.length > 0
      );
  }, [
    situationsMensuelles,
    recherche,
    filtreMois,
    filtreAnnee,
    filtreStatut,
  ]);


  /*
   * Années réellement présentes dans les cotisations.
   */
  const anneesDisponibles = useMemo(() => {
    return Array.from(
      new Set(
        cotisations
          .map((cotisation) =>
            getAnnee(cotisation)
          )
          .filter(Boolean)
      )
    ).sort((a, b) => b - a);
  }, [cotisations]);


  /*
   * ============================================================
   *  MODAL : NOUVELLE COTISATION
   * ============================================================
   */

  const ouvrirNouvelleCotisation = (
    membre = null,
    mois = "",
    annee = ""
  ) => {
    const membreId =
      membre?.id ||
      membreSelectionne?.id ||
      "";

    const membreChoisi =
      membre ||
      membres.find(
        (item) =>
          Number(item.id) ===
          Number(membreId)
      );

    setMembreSelectionne(
      membreChoisi || null
    );

    setFormCotisation({
      membre_id: membreId,
      montant:
        membreChoisi?.montant_cotisation ||
        "",
      mois_concerne:
        mois ||
        filtreMois ||
        "",
      annee:
        annee ||
        filtreAnnee ||
        new Date().getFullYear(),
      date_cotisation:
        new Date()
          .toISOString()
          .slice(0, 10),
    });

    setModalCotisation(true);
  };


  const fermerModalCotisation = () => {
    setModalCotisation(false);

    setFormCotisation({
      membre_id: "",
      montant: "",
      mois_concerne: "",
      annee: new Date().getFullYear(),
      date_cotisation: new Date()
        .toISOString()
        .slice(0, 10),
    });

    setMembreSelectionne(null);
  };


  const handleMembreCotisation = (event) => {
    const membreId = event.target.value;

    const membre =
      membres.find(
        (item) =>
          Number(item.id) ===
          Number(membreId)
      ) || null;

    setMembreSelectionne(membre);

    setFormCotisation((ancien) => ({
      ...ancien,
      membre_id: membreId,
      montant:
        membre?.montant_cotisation || "",
    }));
  };


  const enregistrerCotisation = async (event) => {
    event.preventDefault();

    try {
      setErreur("");
      setMessage("");

      if (!formCotisation.membre_id) {
        setErreur(
          "Veuillez sélectionner un membre."
        );
        return;
      }

      if (!formCotisation.mois_concerne) {
        setErreur(
          "Veuillez sélectionner le mois."
        );
        return;
      }

      if (!formCotisation.montant) {
        setErreur(
          "Le montant de la cotisation est obligatoire."
        );
        return;
      }

      await creerCotisation({
        membre_id: Number(
          formCotisation.membre_id
        ),
        montant: Number(
          formCotisation.montant
        ),
        mois_concerne:
          formCotisation.mois_concerne,
        annee: Number(
          formCotisation.annee
        ),
        date_cotisation:
          formCotisation.date_cotisation,
      });

      fermerModalCotisation();

      setMessage(
        "Cotisation enregistrée avec succès."
      );

      await chargerCotisations();
    } catch (error) {
      console.error(error);

      setErreur(
        error?.response?.data?.detail ||
          "Impossible d'enregistrer la cotisation."
      );
    }
  };


  /*
   * ============================================================
   *  MODAL PAIEMENT
   * ============================================================
   */

  const ouvrirPaiement = (ligne) => {
    if (!ligne?.cotisation?.id) {
      return;
    }

    setCotisationSelectionnee(ligne);

    const reste = Math.max(
      0,
      Number(ligne.montantAttendu || 0) -
        Number(ligne.montantPaye || 0)
    );

    setFormPaiement({
      montant: reste > 0 ? reste : "",
      mode_paiement: "especes",
      date_paiement: new Date()
        .toISOString()
        .slice(0, 10),
      reference: "",
    });

    setModalPaiement(true);
  };


  const fermerModalPaiement = () => {
    setModalPaiement(false);
    setCotisationSelectionnee(null);

    setFormPaiement({
      montant: "",
      mode_paiement: "especes",
      date_paiement: new Date()
        .toISOString()
        .slice(0, 10),
      reference: "",
    });
  };


  const enregistrerPaiement = async (event) => {
    event.preventDefault();

    try {
      setErreur("");
      setMessage("");

      if (
        !cotisationSelectionnee?.cotisation
          ?.id
      ) {
        setErreur(
          "Cette cotisation n'existe pas encore."
        );
        return;
      }

      if (!formPaiement.montant) {
        setErreur(
          "Veuillez saisir le montant payé."
        );
        return;
      }

      await ajouterPaiement(
        cotisationSelectionnee.cotisation.id,
        {
          montant: Number(
            formPaiement.montant
          ),
          mode_paiement:
            formPaiement.mode_paiement,
          date_paiement:
            formPaiement.date_paiement,
          reference:
            formPaiement.reference ||
            null,
        }
      );

      fermerModalPaiement();

      setMessage(
        "Paiement enregistré avec succès."
      );

      await chargerCotisations();
    } catch (error) {
      console.error(error);

      setErreur(
        error?.response?.data?.detail ||
          "Impossible d'enregistrer le paiement."
      );
    }
  };


  /*
   * ============================================================
   *  DETAILS
   * ============================================================
   */

  const ouvrirDetails = (ligne) => {
    setCotisationSelectionnee(ligne);
    setModalDetails(true);
  };


  /*
   * ============================================================
   *  SUPPRESSION
   * ============================================================
   */

  const supprimer = async (ligne) => {
    if (!ligne?.cotisation?.id) return;

    const confirmation = window.confirm(
      `Voulez-vous vraiment supprimer la cotisation de ${getNomMembre(
        ligne.membre
      )} pour ${ligne.mois} ${ligne.annee} ?`
    );

    if (!confirmation) return;

    try {
      setErreur("");
      setMessage("");

      await supprimerCotisation(
        ligne.cotisation.id
      );

      setMessage(
        "Cotisation supprimée avec succès."
      );

      await chargerCotisations();
    } catch (error) {
      console.error(error);

      setErreur(
        error?.response?.data?.detail ||
          "Impossible de supprimer la cotisation."
      );
    }
  };


  /*
   * ============================================================
   *  STATUT
   * ============================================================
   */

  const badgeStatut = (statut) => {
    if (statut === "payee") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          <CheckCircle2 size={14} />
          Payée
        </span>
      );
    }

    if (statut === "partielle") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
          <Clock3 size={14} />
          Partielle
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
        <AlertCircle size={14} />
        Impayée
      </span>
    );
  };


  /*
   * ============================================================
   *  RENDU
   * ============================================================
   */

  if (chargement) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-sm text-slate-500">
          Chargement des cotisations...
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* ======================================================
          EN-TÊTE
      ======================================================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Cotisations
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Suivi des cotisations et des paiements
            des membres.
          </p>
        </div>

        {peutCreer && (
          <button
            type="button"
            onClick={() =>
              ouvrirNouvelleCotisation()
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus size={18} />
            Nouvelle cotisation
          </button>
        )}
      </div>


      {/* ======================================================
          MESSAGES
      ======================================================= */}

      {erreur && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />
          <span>{erreur}</span>

          <button
            type="button"
            onClick={() => setErreur("")}
            className="ml-auto"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {message && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 size={18} />
          <span>{message}</span>

          <button
            type="button"
            onClick={() => setMessage("")}
            className="ml-auto"
          >
            <X size={16} />
          </button>
        </div>
      )}


      {/* ======================================================
          MA COTISATION
      ======================================================= */}

      {membreConnecte && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                <UserRound
                  size={21}
                  className="text-slate-700"
                />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Ma cotisation
                </h2>

                <p className="text-sm text-slate-500">
                  {getNomMembre(
                    membreConnecte
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5">
            {mesCotisations.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                Aucune cotisation enregistrée
                pour le moment.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                      <th className="px-4 py-3">
                        Période
                      </th>

                      <th className="px-4 py-3">
                        Montant
                      </th>

                      <th className="px-4 py-3">
                        Versé
                      </th>

                      <th className="px-4 py-3">
                        Reste
                      </th>

                      <th className="px-4 py-3">
                        Statut
                      </th>

                      <th className="px-4 py-3 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {mesCotisations.map(
                      (ligne) => (
                        <tr
                          key={ligne.id}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="px-4 py-4 font-medium text-slate-900">
                            {ligne.mois}{" "}
                            {ligne.annee}
                          </td>

                          <td className="px-4 py-4 text-slate-700">
                            {formatMontant(
                              ligne.montantAttendu
                            )}
                          </td>

                          <td className="px-4 py-4 font-semibold text-emerald-700">
                            {formatMontant(
                              ligne.montantPaye
                            )}
                          </td>

                          <td className="px-4 py-4 text-slate-700">
                            {formatMontant(
                              ligne.reste
                            )}
                          </td>

                          <td className="px-4 py-4">
                            {badgeStatut(
                              ligne.statut
                            )}
                          </td>

                          <td className="px-4 py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                ouvrirDetails(
                                  ligne
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                            >
                              <Eye size={16} />
                              Détails
                            </button>
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
      )}


      {/* ======================================================
          DAHIRA
      ======================================================= */}

      {peutCreer && (
        <section className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Cotisations du Dahira
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Suivi mensuel de l'ensemble des
              membres actifs.
            </p>
          </div>


          {/* ==================================================
              FILTRES
          =================================================== */}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-slate-400"
                />
              </div>


              {/* Mois */}
              <div className="relative">
                <Calendar
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={filtreMois}
                  onChange={(event) =>
                    setFiltreMois(
                      event.target.value
                    )
                  }
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm outline-none focus:border-slate-400"
                >
                  <option value="">
                    Tous les mois enregistrés
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


              {/* Année */}
              <div className="relative">
                <select
                  value={filtreAnnee}
                  onChange={(event) =>
                    setFiltreAnnee(
                      event.target.value
                    )
                  }
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 px-3 pr-9 text-sm outline-none focus:border-slate-400"
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


              {/* Statut */}
              <div className="relative">
                <select
                  value={filtreStatut}
                  onChange={(event) =>
                    setFiltreStatut(
                      event.target.value
                    )
                  }
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 px-3 pr-9 text-sm outline-none focus:border-slate-400"
                >
                  {Object.entries(
                    statutLabels
                  ).map(
                    ([
                      valeur,
                      libelle,
                    ]) => (
                      <option
                        key={valeur}
                        value={valeur}
                      >
                        {libelle}
                      </option>
                    )
                  )}
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>


              {/* Réinitialiser */}
              <button
                type="button"
                onClick={() => {
                  setRecherche("");
                  setFiltreMois("");
                  setFiltreAnnee("");
                  setFiltreStatut("tous");
                }}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Réinitialiser
              </button>
            </div>
          </div>


          {/* ==================================================
              SITUATIONS MENSUELLES
          =================================================== */}

          {situationsFiltrees.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <FileText
                size={38}
                className="mx-auto text-slate-300"
              />

              <p className="mt-4 font-semibold text-slate-700">
                Aucune cotisation trouvée
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Les mois futurs ou sans cotisation
                enregistrée ne sont pas affichés.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {situationsFiltrees.map(
                (groupe) => (
                  <div
                    key={`${groupe.annee}-${groupe.mois}`}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    {/* ========================================
                        HEADER MOIS
                    ========================================= */}

                    <div className="border-b border-slate-200 bg-slate-50 p-5">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            {groupe.mois}{" "}
                            {groupe.annee}
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            {
                              groupe.nombreCotisationsEnregistrees
                            }{" "}
                            cotisation(s)
                            enregistrée(s)
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs text-slate-500">
                              Estimation
                            </p>

                            <p className="mt-1 font-bold text-slate-900">
                              {formatMontant(
                                groupe.estimation
                              )}
                            </p>
                          </div>

                          <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs text-slate-500">
                              Total versé
                            </p>

                            <p className="mt-1 font-bold text-emerald-700">
                              {formatMontant(
                                groupe.totalPaye
                              )}
                            </p>
                          </div>

                          <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs text-slate-500">
                              Reste
                            </p>

                            <p className="mt-1 font-bold text-amber-700">
                              {formatMontant(
                                groupe.reste
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>


                    {/* ========================================
                        TABLE
                    ========================================= */}

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[900px] text-left">
                        <thead>
                          <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                            <th className="px-5 py-3">
                              Membre
                            </th>

                            <th className="px-5 py-3">
                              Cotisation
                            </th>

                            <th className="px-5 py-3">
                              Versé
                            </th>

                            <th className="px-5 py-3">
                              Reste
                            </th>

                            <th className="px-5 py-3">
                              Statut
                            </th>

                            <th className="px-5 py-3">
                              Situation
                            </th>

                            <th className="px-5 py-3 text-right">
                              Action
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {groupe.lignes.map(
                            (ligne) => (
                              <tr
                                key={`${groupe.annee}-${groupe.mois}-${ligne.membre_id}`}
                                className="border-b border-slate-100 last:border-0"
                              >
                                {/* Membre */}
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                                      {getInitiales(
                                        ligne.membre
                                      )}
                                    </div>

                                    <div>
                                      <p className="font-semibold text-slate-900">
                                        {getNomMembre(
                                          ligne.membre
                                        )}
                                      </p>

                                      {ligne
                                        .membre
                                        ?.telephone && (
                                        <p className="text-xs text-slate-500">
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


                                {/* Montant attendu */}
                                <td className="px-5 py-4 font-medium text-slate-700">
                                  {formatMontant(
                                    ligne.montantAttendu
                                  )}
                                </td>


                                {/* Montant payé */}
                                <td className="px-5 py-4 font-semibold text-emerald-700">
                                  {formatMontant(
                                    ligne.montantPaye
                                  )}
                                </td>


                                {/* Reste */}
                                <td className="px-5 py-4 font-medium text-slate-700">
                                  {formatMontant(
                                    ligne.reste
                                  )}
                                </td>


                                {/* Statut */}
                                <td className="px-5 py-4">
                                  {badgeStatut(
                                    ligne.statut
                                  )}
                                </td>


                                {/* Cotisation enregistrée ? */}
                                <td className="px-5 py-4">
                                  {ligne.cotisationExiste ? (
                                    <span className="text-xs font-medium text-slate-600">
                                      Cotisation
                                      enregistrée
                                    </span>
                                  ) : (
                                    <span className="text-xs font-medium text-orange-600">
                                      Non enregistrée
                                    </span>
                                  )}
                                </td>


                                {/* Actions */}
                                <td className="px-5 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    {/* Si cotisation existe */}
                                    {ligne.cotisationExiste && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            ouvrirDetails(
                                              ligne
                                            )
                                          }
                                          className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                                          title="Voir les détails"
                                        >
                                          <Eye
                                            size={16}
                                          />
                                          Détails
                                        </button>

                                        {ligne.statut !==
                                          "payee" && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              ouvrirPaiement(
                                                ligne
                                              )
                                            }
                                            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                                          >
                                            <CircleDollarSign
                                              size={16}
                                            />
                                            Payer
                                          </button>
                                        )}
                                      </>
                                    )}


                                    {/* Si aucune cotisation :
                                        on crée d'abord la cotisation */}
                                    {!ligne.cotisationExiste && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          ouvrirNouvelleCotisation(
                                            ligne.membre,
                                            groupe.mois,
                                            groupe.annee
                                          )
                                        }
                                        className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                                      >
                                        <Plus
                                          size={16}
                                        />
                                        Enregistrer
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
                  </div>
                )
              )}
            </div>
          )}
        </section>
      )}


      {/* ======================================================
          MODAL NOUVELLE COTISATION
      ======================================================= */}

      {modalCotisation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Nouvelle cotisation
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enregistrer une cotisation
                  pour un membre.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  fermerModalCotisation
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
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
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Membre
                </label>

                <select
                  value={
                    formCotisation.membre_id
                  }
                  onChange={
                    handleMembreCotisation
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400"
                >
                  <option value="">
                    Sélectionner un membre
                  </option>

                  {membres
                    .filter(
                      (membre) =>
                        membre?.actif !== false
                    )
                    .map((membre) => (
                      <option
                        key={membre.id}
                        value={membre.id}
                      >
                        {getNomMembre(
                          membre
                        )}
                      </option>
                    ))}
                </select>
              </div>


              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
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
                            event.target
                              .value,
                        })
                      )
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400"
                  >
                    <option value="">
                      Sélectionner
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
                </div>


                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
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
                            event.target
                              .value,
                        })
                      )
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400"
                  />
                </div>
              </div>


              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Montant de la cotisation
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min="0"
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
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 pr-12 text-sm outline-none focus:border-slate-400"
                  />

                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    F
                  </span>
                </div>

                {membreSelectionne && (
                  <p className="mt-2 text-xs text-slate-500">
                    Cotisation habituelle :{" "}
                    <strong>
                      {formatMontant(
                        membreSelectionne.montant_cotisation
                      )}
                    </strong>
                  </p>
                )}
              </div>


              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
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
                          event.target
                            .value,
                      })
                    )
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400"
                />
              </div>


              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={
                    fermerModalCotisation
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ======================================================
          MODAL PAIEMENT
      ======================================================= */}

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
                    {
                      cotisationSelectionnee
                        .membre
                        ?.prenom
                    }{" "}
                    {
                      cotisationSelectionnee
                        .membre?.nom
                    }{" "}
                    —{" "}
                    {
                      cotisationSelectionnee
                        .mois
                    }{" "}
                    {
                      cotisationSelectionnee
                        .annee
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    fermerModalPaiement
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
                      Attendu
                    </p>

                    <p className="mt-1 font-bold text-slate-900">
                      {formatMontant(
                        cotisationSelectionnee.montantAttendu
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">
                      Déjà versé
                    </p>

                    <p className="mt-1 font-bold text-emerald-700">
                      {formatMontant(
                        cotisationSelectionnee.montantPaye
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">
                      Reste
                    </p>

                    <p className="mt-1 font-bold text-amber-700">
                      {formatMontant(
                        cotisationSelectionnee.reste
                      )}
                    </p>
                  </div>
                </div>


                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Montant payé
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
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
                      required
                      className="w-full rounded-xl border border-slate-200 px-3 py-3 pr-12 text-sm outline-none focus:border-slate-400"
                    />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      F
                    </span>
                  </div>
                </div>


                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
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
                      className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="especes">
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

                      <option value="autre">
                        Autre
                      </option>
                    </select>
                  </div>


                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
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
                      required
                      className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400"
                    />
                  </div>
                </div>


                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
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
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400"
                  />
                </div>


                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={
                      fermerModalPaiement
                    }
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
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


      {/* ======================================================
          MODAL DÉTAILS
      ======================================================= */}

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
                      cotisationSelectionnee
                        .membre
                        ?.prenom
                    }{" "}
                    {
                      cotisationSelectionnee
                        .membre?.nom
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setModalDetails(false)
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
                      Période
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {
                        cotisationSelectionnee
                          .mois
                      }{" "}
                      {
                        cotisationSelectionnee
                          .annee
                      }
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      Statut
                    </p>

                    <div className="mt-2">
                      {badgeStatut(
                        cotisationSelectionnee.statut
                      )}
                    </div>
                  </div>
                </div>


                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Montant attendu
                    </span>

                    <strong className="text-slate-900">
                      {formatMontant(
                        cotisationSelectionnee.montantAttendu
                      )}
                    </strong>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Total versé
                    </span>

                    <strong className="text-emerald-700">
                      {formatMontant(
                        cotisationSelectionnee.montantPaye
                      )}
                    </strong>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-sm text-slate-500">
                      Reste
                    </span>

                    <strong className="text-amber-700">
                      {formatMontant(
                        cotisationSelectionnee.reste
                      )}
                    </strong>
                  </div>
                </div>


                <div>
                  <h3 className="mb-3 font-semibold text-slate-900">
                    Paiements
                  </h3>

                  {!Array.isArray(
                    cotisationSelectionnee
                      .cotisation
                      ?.paiements
                  ) ||
                  cotisationSelectionnee
                    .cotisation
                    .paiements.length ===
                    0 ? (
                    <div className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">
                      Aucun paiement
                      enregistré.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cotisationSelectionnee.cotisation.paiements
                        .filter(
                          (paiement) =>
                            paiement?.actif !==
                            false
                        )
                        .map((paiement) => (
                          <div
                            key={paiement.id}
                            className="flex items-center justify-between rounded-xl border border-slate-100 p-3"
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {formatMontant(
                                  paiement.montant
                                )}
                              </p>

                              <p className="text-xs text-slate-500">
                                {paiement.mode_paiement ||
                                  "Non précisé"}
                                {paiement.date_paiement
                                  ? ` · ${paiement.date_paiement}`
                                  : ""}
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
                        ))}
                    </div>
                  )}
                </div>


                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setModalDetails(false)
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