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


/* ============================================================
   UTILITAIRES
============================================================ */

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


function formaterDate(dateValue) {
  if (!dateValue) return "-";

  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}


function formaterHeure(heure) {
  if (!heure) return null;

  return String(heure).slice(0, 5);
}


function messageErreur(error) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || JSON.stringify(item))
      .join(", ");
  }

  return (
    error?.message ||
    "Une erreur est survenue."
  );
}


function construireUrlAudio(audio) {
  if (!audio) return "";

  const url = audio.url || audio.fichier;

  if (!url) return "";

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const base =
    api.defaults.baseURL?.replace(/\/$/, "") || "";

  return `${base}${
    url.startsWith("/") ? url : `/${url}`
  }`;
}


function extraireKhassidasDeclamation(declamation) {
  if (Array.isArray(declamation?.khassidas)) {
    return declamation.khassidas;
  }

  if (
    Array.isArray(
      declamation?.declamation?.khassidas
    )
  ) {
    return declamation.declamation.khassidas;
  }

  return [];
}


/* ============================================================
   COMPOSANT
============================================================ */

export default function ProgrammeReligieux() {
  const { aPermission } = useAuth();

  /* ==========================================================
     PERMISSIONS
  ========================================================== */

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


  /* ==========================================================
     PROGRAMMES
  ========================================================== */

  const [programmes, setProgrammes] = useState([]);

  const [programmeSelectionne, setProgrammeSelectionne] =
    useState(null);

  const [chargement, setChargement] =
    useState(true);

  const [chargementProgramme, setChargementProgramme] =
    useState(false);

  const [erreur, setErreur] = useState("");

  const [message, setMessage] = useState("");


  /* ==========================================================
     MODAL PROGRAMME
  ========================================================== */

  const [modalProgramme, setModalProgramme] =
    useState(false);

  const [formProgramme, setFormProgramme] =
    useState({
      kourel_id: "",
      annee: new Date().getFullYear(),
      mois: new Date().getMonth() + 1,
    });


  /* ==========================================================
     RÉPÉTITIONS
  ========================================================== */

  const [modalRepetition, setModalRepetition] =
    useState(false);

  const [formRepetition, setFormRepetition] =
    useState({
      date_repetition: "",
      heure_debut: "",
      heure_fin: "",
      lieu: "",
    });

  const [repetitionEdition, setRepetitionEdition] =
    useState(null);


  /* ==========================================================
     KHASSIDAS D'UNE RÉPÉTITION
     
     IMPORTANT :
     Cette liste contient uniquement les Khassidas
     de la répétition actuellement ouverte.
  ========================================================== */

  const [repetitionSelectionnee, setRepetitionSelectionnee] =
    useState(null);

  const [khassidas, setKhassidas] =
    useState([]);

  const [chargementKhassidas, setChargementKhassidas] =
    useState(false);


  /* ==========================================================
     RÉFÉRENTIEL KHASSIDAS
     
     Cette liste sert uniquement à ajouter/modifier
     une Khassida.
  ========================================================== */

  const [listeKhassidas, setListeKhassidas] =
    useState([]);

  const [tons, setTons] = useState([]);

  const [audios, setAudios] = useState([]);

  const [khassidaSelectionnee, setKhassidaSelectionnee] =
    useState(null);

  const [tonSelectionne, setTonSelectionne] =
    useState(null);

  const [audioSelectionne, setAudioSelectionne] =
    useState(null);

  const [ordreKhassida, setOrdreKhassida] =
    useState(1);

  const [modalKhassida, setModalKhassida] =
    useState(false);

  const [chargementKhassida, setChargementKhassida] =
    useState(false);


  /* ==========================================================
     DÉCLAMATIONS
  ========================================================== */

  const [modalDeclamation, setModalDeclamation] =
    useState(false);

  const [declamationEdition, setDeclamationEdition] =
    useState(null);

  const [formDeclamation, setFormDeclamation] =
    useState({
      date_declamation: "",
      heure: "",
      lieu: "",
      evenement: "",
    });


  /* ==========================================================
     KHASSIDAS D'UNE DÉCLAMATION
  ========================================================== */

  const [modalKhassidaDeclamation, setModalKhassidaDeclamation] =
    useState(false);

  const [declamationSelectionnee, setDeclamationSelectionnee] =
    useState(null);

  const [
    khassidaDeclamationSelectionnee,
    setKhassidaDeclamationSelectionnee,
  ] = useState(null);

  const [
    tonDeclamationSelectionne,
    setTonDeclamationSelectionne,
  ] = useState(null);

  const [
    audioDeclamationSelectionne,
    setAudioDeclamationSelectionne,
  ] = useState(null);

  const [
    ordreKhassidaDeclamation,
    setOrdreKhassidaDeclamation,
  ] = useState(1);

  const [
    chargementKhassidaDeclamation,
    setChargementKhassidaDeclamation,
  ] = useState(false);


  /* ============================================================
     ERREUR
  ============================================================ */

  function afficherErreur(error, messageDefaut) {
    setErreur(
      error?.response?.data?.detail ||
        messageDefaut ||
        "Une erreur est survenue."
    );
  }


  /* ============================================================
     CHARGER TOUS LES PROGRAMMES
  ============================================================ */

  async function chargerProgrammes(
    programmeIdASelectionner = null
  ) {
    setChargement(true);
    setErreur("");

    try {
      const response = await api.get(
        "/programmes-religieux"
      );

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setProgrammes(data);

      if (programmeIdASelectionner) {
        await chargerProgramme(
          programmeIdASelectionner
        );
      } else if (data.length > 0) {
        await chargerProgramme(data[0].id);
      } else {
        setProgrammeSelectionne(null);
      }
    } catch (error) {
      afficherErreur(
        error,
        "Impossible de charger les programmes religieux."
      );
    } finally {
      setChargement(false);
    }
  }


  /* ============================================================
     CHARGER UN PROGRAMME
  ============================================================ */

  async function chargerProgramme(programmeId) {
    if (!programmeId) return;

    setChargementProgramme(true);
    setErreur("");

    try {
      const response = await api.get(
        `/programmes-religieux/${programmeId}`
      );

      setProgrammeSelectionne(response.data);
    } catch (error) {
      afficherErreur(
        error,
        "Impossible de charger le programme."
      );
    } finally {
      setChargementProgramme(false);
    }
  }


  /* ============================================================
     CHARGEMENT INITIAL
  ============================================================ */

  useEffect(() => {
    if (peutConsulter) {
      chargerProgrammes();
    } else {
      setChargement(false);
    }
  }, [peutConsulter]);


  /* ============================================================
     CHARGER LES KHASSIDAS D'UNE RÉPÉTITION
     
     C'EST LA CORRECTION PRINCIPALE.
     
     On ne fait PAS :
       GET /khassidas
     
     pour afficher les Khassidas d'une répétition.
     
     On fait :
       GET /programmes-religieux/{programmeId}
             /repetitions/{repetitionId}/khassidas
  ============================================================ */

  async function chargerKhassidas(repetitionId) {
    if (!programmeSelectionne?.id || !repetitionId) {
      setKhassidas([]);
      return;
    }

    setChargementKhassidas(true);
    setErreur("");

    try {
      const response = await api.get(
        `/programmes-religieux/${programmeSelectionne.id}/repetitions/${repetitionId}/khassidas`
      );

      const data = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.items)
        ? response.data.items
        : Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data?.results)
        ? response.data.results
        : [];

      console.log(
        "Khassidas de la répétition",
        repetitionId,
        ":",
        data
      );

      setKhassidas(data);
    } catch (error) {
      console.error(
        "Erreur chargement Khassidas répétition :",
        error
      );

      afficherErreur(
        error,
        "Impossible de charger les Khassidas de cette répétition."
      );

      setKhassidas([]);
    } finally {
      setChargementKhassidas(false);
    }
  }


  /* ============================================================
     OUVRIR / FERMER UNE RÉPÉTITION
  ============================================================ */

  async function ouvrirRepetition(repetition) {
    if (
      repetitionSelectionnee?.id === repetition.id
    ) {
      setRepetitionSelectionnee(null);
      setKhassidas([]);
      return;
    }

    setRepetitionSelectionnee(repetition);
    setKhassidas([]);

    await chargerKhassidas(repetition.id);
  }


  /* ============================================================
     CRÉER UN PROGRAMME
  ============================================================ */

  function ouvrirModalProgramme() {
    setFormProgramme({
      kourel_id: "",
      annee: new Date().getFullYear(),
      mois: new Date().getMonth() + 1,
    });

    setModalProgramme(true);
  }


  function fermerModalProgramme() {
    setModalProgramme(false);
  }


  async function creerProgramme(event) {
    event.preventDefault();

    setErreur("");
    setMessage("");

    try {
      const params = new URLSearchParams();

      if (formProgramme.kourel_id) {
        params.append(
          "kourel_id",
          formProgramme.kourel_id
        );
      }

      params.append(
        "annee",
        String(formProgramme.annee)
      );

      params.append(
        "mois",
        String(formProgramme.mois)
      );

      await api.post(
        `/programmes-religieux?${params.toString()}`
      );

      setMessage(
        "Programme religieux créé avec succès."
      );

      fermerModalProgramme();

      await chargerProgrammes();
    } catch (error) {
      afficherErreur(
        error,
        "Impossible de créer le programme."
      );
    }
  }


  /* ============================================================
     SUPPRIMER PROGRAMME
  ============================================================ */

  async function supprimerProgramme(programme) {
    if (
      !window.confirm(
        "Voulez-vous vraiment supprimer ce programme religieux ?"
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/programmes-religieux/${programme.id}`
      );

      setMessage(
        "Programme religieux supprimé avec succès."
      );

      await chargerProgrammes();
    } catch (error) {
      afficherErreur(
        error,
        "Impossible de supprimer le programme."
      );
    }
  }


  /* ============================================================
     MODAL RÉPÉTITION
  ============================================================ */

  function ouvrirNouvelleRepetition() {
    setRepetitionEdition(null);

    setFormRepetition({
      date_repetition:
        programmeSelectionne?.date_debut || "",
      heure_debut: "",
      heure_fin: "",
      lieu: "",
    });

    setModalRepetition(true);
  }


  function ouvrirEditionRepetition(repetition) {
    setRepetitionEdition(repetition);

    setFormRepetition({
      date_repetition:
        repetition.date_repetition || "",
      heure_debut:
        formaterHeure(repetition.heure_debut) || "",
      heure_fin:
        formaterHeure(repetition.heure_fin) || "",
      lieu: repetition.lieu || "",
    });

    setModalRepetition(true);
  }


  function fermerModalRepetition() {
    setModalRepetition(false);
    setRepetitionEdition(null);
  }


  /* ============================================================
     ENREGISTRER RÉPÉTITION
  ============================================================ */

  async function enregistrerRepetition(event) {
    event.preventDefault();

    if (!programmeSelectionne?.id) return;

    setErreur("");
    setMessage("");

    try {
      const params = new URLSearchParams();

      params.append(
        "date_repetition",
        formRepetition.date_repetition
      );

      if (formRepetition.heure_debut) {
        params.append(
          "heure_debut",
          formRepetition.heure_debut
        );
      }

      if (formRepetition.heure_fin) {
        params.append(
          "heure_fin",
          formRepetition.heure_fin
        );
      }

      if (formRepetition.lieu.trim()) {
        params.append(
          "lieu",
          formRepetition.lieu.trim()
        );
      }

      if (repetitionEdition) {
        await api.put(
          `/programmes-religieux/${programmeSelectionne.id}/repetitions/${repetitionEdition.id}?${params.toString()}`
        );

        setMessage(
          "Répétition modifiée avec succès."
        );
      } else {
        await api.post(
          `/programmes-religieux/${programmeSelectionne.id}/repetitions?${params.toString()}`
        );

        setMessage(
          "Répétition ajoutée avec succès."
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


  /* ============================================================
     GÉNÉRER LES RÉPÉTITIONS
  ============================================================ */

  async function genererRepetitions() {
    if (!programmeSelectionne?.id) return;

    if (
      !window.confirm(
        "Voulez-vous générer automatiquement les répétitions de ce programme ?"
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


  /* ============================================================
     SUPPRIMER RÉPÉTITION
  ============================================================ */

  async function supprimerRepetition(repetitionId) {
    if (!programmeSelectionne?.id) return;

    if (
      !window.confirm(
        "Voulez-vous vraiment supprimer cette répétition ?"
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/programmes-religieux/${programmeSelectionne.id}/repetitions/${repetitionId}`
      );

      if (
        repetitionSelectionnee?.id ===
        repetitionId
      ) {
        setRepetitionSelectionnee(null);
        setKhassidas([]);
      }

      setMessage(
        "Répétition supprimée avec succès."
      );

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


  /* ============================================================
     CHARGER LE CATALOGUE DES KHASSIDAS
     
     UTILISÉ UNIQUEMENT DANS LE MODAL AJOUT/MODIFICATION.
  ============================================================ */

  async function chargerListeKhassidas() {
    try {
      const response = await api.get(
        "/khassidas"
      );

      const data = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.items)
        ? response.data.items
        : Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      setListeKhassidas(data);

      return data;
    } catch (error) {
      afficherErreur(
        error,
        "Impossible de charger les Khassidas."
      );

      setListeKhassidas([]);

      return [];
    }
  }


  /* ============================================================
     CHARGER LES TONS D'UNE KHASSIDA
  ============================================================ */

  async function selectionnerKhassida(
    khassidaId
  ) {
    if (
      !programmeSelectionne?.id ||
      !repetitionSelectionnee?.id ||
      !khassidaId
    ) {
      setTons([]);
      setAudios([]);
      return;
    }

    setKhassidaSelectionnee(khassidaId);
    setTonSelectionne(null);
    setAudioSelectionne(null);
    setTons([]);
    setAudios([]);

    setChargementKhassida(true);

    try {
      const response = await api.get(
        `/programmes-religieux/${programmeSelectionne.id}/repetitions/${repetitionSelectionnee.id}/khassidas/${khassidaId}/tons`
      );

      const data = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.items)
        ? response.data.items
        : Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      setTons(data);
    } catch (error) {
      afficherErreur(
        error,
        "Impossible de charger les tons de cette Khassida."
      );
    } finally {
      setChargementKhassida(false);
    }
  }


  /* ============================================================
     CHARGER LES AUDIOS D'UN TON
  ============================================================ */

  async function selectionnerTon(tonId) {
    if (
      !programmeSelectionne?.id ||
      !repetitionSelectionnee?.id ||
      !khassidaSelectionnee ||
      !tonId
    ) {
      setAudios([]);
      return;
    }

    setTonSelectionne(tonId);
    setAudioSelectionne(null);
    setAudios([]);

    try {
      const response = await api.get(
        `/programmes-religieux/${programmeSelectionne.id}/repetitions/${repetitionSelectionnee.id}/khassidas/${khassidaSelectionnee}/tons/${tonId}/audios`
      );

      const data = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.items)
        ? response.data.items
        : Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      setAudios(data);
    } catch (error) {
      afficherErreur(
        error,
        "Impossible de charger les audios de ce ton."
      );
    }
  }


  /* ============================================================
     OUVRIR MODAL AJOUT KHASSIDA
  ============================================================ */

  async function ouvrirKhassidaModal(
    repetition
  ) {
    setRepetitionSelectionnee(repetition);

    setKhassidaSelectionnee(null);
    setTonSelectionne(null);
    setAudioSelectionne(null);

    setTons([]);
    setAudios([]);

    const nombre =
      khassidas.length || 0;

    setOrdreKhassida(
      String(nombre + 1)
    );

    setModalKhassida(true);

    await chargerListeKhassidas();
  }


  /* ============================================================
     OUVRIR MODAL MODIFICATION KHASSIDA
  ============================================================ */

  async function ouvrirEditionKhassida(
    item
  ) {
    setKhassidaSelectionnee(
      item.khassida_id ||
        item.khassida?.id ||
        null
    );

    setTonSelectionne(
      item.ton_id ||
        item.ton?.id ||
        null
    );

    setAudioSelectionne(
      item.audio_id ||
        item.audio?.id ||
        null
    );

    setOrdreKhassida(
      item.ordre || 1
    );

    setModalKhassida(true);

    await chargerListeKhassidas();

    const khassidaId =
      item.khassida_id ||
      item.khassida?.id;

    if (khassidaId) {
      await selectionnerKhassida(
        khassidaId
      );
    }

    const tonId =
      item.ton_id ||
      item.ton?.id;

    if (tonId) {
      await selectionnerTon(tonId);
    }
  }


  /* ============================================================
     FERMER MODAL KHASSIDA
  ============================================================ */

  function fermerModalKhassida() {
    setModalKhassida(false);

    setKhassidaSelectionnee(null);
    setTonSelectionne(null);
    setAudioSelectionne(null);

    setTons([]);
    setAudios([]);
  }


  /* ============================================================
     ENREGISTRER KHASSIDA DANS RÉPÉTITION
  ============================================================ */

  async function ajouterKhassidaARepetition(
    event
  ) {
    event.preventDefault();

    if (
      !programmeSelectionne?.id ||
      !repetitionSelectionnee?.id
    ) {
      return;
    }

    if (!khassidaSelectionnee) {
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

    if (!audioSelectionne) {
      setErreur(
        "Veuillez sélectionner un audio."
      );
      return;
    }

    if (
      !ordreKhassida ||
      Number(ordreKhassida) < 1
    ) {
      setErreur(
        "L'ordre doit être supérieur ou égal à 1."
      );
      return;
    }

    setErreur("");
    setMessage("");

    try {
      const params = new URLSearchParams();

      params.append(
        "khassida_id",
        String(khassidaSelectionnee)
      );

      params.append(
        "ton_id",
        String(tonSelectionne)
      );

      params.append(
        "audio_id",
        String(audioSelectionne)
      );

      params.append(
        "ordre",
        String(ordreKhassida)
      );

      if (
        window.__PROGRAMME_KHASSSIDA_DEBUG__
      ) {
        console.log(
          "Ajout Khassida répétition :",
          params.toString()
        );
      }

      await api.post(
        `/programmes-religieux/${programmeSelectionne.id}/repetitions/${repetitionSelectionnee.id}/khassidas?${params.toString()}`
      );

      setMessage(
        "Khassida ajoutée à la répétition."
      );

      fermerModalKhassida();

      /*
       * IMPORTANT :
       * On recharge directement les Khassidas de
       * CETTE répétition.
       */
      await chargerKhassidas(
        repetitionSelectionnee.id
      );

      /*
       * Puis on rafraîchit le programme pour avoir
       * les éventuelles autres modifications.
       */
      await chargerProgramme(
        programmeSelectionne.id
      );
    } catch (error) {
      afficherErreur(
        error,
        "Impossible d'ajouter la Khassida à la répétition."
      );
    }
  }


  /* ============================================================
     SUPPRIMER KHASSIDA D'UNE RÉPÉTITION
  ============================================================ */

  async function supprimerKhassida(
    item
  ) {
    if (
      !programmeSelectionne?.id ||
      !repetitionSelectionnee?.id
    ) {
      return;
    }

    if (
      !window.confirm(
        `Retirer "${
          item.khassida?.titre ||
          "cette Khassida"
        }" de cette répétition ?`
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/programmes-religieux/${programmeSelectionne.id}/repetitions/${repetitionSelectionnee.id}/khassidas/${item.id}`
      );

      setMessage(
        "Khassida retirée de la répétition."
      );

      await chargerKhassidas(
        repetitionSelectionnee.id
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


  /* ============================================================
     MODAL DÉCLAMATION
  ============================================================ */

  function ouvrirNouvelleDeclamation() {
    setDeclamationEdition(null);

    setFormDeclamation({
      date_declamation:
        programmeSelectionne?.date_debut ||
        "",
      heure: "",
      lieu: "",
      evenement: "",
    });

    setModalDeclamation(true);
  }


  function ouvrirEditionDeclamation(
    declamation
  ) {
    setDeclamationEdition(
      declamation
    );

    setFormDeclamation({
      date_declamation:
        declamation.date_declamation ||
        declamation.date ||
        "",
      heure:
        formaterHeure(
          declamation.heure
        ) || "",
      lieu:
        declamation.lieu || "",
      evenement:
        declamation.evenement || "",
    });

    setModalDeclamation(true);
  }


  function fermerModalDeclamation() {
    setModalDeclamation(false);
    setDeclamationEdition(null);
  }


  /* ============================================================
     ENREGISTRER DÉCLAMATION
  ============================================================ */

  async function enregistrerDeclamation(
    event
  ) {
    event.preventDefault();

    if (!programmeSelectionne?.id) {
      return;
    }

    if (!formDeclamation.date_declamation) {
      setErreur(
        "Veuillez sélectionner une date."
      );
      return;
    }

    setErreur("");
    setMessage("");

    try {
      const params = new URLSearchParams();

      params.append(
        "date_declamation",
        formDeclamation.date_declamation
      );

      if (formDeclamation.heure) {
        params.append(
          "heure",
          formDeclamation.heure
        );
      }

      if (formDeclamation.lieu.trim()) {
        params.append(
          "lieu",
          formDeclamation.lieu.trim()
        );
      }

      if (
        formDeclamation.evenement.trim()
      ) {
        params.append(
          "evenement",
          formDeclamation.evenement.trim()
        );
      }

      if (declamationEdition) {
        await api.put(
          `/programmes-religieux/${programmeSelectionne.id}/declamations/${declamationEdition.id}?${params.toString()}`
        );

        setMessage(
          "Déclamation modifiée avec succès."
        );
      } else {
        await api.post(
          `/programmes-religieux/${programmeSelectionne.id}/declamations?${params.toString()}`
        );

        setMessage(
          "Déclamation ajoutée avec succès."
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


  /* ============================================================
     SUPPRIMER DÉCLAMATION
  ============================================================ */

  async function supprimerDeclamation(
    declamation
  ) {
    if (!programmeSelectionne?.id) {
      return;
    }

    if (
      !window.confirm(
        "Voulez-vous vraiment supprimer cette déclamation ?"
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/programmes-religieux/${programmeSelectionne.id}/declamations/${declamation.id}`
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


  /* ============================================================
     OUVRIR MODAL KHASSIDA DÉCLAMATION
  ============================================================ */

  async function ouvrirKhassidaDeclamationModal(
    declamation
  ) {
    setDeclamationSelectionnee(
      declamation
    );

    setKhassidaDeclamationSelectionnee(
      null
    );

    setTonDeclamationSelectionne(
      null
    );

    setAudioDeclamationSelectionne(
      null
    );

    const existantes =
      extraireKhassidasDeclamation(
        declamation
      );

    setOrdreKhassidaDeclamation(
      existantes.length + 1
    );

    setModalKhassidaDeclamation(
      true
    );

    if (listeKhassidas.length === 0) {
      await chargerListeKhassidas();
    }
  }


  /* ============================================================
     SÉLECTION KHASSIDA DÉCLAMATION
  ============================================================ */

  async function selectionnerKhassidaDeclamation(
    khassidaId
  ) {
    if (
      !programmeSelectionne?.id ||
      !declamationSelectionnee?.id ||
      !khassidaId
    ) {
      return;
    }

    setKhassidaDeclamationSelectionnee(
      khassidaId
    );

    setTonDeclamationSelectionne(
      null
    );

    setAudioDeclamationSelectionne(
      null
    );

    setChargementKhassidaDeclamation(
      true
    );

    try {
      const response = await api.get(
        `/programmes-religieux/${programmeSelectionne.id}/declamations/${declamationSelectionnee.id}/khassidas/${khassidaId}/tons`
      );

      const data = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.items)
        ? response.data.items
        : Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      setTons(data);
    } catch (error) {
      afficherErreur(
        error,
        "Impossible de charger les tons de la Khassida."
      );
    } finally {
      setChargementKhassidaDeclamation(
        false
      );
    }
  }


  /* ============================================================
     SÉLECTION TON DÉCLAMATION
  ============================================================ */

  async function selectionnerTonDeclamation(
    tonId
  ) {
    if (
      !programmeSelectionne?.id ||
      !declamationSelectionnee?.id ||
      !khassidaDeclamationSelectionnee ||
      !tonId
    ) {
      return;
    }

    setTonDeclamationSelectionne(
      tonId
    );

    setAudioDeclamationSelectionne(
      null
    );

    try {
      const response = await api.get(
        `/programmes-religieux/${programmeSelectionne.id}/declamations/${declamationSelectionnee.id}/khassidas/${khassidaDeclamationSelectionnee}/tons/${tonId}/audios`
      );

      const data = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.items)
        ? response.data.items
        : Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      /*
       * On réutilise la variable audios du composant.
       */
      setAudios(data);
    } catch (error) {
      afficherErreur(
        error,
        "Impossible de charger les audios."
      );
    }
  }


  /* ============================================================
     AJOUTER KHASSIDA À UNE DÉCLAMATION
  ============================================================ */

  async function ajouterKhassidaADeclamation(
    event
  ) {
    event.preventDefault();

    if (
      !programmeSelectionne?.id ||
      !declamationSelectionnee?.id
    ) {
      return;
    }

    if (
      !khassidaDeclamationSelectionnee
    ) {
      setErreur(
        "Veuillez sélectionner une Khassida."
      );
      return;
    }

    if (
      !tonDeclamationSelectionne
    ) {
      setErreur(
        "Veuillez sélectionner un ton."
      );
      return;
    }

    if (
      !ordreKhassidaDeclamation ||
      Number(ordreKhassidaDeclamation) < 1
    ) {
      setErreur(
        "L'ordre doit être supérieur ou égal à 1."
      );
      return;
    }

    setErreur("");
    setMessage("");

    try {
      const params = new URLSearchParams();

      params.append(
        "khassida_id",
        String(
          khassidaDeclamationSelectionnee
        )
      );

      params.append(
        "ton_id",
        String(
          tonDeclamationSelectionne
        )
      );

      params.append(
        "ordre",
        String(
          ordreKhassidaDeclamation
        )
      );

      await api.post(
        `/programmes-religieux/${programmeSelectionne.id}/declamations/${declamationSelectionnee.id}/khassidas?${params.toString()}`
      );

      setMessage(
        "Khassida ajoutée à la déclamation."
      );

      setModalKhassidaDeclamation(
        false
      );

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


  /* ============================================================
     SUPPRIMER KHASSIDA DÉCLAMATION
  ============================================================ */

  async function supprimerKhassidaDeclamation(
    declamation,
    item
  ) {
    if (!programmeSelectionne?.id) {
      return;
    }

    if (
      !window.confirm(
        `Retirer "${
          item.khassida?.titre ||
          "cette Khassida"
        }" de la déclamation ?`
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/programmes-religieux/${programmeSelectionne.id}/declamations/${declamation.id}/khassidas/${item.id}`
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


  /* ============================================================
     DÉCLAMATIONS DU PROGRAMME
  ============================================================ */

  const declamations = useMemo(() => {
    if (
      Array.isArray(
        programmeSelectionne?.declamations
      )
    ) {
      return programmeSelectionne.declamations;
    }

    if (
      Array.isArray(
        programmeSelectionne?.evenements
      )
    ) {
      return programmeSelectionne.evenements;
    }

    return [];
  }, [programmeSelectionne]);


  /* ============================================================
     RENDU CHARGEMENT
  ============================================================ */

  if (chargement) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-emerald-700">
          <Loader2
            size={25}
            className="animate-spin"
          />

          <span className="font-semibold">
            Chargement du programme...
          </span>
        </div>
      </div>
    );
  }


  /* ============================================================
     ACCÈS REFUSÉ
  ============================================================ */

  if (!peutConsulter) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
          <X
            size={42}
            className="mx-auto text-red-500"
          />

          <h2 className="mt-4 text-xl font-black text-red-800">
            Accès refusé
          </h2>

          <p className="mt-2 text-sm text-red-600">
            Vous n'avez pas la permission de
            consulter le programme religieux.
          </p>
        </div>
      </div>
    );
  }


  /* ============================================================
     AUCUN PROGRAMME
  ============================================================ */

  if (!programmeSelectionne) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <CalendarDays
            size={50}
            className="mx-auto text-slate-300"
          />

          <h2 className="mt-5 text-xl font-black text-slate-800">
            Aucun programme religieux
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Aucun programme mensuel n'est
            actuellement disponible pour votre
            Kourel.
          </p>

          {peutModifier && (
            <button
              type="button"
              onClick={
                ouvrirModalProgramme
              }
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white"
            >
              <Plus size={17} />
              Créer un programme
            </button>
          )}
        </div>

        {modalProgramme && (
          <ModalProgramme
            formProgramme={
              formProgramme
            }
            setFormProgramme={
              setFormProgramme
            }
            onClose={
              fermerModalProgramme
            }
            onSubmit={
              creerProgramme
            }
          />
        )}
      </div>
    );
  }


  const repetitions =
    Array.isArray(
      programmeSelectionne.repetitions
    )
      ? programmeSelectionne.repetitions
      : [];


  /* ============================================================
     RENDU PRINCIPAL
  ============================================================ */

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* ====================================================
            EN-TÊTE
        ==================================================== */}

        <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 p-6 text-white shadow-xl sm:p-8">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <div className="mb-3 flex items-center gap-2 text-emerald-300">
                <CalendarDays size={18} />

                <span className="text-xs font-black uppercase tracking-[0.2em]">
                  Programme du Kourel
                </span>
              </div>

              <h1 className="text-3xl font-black sm:text-4xl">
                Programme religieux
              </h1>

              <p className="mt-3 text-sm text-emerald-100/70">
                Programme du mois{" "}
                <strong>
                  {MOIS[
                    Number(
                      programmeSelectionne.mois
                    ) - 1
                  ] ||
                    String(
                      programmeSelectionne.mois
                    ).padStart(2, "0")}
                  {" "}
                  {programmeSelectionne.annee}
                </strong>
              </p>
            </div>

            <div className="flex flex-wrap gap-3">

              {peutModifier && (
                <>
                  <button
                    type="button"
                    onClick={
                      genererRepetitions
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/20"
                  >
                    <RefreshCw
                      size={17}
                    />
                    Générer les répétitions
                  </button>

                  <button
                    type="button"
                    onClick={
                      ouvrirNouvelleRepetition
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    <Plus size={18} />
                    Ajouter une répétition
                  </button>
                </>
              )}

            </div>

          </div>
        </div>


        {/* ====================================================
            MESSAGES
        ==================================================== */}

        {message && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <Check size={18} />

            <span>{message}</span>

            <button
              type="button"
              className="ml-auto"
              onClick={() =>
                setMessage("")
              }
            >
              <X size={16} />
            </button>
          </div>
        )}


        {erreur && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <X
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>{erreur}</span>

            <button
              type="button"
              className="ml-auto"
              onClick={() =>
                setErreur("")
              }
            >
              <X size={16} />
            </button>
          </div>
        )}


        {/* ====================================================
            INFORMATIONS PROGRAMME
        ==================================================== */}

        <div className="mb-8 grid gap-4 sm:grid-cols-3">

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Début
            </p>

            <p className="mt-2 font-black capitalize text-slate-800">
              {formaterDate(
                programmeSelectionne.date_debut
              )}
            </p>
          </div>


          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Fin
            </p>

            <p className="mt-2 font-black capitalize text-slate-800">
              {formaterDate(
                programmeSelectionne.date_fin
              )}
            </p>
          </div>


          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Répétitions
            </p>

            <p className="mt-2 text-2xl font-black text-emerald-700">
              {repetitions.length}
            </p>
          </div>

        </div>


        {/* ====================================================
            RÉPÉTITIONS
        ==================================================== */}

        <section className="mb-10">

          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Music
                  size={20}
                  className="text-emerald-700"
                />

                <h2 className="text-xl font-black text-slate-900">
                  Répétitions
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Les séances de répétition du
                programme religieux.
              </p>
            </div>
          </div>


          {repetitions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <CalendarDays
                size={42}
                className="mx-auto text-slate-300"
              />

              <p className="mt-4 font-bold text-slate-600">
                Aucune répétition programmée.
              </p>

              {peutModifier && (
                <button
                  type="button"
                  onClick={
                    ouvrirNouvelleRepetition
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white"
                >
                  <Plus size={17} />
                  Ajouter une répétition
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-5">

              {repetitions.map(
                (repetition) => {
                  const ouverte =
                    repetitionSelectionnee?.id ===
                    repetition.id;

                  return (
                    <div
                      key={repetition.id}
                      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                    >

                      {/* EN-TÊTE */}

                      <div className="p-5 sm:p-6">

                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                          <button
                            type="button"
                            onClick={() =>
                              ouvrirRepetition(
                                repetition
                              )
                            }
                            className="flex min-w-0 flex-1 items-center gap-4 text-left"
                          >

                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                              <CalendarDays
                                size={25}
                              />
                            </div>


                            <div className="min-w-0">

                              <p className="text-lg font-black capitalize text-slate-900">
                                {formaterDate(
                                  repetition.date_repetition
                                )}
                              </p>

                              <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">

                                {(repetition.heure_debut ||
                                  repetition.heure_fin) && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <Clock
                                      size={14}
                                    />

                                    {formaterHeure(
                                      repetition.heure_debut
                                    )}

                                    {repetition.heure_fin &&
                                      ` - ${formaterHeure(
                                        repetition.heure_fin
                                      )}`}
                                  </span>
                                )}


                                {repetition.lieu && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <MapPin
                                      size={14}
                                    />
                                    {repetition.lieu}
                                  </span>
                                )}

                              </div>

                            </div>


                            <div className="ml-auto">
                              <ChevronRight
                                size={21}
                                className={`text-slate-400 transition-transform ${
                                  ouverte
                                    ? "rotate-90"
                                    : ""
                                }`}
                              />
                            </div>

                          </button>


                          {peutModifier && (
                            <div className="flex items-center gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  ouvrirEditionRepetition(
                                    repetition
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                              >
                                <Pencil
                                  size={15}
                                />
                                Modifier
                              </button>


                              <button
                                type="button"
                                onClick={() =>
                                  supprimerRepetition(
                                    repetition.id
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
                              >
                                <Trash2
                                  size={15}
                                />
                                Supprimer
                              </button>

                            </div>
                          )}

                        </div>
                      </div>


                      {/* ==================================================
                          CONTENU DE LA RÉPÉTITION
                      ================================================== */}

                      {ouverte && (
                        <div className="border-t border-slate-100 bg-slate-50/70 p-5 sm:p-6">

                          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                            <div>
                              <div className="flex items-center gap-2">
                                <BookOpen
                                  size={19}
                                  className="text-emerald-700"
                                />

                                <h3 className="font-black text-slate-900">
                                  Khassidas à répéter
                                </h3>
                              </div>

                              <p className="mt-1 text-xs text-slate-500">
                                Les Khassidas, leurs
                                tons et leurs audios
                                pour cette répétition.
                              </p>
                            </div>


                            {peutModifier && (
                              <button
                                type="button"
                                onClick={() =>
                                  ouvrirKhassidaModal(
                                    repetition
                                  )
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-emerald-800"
                              >
                                <Plus size={16} />
                                Ajouter une Khassida
                              </button>
                            )}

                          </div>


                          {/* CHARGEMENT */}

                          {chargementKhassidas ? (
                            <div className="flex items-center justify-center rounded-2xl bg-white py-12">
                              <div className="flex items-center gap-3 text-emerald-700">
                                <Loader2
                                  size={26}
                                  className="animate-spin"
                                />

                                <span className="text-sm font-bold">
                                  Chargement des Khassidas...
                                </span>
                              </div>
                            </div>
                          ) : khassidas.length ===
                            0 ? (

                            /* AUCUNE KHASSIDA */

                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">

                              <BookOpen
                                size={36}
                                className="mx-auto text-slate-300"
                              />

                              <p className="mt-3 text-sm font-bold text-slate-600">
                                Aucune Khassida
                                programmée pour
                                cette répétition.
                              </p>

                              {peutModifier && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    ouvrirKhassidaModal(
                                      repetition
                                    )
                                  }
                                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white"
                                >
                                  <Plus size={15} />
                                  Ajouter la première
                                  Khassida
                                </button>
                              )}

                            </div>

                          ) : (

                            /* KHASSIDAS */

                            <div className="space-y-3">

                              {khassidas
                                .slice()
                                .sort(
                                  (a, b) =>
                                    Number(
                                      a.ordre || 0
                                    ) -
                                    Number(
                                      b.ordre || 0
                                    )
                                )
                                .map(
                                  (
                                    item,
                                    index
                                  ) => {

                                    const titre =
                                      item.khassida
                                        ?.titre ||
                                      item.khassida_titre ||
                                      "Khassida";

                                    const auteur =
                                      item.khassida
                                        ?.auteur ||
                                      item.khassida_auteur ||
                                      "";

                                    const ton =
                                      item.ton?.nom ||
                                      item.ton_nom ||
                                      "Non défini";

                                    const audioUrl =
                                      construireUrlAudio(
                                        item.audio
                                      );

                                    const audioTitre =
                                      item.audio
                                        ?.titre ||
                                      item.audio_titre ||
                                      "Audio";

                                    return (
                                      <div
                                        key={
                                          item.id ||
                                          `${repetition.id}-${index}`
                                        }
                                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                                      >

                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">

                                          {/* ORDRE */}

                                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-black text-emerald-700">
                                            {item.ordre ||
                                              index +
                                                1}
                                          </div>


                                          {/* KHASSIDA */}

                                          <div className="min-w-0 flex-1">

                                            <div className="flex items-center gap-2">
                                              <BookOpen
                                                size={
                                                  16
                                                }
                                                className="shrink-0 text-emerald-700"
                                              />

                                              <h4 className="truncate font-black text-slate-900">
                                                {
                                                  titre
                                                }
                                              </h4>
                                            </div>

                                            {auteur && (
                                              <p className="mt-1 text-xs text-slate-400">
                                                {
                                                  auteur
                                                }
                                              </p>
                                            )}

                                          </div>


                                          {/* TON */}

                                          <div className="rounded-xl bg-violet-50 px-3 py-2">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                                              Ton
                                            </p>

                                            <p className="mt-0.5 text-sm font-black text-violet-700">
                                              {
                                                ton
                                              }
                                            </p>
                                          </div>


                                          {/* AUDIO */}

                                          <div className="min-w-[220px] rounded-xl bg-slate-50 px-3 py-2">

                                            <div className="flex items-center gap-2">
                                              <Headphones
                                                size={
                                                  15
                                                }
                                                className="text-slate-500"
                                              />

                                              <span className="truncate text-xs font-bold text-slate-700">
                                                {
                                                  audioTitre
                                                }
                                              </span>
                                            </div>

                                            {audioUrl && (
                                              <audio
                                                controls
                                                preload="none"
                                                className="mt-2 h-8 w-full"
                                              >
                                                <source
                                                  src={
                                                    audioUrl
                                                  }
                                                />

                                                Votre navigateur
                                                ne supporte
                                                pas l'audio.
                                              </audio>
                                            )}

                                          </div>


                                          {/* ACTIONS */}

                                          {peutModifier && (
                                            <div className="flex items-center gap-2">

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  ouvrirEditionKhassida(
                                                    item
                                                  )
                                                }
                                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                                                title="Modifier"
                                              >
                                                <Pencil
                                                  size={
                                                    15
                                                  }
                                                />
                                              </button>


                                              <button
                                                type="button"
                                                onClick={() =>
                                                  supprimerKhassida(
                                                    item
                                                  )
                                                }
                                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100"
                                                title="Retirer"
                                              >
                                                <Trash2
                                                  size={
                                                    15
                                                  }
                                                />
                                              </button>

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
                      )}

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>


        {/* ====================================================
            DÉCLAMATIONS
        ==================================================== */}

        <section>

          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <div className="flex items-center gap-2">
                <Mic2
                  size={20}
                  className="text-emerald-700"
                />

                <h2 className="text-xl font-black text-slate-900">
                  Déclamations
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Khassidas à déclamer lors des
                réunions et programmes religieux.
              </p>
            </div>


            {peutModifier && (
              <button
                type="button"
                onClick={
                  ouvrirNouvelleDeclamation
                }
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-emerald-800"
              >
                <Plus size={16} />
                Ajouter une déclamation
              </button>
            )}

          </div>


          {declamations.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <Mic2
                size={42}
                className="mx-auto text-slate-300"
              />

              <p className="mt-4 font-bold text-slate-600">
                Aucune déclamation programmée.
              </p>

              {peutModifier && (
                <button
                  type="button"
                  onClick={
                    ouvrirNouvelleDeclamation
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white"
                >
                  <Plus size={17} />
                  Ajouter une déclamation
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">

              {declamations.map(
                (declamation) => {

                  const khassidasDeclamation =
                    extraireKhassidasDeclamation(
                      declamation
                    );

                  return (
                    <div
                      key={
                        declamation.id
                      }
                      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                    >

                      <div className="p-5 sm:p-6">

                        <div className="flex flex-col gap-5">

                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                            <div className="flex min-w-0 items-start gap-4">

                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                                <Mic2
                                  size={22}
                                />
                              </div>

                              <div className="min-w-0">

                                <h3 className="font-black text-slate-900">
                                  {declamation.evenement ||
                                    "Déclamation"}
                                </h3>

                                <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">

                                  {(declamation.date_declamation ||
                                    declamation.date) && (
                                    <span className="inline-flex items-center gap-1.5">
                                      <CalendarDays
                                        size={
                                          14
                                        }
                                      />

                                      {formaterDate(
                                        declamation.date_declamation ||
                                          declamation.date
                                      )}
                                    </span>
                                  )}

                                  {declamation.heure && (
                                    <span className="inline-flex items-center gap-1.5">
                                      <Clock
                                        size={
                                          14
                                        }
                                      />

                                      {formaterHeure(
                                        declamation.heure
                                      )}
                                    </span>
                                  )}

                                  {declamation.lieu && (
                                    <span className="inline-flex items-center gap-1.5">
                                      <MapPin
                                        size={
                                          14
                                        }
                                      />

                                      {
                                        declamation.lieu
                                      }
                                    </span>
                                  )}

                                </div>

                              </div>

                            </div>


                            {peutModifier && (
                              <div className="flex items-center gap-2">

                                <button
                                  type="button"
                                  onClick={() =>
                                    ouvrirEditionDeclamation(
                                      declamation
                                    )
                                  }
                                  className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
                                >
                                  <Pencil
                                    size={
                                      15
                                    }
                                  />
                                  Modifier
                                </button>


                                <button
                                  type="button"
                                  onClick={() =>
                                    supprimerDeclamation(
                                      declamation
                                    )
                                  }
                                  className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600"
                                >
                                  <Trash2
                                    size={
                                      15
                                    }
                                  />
                                  Supprimer
                                </button>

                              </div>
                            )}

                          </div>


                          {/* KHASSIDAS DÉCLAMATION */}

                          <div className="rounded-2xl bg-slate-50 p-4">

                            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                              <div>
                                <div className="flex items-center gap-2">
                                  <BookOpen
                                    size={
                                      17
                                    }
                                    className="text-violet-700"
                                  />

                                  <h4 className="text-sm font-black text-slate-800">
                                    Khassidas à déclamer
                                  </h4>
                                </div>
                              </div>


                              {peutModifier && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    ouvrirKhassidaDeclamationModal(
                                      declamation
                                    )
                                  }
                                  className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-3 py-2 text-xs font-bold text-white"
                                >
                                  <Plus
                                    size={
                                      15
                                    }
                                  />
                                  Ajouter une Khassida
                                </button>
                              )}

                            </div>


                            {khassidasDeclamation.length ===
                            0 ? (
                              <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center text-xs font-semibold text-slate-500">
                                Aucune Khassida
                                programmée.
                              </p>
                            ) : (
                              <div className="space-y-2">

                                {khassidasDeclamation
                                  .slice()
                                  .sort(
                                    (a, b) =>
                                      Number(
                                        a.ordre ||
                                          0
                                      ) -
                                      Number(
                                        b.ordre ||
                                          0
                                      )
                                  )
                                  .map(
                                    (
                                      item,
                                      index
                                    ) => {

                                      const audioUrl =
                                        construireUrlAudio(
                                          item.audio
                                        );

                                      return (
                                        <div
                                          key={
                                            item.id ||
                                            `${declamation.id}-${index}`
                                          }
                                          className="rounded-xl border border-slate-200 bg-white p-3"
                                        >

                                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-xs font-black text-violet-700">
                                              {item.ordre ||
                                                index +
                                                  1}
                                            </div>


                                            <div className="min-w-0 flex-1">
                                              <p className="truncate text-sm font-black text-slate-800">
                                                {item.khassida
                                                  ?.titre ||
                                                  item.khassida_titre ||
                                                  "Khassida"}
                                              </p>

                                              {(item.ton?.nom ||
                                                item.ton_nom) && (
                                                <p className="mt-1 text-xs text-violet-600">
                                                  Ton :{" "}
                                                  {item.ton
                                                    ?.nom ||
                                                    item.ton_nom}
                                                </p>
                                              )}
                                            </div>


                                            {audioUrl && (
                                              <audio
                                                controls
                                                preload="none"
                                                className="h-8 w-full max-w-xs"
                                              >
                                                <source
                                                  src={
                                                    audioUrl
                                                  }
                                                />
                                              </audio>
                                            )}


                                            {peutModifier && (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  supprimerKhassidaDeclamation(
                                                    declamation,
                                                    item
                                                  )
                                                }
                                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600"
                                                title="Retirer"
                                              >
                                                <Trash2
                                                  size={
                                                    15
                                                  }
                                                />
                                              </button>
                                            )}

                                          </div>

                                        </div>
                                      );
                                    }
                                  )}

                              </div>
                            )}

                          </div>

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>

      </div>


      {/* ========================================================
          MODAL PROGRAMME
      ======================================================== */}

      {modalProgramme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-100 p-5">

              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Nouveau programme religieux
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Création du programme mensuel
                </p>
              </div>

              <button
                type="button"
                onClick={
                  fermerModalProgramme
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>

            </div>


            <form
              onSubmit={
                creerProgramme
              }
              className="space-y-5 p-5"
            >

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Année
                </label>

                <input
                  type="number"
                  min="2000"
                  max="2100"
                  required
                  value={
                    formProgramme.annee
                  }
                  onChange={(event) =>
                    setFormProgramme(
                      (ancien) => ({
                        ...ancien,
                        annee:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>


              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Mois
                </label>

                <select
                  required
                  value={
                    formProgramme.mois
                  }
                  onChange={(event) =>
                    setFormProgramme(
                      (ancien) => ({
                        ...ancien,
                        mois:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:bg-white"
                >
                  {MOIS.map(
                    (mois, index) => (
                      <option
                        key={mois}
                        value={index + 1}
                      >
                        {mois}
                      </option>
                    )
                  )}
                </select>
              </div>


              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={
                    fermerModalProgramme
                  }
                  className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white"
                >
                  <Check size={16} />
                  Créer
                </button>

              </div>

            </form>

          </div>
        </div>
      )}


      {/* ========================================================
          MODAL RÉPÉTITION
      ======================================================== */}

      {modalRepetition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-100 p-5">

              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {repetitionEdition
                    ? "Modifier la répétition"
                    : "Ajouter une répétition"}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Informations de la séance
                </p>
              </div>

              <button
                type="button"
                onClick={
                  fermerModalRepetition
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>

            </div>


            <form
              onSubmit={
                enregistrerRepetition
              }
              className="space-y-5 p-5"
            >

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Date
                </label>

                <input
                  type="date"
                  required
                  value={
                    formRepetition.date_repetition
                  }
                  onChange={(event) =>
                    setFormRepetition(
                      (ancien) => ({
                        ...ancien,
                        date_repetition:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>


              <div className="grid gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Heure de début
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
                            event.target.value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>


                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Heure de fin
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
                            event.target.value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>

              </div>


              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
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
                  placeholder="Ex. Castors"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>


              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={
                    fermerModalRepetition
                  }
                  className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white"
                >
                  <Check size={16} />
                  Enregistrer
                </button>

              </div>

            </form>

          </div>
        </div>
      )}


      {/* ========================================================
          MODAL KHASSIDA RÉPÉTITION
      ======================================================== */}

      {modalKhassida && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-100 p-5">

              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Ajouter une Khassida
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Khassida, ton, audio et ordre
                </p>
              </div>

              <button
                type="button"
                onClick={
                  fermerModalKhassida
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>

            </div>


            <form
              onSubmit={
                ajouterKhassidaARepetition
              }
              className="space-y-5 p-5"
            >

              {/* KHASSIDA */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Khassida
                </label>

                <select
                  required
                  value={
                    khassidaSelectionnee || ""
                  }
                  onChange={(event) =>
                    selectionnerKhassida(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:bg-white"
                >
                  <option value="">
                    Sélectionner une Khassida
                  </option>

                  {listeKhassidas.map(
                    (khassida) => (
                      <option
                        key={
                          khassida.id
                        }
                        value={
                          khassida.id
                        }
                      >
                        {khassida.titre}
                      </option>
                    )
                  )}
                </select>
              </div>


              {/* TON */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Ton
                </label>

                <select
                  required
                  disabled={
                    !khassidaSelectionnee ||
                    tons.length === 0
                  }
                  value={
                    tonSelectionne || ""
                  }
                  onChange={(event) =>
                    selectionnerTon(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">
                    {tons.length === 0
                      ? "Aucun ton disponible"
                      : "Sélectionner un ton"}
                  </option>

                  {tons.map(
                    (ton) => (
                      <option
                        key={ton.id}
                        value={ton.id}
                      >
                        {ton.nom ||
                          ton.titre ||
                          `Ton ${ton.id}`}
                      </option>
                    )
                  )}
                </select>
              </div>


              {/* AUDIO */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Audio
                </label>

                <select
                  required
                  disabled={
                    !tonSelectionne ||
                    audios.length === 0
                  }
                  value={
                    audioSelectionne ||
                    ""
                  }
                  onChange={(event) =>
                    setAudioSelectionne(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">
                    {audios.length === 0
                      ? "Aucun audio disponible"
                      : "Sélectionner un audio"}
                  </option>

                  {audios.map(
                    (audio) => (
                      <option
                        key={audio.id}
                        value={audio.id}
                      >
                        {audio.titre ||
                          `Audio ${audio.id}`}
                      </option>
                    )
                  )}
                </select>
              </div>


              {/* ORDRE */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Ordre
                </label>

                <input
                  type="number"
                  min="1"
                  required
                  value={
                    ordreKhassida
                  }
                  onChange={(event) =>
                    setOrdreKhassida(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>


              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={
                    fermerModalKhassida
                  }
                  className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={
                    chargementKhassida
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {chargementKhassida ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Check
                      size={16}
                    />
                  )}

                  Enregistrer
                </button>

              </div>

            </form>

          </div>
        </div>
      )}


      {/* ========================================================
          MODAL DÉCLAMATION
      ======================================================== */}

      {modalDeclamation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-100 p-5">

              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {declamationEdition
                    ? "Modifier la déclamation"
                    : "Ajouter une déclamation"}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Informations de la déclamation
                </p>
              </div>

              <button
                type="button"
                onClick={
                  fermerModalDeclamation
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>

            </div>


            <form
              onSubmit={
                enregistrerDeclamation
              }
              className="space-y-5 p-5"
            >

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Événement
                </label>

                <input
                  type="text"
                  value={
                    formDeclamation.evenement
                  }
                  onChange={(event) =>
                    setFormDeclamation(
                      (ancien) => ({
                        ...ancien,
                        evenement:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Ex. Réunion mensuelle"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>


              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Date
                </label>

                <input
                  type="date"
                  required
                  value={
                    formDeclamation.date_declamation
                  }
                  onChange={(event) =>
                    setFormDeclamation(
                      (ancien) => ({
                        ...ancien,
                        date_declamation:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>


              <div className="grid gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Heure
                  </label>

                  <input
                    type="time"
                    value={
                      formDeclamation.heure
                    }
                    onChange={(event) =>
                      setFormDeclamation(
                        (ancien) => ({
                          ...ancien,
                          heure:
                            event.target.value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>


                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
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
                    placeholder="Ex. Castors"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>

              </div>


              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={
                    fermerModalDeclamation
                  }
                  className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white"
                >
                  <Check size={16} />
                  Enregistrer
                </button>

              </div>

            </form>

          </div>
        </div>
      )}


      {/* ========================================================
          MODAL KHASSIDA DÉCLAMATION
      ======================================================== */}

      {modalKhassidaDeclamation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-100 p-5">

              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Ajouter une Khassida
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Khassida et ton de déclamation
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setModalKhassidaDeclamation(
                    false
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>

            </div>


            <form
              onSubmit={
                ajouterKhassidaADeclamation
              }
              className="space-y-5 p-5"
            >

              {/* KHASSIDA */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Khassida
                </label>

                <select
                  required
                  value={
                    khassidaDeclamationSelectionnee ||
                    ""
                  }
                  onChange={(event) =>
                    selectionnerKhassidaDeclamation(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-600 focus:bg-white"
                >
                  <option value="">
                    Sélectionner une Khassida
                  </option>

                  {listeKhassidas.map(
                    (khassida) => (
                      <option
                        key={
                          khassida.id
                        }
                        value={
                          khassida.id
                        }
                      >
                        {khassida.titre}
                      </option>
                    )
                  )}
                </select>
              </div>


              {/* TON */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Ton
                </label>

                <select
                  required
                  disabled={
                    !khassidaDeclamationSelectionnee ||
                    tons.length === 0
                  }
                  value={
                    tonDeclamationSelectionne ||
                    ""
                  }
                  onChange={(event) =>
                    selectionnerTonDeclamation(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-600 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">
                    {tons.length === 0
                      ? "Aucun ton disponible"
                      : "Sélectionner un ton"}
                  </option>

                  {tons.map(
                    (ton) => (
                      <option
                        key={ton.id}
                        value={ton.id}
                      >
                        {ton.nom ||
                          ton.titre ||
                          `Ton ${ton.id}`}
                      </option>
                    )
                  )}
                </select>
              </div>


              {/* AUDIO INFORMATIF */}

              {audioDeclamationSelectionne && (
                <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                  Audio sélectionné :
                  {" "}
                  {
                    audioDeclamationSelectionne
                  }
                </div>
              )}


              {/* ORDRE */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Ordre
                </label>

                <input
                  type="number"
                  min="1"
                  required
                  value={
                    ordreKhassidaDeclamation
                  }
                  onChange={(event) =>
                    setOrdreKhassidaDeclamation(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-600 focus:bg-white"
                />
              </div>


              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={() =>
                    setModalKhassidaDeclamation(
                      false
                    )
                  }
                  className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={
                    chargementKhassidaDeclamation
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {chargementKhassidaDeclamation ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Check
                      size={16}
                    />
                  )}

                  Enregistrer
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}


/* ============================================================
   MODAL PROGRAMME — COMPOSANT LOCAL
============================================================ */

function ModalProgramme({
  formProgramme,
  setFormProgramme,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">

        <div className="flex items-center justify-between border-b border-slate-100 p-5">

          <div>
            <h2 className="text-lg font-black text-slate-900">
              Nouveau programme religieux
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Création du programme mensuel
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
          >
            <X size={18} />
          </button>

        </div>


        <form
          onSubmit={onSubmit}
          className="space-y-5 p-5"
        >

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Année
            </label>

            <input
              type="number"
              min="2000"
              max="2100"
              required
              value={
                formProgramme.annee
              }
              onChange={(event) =>
                setFormProgramme(
                  (ancien) => ({
                    ...ancien,
                    annee:
                      event.target.value,
                  })
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:bg-white"
            />
          </div>


          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Mois
            </label>

            <select
              required
              value={
                formProgramme.mois
              }
              onChange={(event) =>
                setFormProgramme(
                  (ancien) => ({
                    ...ancien,
                    mois:
                      event.target.value,
                  })
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:bg-white"
            >
              {MOIS.map(
                (mois, index) => (
                  <option
                    key={mois}
                    value={index + 1}
                  >
                    {mois}
                  </option>
                )
              )}
            </select>
          </div>


          <div className="flex justify-end gap-3 pt-2">

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600"
            >
              Annuler
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white"
            >
              <Check size={16} />
              Créer
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}