
import { useEffect, useMemo, useState } from "react";

import {
  Music,
  Plus,
  Trash2,
  CalendarDays,
  Clock,
  MapPin,
  Headphones,
  BookOpen,
  Volume2,
  X,
  Check,
  ChevronRight,
  Loader2,
  RefreshCw,
  Pencil,
  Mic2,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

// ==========================================================
// UTILITAIRES
// ==========================================================

function formaterDate(dateValue) {
  if (!dateValue) return "—";

  try {
    return new Date(dateValue).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateValue;
  }
}

function formaterHeure(heureValue) {
  if (!heureValue) return "—";

  if (typeof heureValue === "string") {
    return heureValue.slice(0, 5);
  }

  return heureValue;
}

function construireUrlAudio(url) {
  if (!url) return "";

  // URL Cloudinary ou autre URL externe
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const base =
    api.defaults.baseURL?.replace(/\/+$/, "") || "";

  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}

function extraireKhassidasDeclamation(declamation) {
  if (!declamation) return [];

  if (Array.isArray(declamation.khassidas)) {
    return declamation.khassidas;
  }

  if (Array.isArray(declamation.declamation_khassidas)) {
    return declamation.declamation_khassidas;
  }

  return [];
}

// ==========================================================
// COMPOSANT PRINCIPAL
// ==========================================================

export default function ProgrammeReligieux() {
  const {
    utilisateur,
    aPermission,
    estGestionnaireKourel,
  } = useAuth();

  // ========================================================
  // PERMISSIONS
  // ========================================================

  const peutConsulter = useMemo(
    () => aPermission("KOUREL_CONSULTER"),
    [aPermission]
  );

  const peutModifier = useMemo(
    () =>
      aPermission("KOUREL_MODIFIER") ||
      aPermission("KOUREL_CREER"),
    [aPermission]
  );

  // ========================================================
  // PROGRAMMES
  // ========================================================

  const [programmes, setProgrammes] = useState([]);
  const [programmeSelectionne, setProgrammeSelectionne] =
    useState(null);

  const [chargement, setChargement] = useState(true);
  const [chargementProgramme, setChargementProgramme] =
    useState(false);
  const [rafraichissement, setRafraichissement] =
    useState(false);

  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  const [modalProgramme, setModalProgramme] =
    useState(false);

  const [formProgramme, setFormProgramme] = useState({
    kourel_id: "",
    annee: new Date().getFullYear(),
    mois: new Date().getMonth() + 1,
  });

  // ========================================================
  // REPETITIONS
  // ========================================================

  const [repetitionSelectionnee, setRepetitionSelectionnee] =
    useState(null);

  const [modalRepetition, setModalRepetition] =
    useState(false);

  const [formRepetition, setFormRepetition] = useState({
    date_repetition: "",
    heure_debut: "",
    heure_fin: "",
    lieu: "",
    ordre: 1,
  });

  const [repetitions, setRepetitions] = useState([]);
  const [chargementRepetitions, setChargementRepetitions] =
    useState(false);

  // ========================================================
  // KHASSIDAS REPETITION
  // ========================================================

  const [modalKhassida, setModalKhassida] =
    useState(false);

  const [khassidas, setKhassidas] = useState([]);
  const [khassidasProgramme, setKhassidasProgramme] =
    useState([]);

  const [khassidaSelectionnee, setKhassidaSelectionnee] =
    useState(null);

  const [tons, setTons] = useState([]);
  const [audios, setAudios] = useState([]);

  const [tonSelectionne, setTonSelectionne] =
    useState("");

  const [audioSelectionne, setAudioSelectionne] =
    useState("");

  const [ordreKhassida, setOrdreKhassida] =
    useState(1);

  const [chargementKhassidas, setChargementKhassidas] =
    useState(false);

  const [chargementTons, setChargementTons] =
    useState(false);

  const [chargementAudios, setChargementAudios] =
    useState(false);

  // ========================================================
  // DECLAMATIONS
  // ========================================================

  const [modalDeclamation, setModalDeclamation] =
    useState(false);

  const [declamationSelectionnee, setDeclamationSelectionnee] =
    useState(null);

  const [formDeclamation, setFormDeclamation] = useState({
    date_declamaion: "",
    date_declamation: "",
    heure_debut: "",
    heure_fin: "",
    lieu: "",
    ordre: 1,
  });

  const [declamations, setDeclamations] =
    useState([]);

  const [chargementDeclamations, setChargementDeclamations] =
    useState(false);

  const [modalKhassidaDeclamation, setModalKhassidaDeclamation] =
    useState(false);

  const [khassidasDeclamation, setKhassidasDeclamation] =
    useState([]);

  const [khassidaDeclamationSelectionnee, setKhassidaDeclamationSelectionnee] =
    useState(null);

  const [tonsDeclamation, setTonsDeclamation] =
    useState([]);

  const [audiosDeclamation, setAudiosDeclamation] =
    useState([]);

  const [tonDeclamationSelectionne, setTonDeclamationSelectionne] =
    useState("");

  const [audioDeclamationSelectionne, setAudioDeclamationSelectionne] =
    useState("");

  const [ordreKhassidaDeclamation, setOrdreKhassidaDeclamation] =
    useState(1);

  const [chargementKhassidasDeclamation, setChargementKhassidasDeclamation] =
    useState(false);

  // ========================================================
  // GESTION DES ERREURS
  // ========================================================

  function afficherErreur(error, messageParDefaut) {
    console.error(error);

    const detail = error?.response?.data?.detail;

    if (typeof detail === "string") {
      setErreur(detail);
      return;
    }

    if (Array.isArray(detail)) {
      setErreur(
        detail
          .map((item) => {
            if (typeof item === "string") return item;

            return (
              item?.msg ||
              item?.message ||
              "Erreur de validation."
            );
          })
          .join(" ")
      );
      return;
    }

    if (error?.message) {
      setErreur(error.message);
      return;
    }

    setErreur(messageParDefaut);
  }

  // ========================================================
  // CHARGER LES PROGRAMMES
  // ========================================================

  async function chargerProgrammes(
    afficherLoader = true
  ) {
    if (afficherLoader) {
      setChargement(true);
    } else {
      setRafraichissement(true);
    }

    setErreur("");

    try {
      const response = await api.get(
        "/programmes-religieux"
      );

      const liste = Array.isArray(response.data)
        ? response.data
        : [];

      setProgrammes(liste);

      if (liste.length === 0) {
        setProgrammeSelectionne(null);
        setRepetitions([]);
        setDeclamations([]);
        return;
      }

      const programmeCourant =
        programmeSelectionne &&
        liste.find(
          (programme) =>
            Number(programme.id) ===
            Number(programmeSelectionne.id)
        );

      const programme =
        programmeCourant || liste[0];

      await chargerProgramme(programme.id);
    } catch (error) {
      afficherErreur(
        error,
        "Impossible de charger les programmes religieux."
      );
    } finally {
      if (afficherLoader) {
        setChargement(false);
      } else {
        setRafraichissement(false);
      }
    }
  }

  // ========================================================
  // CHARGER UN PROGRAMME
  // ========================================================

  async function chargerProgramme(programmeId) {
    if (!programmeId) return;

    setChargementProgramme(true);

    try {
      const response = await api.get(
        `/programmes-religieux/${programmeId}`
      );

      const programme = response.data;

      setProgrammeSelectionne(programme);

      setRepetitions(
        Array.isArray(programme?.repetitions)
          ? programme.repetitions
          : []
      );

      setDeclamations(
        extraireKhassidasDeclamation(programme)
      );

      if (
        Array.isArray(programme?.declamations)
      ) {
        setDeclamations(
          programme.declamations
        );
      }
    } catch (error) {
      afficherErreur(
        error,
        "Impossible de charger le programme."
      );
    } finally {
      setChargementProgramme(false);
    }
  }

  // ========================================================
  // CHARGEMENT INITIAL
  // ========================================================

  useEffect(() => {
    if (peutConsulter) {
      chargerProgrammes(true);
    } else {
      setChargement(false);
    }
  }, [peutConsulter]);

  // ========================================================
  // MODAL PROGRAMME
  // ========================================================

  function ouvrirModalProgramme() {
    setErreur("");
    setMessage("");

    setFormProgramme({
      kourel_id:
        utilisateur?.gestionnaire_kourel_id || "",
      annee: new Date().getFullYear(),
      mois: new Date().getMonth() + 1,
    });

    setModalProgramme(true);
  }

  function fermerModalProgramme() {
    setModalProgramme(false);
  }

  // ========================================================
  // CREER PROGRAMME
  // ========================================================

 async function creerProgramme(event) {
  event.preventDefault();

  setErreur("");
  setMessage("");

  try {
    const kourelId =
      utilisateur?.gestionnaire_kourel_id;

    if (!kourelId) {
      throw new Error(
        "Aucun Kourel de gestion n'est associé à votre compte."
      );
    }

    if (!estGestionnaireKourel(kourelId)) {
      throw new Error(
        "Vous n'êtes pas gestionnaire de ce Kourel."
      );
    }

    const annee = Number(formProgramme.annee);

    if (
      !Number.isInteger(annee) ||
      annee < 2000 ||
      annee > 2100
    ) {
      throw new Error(
        "Veuillez saisir une année valide."
      );
    }

    const mois = Number(formProgramme.mois);

    if (
      !Number.isInteger(mois) ||
      mois < 1 ||
      mois > 12
    ) {
      throw new Error(
        "Veuillez sélectionner un mois valide."
      );
    }

    const params = new URLSearchParams();

    params.append(
      "kourel_id",
      String(kourelId)
    );

    params.append(
      "annee",
      String(annee)
    );

    params.append(
      "mois",
      String(mois)
    );

    console.log(
      "CRÉATION PROGRAMME RELIGIEUX :",
      {
        kourel_id: kourelId,
        annee,
        mois,
      }
    );

    await api.post(
      `/programmes-religieux?${params.toString()}`
    );

    setMessage(
      "Programme religieux créé avec succès."
    );

    fermerModalProgramme();

    await chargerProgrammes(false);
  } catch (error) {
    console.error(
      "ERREUR CRÉATION PROGRAMME :",
      error
    );

    afficherErreur(
      error,
      error?.message ||
        "Impossible de créer le programme."
    );
  }
}

  // ========================================================
  // REPETITIONS
  // ========================================================

  async function ouvrirRepetition(repetition) {
    setRepetitionSelectionnee(repetition);

    setKhassidasProgramme([]);

    try {
      await chargerKhassidas(
        repetition.id
      );
    } catch (error) {
      console.error(error);
    }
  }

  async function chargerKhassidas(
    repetitionId
  ) {
    if (!programmeSelectionne?.id) return;

    setChargementKhassidas(true);

    try {
      const response = await api.get(
        `/programmes-religieux/${programmeSelectionne.id}/repetitions/${repetitionId}/khassidas`
      );

      const liste = Array.isArray(response.data)
        ? response.data
        : [];

      setKhassidasProgramme(liste);
    } catch (error) {
      afficherErreur(
        error,
        "Impossible de charger les Khassidas."
      );
    } finally {
      setChargementKhassidas(false);
    }
  }

  function ouvrirModalRepetition() {
    setErreur("");

    setFormRepetition({
      date_repetition: "",
      heure_debut: "",
      heure_fin: "",
      lieu: "",
      ordre: repetitions.length + 1,
    });

    setRepetitionSelectionnee(null);
    setModalRepetition(true);
  }

  function fermerModalRepetition() {
    setModalRepetition(false);
    setRepetitionSelectionnee(null);
  }

  function modifierRepetition(repetition) {
    setRepetitionSelectionnee(repetition);

    setFormRepetition({
      date_repetition:
        repetition.date_repetition || "",
      heure_debut:
        repetition.heure_debut?.slice(0, 5) ||
        "",
      heure_fin:
        repetition.heure_fin?.slice(0, 5) ||
        "",
      lieu: repetition.lieu || "",
      ordre:
        repetition.ordre ||
        repetitions.length + 1,
    });

    setModalRepetition(true);
  }

  async function enregistrerRepetition(event) {
    event.preventDefault();

    if (!programmeSelectionne?.id) {
      setErreur(
        "Aucun programme sélectionné."
      );
      return;
    }

    setErreur("");
    setMessage("");

    try {
      const payload = {
        date_repetition:
          formRepetition.date_repetition,
        heure_debut:
          formRepetition.heure_debut || null,
        heure_fin:
          formRepetition.heure_fin || null,
        lieu:
          formRepetition.lieu || null,
        ordre: Number(
          formRepetition.ordre
        ),
      };

      if (repetitionSelectionnee?.id) {
        await api.put(
          `/programmes-religieux/${programmeSelectionne.id}/repetitions/${repetitionSelectionnee.id}`,
          payload
        );

        setMessage(
          "Répétition modifiée avec succès."
        );
      } else {
        await api.post(
          `/programmes-religieux/${programmeSelectionne.id}/repetitions`,
          payload
        );

        setMessage(
          "Répétition créée avec succès."
        );
      }

      fermerModalRepetition();

      await chargerProgramme(
        programmeSelectionne.id
      );
    } catch (error) {
      afficherErreur(
        error,
        "Impossible d'enregistrer la répétition."
      );
    }
  }

  async function supprimerRepetition(
    repetitionId
  ) {
    if (!programmeSelectionne?.id) return;

    if (
      !window.confirm(
        "Voulez-vous vraiment supprimer cette répétition ?"
      )
    ) {
      return;
    }

    setErreur("");

    try {
      await api.delete(
        `/programmes-religieux/${programmeSelectionne.id}/repetitions/${repetitionId}`
      );

      setMessage(
        "Répétition supprimée avec succès."
      );

      if (
        repetitionSelectionnee?.id ===
        repetitionId
      ) {
        setRepetitionSelectionnee(null);
      }

      await chargerProgramme(
        programmeSelectionne.id
      );
    } catch (error) {
      afficherErreur(
        error,
        "Impossible de supprimer la répétition."
      );
    }
  }

  // ========================================================
  // GENERER LES REPETITIONS
  // ========================================================

  async function genererRepetitions() {
    if (!programmeSelectionne?.id) return;

    if (
      !window.confirm(
        "Voulez-vous générer automatiquement les répétitions du programme ?"
      )
    ) {
      return;
    }

    setErreur("");
    setMessage("");

    try {
      await api.post(
        `/programmes-religieux/${programmeSelectionne.id}/repetitions/generer`
      );

      setMessage(
        "Les répétitions ont été générées avec succès."
      );

      await chargerProgramme(
        programmeSelectionne.id
      );
    } catch (error) {
      afficherErreur(
        error,
        "Impossible de générer les répétitions."
      );
    }
  }

  // ========================================================
  // CATALOGUE KHASSIDAS
  // ========================================================

  async function chargerCatalogueKhassidas() {
    try {
      const response = await api.get(
        "/khassidas"
      );

      setKhassidas(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error) {
      afficherErreur(
        error,
        "Impossible de charger les Khassidas."
      );
    }
  }

  async function ouvrirKhassidaModal(
    repetition
  ) {
    if (!programmeSelectionne?.id) return;

    setRepetitionSelectionnee(repetition);

    setKhassidaSelectionnee(null);
    setTonSelectionne("");
    setAudioSelectionne("");

    setOrdreKhassida(
      (khassidasProgramme?.length || 0) + 1
    );

    setModalKhassida(true);

    await chargerCatalogueKhassidas();

    await chargerKhassidas(
      repetition.id
    );
  }

  function fermerModalKhassida() {
    setModalKhassida(false);

    setKhassidaSelectionnee(null);
    setTons([]);
    setAudios([]);

    setTonSelectionne("");
    setAudioSelectionne("");

    setOrdreKhassida(1);
  }

  // ========================================================
  // TONS KHASSIDA
  // ========================================================

  async function selectionnerKhassida(
    khassidaId
  ) {
    setKhassidaSelectionnee(
      khassidas.find(
        (item) =>
          Number(item.id) ===
          Number(khassidaId)
      ) || null
    );

    setTonSelectionne("");
    setAudioSelectionne("");
    setTons([]);
    setAudios([]);

    if (!khassidaId) return;

    setChargementTons(true);

    try {
      const response = await api.get(
        `/programmes-religieux/khassidas/${khassidaId}/tons`
      );

      setTons(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error) {
      afficherErreur(
        error,
        "Impossible de charger les tons."
      );
    } finally {
      setChargementTons(false);
    }
  }

  // ========================================================
  // AUDIOS KHASSIDA
  // ========================================================

  async function selectionnerTon(
    tonId
  ) {
    setTonSelectionne(tonId);
    setAudioSelectionne("");
    setAudios([]);

    if (
      !khassidaSelectionnee?.id ||
      !tonId
    ) {
      return;
    }

    setChargementAudios(true);

    try {
      const response = await api.get(
        `/programmes-religieux/khassidas/${khassidaSelectionnee.id}/tons/${tonId}/audios`
      );

      setAudios(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error) {
      afficherErreur(
        error,
        "Impossible de charger les audios."
      );
    } finally {
      setChargementAudios(false);
    }
  }

  // ========================================================
  // AJOUTER KHASSIDA A UNE REPETITION
  // ========================================================

  async function ajouterKhassidaARepetition(
    event
  ) {
    event.preventDefault();

    if (
      !programmeSelectionne?.id ||
      !repetitionSelectionnee?.id
    ) {
      setErreur(
        "Aucune répétition sélectionnée."
      );
      return;
    }

    if (!khassidaSelectionnee?.id) {
      setErreur(
        "Veuillez sélectionner une Khassida."
      );
      return;
    }

    if (!tonSelectionne) {
      setErreur(
        "Veuillez sélectionner un ton."
      );
      return;
    }

    setErreur("");
    setMessage("");

    try {
      const payload = {
        khassida_id: Number(
          khassidaSelectionnee.id
        ),
        ton_id: Number(
          tonSelectionne
        ),
        ordre: Number(
          ordreKhassida
        ),
      };

      await api.post(
        `/programmes-religieux/${programmeSelectionne.id}/repetitions/${repetitionSelectionnee.id}/khassidas`,
        payload
      );

      setMessage(
        "Khassida ajoutée à la répétition."
      );

      fermerModalKhassida();

      await chargerProgramme(
        programmeSelectionne.id
      );

      await chargerKhassidas(
        repetitionSelectionnee.id
      );
    } catch (error) {
      afficherErreur(
        error,
        "Impossible d'ajouter la Khassida."
      );
    }
  }

  // ========================================================
  // SUPPRIMER KHASSIDA REPETITION
  // ========================================================

  async function supprimerKhassidaRepetition(
    repetitionKhassidaId
  ) {
    if (
      !programmeSelectionne?.id ||
      !repetitionSelectionnee?.id
    ) {
      return;
    }

    if (
      !window.confirm(
        "Voulez-vous supprimer cette Khassida de la répétition ?"
      )
    ) {
      return;
    }

    setErreur("");

    try {
      await api.delete(
        `/programmes-religieux/${programmeSelectionne.id}/repetitions/${repetitionSelectionnee.id}/khassidas/${repetitionKhassidaId}`
      );

      setMessage(
        "Khassida retirée de la répétition."
      );

      await chargerProgramme(
        programmeSelectionne.id
      );

      await chargerKhassidas(
        repetitionSelectionnee.id
      );
    } catch (error) {
      afficherErreur(
        error,
        "Impossible de retirer la Khassida."
      );
    }
  }

  // ========================================================
  // DECLAMATIONS
  // ========================================================

  function ouvrirModalDeclamation() {
    setErreur("");

    setDeclamationSelectionnee(null);

    setFormDeclamation({
      date_declamaion: "",
      date_declamation: "",
      heure_debut: "",
      heure_fin: "",
      lieu: "",
      ordre: declamations.length + 1,
    });

    setModalDeclamation(true);
  }

  function fermerModalDeclamation() {
    setModalDeclamation(false);
    setDeclamationSelectionnee(null);
  }

  function modifierDeclamation(
    declamation
  ) {
    setDeclamationSelectionnee(
      declamation
    );

    setFormDeclamation({
      date_declamaion:
        declamation.date_declamaion ||
        "",
      date_declamation:
        declamation.date_declamation ||
        "",
      heure_debut:
        declamation.heure_debut?.slice(
          0,
          5
        ) || "",
      heure_fin:
        declamation.heure_fin?.slice(
          0,
          5
        ) || "",
      lieu:
        declamation.lieu || "",
      ordre:
        declamation.ordre ||
        declamations.length + 1,
    });

    setModalDeclamation(true);
  }

  async function enregistrerDeclamation(
    event
  ) {
    event.preventDefault();

    if (!programmeSelectionne?.id) {
      setErreur(
        "Aucun programme sélectionné."
      );
      return;
    }

    setErreur("");
    setMessage("");

    try {
      const dateDeclamation =
        formDeclamation.date_declamation ||
        formDeclamation.date_declamaion;

      const payload = {
        date_declamation:
          dateDeclamation,
        heure_debut:
          formDeclamation.heure_debut ||
          null,
        heure_fin:
          formDeclamation.heure_fin ||
          null,
        lieu:
          formDeclamation.lieu ||
          null,
        ordre: Number(
          formDeclamation.ordre
        ),
      };

      if (
        declamationSelectionnee?.id
      ) {
        await api.put(
          `/programmes-religieux/${programmeSelectionne.id}/declamations/${declamationSelectionnee.id}`,
          payload
        );

        setMessage(
          "Déclamation modifiée avec succès."
        );
      } else {
        await api.post(
          `/programmes-religieux/${programmeSelectionne.id}/declamations`,
          payload
        );

        setMessage(
          "Déclamation créée avec succès."
        );
      }

      fermerModalDeclamation();

      await chargerProgramme(
        programmeSelectionne.id
      );
    } catch (error) {
      afficherErreur(
        error,
        "Impossible d'enregistrer la déclamation."
      );
    }
  }

  async function supprimerDeclamation(
    declamationId
  ) {
    if (!programmeSelectionne?.id) return;

    if (
      !window.confirm(
        "Voulez-vous vraiment supprimer cette déclamation ?"
      )
    ) {
      return;
    }

    setErreur("");

    try {
      await api.delete(
        `/programmes-religieux/${programmeSelectionne.id}/declamations/${declamationId}`
      );

      setMessage(
        "Déclamation supprimée avec succès."
      );

      await chargerProgramme(
        programmeSelectionne.id
      );
    } catch (error) {
      afficherErreur(
        error,
        "Impossible de supprimer la déclamation."
      );
    }
  }

  // ========================================================
  // KHASSIDAS DECLAMATION
  // ========================================================

  async function chargerKhassidasDeclamation(
    declamationId
  ) {
    if (!programmeSelectionne?.id) return;

    setChargementKhassidasDeclamation(
      true
    );

    try {
      const response = await api.get(
        `/programmes-religieux/${programmeSelectionne.id}/declamations/${declamationId}/khassidas`
      );

      setKhassidasDeclamation(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error) {
      afficherErreur(
        error,
        "Impossible de charger les Khassidas de la déclamation."
      );
    } finally {
      setChargementKhassidasDeclamation(
        false
      );
    }
  }

  async function ouvrirKhassidaDeclamationModal(
    declamation
  ) {
    setDeclamationSelectionnee(
      declamation
    );

    setKhassidaDeclamationSelectionnee(
      null
    );

    setTonDeclamationSelectionne("");
    setAudioDeclamationSelectionne("");

    setKhassidasDeclamation([]);

    setModalKhassidaDeclamation(
      true
    );

    await chargerCatalogueKhassidas();

    await chargerKhassidasDeclamation(
      declamation.id
    );
  }

  function fermerModalKhassidaDeclamation() {
    setModalKhassidaDeclamation(
      false
    );

    setKhassidaDeclamationSelectionnee(
      null
    );

    setTonsDeclamation([]);
    setAudiosDeclamation([]);

    setTonDeclamationSelectionne("");
    setAudioDeclamationSelectionne("");

    setOrdreKhassidaDeclamation(1);
  }

  async function selectionnerKhassidaDeclamation(
    khassidaId
  ) {
    const khassida =
      khassidas.find(
        (item) =>
          Number(item.id) ===
          Number(khassidaId)
      );

    setKhassidaDeclamationSelectionnee(
      khassida || null
    );

    setTonDeclamationSelectionne("");
    setAudioDeclamationSelectionne("");

    setTonsDeclamation([]);
    setAudiosDeclamation([]);

    if (!khassidaId) return;

    setChargementTons(true);

    try {
      const response = await api.get(
        `/programmes-religieux/declamations/khassidas/${khassidaId}/tons`
      );

      setTonsDeclamation(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error) {
      afficherErreur(
        error,
        "Impossible de charger les tons."
      );
    } finally {
      setChargementTons(false);
    }
  }

  async function selectionnerTonDeclamation(
    tonId
  ) {
    setTonDeclamationSelectionne(
      tonId
    );

    setAudioDeclamationSelectionne(
      ""
    );

    setAudiosDeclamation([]);

    if (
      !khassidaDeclamationSelectionnee?.id ||
      !tonId
    ) {
      return;
    }

    setChargementAudios(true);

    try {
      const response = await api.get(
        `/programmes-religieux/declamations/khassidas/${khassidaDeclamationSelectionnee.id}/tons/${tonId}/audios`
      );

      setAudiosDeclamation(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error) {
      afficherErreur(
        error,
        "Impossible de charger les audios."
      );
    } finally {
      setChargementAudios(false);
    }
  }

  async function ajouterKhassidaDeclamation(
    event
  ) {
    event.preventDefault();

    if (
      !programmeSelectionne?.id ||
      !declamationSelectionnee?.id
    ) {
      setErreur(
        "Aucune déclamation sélectionnée."
      );
      return;
    }

    if (
      !khassidaDeclamationSelectionnee?.id
    ) {
      setErreur(
        "Veuillez sélectionner une Khassida."
      );
      return;
    }

    if (!tonDeclamationSelectionne) {
      setErreur(
        "Veuillez sélectionner un ton."
      );
      return;
    }

    setErreur("");
    setMessage("");

    try {
      const payload = {
        khassida_id: Number(
          khassidaDeclamationSelectionnee.id
        ),
        ton_id: Number(
          tonDeclamationSelectionne
        ),
        ordre: Number(
          ordreKhassidaDeclamation
        ),
      };

      await api.post(
        `/programmes-religieux/${programmeSelectionne.id}/declamations/${declamationSelectionnee.id}/khassidas`,
        payload
      );

      setMessage(
        "Khassida ajoutée à la déclamation."
      );

      fermerModalKhassidaDeclamation();

      await chargerProgramme(
        programmeSelectionne.id
      );
    } catch (error) {
      afficherErreur(
        error,
        "Impossible d'ajouter la Khassida à la déclamation."
      );
    }
  }

  async function supprimerKhassidaDeclamation(
    declamationKhassidaId
  ) {
    if (
      !programmeSelectionne?.id ||
      !declamationSelectionnee?.id
    ) {
      return;
    }

    if (
      !window.confirm(
        "Voulez-vous supprimer cette Khassida de la déclamation ?"
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/programmes-religieux/${programmeSelectionne.id}/declamations/${declamationSelectionnee.id}/khassidas/${declamationKhassidaId}`
      );

      setMessage(
        "Khassida retirée de la déclamation."
      );

      await chargerProgramme(
        programmeSelectionne.id
      );
    } catch (error) {
      afficherErreur(
        error,
        "Impossible de retirer la Khassida."
      );
    }
  }

  // ========================================================
  // PROGRAMME NON AUTORISE
  // ========================================================

  if (!chargement && !peutConsulter) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <h2 className="text-lg font-semibold">
            Accès refusé
          </h2>

          <p className="mt-2 text-sm">
            Vous n'avez pas la permission de consulter
            les programmes religieux.
          </p>
        </div>
      </div>
    );
  }

  // ========================================================
  // CHARGEMENT INITIAL
  // ========================================================

  if (chargement) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>
            Chargement des programmes religieux...
          </span>
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* ================================================== */}
      {/* EN-TETE */}
      {/* ================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
              <Music className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Programme religieux
              </h1>

              <p className="text-sm text-slate-500">
                Gestion des répétitions et des déclamations
                du Kourel.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              chargerProgrammes(false)
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                rafraichissement
                  ? "animate-spin"
                  : ""
              }`}
            />

            Actualiser
          </button>

          {peutModifier && (
            <button
              type="button"
              onClick={ouvrirModalProgramme}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Nouveau programme
            </button>
          )}
        </div>
      </div>

      {/* ================================================== */}
      {/* MESSAGES */}
      {/* ================================================== */}

      {rafraichissement && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Actualisation...
        </div>
      )}

      {erreur && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erreur}
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      {/* ================================================== */}
      {/* LISTE PROGRAMMES */}
      {/* ================================================== */}

      {programmes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-slate-400" />

          <h2 className="mt-4 text-lg font-semibold text-slate-800">
            Aucun programme religieux
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Aucun programme n'a encore été créé pour
            votre Kourel.
          </p>

          {peutModifier && (
            <button
              type="button"
              onClick={ouvrirModalProgramme}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Créer un programme
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* ============================================== */}
          {/* PROGRAMMES */}
          {/* ============================================== */}

          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Programmes
            </h2>

            {programmes.map((programme) => {
              const selectionne =
                Number(programme.id) ===
                Number(
                  programmeSelectionne?.id
                );

              return (
                <button
                  key={programme.id}
                  type="button"
                  onClick={() =>
                    chargerProgramme(
                      programme.id
                    )
                  }
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectionne
                      ? "border-emerald-500 bg-emerald-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-emerald-600" />

                        <span className="font-semibold text-slate-800">
                          {String(
                            programme.mois
                          ).padStart(2, "0")}
                          /
                          {programme.annee}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-slate-500">
                        Du{" "}
                        {formaterDate(
                          programme.date_debut
                        )}{" "}
                        au{" "}
                        {formaterDate(
                          programme.date_fin
                        )}
                      </p>
                    </div>

                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* ============================================== */}
          {/* DETAIL PROGRAMME */}
          {/* ============================================== */}

          <div className="space-y-6">
            {chargementProgramme ? (
              <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Chargement du programme...
                </div>
              </div>
            ) : programmeSelectionne ? (
              <>
                {/* ---------------------------------------- */}
                {/* CARTE PROGRAMME */}
                {/* ---------------------------------------- */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-emerald-600" />

                        <h2 className="text-xl font-bold text-slate-900">
                          Programme{" "}
                          {String(
                            programmeSelectionne.mois
                          ).padStart(2, "0")}
                          /
                          {
                            programmeSelectionne.annee
                          }
                        </h2>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                        <span>
                          Du{" "}
                          <strong className="text-slate-700">
                            {formaterDate(
                              programmeSelectionne.date_debut
                            )}
                          </strong>
                        </span>

                        <span>
                          au{" "}
                          <strong className="text-slate-700">
                            {formaterDate(
                              programmeSelectionne.date_fin
                            )}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {peutModifier && (
                      <button
                        type="button"
                        onClick={() =>
                          supprimerProgramme(
                            programmeSelectionne.id
                          )
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>

                {/* ---------------------------------------- */}
                {/* REPETITIONS */}
                {/* ---------------------------------------- */}

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-emerald-600" />

                        <h2 className="text-lg font-bold text-slate-900">
                          Répétitions
                        </h2>
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        Khassidas à répéter durant le
                        programme mensuel.
                      </p>
                    </div>

                    {peutModifier && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={
                            genererRepetitions
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Générer
                        </button>

                        <button
                          type="button"
                          onClick={
                            ouvrirModalRepetition
                          }
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                        >
                          <Plus className="h-4 w-4" />
                          Répétition
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    {repetitions.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                        <BookOpen className="mx-auto h-8 w-8 text-slate-400" />

                        <p className="mt-3 text-sm text-slate-500">
                          Aucune répétition enregistrée.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {repetitions.map(
                          (repetition) => {
                            const ouverte =
                              Number(
                                repetitionSelectionnee?.id
                              ) ===
                              Number(
                                repetition.id
                              );

                            return (
                              <div
                                key={
                                  repetition.id
                                }
                                className={`rounded-2xl border p-4 ${
                                  ouverte
                                    ? "border-emerald-300 bg-emerald-50/40"
                                    : "border-slate-200"
                                }`}
                              >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      ouvrirRepetition(
                                        repetition
                                      )
                                    }
                                    className="flex-1 text-left"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="rounded-xl bg-slate-100 p-2">
                                        <CalendarDays className="h-5 w-5 text-slate-600" />
                                      </div>

                                      <div>
                                        <h3 className="font-semibold text-slate-800">
                                          Répétition{" "}
                                          {repetition.ordre ||
                                            ""}
                                        </h3>

                                        <p className="text-sm text-slate-500">
                                          {formaterDate(
                                            repetition.date_repetition
                                          )}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                                      <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />

                                        <span>
                                          {formaterHeure(
                                            repetition.heure_debut
                                          )}
                                          {" - "}
                                          {formaterHeure(
                                            repetition.heure_fin
                                          )}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />

                                        <span>
                                          {repetition.lieu ||
                                            "Lieu non précisé"}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4" />

                                        <span>
                                          {Array.isArray(
                                            repetition.khassidas
                                          )
                                            ? repetition.khassidas.length
                                            : 0}{" "}
                                          Khassida(s)
                                        </span>
                                      </div>
                                    </div>
                                  </button>

                                  {peutModifier && (
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          modifierRepetition(
                                            repetition
                                          )
                                        }
                                        className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                                        title="Modifier"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          supprimerRepetition(
                                            repetition.id
                                          )
                                        }
                                        className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                                        title="Supprimer"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* KHASSIDAS DE LA REPETITION */}
                                {ouverte && (
                                  <div className="mt-5 border-t border-slate-200 pt-5">
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                      <div>
                                        <h4 className="font-semibold text-slate-800">
                                          Khassidas à répéter
                                        </h4>
                                      </div>

                                      {peutModifier && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            ouvrirKhassidaModal(
                                              repetition
                                            )
                                          }
                                          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                                        >
                                          <Plus className="h-4 w-4" />
                                          Ajouter
                                        </button>
                                      )}
                                    </div>

                                    {chargementKhassidas ? (
                                      <div className="flex items-center gap-2 py-5 text-sm text-slate-500">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Chargement...
                                      </div>
                                    ) : khassidasProgramme.length ===
                                      0 ? (
                                      <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
                                        <Music className="mx-auto h-7 w-7 text-slate-400" />

                                        <p className="mt-2 text-sm text-slate-500">
                                          Aucune Khassida ajoutée.
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="space-y-3">
                                        {khassidasProgramme.map(
                                          (
                                            item,
                                            index
                                          ) => (
                                            <div
                                              key={
                                                item.id ||
                                                `${item.khassida_id}-${index}`
                                              }
                                              className="rounded-xl border border-slate-200 bg-white p-4"
                                            >
                                              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                <div>
                                                  <div className="flex items-center gap-2">
                                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                                                      {item.ordre ||
                                                        index +
                                                          1}
                                                    </span>

                                                    <span className="font-semibold text-slate-800">
                                                      {item.khassida?.titre ||
                                                        item.khassida?.nom ||
                                                        item.titre ||
                                                        "Khassida"}
                                                    </span>
                                                  </div>

                                                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                                                    <span>
                                                      Ton :{" "}
                                                      <strong className="text-slate-700">
                                                        {item.ton?.nom ||
                                                          item.ton?.titre ||
                                                          item.ton_nom ||
                                                          "—"}
                                                      </strong>
                                                    </span>
                                                  </div>

                                                  {item.audio?.fichier && (
                                                    <div className="mt-3">
                                                      <audio
                                                        controls
                                                        preload="metadata"
                                                        className="h-9 w-full max-w-md"
                                                        src={construireUrlAudio(
                                                          item.audio
                                                            .fichier ||
                                                            item.audio
                                                              .url
                                                        )}
                                                      >
                                                        Votre navigateur ne supporte pas la lecture audio.
                                                      </audio>
                                                    </div>
                                                  )}
                                                </div>

                                                {peutModifier && (
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      supprimerKhassidaRepetition(
                                                        item.id
                                                      )
                                                    }
                                                    className="self-start rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
                </section>

                {/* ---------------------------------------- */}
                {/* DECLAMATIONS */}
                {/* ---------------------------------------- */}

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Mic2 className="h-5 w-5 text-emerald-600" />

                        <h2 className="text-lg font-bold text-slate-900">
                          Déclamations
                        </h2>
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        Khassidas prévues pour les réunions
                        et programmes du mois.
                      </p>
                    </div>

                    {peutModifier && (
                      <button
                        type="button"
                        onClick={
                          ouvrirModalDeclamation
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                      >
                        <Plus className="h-4 w-4" />
                        Déclamation
                      </button>
                    )}
                  </div>

                  <div className="p-5">
                    {declamations.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                        <Mic2 className="mx-auto h-8 w-8 text-slate-400" />

                        <p className="mt-3 text-sm text-slate-500">
                          Aucune déclamation enregistrée.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {declamations.map(
                          (declamation) => {
                            const listeKhassidas =
                              extraireKhassidasDeclamation(
                                declamation
                              );

                            return (
                              <div
                                key={
                                  declamation.id
                                }
                                className="rounded-2xl border border-slate-200 p-4"
                              >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                  <div>
                                    <div className="flex items-center gap-3">
                                      <div className="rounded-xl bg-violet-100 p-2 text-violet-700">
                                        <Mic2 className="h-5 w-5" />
                                      </div>

                                      <div>
                                        <h3 className="font-semibold text-slate-800">
                                          Déclamation{" "}
                                          {declamation.ordre ||
                                            ""}
                                        </h3>

                                        <p className="text-sm text-slate-500">
                                          {formaterDate(
                                            declamation.date_declamation ||
                                              declamation.date_declamaion
                                          )}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-600">
                                      <span className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />

                                        {formaterHeure(
                                          declamation.heure_debut
                                        )}
                                        {" - "}
                                        {formaterHeure(
                                          declamation.heure_fin
                                        )}
                                      </span>

                                      <span className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />

                                        {declamation.lieu ||
                                          "Lieu non précisé"}
                                      </span>
                                    </div>
                                  </div>

                                  {peutModifier && (
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          modifierDeclamation(
                                            declamation
                                          )
                                        }
                                        className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          supprimerDeclamation(
                                            declamation.id
                                          )
                                        }
                                        className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <div className="mt-5 border-t border-slate-200 pt-4">
                                  <div className="mb-3 flex items-center justify-between">
                                    <h4 className="font-semibold text-slate-800">
                                      Khassidas
                                    </h4>

                                    {peutModifier && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          ouvrirKhassidaDeclamationModal(
                                            declamation
                                          )
                                        }
                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                      >
                                        <Plus className="h-4 w-4" />
                                        Ajouter
                                      </button>
                                    )}
                                  </div>

                                  {listeKhassidas.length ===
                                  0 ? (
                                    <p className="text-sm text-slate-500">
                                      Aucune Khassida
                                      ajoutée.
                                    </p>
                                  ) : (
                                    <div className="space-y-2">
                                      {listeKhassidas.map(
                                        (
                                          item,
                                          index
                                        ) => (
                                          <div
                                            key={
                                              item.id ||
                                              `${item.khassida_id}-${index}`
                                            }
                                            className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
                                          >
                                            <div className="flex items-center gap-3">
                                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-600">
                                                {item.ordre ||
                                                  index +
                                                    1}
                                              </span>

                                              <div>
                                                <p className="font-medium text-slate-800">
                                                  {item.khassida?.titre ||
                                                    item.khassida?.nom ||
                                                    item.titre ||
                                                    "Khassida"}
                                                </p>

                                                <p className="text-xs text-slate-500">
                                                  Ton :{" "}
                                                  {item.ton?.nom ||
                                                    item.ton?.titre ||
                                                    item.ton_nom ||
                                                    "—"}
                                                </p>
                                              </div>
                                            </div>

                                            {peutModifier && (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  supprimerKhassidaDeclamation(
                                                    item.id
                                                  )
                                                }
                                                className="rounded-lg p-2 text-red-600 hover:bg-red-100"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </button>
                                            )}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
                </section>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* MODAL PROGRAMME */}
      {/* ================================================== */}

      {modalProgramme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Nouveau programme religieux
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Le Kourel est automatiquement associé à
                  votre compte.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  fermerModalProgramme
                }
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={creerProgramme}
              className="space-y-5 p-5"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Année
                </label>

                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={formProgramme.annee}
                  onChange={(event) =>
                    setFormProgramme(
                      (ancien) => ({
                        ...ancien,
                        annee:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Mois
                </label>

                <select
                  value={formProgramme.mois}
                  onChange={(event) =>
                    setFormProgramme(
                      (ancien) => ({
                        ...ancien,
                        mois:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  required
                >
                  {Array.from(
                    { length: 12 },
                    (_, index) => {
                      const mois =
                        index + 1;

                      return (
                        <option
                          key={mois}
                          value={mois}
                        >
                          {new Date(
                            2000,
                            index,
                            1
                          ).toLocaleDateString(
                            "fr-FR",
                            {
                              month:
                                "long",
                            }
                          )}
                        </option>
                      );
                    }
                  )}
                </select>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                <strong className="text-slate-700">
                  Kourel :
                </strong>{" "}
                {utilisateur?.gestionnaire_kourel_id
                  ? `Kourel #${utilisateur.gestionnaire_kourel_id}`
                  : "Aucun Kourel associé"}
              </div>

              {erreur && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {erreur}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={
                    fermerModalProgramme
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  <Check className="h-4 w-4" />
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* MODAL REPETITION */}
      {/* ================================================== */}

      {modalRepetition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <h2 className="text-lg font-bold text-slate-900">
                {repetitionSelectionnee
                  ? "Modifier la répétition"
                  : "Nouvelle répétition"}
              </h2>

              <button
                type="button"
                onClick={
                  fermerModalRepetition
                }
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={
                enregistrerRepetition
              }
              className="space-y-4 p-5"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Date
                </label>

                <input
                  type="date"
                  value={
                    formRepetition.date_repetition
                  }
                  onChange={(event) =>
                    setFormRepetition(
                      (ancien) => ({
                        ...ancien,
                        date_repetition:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Heure début
                  </label>

                  <input
                    type="time"
                    value={
                      formRepetition.heure_debut
                    }
                    onChange={(event) =>
                      setFormRepetition(
                        (ancien) => ({
                          ...ancien,
                          heure_debut:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Heure fin
                  </label>

                  <input
                    type="time"
                    value={
                      formRepetition.heure_fin
                    }
                    onChange={(event) =>
                      setFormRepetition(
                        (ancien) => ({
                          ...ancien,
                          heure_fin:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Lieu
                </label>

                <input
                  type="text"
                  value={
                    formRepetition.lieu
                  }
                  onChange={(event) =>
                    setFormRepetition(
                      (ancien) => ({
                        ...ancien,
                        lieu:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  placeholder="Lieu de la répétition"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Ordre
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    formRepetition.ordre
                  }
                  onChange={(event) =>
                    setFormRepetition(
                      (ancien) => ({
                        ...ancien,
                        ordre:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={
                    fermerModalRepetition
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* MODAL KHASSIDA REPETITION */}
      {/* ================================================== */}

      {modalKhassida && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Ajouter une Khassida
                </h2>

                <p className="text-xs text-slate-500">
                  Sélectionnez la Khassida et son ton.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  fermerModalKhassida
                }
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={
                ajouterKhassidaARepetition
              }
              className="space-y-5 p-5"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Khassida
                </label>

                <select
                  value={
                    khassidaSelectionnee?.id ||
                    ""
                  }
                  onChange={(event) =>
                    selectionnerKhassida(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  required
                >
                  <option value="">
                    Sélectionner une Khassida
                  </option>

                  {khassidas.map(
                    (khassida) => (
                      <option
                        key={khassida.id}
                        value={khassida.id}
                      >
                        {khassida.titre ||
                          khassida.nom}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Ton
                </label>

                <select
                  value={tonSelectionne}
                  onChange={(event) =>
                    selectionnerTon(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  disabled={
                    !khassidaSelectionnee ||
                    chargementTons
                  }
                  required
                >
                  <option value="">
                    {chargementTons
                      ? "Chargement..."
                      : "Sélectionner un ton"}
                  </option>

                  {tons.map((ton) => (
                    <option
                      key={ton.id}
                      value={ton.id}
                    >
                      {ton.nom ||
                        ton.titre ||
                        ton.libelle}
                    </option>
                  ))}
                </select>
              </div>

              {audios.length > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Audio
                  </label>

                  <select
                    value={
                      audioSelectionne
                    }
                    onChange={(event) =>
                      setAudioSelectionne(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  >
                    <option value="">
                      Sélectionner un audio
                    </option>

                    {audios.map(
                      (audio) => (
                        <option
                          key={audio.id}
                          value={audio.id}
                        >
                          {audio.titre ||
                            `Audio #${audio.id}`}
                        </option>
                      )
                    )}
                  </select>
                </div>
              )}

              {audioSelectionne &&
                audios.find(
                  (audio) =>
                    Number(audio.id) ===
                    Number(
                      audioSelectionne
                    )
                ) && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Headphones className="h-4 w-4" />
                      Écouter l'audio
                    </div>

                    <audio
                      controls
                      preload="metadata"
                      className="w-full"
                      src={construireUrlAudio(
                        audios.find(
                          (audio) =>
                            Number(
                              audio.id
                            ) ===
                            Number(
                              audioSelectionne
                            )
                        )?.fichier ||
                          audios.find(
                            (audio) =>
                              Number(
                                audio.id
                              ) ===
                              Number(
                                audioSelectionne
                              )
                          )?.url
                      )}
                    >
                      Votre navigateur ne supporte pas la lecture audio.
                    </audio>
                  </div>
                )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Ordre
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    ordreKhassida
                  }
                  onChange={(event) =>
                    setOrdreKhassida(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={
                    fermerModalKhassida
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  <Check className="h-4 w-4" />
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* MODAL DECLAMATION */}
      {/* ================================================== */}

      {modalDeclamation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <h2 className="text-lg font-bold text-slate-900">
                {declamationSelectionnee
                  ? "Modifier la déclamation"
                  : "Nouvelle déclamation"}
              </h2>

              <button
                type="button"
                onClick={
                  fermerModalDeclamation
                }
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={
                enregistrerDeclamation
              }
              className="space-y-4 p-5"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Date
                </label>

                <input
                  type="date"
                  value={
                    formDeclamation.date_declamation ||
                    formDeclamation.date_declamaion
                  }
                  onChange={(event) =>
                    setFormDeclamation(
                      (ancien) => ({
                        ...ancien,
                        date_declamation:
                          event.target
                            .value,
                        date_declamaion:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Heure début
                  </label>

                  <input
                    type="time"
                    value={
                      formDeclamation.heure_debut
                    }
                    onChange={(event) =>
                      setFormDeclamation(
                        (ancien) => ({
                          ...ancien,
                          heure_debut:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Heure fin
                  </label>

                  <input
                    type="time"
                    value={
                      formDeclamation.heure_fin
                    }
                    onChange={(event) =>
                      setFormDeclamation(
                        (ancien) => ({
                          ...ancien,
                          heure_fin:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Lieu
                </label>

                <input
                  type="text"
                  value={
                    formDeclamation.lieu
                  }
                  onChange={(event) =>
                    setFormDeclamation(
                      (ancien) => ({
                        ...ancien,
                        lieu:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  placeholder="Lieu de la déclamation"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Ordre
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    formDeclamation.ordre
                  }
                  onChange={(event) =>
                    setFormDeclamation(
                      (ancien) => ({
                        ...ancien,
                        ordre:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={
                    fermerModalDeclamation
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* MODAL KHASSIDA DECLAMATION */}
      {/* ================================================== */}

      {modalKhassidaDeclamation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Ajouter une Khassida
                </h2>

                <p className="text-xs text-slate-500">
                  Déclamation
                </p>
              </div>

              <button
                type="button"
                onClick={
                  fermerModalKhassidaDeclamation
                }
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={
                ajouterKhassidaDeclamation
              }
              className="space-y-5 p-5"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Khassida
                </label>

                <select
                  value={
                    khassidaDeclamationSelectionnee?.id ||
                    ""
                  }
                  onChange={(event) =>
                    selectionnerKhassidaDeclamation(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  required
                >
                  <option value="">
                    Sélectionner une Khassida
                  </option>

                  {khassidas.map(
                    (khassida) => (
                      <option
                        key={khassida.id}
                        value={khassida.id}
                      >
                        {khassida.titre ||
                          khassida.nom}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Ton
                </label>

                <select
                  value={
                    tonDeclamationSelectionne
                  }
                  onChange={(event) =>
                    selectionnerTonDeclamation(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  disabled={
                    !khassidaDeclamationSelectionnee ||
                    chargementTons
                  }
                  required
                >
                  <option value="">
                    {chargementTons
                      ? "Chargement..."
                      : "Sélectionner un ton"}
                  </option>

                  {tonsDeclamation.map(
                    (ton) => (
                      <option
                        key={ton.id}
                        value={ton.id}
                      >
                        {ton.nom ||
                          ton.titre ||
                          ton.libelle}
                      </option>
                    )
                  )}
                </select>
              </div>

              {audiosDeclamation.length >
                0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Volume2 className="h-4 w-4" />
                    Audios disponibles
                  </div>

                  <div className="space-y-3">
                    {audiosDeclamation.map(
                      (audio) => (
                        <div
                          key={
                            audio.id
                          }
                          className="rounded-xl bg-white p-3"
                        >
                          <p className="mb-2 text-sm font-medium text-slate-700">
                            {audio.titre ||
                              `Audio #${audio.id}`}
                          </p>

                          <audio
                            controls
                            preload="metadata"
                            className="w-full"
                            src={construireUrlAudio(
                              audio.fichier ||
                                audio.url
                            )}
                          >
                            Votre navigateur ne supporte pas la lecture audio.
                          </audio>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Ordre
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    ordreKhassidaDeclamation
                  }
                  onChange={(event) =>
                    setOrdreKhassidaDeclamation(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={
                    fermerModalKhassidaDeclamation
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  <Check className="h-4 w-4" />
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}