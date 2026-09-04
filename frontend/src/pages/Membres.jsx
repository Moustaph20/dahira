
import { useEffect, useState } from "react";

import {
  getMembres,
  creerMembre,
  modifierMembre,
  desactiverMembre,
  activerMembre,
} from "../services/membres";

import { getFonctions } from "../services/fonctions";
import { getKourels } from "../services/kourels";

const FORMULAIRE_INITIAL = {
  nom: "",
  prenom: "",
  telephone: "",
  lieu_residence: "",
  montant_cotisation: "",
  fonction_ids: [],
  kourel_ids: [],
};

function Membres() {
  // ============================================================
  // ETATS
  // ============================================================

  const [membres, setMembres] = useState([]);
  const [fonctions, setFonctions] = useState([]);
  const [kourels, setKourels] = useState([]);

  const [recherche, setRecherche] = useState("");
  const [rechercheActive, setRechercheActive] = useState("");

  const [inclureInactifs, setInclureInactifs] = useState(false);

  const [chargement, setChargement] = useState(true);
  const [chargementOptions, setChargementOptions] = useState(true);

  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  const [modalOuverte, setModalOuverte] = useState(false);
  const [modeEdition, setModeEdition] = useState(false);

  const [membreSelectionne, setMembreSelectionne] = useState(null);

  const [formulaire, setFormulaire] = useState({
    ...FORMULAIRE_INITIAL,
    fonction_ids: [],
    kourel_ids: [],
  });

  const [erreursFormulaire, setErreursFormulaire] = useState({});

  const [enregistrement, setEnregistrement] = useState(false);

  const [actionId, setActionId] = useState(null);

  // ============================================================
  // CHARGER FONCTIONS ET KOURELS
  // ============================================================

  async function chargerOptions() {
    try {
      setChargementOptions(true);
      setErreur("");

      const [fonctionsData, kourelsData] = await Promise.all([
        getFonctions(),
        getKourels(),
      ]);

      console.log("FONCTIONS REÇUES :", fonctionsData);
      console.log("KOURELS REÇUS :", kourelsData);

      setFonctions(
        Array.isArray(fonctionsData)
          ? fonctionsData.filter(
              (fonction) => fonction.actif !== false
            )
          : []
      );

      setKourels(
        Array.isArray(kourelsData)
          ? kourelsData.filter(
              (kourel) => kourel.actif !== false
            )
          : []
      );
    } catch (error) {
      console.error(
        "Erreur chargement fonctions/Kourels :",
        error
      );

      setErreur(
        error.response?.data?.detail ||
          "Impossible de charger les fonctions et les Kourels."
      );
    } finally {
      setChargementOptions(false);
    }
  }

  // ============================================================
  // CHARGER LES MEMBRES
  // ============================================================

  async function chargerMembres(
    terme = rechercheActive,
    afficherInactifs = inclureInactifs
  ) {
    try {
      setChargement(true);
      setErreur("");

      const data = await getMembres(
        terme,
        afficherInactifs
      );

      console.log(
        "MEMBRES REÇUS PAR LE FRONTEND :",
        data
      );

      setMembres(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Erreur chargement membres :",
        error
      );

      if (error.response?.status === 401) {
        setErreur(
          "Votre session a expiré. Veuillez vous reconnecter."
        );
      } else if (error.response?.status === 403) {
        setErreur(
          "Vous n'avez pas la permission de consulter les membres."
        );
      } else {
        setErreur(
          error.response?.data?.detail ||
            "Impossible de charger les membres."
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
    chargerOptions();
  }, []);

  useEffect(() => {
    chargerMembres(
      rechercheActive,
      inclureInactifs
    );
  }, [inclureInactifs]);

  // ============================================================
  // RECHERCHE
  // ============================================================

  function handleRecherche(event) {
    event.preventDefault();

    const terme = recherche.trim();

    setRechercheActive(terme);

    chargerMembres(
      terme,
      inclureInactifs
    );
  }

  function effacerRecherche() {
    setRecherche("");
    setRechercheActive("");

    chargerMembres(
      "",
      inclureInactifs
    );
  }

  // ============================================================
  // CHANGEMENT DES CHAMPS
  // ============================================================

  function handleChange(event) {
    const { name, value } = event.target;

    setFormulaire((ancien) => ({
      ...ancien,
      [name]: value,
    }));

    setErreursFormulaire((ancien) => ({
      ...ancien,
      [name]: "",
    }));
  }

  // ============================================================
  // TELEPHONE
  // ============================================================

  function formaterTelephone(value) {
    let chiffres = String(value || "").replace(/\D/g, "");

    // Si l'utilisateur colle un numéro avec l'indicatif 221
    if (
      chiffres.length === 12 &&
      chiffres.startsWith("221")
    ) {
      chiffres = chiffres.substring(3);
    }

    // Maximum 9 chiffres
    chiffres = chiffres.substring(0, 9);

    // Format 77 123 45 67
    if (chiffres.length <= 2) {
      return chiffres;
    }

    if (chiffres.length <= 5) {
      return `${chiffres.substring(0, 2)} ${chiffres.substring(2)}`;
    }

    if (chiffres.length <= 7) {
      return `${chiffres.substring(0, 2)} ${chiffres.substring(
        2,
        5
      )} ${chiffres.substring(5)}`;
    }

    return `${chiffres.substring(0, 2)} ${chiffres.substring(
      2,
      5
    )} ${chiffres.substring(5, 7)} ${chiffres.substring(7, 9)}`;
  }

  function handleTelephoneChange(event) {
    const value = event.target.value;

    const telephoneFormate = formaterTelephone(value);

    setFormulaire((ancien) => ({
      ...ancien,
      telephone: telephoneFormate,
    }));

    setErreursFormulaire((ancien) => ({
      ...ancien,
      telephone: "",
    }));
  }

  // ============================================================
  // NORMALISATION TELEPHONE POUR LE BACKEND
  // ============================================================

  function normaliserTelephone(telephone) {
    let chiffres = String(
      telephone || ""
    ).replace(/\D/g, "");

    if (
      chiffres.length === 12 &&
      chiffres.startsWith("221")
    ) {
      chiffres = chiffres.substring(3);
    }

    return chiffres;
  }

  // ============================================================
  // FONCTIONS
  // ============================================================

  function handleFonctionChange(fonctionId) {
    const id = Number(fonctionId);

    setFormulaire((ancien) => {
      const dejaSelectionnee =
        ancien.fonction_ids.includes(id);

      const nouvelleListe = dejaSelectionnee
        ? ancien.fonction_ids.filter(
            (fonction) => fonction !== id
          )
        : [
            ...ancien.fonction_ids,
            id,
          ];

      return {
        ...ancien,
        fonction_ids: nouvelleListe,
      };
    });

    setErreursFormulaire((ancien) => ({
      ...ancien,
      fonction_ids: "",
    }));
  }

  // ============================================================
  // KOURELS
  // ============================================================

  function handleKourelChange(kourelId) {
    const id = Number(kourelId);

    setFormulaire((ancien) => {
      const dejaSelectionne =
        ancien.kourel_ids.includes(id);

      const nouvelleListe = dejaSelectionne
        ? ancien.kourel_ids.filter(
            (kourel) => kourel !== id
          )
        : [
            ...ancien.kourel_ids,
            id,
          ];

      return {
        ...ancien,
        kourel_ids: nouvelleListe,
      };
    });

    setErreursFormulaire((ancien) => ({
      ...ancien,
      kourel_ids: "",
    }));
  }

  // ============================================================
  // VALIDATION
  // ============================================================

  function validerFormulaire() {
    const erreurs = {};

    const nom = String(
      formulaire.nom || ""
    ).trim();

    const prenom = String(
      formulaire.prenom || ""
    ).trim();

    const telephone = String(
      formulaire.telephone || ""
    ).trim();

    const telephoneNormalise =
      normaliserTelephone(telephone);

    const lieu = String(
      formulaire.lieu_residence || ""
    ).trim();

    const montantCotisation = String(
      formulaire.montant_cotisation || ""
    ).trim();

    console.log(
      "VALIDATION TELEPHONE :",
      {
        valeurSaisie: telephone,
        valeurNormalisee: telephoneNormalise,
        longueur: telephoneNormalise.length,
      }
    );

    // ==========================================================
    // NOM
    // ==========================================================

    if (!nom) {
      erreurs.nom =
        "Le nom est obligatoire.";
    } else if (nom.length < 2) {
      erreurs.nom =
        "Le nom doit contenir au moins 2 caractères.";
    }

    // ==========================================================
    // PRENOM
    // ==========================================================

    if (!prenom) {
      erreurs.prenom =
        "Le prénom est obligatoire.";
    } else if (prenom.length < 2) {
      erreurs.prenom =
        "Le prénom doit contenir au moins 2 caractères.";
    }

    // ==========================================================
    // TELEPHONE
    // ==========================================================

    if (!telephoneNormalise) {
      erreurs.telephone =
        "Le numéro de téléphone est obligatoire.";
    } else if (
      telephoneNormalise.length !== 9
    ) {
      erreurs.telephone =
        "Le numéro doit contenir exactement 9 chiffres. Exemple : 77 123 45 67.";
    } else if (
      !/^(70|71|75|76|77|78)/.test(
        telephoneNormalise
      )
    ) {
      erreurs.telephone =
        "Le numéro de téléphone sénégalais est invalide.";
    }

    // ==========================================================
    // RESIDENCE
    // ==========================================================

    if (!lieu) {
      erreurs.lieu_residence =
        "Le lieu de résidence est obligatoire.";
    } else if (lieu.length < 2) {
      erreurs.lieu_residence =
        "Le lieu doit contenir au moins 2 caractères.";
    }

    // ==========================================================
    // COTISATION
    // ==========================================================

    if (!montantCotisation) {
      erreurs.montant_cotisation =
        "Le montant de cotisation mensuelle est obligatoire.";
    } else if (
      !/^\d+(\.\d{1,2})?$/.test(
        montantCotisation
      )
    ) {
      erreurs.montant_cotisation =
        "Le montant doit être un nombre valide.";
    } else if (
      Number(montantCotisation) <= 0
    ) {
      erreurs.montant_cotisation =
        "Le montant doit être supérieur à 0.";
    }

    // ==========================================================
    // FONCTIONS
    // ==========================================================

    if (
      !Array.isArray(
        formulaire.fonction_ids
      ) ||
      formulaire.fonction_ids.length === 0
    ) {
      erreurs.fonction_ids =
        "Au moins une fonction doit être attribuée au membre.";
    }

    setErreursFormulaire(erreurs);

    console.log(
      "VALIDATION FORMULAIRE :",
      erreurs
    );

    return (
      Object.keys(erreurs).length === 0
    );
  }

  // ============================================================
  // OUVRIR AJOUT
  // ============================================================

  function ouvrirAjout() {
    console.log(
      "OUVERTURE FORMULAIRE AJOUT"
    );

    setModeEdition(false);
    setMembreSelectionne(null);

    setFormulaire({
      nom: "",
      prenom: "",
      telephone: "",
      lieu_residence: "",
      montant_cotisation: "",
      fonction_ids: [],
      kourel_ids: [],
    });

    setErreursFormulaire({});
    setErreur("");
    setMessage("");
    setModalOuverte(true);
  }

  // ============================================================
  // EXTRAIRE IDS FONCTIONS
  // ============================================================

  function obtenirFonctionIds(membre) {
    if (
      Array.isArray(
        membre.fonction_ids
      )
    ) {
      return membre.fonction_ids
        .map(Number)
        .filter(
          (id) => !Number.isNaN(id)
        );
    }

    if (
      Array.isArray(
        membre.fonctions
      )
    ) {
      return membre.fonctions
        .map(
          (fonction) =>
            Number(fonction.id)
        )
        .filter(
          (id) => !Number.isNaN(id)
        );
    }

    return [];
  }

  // ============================================================
  // EXTRAIRE IDS KOURELS
  // ============================================================

  function obtenirKourelIds(membre) {
    if (
      Array.isArray(
        membre.kourel_ids
      )
    ) {
      return membre.kourel_ids
        .map(Number)
        .filter(
          (id) => !Number.isNaN(id)
        );
    }

    if (
      Array.isArray(
        membre.kourels
      )
    ) {
      return membre.kourels
        .map(
          (kourel) =>
            Number(kourel.id)
        )
        .filter(
          (id) => !Number.isNaN(id)
        );
    }

    return [];
  }

  // ============================================================
  // OUVRIR MODIFICATION
  // ============================================================

  function ouvrirModification(membre) {
    console.log(
      "OUVERTURE MODIFICATION :",
      membre
    );

    setModeEdition(true);
    setMembreSelectionne(membre);

    setFormulaire({
      nom: membre.nom || "",
      prenom: membre.prenom || "",
      telephone: formaterTelephone(
        membre.telephone || ""
      ),
      lieu_residence:
        membre.lieu_residence || "",
      montant_cotisation:
        membre.montant_cotisation != null
          ? String(
              membre.montant_cotisation
            )
          : membre.montant_cotisation_mensuelle != null
            ? String(
                membre.montant_cotisation_mensuelle
              )
            : "",
      fonction_ids:
        obtenirFonctionIds(membre),
      kourel_ids:
        obtenirKourelIds(membre),
    });

    setErreursFormulaire({});
    setErreur("");
    setMessage("");
    setModalOuverte(true);
  }

  // ============================================================
  // FERMER MODAL
  // ============================================================

  function fermerModal() {
    if (enregistrement) {
      return;
    }

    setModalOuverte(false);
    setMembreSelectionne(null);

    setFormulaire({
      nom: "",
      prenom: "",
      telephone: "",
      lieu_residence: "",
      montant_cotisation: "",
      fonction_ids: [],
      kourel_ids: [],
    });

    setErreursFormulaire({});
  }

  // ============================================================
  // SOUMISSION
  // ============================================================

  async function handleSubmit(event) {
    event.preventDefault();

    console.log("=================================");
    console.log(
      "BOUTON AJOUT / MODIFICATION CLIQUÉ"
    );
    console.log("=================================");

    setErreur("");
    setMessage("");

    console.log(
      "FORMULAIRE ACTUEL :",
      formulaire
    );

    const formulaireValide =
      validerFormulaire();

    console.log(
      "FORMULAIRE VALIDE :",
      formulaireValide
    );

    if (!formulaireValide) {
      console.log(
        "❌ ENREGISTREMENT BLOQUÉ PAR LA VALIDATION"
      );
      return;
    }

    try {
      setEnregistrement(true);

      const telephone =
        normaliserTelephone(
          formulaire.telephone
        );

      const donnees = {
        nom: formulaire.nom.trim(),

        prenom:
          formulaire.prenom.trim(),

        telephone,

        lieu_residence:
          formulaire.lieu_residence.trim(),

        montant_cotisation:
          Number(
            formulaire.montant_cotisation
          ),

        fonction_ids:
          formulaire.fonction_ids.map(
            Number
          ),

        kourel_ids:
          formulaire.kourel_ids.map(
            Number
          ),
      };

      console.log(
        "================================="
      );

      console.log(
        "DONNEES ENVOYEES AU BACKEND :"
      );

      console.log(donnees);

      console.log(
        "TELEPHONE ENVOYE :",
        donnees.telephone
      );

      console.log(
        "================================="
      );

      // ========================================================
      // MODIFICATION
      // ========================================================

      if (
        modeEdition &&
        membreSelectionne
      ) {
        console.log(
          "MODIFICATION DU MEMBRE :",
          membreSelectionne.id
        );

        const response =
          await modifierMembre(
            membreSelectionne.id,
            donnees
          );

        console.log(
          "REPONSE MODIFICATION :",
          response
        );

        setMessage(
          "Les informations du membre ont été modifiées avec succès."
        );
      }

      // ========================================================
      // CREATION
      // ========================================================

      else {
        console.log(
          "CREATION D'UN NOUVEAU MEMBRE"
        );

        const response =
          await creerMembre(
            donnees
          );

        console.log(
          "MEMBRE CREE :",
          response
        );

        setMessage(
          "Le membre a été ajouté avec succès."
        );
      }

      // ========================================================
      // FERMETURE
      // ========================================================

      setModalOuverte(false);
      setMembreSelectionne(null);

      setFormulaire({
        nom: "",
        prenom: "",
        telephone: "",
        lieu_residence: "",
        montant_cotisation: "",
        fonction_ids: [],
        kourel_ids: [],
      });

      setErreursFormulaire({});

      // Recharger la liste
      await chargerMembres(
        rechercheActive,
        inclureInactifs
      );

    } catch (error) {
      console.error(
        "================================="
      );

      console.error(
        "ERREUR ENREGISTREMENT :",
        error
      );

      console.error(
        "REPONSE BACKEND :",
        error.response?.data
      );

      console.error(
        "STATUT HTTP :",
        error.response?.status
      );

      console.error(
        "================================="
      );

      // ========================================================
      // 401
      // ========================================================

      if (
        error.response?.status === 401
      ) {
        setErreur(
          "Votre session a expiré. Veuillez vous reconnecter."
        );
      }

      // ========================================================
      // 403
      // ========================================================

      else if (
        error.response?.status === 403
      ) {
        setErreur(
          "Vous n'avez pas la permission d'effectuer cette action."
        );
      }

      // ========================================================
      // 409
      // ========================================================

      else if (
        error.response?.status === 409
      ) {
        setErreur(
          error.response?.data?.detail ||
            "Ce numéro de téléphone est déjà utilisé."
        );
      }

      // ========================================================
      // 422
      // ========================================================

      else if (
        error.response?.status === 422
      ) {
        const detail =
          error.response?.data?.detail;

        if (
          Array.isArray(detail)
        ) {
          setErreur(
            detail
              .map(
                (item) =>
                  item.msg ||
                  "Donnée invalide."
              )
              .join(" ")
          );
        } else {
          setErreur(
            detail ||
              "Certaines données saisies sont invalides."
          );
        }
      }

      // ========================================================
      // AUTRE ERREUR
      // ========================================================

      else {
        setErreur(
          error.response?.data?.detail ||
            error.message ||
            "Une erreur est survenue lors de l'enregistrement."
        );
      }

    } finally {
      setEnregistrement(false);
    }
  }

  // ============================================================
  // ACTIVER / DESACTIVER
  // ============================================================

  async function handleToggleActif(membre) {
    const action = membre.actif
      ? "désactiver"
      : "réactiver";

    const confirmation =
      window.confirm(
        `Voulez-vous vraiment ${action} ${membre.prenom} ${membre.nom} ?`
      );

    if (!confirmation) {
      return;
    }

    try {
      setActionId(membre.id);
      setErreur("");
      setMessage("");

      if (membre.actif) {
        await desactiverMembre(
          membre.id
        );

        setMessage(
          `${membre.prenom} ${membre.nom} a été désactivé.`
        );
      } else {
        await activerMembre(
          membre.id
        );

        setMessage(
          `${membre.prenom} ${membre.nom} a été réactivé.`
        );
      }

      await chargerMembres(
        rechercheActive,
        inclureInactifs
      );

    } catch (error) {
      console.error(
        "Erreur changement statut :",
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
          "Vous n'avez pas la permission de modifier le statut."
        );
      } else {
        setErreur(
          error.response?.data?.detail ||
            "Impossible de modifier le statut du membre."
        );
      }

    } finally {
      setActionId(null);
    }
  }

  // ============================================================
  // STATISTIQUES
  // ============================================================

  const total = membres.length;

  const actifs =
    membres.filter(
      (membre) =>
        membre.actif
    ).length;

  const inactifs =
    membres.filter(
      (membre) =>
        !membre.actif
    ).length;

  const membresKourel =
    membres.filter(
      (membre) =>
        membre.est_membre_kourel === true ||
        (
          Array.isArray(
            membre.kourels
          ) &&
          membre.kourels.length > 0
        )
    ).length;

  // ============================================================
  // FORMATAGE MONTANT
  // ============================================================

  function formaterMontant(montant) {
    if (
      montant === null ||
      montant === undefined ||
      montant === ""
    ) {
      return "—";
    }

    const nombre = Number(montant);

    if (Number.isNaN(nombre)) {
      return "—";
    }

    return `${nombre.toLocaleString(
      "fr-FR"
    )} FCFA`;
  }

  // ============================================================
  // AFFICHER FONCTIONS
  // ============================================================

  function afficherFonctions(membre) {
    if (
      Array.isArray(
        membre.fonctions
      ) &&
      membre.fonctions.length > 0
    ) {
      return membre.fonctions;
    }

    return [];
  }

  // ============================================================
  // AFFICHER KOURELS
  // ============================================================

  function afficherKourels(membre) {
    if (
      Array.isArray(
        membre.kourels
      ) &&
      membre.kourels.length > 0
    ) {
      return membre.kourels;
    }

    return [];
  }

  // ============================================================
  // RENDU
  // ============================================================

  return (
    <div className="space-y-8">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Administration
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Membres
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Gérez les membres du Dahira,
            leurs fonctions, leurs Kourels,
            leurs coordonnées, leur cotisation
            mensuelle et leur statut.
          </p>
        </div>

        <button
          type="button"
          onClick={ouvrirAjout}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-950 focus:outline-none focus:ring-4 focus:ring-emerald-900/20"
        >
          <span className="text-lg leading-none">
            +
          </span>

          Ajouter un membre
        </button>

      </div>

      {/* ======================================================
          MESSAGES
      ====================================================== */}

      {message && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">

          <div className="flex gap-3">
            <span className="font-bold">
              ✓
            </span>

            <span>
              {message}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              setMessage("")
            }
            className="text-emerald-600 hover:text-emerald-900"
          >
            ×
          </button>

        </div>
      )}

      {erreur && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          <div className="flex gap-3">
            <span className="font-bold">
              !
            </span>

            <span>
              {erreur}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              setErreur("")
            }
            className="text-red-500 hover:text-red-800"
          >
            ×
          </button>

        </div>
      )}

      {/* ======================================================
          STATISTIQUES
      ====================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Total affiché
          </p>

          <p className="mt-3 text-3xl font-bold text-gray-900">
            {total}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Résultats actuels
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Membres actifs
          </p>

          <p className="mt-3 text-3xl font-bold text-emerald-700">
            {actifs}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Membres actuellement actifs
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Membres du Kourel
          </p>

          <p className="mt-3 text-3xl font-bold text-indigo-700">
            {membresKourel}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Membres affiliés à un Kourel
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Membres inactifs
          </p>

          <p className="mt-3 text-3xl font-bold text-gray-500">
            {inactifs}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Membres désactivés
          </p>
        </div>

      </div>

      {/* ======================================================
          RECHERCHE
      ====================================================== */}

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

        <form
          onSubmit={handleRecherche}
          className="flex flex-col gap-4"
        >

          <div className="flex flex-col gap-3 lg:flex-row">

            <div className="relative flex-1">

              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>

              <input
                type="search"
                value={recherche}
                onChange={(event) =>
                  setRecherche(
                    event.target.value
                  )
                }
                placeholder="Nom, prénom ou téléphone..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10"
              />

            </div>

            <button
              type="submit"
              className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Rechercher
            </button>

            {(recherche ||
              rechercheActive) && (
              <button
                type="button"
                onClick={
                  effacerRecherche
                }
                className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                Effacer
              </button>
            )}

          </div>

          <label className="flex w-fit cursor-pointer items-center gap-3 text-sm text-gray-600">

            <input
              type="checkbox"
              checked={
                inclureInactifs
              }
              onChange={(event) =>
                setInclureInactifs(
                  event.target.checked
                )
              }
              className="h-4 w-4 rounded border-gray-300 text-emerald-700 focus:ring-emerald-700"
            />

            Afficher également les membres inactifs

          </label>

        </form>

        {rechercheActive && (
          <p className="mt-4 text-xs text-gray-500">

            Recherche pour :{" "}

            <span className="font-semibold text-gray-700">
              "{rechercheActive}"
            </span>

          </p>
        )}

      </div>

      {/* ======================================================
          TABLEAU
      ====================================================== */}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

        <div className="border-b border-gray-100 px-6 py-5">

          <h2 className="font-semibold text-gray-900">
            Liste des membres
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            {total} membre
            {total > 1 ? "s" : ""} affiché
            {total > 1 ? "s" : ""}
          </p>

        </div>

        {chargement ? (

          <div className="flex min-h-[250px] items-center justify-center">

            <div className="flex items-center gap-3 text-sm text-gray-500">

              <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-emerald-700" />

              Chargement des membres...

            </div>

          </div>

        ) : membres.length === 0 ? (

          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
              👥
            </div>

            <h3 className="mt-5 font-semibold text-gray-900">
              Aucun membre trouvé
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">

              {rechercheActive
                ? "Aucun membre ne correspond à votre recherche."
                : "Commencez par ajouter le premier membre du Dahira."}

            </p>

            {!rechercheActive && (
              <button
                type="button"
                onClick={
                  ouvrirAjout
                }
                className="mt-5 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-950"
              >
                Ajouter un membre
              </button>
            )}

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1450px]">

              <thead className="bg-gray-50">

                <tr className="border-b border-gray-100">

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Membre
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Téléphone
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Résidence
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Fonctions
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Kourel
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Cotisation
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Statut
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {membres.map(
                  (membre) => {

                    const fonctionsMembre =
                      afficherFonctions(
                        membre
                      );

                    const kourelsMembre =
                      afficherKourels(
                        membre
                      );

                    return (
                      <tr
                        key={membre.id}
                        className="transition hover:bg-gray-50"
                      >

                        {/* MEMBRE */}

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">

                              {`${membre.prenom || ""} ${
                                membre.nom || ""
                              }`
                                .trim()
                                .split(/\s+/)
                                .filter(Boolean)
                                .map(
                                  (mot) =>
                                    mot
                                      .charAt(0)
                                      .toUpperCase()
                                )
                                .slice(0, 2)
                                .join("") ||
                                "M"}

                            </div>

                            <div className="min-w-0">

                              <p className="truncate font-semibold text-gray-900">

                                {membre.prenom}{" "}
                                {membre.nom}

                              </p>

                              <p className="mt-0.5 text-xs text-gray-400">
                                ID #{membre.id}
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* TELEPHONE */}

                        <td className="px-6 py-5 text-sm text-gray-600">
                          {membre.telephone
                            ? formaterTelephone(
                                membre.telephone
                              )
                            : "—"}
                        </td>

                        {/* RESIDENCE */}

                        <td className="px-6 py-5 text-sm text-gray-600">
                          {membre.lieu_residence ||
                            "—"}
                        </td>

                        {/* FONCTIONS */}

                        <td className="px-6 py-5">

                          {fonctionsMembre.length >
                          0 ? (

                            <div className="flex max-w-[280px] flex-wrap gap-1.5">

                              {fonctionsMembre.map(
                                (fonction) => (

                                  <span
                                    key={
                                      fonction.id
                                    }
                                    className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                                  >
                                    {fonction.nom}
                                  </span>

                                )
                              )}

                            </div>

                          ) : (

                            <span className="text-sm text-gray-400">
                              Aucune
                            </span>

                          )}

                        </td>

                        {/* KOURELS */}

                        <td className="px-6 py-5">

                          {kourelsMembre.length >
                          0 ? (

                            <div className="flex max-w-[260px] flex-wrap gap-1.5">

                              {kourelsMembre.map(
                                (kourel) => (

                                  <span
                                    key={
                                      kourel.id
                                    }
                                    className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700"
                                  >
                                    {kourel.nom}
                                  </span>

                                )
                              )}

                            </div>

                          ) : (

                            <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
                              Aucun Kourel
                            </span>

                          )}

                        </td>

                        {/* COTISATION */}

                        <td className="px-6 py-5 text-sm font-semibold text-gray-700">

                          {formaterMontant(
                            membre.montant_cotisation ??
                              membre.montant_cotisation_mensuelle
                          )}

                        </td>

                        {/* STATUT */}

                        <td className="px-6 py-5">

                          {membre.actif ? (

                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">

                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />

                              Actif

                            </span>

                          ) : (

                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500">

                              <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />

                              Inactif

                            </span>

                          )}

                        </td>

                        {/* ACTIONS */}

                        <td className="px-6 py-5">

                          <div className="flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                ouvrirModification(
                                  membre
                                )
                              }
                              disabled={
                                actionId ===
                                membre.id
                              }
                              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Modifier
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleToggleActif(
                                  membre
                                )
                              }
                              disabled={
                                actionId ===
                                membre.id
                              }
                              className={
                                membre.actif
                                  ? "rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                  : "rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                              }
                            >
                              {actionId ===
                              membre.id
                                ? "..."
                                : membre.actif
                                  ? "Désactiver"
                                  : "Réactiver"}
                            </button>

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

      {/* ======================================================
          MODAL AJOUT / MODIFICATION
      ====================================================== */}

      {modalOuverte && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-8 backdrop-blur-sm"
          onMouseDown={(event) => {

            if (
              event.target ===
                event.currentTarget &&
              !enregistrement
            ) {
              fermerModal();
            }

          }}
        >

          <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">

            {/* HEADER MODAL */}

            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5 sm:px-8">

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">

                  {modeEdition
                    ? "Modification"
                    : "Nouveau membre"}

                </p>

                <h2 className="mt-2 text-2xl font-bold text-gray-900">

                  {modeEdition
                    ? "Modifier le membre"
                    : "Ajouter un membre"}

                </h2>

                <p className="mt-1 text-sm text-gray-500">

                  {modeEdition
                    ? "Modifiez les informations, les fonctions et les Kourels du membre."
                    : "Renseignez les informations du nouveau membre."}

                </p>

              </div>

              <button
                type="button"
                onClick={
                  fermerModal
                }
                disabled={
                  enregistrement
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ×
              </button>

            </div>

            {/* FORMULAIRE */}

            <form
              onSubmit={
                handleSubmit
              }
              noValidate
              className="max-h-[75vh] overflow-y-auto px-6 py-6 sm:px-8"
            >

              <div className="space-y-6">

                {/* INFORMATIONS PERSONNELLES */}

                <div>

                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800">
                    Informations personnelles
                  </h3>

                  <p className="mt-1 text-xs text-gray-400">
                    Informations générales du membre.
                  </p>

                </div>

                {/* NOM + PRENOM */}

                <div className="grid gap-5 sm:grid-cols-2">

                  {/* NOM */}

                  <div>

                    <label
                      htmlFor="nom"
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Nom
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      id="nom"
                      name="nom"
                      type="text"
                      value={
                        formulaire.nom
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        enregistrement
                      }
                      autoComplete="family-name"
                      placeholder="Ex. Diallo"
                      className={`w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
                        erreursFormulaire.nom
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                          : "border-gray-200 focus:border-emerald-700 focus:ring-emerald-700/10"
                      }`}
                    />

                    {erreursFormulaire.nom && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {
                          erreursFormulaire.nom
                        }
                      </p>
                    )}

                  </div>

                  {/* PRENOM */}

                  <div>

                    <label
                      htmlFor="prenom"
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Prénom
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      id="prenom"
                      name="prenom"
                      type="text"
                      value={
                        formulaire.prenom
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        enregistrement
                      }
                      autoComplete="given-name"
                      placeholder="Ex. Moustapha"
                      className={`w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
                        erreursFormulaire.prenom
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                          : "border-gray-200 focus:border-emerald-700 focus:ring-emerald-700/10"
                      }`}
                    />

                    {erreursFormulaire.prenom && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {
                          erreursFormulaire.prenom
                        }
                      </p>
                    )}

                  </div>

                </div>

                {/* TELEPHONE */}

                <div>

                  <label
                    htmlFor="telephone"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Téléphone
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <div
                    className={`flex overflow-hidden rounded-xl border bg-gray-50 transition focus-within:bg-white focus-within:ring-4 ${
                      erreursFormulaire.telephone
                        ? "border-red-300 focus-within:border-red-500 focus-within:ring-red-500/10"
                        : "border-gray-200 focus-within:border-emerald-700 focus-within:ring-emerald-700/10"
                    }`}
                  >

                    <div className="flex items-center border-r border-gray-200 px-4 text-sm font-semibold text-gray-500">
                      +221
                    </div>

                    <input
                      id="telephone"
                      name="telephone"
                      type="tel"
                      value={
                        formulaire.telephone
                      }
                      onChange={
                        handleTelephoneChange
                      }
                      disabled={
                        enregistrement
                      }
                      autoComplete="tel"
                      inputMode="numeric"
                      maxLength={12}
                      placeholder="77 123 45 67"
                      className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                    />

                  </div>

                  <p className="mt-1.5 text-xs text-gray-400">
                    Exemple : 77 123 45 67 — le +221 est ajouté automatiquement.
                  </p>

                  {erreursFormulaire.telephone && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {
                        erreursFormulaire.telephone
                      }
                    </p>
                  )}

                </div>

                {/* RESIDENCE */}

                <div>

                  <label
                    htmlFor="lieu_residence"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Lieu de résidence
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="lieu_residence"
                    name="lieu_residence"
                    type="text"
                    value={
                      formulaire.lieu_residence
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      enregistrement
                    }
                    autoComplete="address-level2"
                    placeholder="Ex. Castors"
                    className={`w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
                      erreursFormulaire.lieu_residence
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                        : "border-gray-200 focus:border-emerald-700 focus:ring-emerald-700/10"
                    }`}
                  />

                  {erreursFormulaire.lieu_residence && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {
                        erreursFormulaire.lieu_residence
                      }
                    </p>
                  )}

                </div>

                {/* FONCTIONS */}

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <label className="block text-sm font-bold text-gray-800">
                        Fonctions occupées
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      </label>

                      <p className="mt-1 text-xs leading-5 text-gray-500">
                        Sélectionnez une ou plusieurs fonctions
                        occupées par ce membre.
                      </p>

                    </div>

                    {formulaire.fonction_ids.length >
                      0 && (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {formulaire.fonction_ids.length} sélectionnée
                        {formulaire.fonction_ids.length >
                        1
                          ? "s"
                          : ""}
                      </span>
                    )}

                  </div>

                  {chargementOptions ? (

                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">

                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-emerald-700" />

                      Chargement des fonctions...

                    </div>

                  ) : fonctions.length === 0 ? (

                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      Aucune fonction active n'est disponible.
                    </div>

                  ) : (

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">

                      {fonctions.map(
                        (fonction) => {

                          const selectionnee =
                            formulaire.fonction_ids.includes(
                              Number(
                                fonction.id
                              )
                            );

                          return (

                            <label
                              key={
                                fonction.id
                              }
                              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                                selectionnee
                                  ? "border-emerald-300 bg-emerald-50"
                                  : "border-gray-200 bg-white hover:border-emerald-200"
                              }`}
                            >

                              <input
                                type="checkbox"
                                checked={
                                  selectionnee
                                }
                                onChange={() =>
                                  handleFonctionChange(
                                    fonction.id
                                  )
                                }
                                disabled={
                                  enregistrement
                                }
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-700 focus:ring-emerald-700"
                              />

                              <span className="min-w-0">

                                <span className="block text-sm font-semibold text-gray-800">
                                  {
                                    fonction.nom
                                  }
                                </span>

                                {fonction.description && (
                                  <span className="mt-0.5 block text-xs leading-5 text-gray-500">
                                    {
                                      fonction.description
                                    }
                                  </span>
                                )}

                              </span>

                            </label>

                          );
                        }
                      )}

                    </div>

                  )}

                  {erreursFormulaire.fonction_ids && (
                    <p className="mt-2 text-xs text-red-600">
                      {
                        erreursFormulaire.fonction_ids
                      }
                    </p>
                  )}

                </div>

                {/* KOURELS */}

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <label className="block text-sm font-bold text-gray-800">
                        Membre du Kourel
                      </label>

                      <p className="mt-1 text-xs leading-5 text-gray-500">
                        Facultatif. Sélectionnez un ou plusieurs
                        Kourels auxquels ce membre appartient.
                      </p>

                    </div>

                    {formulaire.kourel_ids.length >
                      0 && (
                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                        {formulaire.kourel_ids.length} Kourel
                        {formulaire.kourel_ids.length >
                        1
                          ? "s"
                          : ""}
                      </span>
                    )}

                  </div>

                  {chargementOptions ? (

                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">

                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-700" />

                      Chargement des Kourels...

                    </div>

                  ) : kourels.length === 0 ? (

                    <div className="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
                      Aucun Kourel disponible.
                    </div>

                  ) : (

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">

                      {kourels.map(
                        (kourel) => {

                          const selectionne =
                            formulaire.kourel_ids.includes(
                              Number(
                                kourel.id
                              )
                            );

                          return (

                            <label
                              key={
                                kourel.id
                              }
                              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                                selectionne
                                  ? "border-indigo-300 bg-indigo-50"
                                  : "border-gray-200 bg-white hover:border-indigo-200"
                              }`}
                            >

                              <input
                                type="checkbox"
                                checked={
                                  selectionne
                                }
                                onChange={() =>
                                  handleKourelChange(
                                    kourel.id
                                  )
                                }
                                disabled={
                                  enregistrement
                                }
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-700 focus:ring-indigo-700"
                              />

                              <span className="min-w-0">

                                <span className="block text-sm font-semibold text-gray-800">
                                  {
                                    kourel.nom
                                  }
                                </span>

                                {kourel.description && (
                                  <span className="mt-0.5 block text-xs leading-5 text-gray-500">
                                    {
                                      kourel.description
                                    }
                                  </span>
                                )}

                              </span>

                            </label>

                          );
                        }
                      )}

                    </div>

                  )}

                  {formulaire.kourel_ids.length ===
                    0 && (
                    <p className="mt-3 text-xs text-gray-400">
                      Ce membre ne sera affilié à aucun Kourel.
                    </p>
                  )}

                </div>

                {/* COTISATION */}

                <div>

                  <label
                    htmlFor="montant_cotisation"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Cotisation mensuelle
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <div
                    className={`flex overflow-hidden rounded-xl border bg-gray-50 transition focus-within:bg-white focus-within:ring-4 ${
                      erreursFormulaire.montant_cotisation
                        ? "border-red-300 focus-within:border-red-500 focus-within:ring-red-500/10"
                        : "border-gray-200 focus-within:border-emerald-700 focus-within:ring-emerald-700/10"
                    }`}
                  >

                    <input
                      id="montant_cotisation"
                      name="montant_cotisation"
                      type="number"
                      min="1"
                      step="1"
                      value={
                        formulaire.montant_cotisation
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        enregistrement
                      }
                      placeholder="Ex. 5000"
                      className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <div className="flex items-center border-l border-gray-200 px-4 text-sm font-semibold text-gray-500">
                      FCFA
                    </div>

                  </div>

                  <p className="mt-1.5 text-xs text-gray-400">
                    Montant que le membre doit cotiser chaque mois.
                  </p>

                  {erreursFormulaire.montant_cotisation && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {
                        erreursFormulaire.montant_cotisation
                      }
                    </p>
                  )}

                </div>

              </div>

              {/* ==================================================
                  ACTIONS
                  ================================================== */}

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    fermerModal
                  }
                  disabled={
                    enregistrement
                  }
                  className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={
                    enregistrement ||
                    chargementOptions
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-950 focus:outline-none focus:ring-4 focus:ring-emerald-900/20 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {enregistrement && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  )}

                  {enregistrement
                    ? "Enregistrement..."
                    : modeEdition
                      ? "Enregistrer les modifications"
                      : "Ajouter le membre"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Membres;
