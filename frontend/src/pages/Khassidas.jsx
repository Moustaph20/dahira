import { useEffect, useState } from "react";

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Edit,
  ExternalLink,
  FileAudio,
  FileText,
  Headphones,
  Loader2,
  Music,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import api from "../api/client";
import { useAuth } from "../context/AuthContext";

// ============================================================
// OUTILS
// ============================================================

function getAudioUrl(fichier) {
  if (!fichier) return "";

  if (fichier.startsWith("http://") || fichier.startsWith("https://")) {
    return fichier;
  }

  const baseURL = (api.defaults.baseURL || "").replace(/\/+$/, "");
  const chemin = fichier.replace(/\\/g, "/").replace(/^\/+/, "");

  return `${baseURL}/${chemin}`;
}

function nettoyerNomFichier(nom) {
  return (
    String(nom || "khassida")
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
      .trim() || "khassida"
  );
}

function ActionButton({
  children,
  title,
  icon: Icon,
  onClick,
  disabled = false,
  variant = "light",
}) {
  const variants = {
    light:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    green:
      "bg-emerald-700 text-white hover:bg-emerald-800",
    softGreen:
      "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    danger:
      "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  };

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]}`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function Khassidas() {
  const { aPermission } = useAuth();

  const [khassidas, setKhassidas] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [rafraichissement, setRafraichissement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const [khassidaOuverte, setKhassidaOuverte] = useState(null);

  // KHASSIDA
  const [modalKhassida, setModalKhassida] = useState(false);
  const [modeKhassida, setModeKhassida] = useState("creation");
  const [khassidaSelectionnee, setKhassidaSelectionnee] = useState(null);
  const [formKhassida, setFormKhassida] = useState({
    titre: "",
    auteur: "",
    description: "",
  });
  const [chargementKhassida, setChargementKhassida] = useState(false);

  // PDF
  const [modalPdf, setModalPdf] = useState(false);
  const [khassidaPdf, setKhassidaPdf] = useState(null);
  const [fichierPdf, setFichierPdf] = useState(null);
  const [chargementPdf, setChargementPdf] = useState(false);
  const [lecteurPdfOuvert, setLecteurPdfOuvert] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState("");
  const [chargementLecturePdf, setChargementLecturePdf] = useState(false);
  const [telechargementPdfId, setTelechargementPdfId] = useState(null);

  // AUDIO
  const [modalAudio, setModalAudio] = useState(false);
  const [modeAudio, setModeAudio] = useState("creation");
  const [audioSelectionne, setAudioSelectionne] = useState(null);
  const [khassidaAudio, setKhassidaAudio] = useState(null);
  const [tons, setTons] = useState([]);
  const [chargementTons, setChargementTons] = useState(false);
  const [formAudio, setFormAudio] = useState({
    ton_id: "",
    titre: "",
    description: "",
    fichier: null,
  });
  const [chargementAudio, setChargementAudio] = useState(false);

  const peutCreer = aPermission("KOUREL_CREER");
  const peutModifier = aPermission("KOUREL_MODIFIER");
  const peutSupprimer = aPermission("KOUREL_SUPPRIMER");
  const peutConsulter = aPermission("KOUREL_CONSULTER");
  const peutGererProgramme = aPermission("PROGRAMME_GERER");

  function afficherMessage(texte) {
    setMessage(texte);
    setTimeout(() => setMessage(""), 3500);
  }

  function afficherErreur(error, messageDefaut) {
    console.error(error);
    setErreur(error.response?.data?.detail || messageDefaut);
  }

  async function chargerKhassidas(afficherLoader = true) {
    if (afficherLoader) setChargement(true);
    else setRafraichissement(true);

    setErreur("");

    try {
      const response = await api.get("/khassidas");
      setKhassidas(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      afficherErreur(error, "Impossible de charger les Khassidas.");
    } finally {
      if (afficherLoader) setChargement(false);
      else setRafraichissement(false);
    }
  }

  useEffect(() => {
    chargerKhassidas(true);
  }, []);

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

  // ============================================================
  // KHASSIDA
  // ============================================================

  function toggleKhassida(id) {
    setKhassidaOuverte((ancienne) => (ancienne === id ? null : id));
  }

  function ouvrirCreationKhassida() {
    setModeKhassida("creation");
    setKhassidaSelectionnee(null);
    setFormKhassida({ titre: "", auteur: "", description: "" });
    setErreur("");
    setModalKhassida(true);
  }

  function ouvrirModificationKhassida(khassida) {
    setModeKhassida("modification");
    setKhassidaSelectionnee(khassida);
    setFormKhassida({
      titre: khassida.titre || "",
      auteur: khassida.auteur || "",
      description: khassida.description || "",
    });
    setErreur("");
    setModalKhassida(true);
  }

  function fermerModalKhassida() {
    if (chargementKhassida) return;
    setModalKhassida(false);
    setKhassidaSelectionnee(null);
  }

  async function enregistrerKhassida(e) {
    e.preventDefault();
    setErreur("");

    const titre = formKhassida.titre.trim();
    if (!titre) {
      setErreur("Le titre de la Khassida est obligatoire.");
      return;
    }

    setChargementKhassida(true);

    try {
      const donnees = {
        titre,
        auteur: formKhassida.auteur.trim() || null,
        description: formKhassida.description.trim() || null,
      };

      if (modeKhassida === "creation") {
        await api.post("/khassidas", donnees);
        afficherMessage("Khassida ajoutée avec succès.");
      } else {
        await api.put(`/khassidas/${khassidaSelectionnee.id}`, donnees);
        afficherMessage("Khassida modifiée avec succès.");
      }

      fermerModalKhassida();
      await chargerKhassidas(false);
    } catch (error) {
      afficherErreur(error, "Une erreur est survenue.");
    } finally {
      setChargementKhassida(false);
    }
  }

  async function supprimerKhassida(khassida) {
    if (!window.confirm(`Supprimer « ${khassida.titre} » ?`)) return;

    setErreur("");

    try {
      await api.delete(`/khassidas/${khassida.id}`);
      if (khassidaOuverte === khassida.id) setKhassidaOuverte(null);
      afficherMessage("Khassida supprimée avec succès.");
      await chargerKhassidas(false);
    } catch (error) {
      afficherErreur(error, "Impossible de supprimer la Khassida.");
    }
  }

  // ============================================================
  // PDF
  // ============================================================

  function ouvrirAjoutPdf(khassida) {
    setKhassidaPdf(khassida);
    setFichierPdf(null);
    setErreur("");
    setModalPdf(true);
  }

  function fermerModalPdf() {
    if (chargementPdf) return;
    setModalPdf(false);
    setKhassidaPdf(null);
    setFichierPdf(null);
  }

  function selectionnerPdf(e) {
    const fichier = e.target.files?.[0] || null;
    if (!fichier) {
      setFichierPdf(null);
      return;
    }

    const extension = fichier.name?.toLowerCase().split(".").pop();

    if (fichier.type !== "application/pdf" && extension !== "pdf") {
      setErreur("Veuillez sélectionner un fichier PDF.");
      setFichierPdf(null);
      return;
    }

    if (fichier.size === 0) {
      setErreur("Le fichier PDF est vide.");
      setFichierPdf(null);
      return;
    }

    if (fichier.size > 100 * 1024 * 1024) {
      setErreur("Le fichier PDF ne doit pas dépasser 100 MB.");
      setFichierPdf(null);
      return;
    }

    setErreur("");
    setFichierPdf(fichier);
  }

  async function enregistrerPdf(e) {
    e?.preventDefault?.();
    setErreur("");

    if (!khassidaPdf) {
      setErreur("La Khassida est introuvable.");
      return;
    }

    if (!fichierPdf) {
      setErreur("Veuillez sélectionner un fichier PDF.");
      return;
    }

    setChargementPdf(true);

    try {
      const formData = new FormData();
      formData.append("fichier", fichierPdf);
      await api.post(`/khassidas/${khassidaPdf.id}/pdf`, formData);
      afficherMessage("PDF enregistré avec succès.");
      fermerModalPdf();
      await chargerKhassidas(false);
    } catch (error) {
      afficherErreur(error, "Impossible d'enregistrer le PDF.");
    } finally {
      setChargementPdf(false);
    }
  }

  async function lirePdf(khassida) {
    if (!khassida?.id || !khassida.pdf_url) {
      setErreur("Aucun PDF n'est associé à cette Khassida.");
      return;
    }

    setErreur("");
    setChargementLecturePdf(true);

    try {
      const response = await api.get(`/khassidas/${khassida.id}/pdf/view`, {
        responseType: "blob",
      });

      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);

      const blob =
        response.data instanceof Blob
          ? response.data
          : new Blob([response.data], { type: "application/pdf" });

      setPdfBlobUrl(URL.createObjectURL(blob));
      setKhassidaPdf(khassida);
      setLecteurPdfOuvert(true);
    } catch (error) {
      afficherErreur(error, "Impossible d'ouvrir le PDF.");
    } finally {
      setChargementLecturePdf(false);
    }
  }

  function fermerLecteurPdf() {
    setLecteurPdfOuvert(false);
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setPdfBlobUrl("");
    setKhassidaPdf(null);
  }

  async function telechargerPdf(khassida) {
    if (!khassida?.id || !khassida.pdf_url) {
      setErreur("Aucun PDF n'est associé à cette Khassida.");
      return;
    }

    setErreur("");
    setTelechargementPdfId(khassida.id);

    try {
      const response = await api.get(
        `/khassidas/${khassida.id}/pdf/download`,
        { responseType: "blob" }
      );

      const blob =
        response.data instanceof Blob
          ? response.data
          : new Blob([response.data], { type: "application/pdf" });

      const url = URL.createObjectURL(blob);
      const lien = document.createElement("a");
      lien.href = url;
      lien.download = `${nettoyerNomFichier(khassida.titre)}.pdf`;
      document.body.appendChild(lien);
      lien.click();
      lien.remove();
      URL.revokeObjectURL(url);

      afficherMessage("Téléchargement lancé.");
    } catch (error) {
      afficherErreur(error, "Impossible de télécharger le PDF.");
    } finally {
      setTelechargementPdfId(null);
    }
  }

  async function supprimerPdf(khassida) {
    if (!window.confirm(`Supprimer le PDF de « ${khassida.titre} » ?`)) {
      return;
    }

    setErreur("");

    try {
      await api.delete(`/khassidas/${khassida.id}/pdf`);
      if (khassidaPdf?.id === khassida.id) fermerLecteurPdf();
      afficherMessage("PDF supprimé avec succès.");
      await chargerKhassidas(false);
    } catch (error) {
      afficherErreur(error, "Impossible de supprimer le PDF.");
    }
  }

  function ouvrirPdfNouvelOnglet() {
    if (pdfBlobUrl) window.open(pdfBlobUrl, "_blank", "noopener,noreferrer");
  }

  // ============================================================
  // AUDIO / TONS
  // ============================================================

  async function chargerTons() {
    setChargementTons(true);

    try {
      const response = await api.get("/tons");
      setTons(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setTons([]);
      afficherErreur(error, "Impossible de charger les tons.");
    } finally {
      setChargementTons(false);
    }
  }

  async function ouvrirAjoutAudio(khassida) {
    setModeAudio("creation");
    setAudioSelectionne(null);
    setKhassidaAudio(khassida);
    setFormAudio({ ton_id: "", titre: "", description: "", fichier: null });
    setTons([]);
    setErreur("");
    setModalAudio(true);
    await chargerTons();
  }

  async function ouvrirModificationAudio(khassida, audio) {
    setModeAudio("modification");
    setAudioSelectionne(audio);
    setKhassidaAudio(khassida);
    setFormAudio({
      ton_id: audio.ton?.id || audio.ton_id || "",
      titre: audio.titre || "",
      description: audio.description || "",
      fichier: null,
    });
    setTons([]);
    setErreur("");
    setModalAudio(true);
    await chargerTons();
  }

  function fermerModalAudio() {
    if (chargementAudio) return;
    setModalAudio(false);
    setAudioSelectionne(null);
    setKhassidaAudio(null);
    setTons([]);
    setFormAudio({ ton_id: "", titre: "", description: "", fichier: null });
  }

  function modifierChampAudio(e) {
    const { name, value } = e.target;
    setFormAudio((ancien) => ({ ...ancien, [name]: value }));
  }

  function selectionnerFichier(e) {
    const fichier = e.target.files?.[0] || null;
    setFormAudio((ancien) => ({ ...ancien, fichier }));
  }

  async function enregistrerAudio(e) {
    e.preventDefault();
    setErreur("");

    if (!khassidaAudio) {
      setErreur("La Khassida est obligatoire.");
      return;
    }

    if (!formAudio.ton_id) {
      setErreur("Veuillez sélectionner un ton.");
      return;
    }

    if (!formAudio.titre.trim()) {
      setErreur("Le titre de l'audio est obligatoire.");
      return;
    }

    if (modeAudio === "creation" && !formAudio.fichier) {
      setErreur("Veuillez sélectionner un fichier audio.");
      return;
    }

    setChargementAudio(true);

    try {
      const formData = new FormData();
      formData.append("khassida_id", khassidaAudio.id);
      formData.append("ton_id", formAudio.ton_id);
      formData.append("titre", formAudio.titre.trim());

      if (formAudio.description.trim()) {
        formData.append("description", formAudio.description.trim());
      }

      if (formAudio.fichier) {
        formData.append("fichier", formAudio.fichier);
      }

      if (modeAudio === "creation") {
        await api.post("/audios/", formData);
        afficherMessage("Audio ajouté avec succès.");
      } else {
        if (!audioSelectionne?.id) throw new Error("Audio introuvable.");
        await api.put(`/audios/${audioSelectionne.id}`, formData);
        afficherMessage("Audio modifié avec succès.");
      }

      fermerModalAudio();
      await chargerKhassidas(false);
    } catch (error) {
      afficherErreur(error, "Impossible d'enregistrer l'audio.");
    } finally {
      setChargementAudio(false);
    }
  }

  async function supprimerAudio(audio) {
    if (!window.confirm(`Supprimer « ${audio.titre} » ?`)) return;

    setErreur("");

    try {
      await api.delete(`/audios/${audio.id}`);
      afficherMessage("Audio supprimé avec succès.");
      await chargerKhassidas(false);
    } catch (error) {
      afficherErreur(error, "Impossible de supprimer l'audio.");
    }
  }

  // ============================================================
  // CHARGEMENT
  // ============================================================

  if (chargement) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
        <div className="mx-auto flex min-h-[400px] max-w-6xl items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-700" />
            <p className="mt-3 text-sm text-slate-500">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        {/* MESSAGES */}
        {message && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {message}
          </div>
        )}

        {erreur && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1">{erreur}</span>
            <button type="button" onClick={() => setErreur("")}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* EN-TÊTE */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Music className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Khassidas</h1>
              <p className="text-sm text-slate-500">
                Khassidas, PDF et audios
              </p>
            </div>
          </div>

          {peutCreer && (
            <button
              type="button"
              onClick={ouvrirCreationKhassida}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800"
            >
              <Plus className="h-4 w-4" />
              Nouvelle Khassida
            </button>
          )}
        </div>

        {rafraichissement && (
          <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Actualisation...
          </div>
        )}

        {/* LISTE */}
        {khassidas.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <Music className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-3 font-semibold text-slate-700">
              Aucune Khassida
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Commencez par ajouter une Khassida.
            </p>
            {peutCreer && (
              <button
                type="button"
                onClick={ouvrirCreationKhassida}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {khassidas.map((khassida) => {
              const audios = Array.isArray(khassida.audios)
                ? khassida.audios.filter((audio) => audio.actif !== false)
                : [];

              const ouverte = khassidaOuverte === khassida.id;
              const telechargementEnCours =
                telechargementPdfId === khassida.id;

              return (
                <div
                  key={khassida.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  {/* LIGNE PRINCIPALE */}
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <button
                        type="button"
                        onClick={() => toggleKhassida(khassida.id)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                          <Music className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-base font-semibold text-slate-900">
                              {khassida.titre}
                            </h2>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              {audios.length} audio{audios.length > 1 ? "s" : ""}
                            </span>
                            {khassida.pdf_url && (
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                PDF
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500">
                            {khassida.auteur && <span>{khassida.auteur}</span>}
                            {khassida.description && (
                              <span className="truncate">{khassida.description}</span>
                            )}
                          </div>
                        </div>

                        {ouverte ? (
                          <ChevronUp className="h-5 w-5 shrink-0 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
                        )}
                      </button>

                      {/* ACTIONS RÉDUITES */}
                      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        {peutConsulter && khassida.pdf_url && (
                          <ActionButton
                            icon={
                              chargementLecturePdf &&
                              khassidaPdf?.id === khassida.id
                                ? Loader2
                                : FileText
                            }
                            onClick={() => lirePdf(khassida)}
                            disabled={
                              chargementLecturePdf &&
                              khassidaPdf?.id === khassida.id
                            }
                            variant="softGreen"
                          >
                            Lire PDF
                          </ActionButton>
                        )}

                        {peutModifier && (
                          <ActionButton
                            icon={Edit}
                            title="Modifier"
                            onClick={() => ouvrirModificationKhassida(khassida)}
                          >
                            Modifier
                          </ActionButton>
                        )}

                        {peutSupprimer && (
                          <ActionButton
                            icon={Trash2}
                            title="Supprimer"
                            onClick={() => supprimerKhassida(khassida)}
                            variant="danger"
                          >
                            Supprimer
                          </ActionButton>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CONTENU OUVERT */}
                  {ouverte && (
                    <div className="border-t border-slate-200 bg-slate-50 p-4 sm:p-5">
                      {/* PDF */}
                      {peutConsulter || peutModifier ? (
                        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">
                                  Document PDF
                                </p>
                                <p className="text-xs text-slate-500">
                                  {khassida.pdf_url
                                    ? "PDF disponible"
                                    : "Aucun PDF"}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {peutConsulter && khassida.pdf_url && (
                                <ActionButton
                                  icon={FileText}
                                  onClick={() => lirePdf(khassida)}
                                  variant="softGreen"
                                >
                                  Lire
                                </ActionButton>
                              )}

                              {peutConsulter && khassida.pdf_url && (
                                <ActionButton
                                  icon={
                                    telechargementEnCours ? Loader2 : Download
                                  }
                                  onClick={() => telechargerPdf(khassida)}
                                  disabled={telechargementEnCours}
                                >
                                  Télécharger
                                </ActionButton>
                              )}

                              {peutModifier && (
                                <ActionButton
                                  icon={Upload}
                                  onClick={() => ouvrirAjoutPdf(khassida)}
                                >
                                  {khassida.pdf_url ? "Remplacer" : "Ajouter"}
                                </ActionButton>
                              )}

                              {peutModifier && khassida.pdf_url && (
                                <button
                                  type="button"
                                  title="Supprimer le PDF"
                                  onClick={() => supprimerPdf(khassida)}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {/* AUDIOS */}
                      <div>
                        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-800">Audios</h3>
                            <p className="text-xs text-slate-500">
                              Écoutez les différents tons associés.
                            </p>
                          </div>

                          {peutGererProgramme && (
                            <button
                              type="button"
                              onClick={() => ouvrirAjoutAudio(khassida)}
                              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                            >
                              <Plus className="h-4 w-4" />
                              Ajouter un audio
                            </button>
                          )}
                        </div>

                        {audios.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-7 text-center">
                            <Headphones className="mx-auto h-8 w-8 text-slate-300" />
                            <p className="mt-2 text-sm text-slate-500">
                              Aucun audio pour cette Khassida.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {audios.map((audio, index) => (
                              <div
                                key={audio.id}
                                className="rounded-xl border border-slate-200 bg-white p-4"
                              >
                                <div className="mb-3 flex items-start gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                    <Headphones className="h-4 w-4" />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h4 className="font-semibold text-slate-900">
                                        {audio.titre || `Audio ${index + 1}`}
                                      </h4>
                                      {audio.ton && (
                                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                                          {audio.ton.nom}
                                        </span>
                                      )}
                                    </div>
                                    {audio.description && (
                                      <p className="mt-1 text-xs text-slate-500">
                                        {audio.description}
                                      </p>
                                    )}
                                  </div>

                                  {peutGererProgramme && (
                                    <div className="flex shrink-0 gap-1">
                                      <button
                                        type="button"
                                        title="Modifier l'audio"
                                        onClick={() =>
                                          ouvrirModificationAudio(khassida, audio)
                                        }
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-emerald-700"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </button>
                                      <button
                                        type="button"
                                        title="Supprimer l'audio"
                                        onClick={() => supprimerAudio(audio)}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <div className="rounded-lg bg-slate-50 p-3">
                                  <audio
                                    controls
                                    preload="metadata"
                                    className="w-full"
                                    src={getAudioUrl(audio.fichier)}
                                  >
                                    Votre navigateur ne supporte pas la lecture audio.
                                  </audio>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL KHASSIDA
      ======================================================== */}
      {modalKhassida && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {modeKhassida === "creation"
                    ? "Nouvelle Khassida"
                    : "Modifier la Khassida"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Remplissez uniquement les informations utiles.
                </p>
              </div>
              <button
                type="button"
                onClick={fermerModalKhassida}
                disabled={chargementKhassida}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={enregistrerKhassida} className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Titre *
                </label>
                <input
                  type="text"
                  name="titre"
                  value={formKhassida.titre}
                  onChange={(e) =>
                    setFormKhassida((ancien) => ({
                      ...ancien,
                      titre: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Auteur
                </label>
                <input
                  type="text"
                  name="auteur"
                  value={formKhassida.auteur}
                  onChange={(e) =>
                    setFormKhassida((ancien) => ({
                      ...ancien,
                      auteur: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formKhassida.description}
                  onChange={(e) =>
                    setFormKhassida((ancien) => ({
                      ...ancien,
                      description: e.target.value,
                    }))
                  }
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={fermerModalKhassida}
                  disabled={chargementKhassida}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={chargementKhassida}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  {chargementKhassida ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {modeKhassida === "creation" ? "Ajouter" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL PDF
      ======================================================== */}
      {modalPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-700" />
                  <h2 className="text-lg font-bold text-slate-900">
                    {khassidaPdf?.pdf_url ? "Remplacer le PDF" : "Ajouter le PDF"}
                  </h2>
                </div>
                <p className="mt-1 text-sm text-slate-500">{khassidaPdf?.titre}</p>
              </div>
              <button
                type="button"
                onClick={fermerModalPdf}
                disabled={chargementPdf}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={enregistrerPdf} className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Fichier PDF *
                </label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={selectionnerPdf}
                  className="block w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
                  required
                />
                <p className="mt-2 text-xs text-slate-500">
                  PDF uniquement · 100 MB maximum.
                </p>
              </div>

              {fichierPdf && (
                <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3">
                  <FileText className="h-5 w-5 text-emerald-700" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-emerald-800">
                      {fichierPdf.name}
                    </p>
                    <p className="text-xs text-emerald-700">
                      {(fichierPdf.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={fermerModalPdf}
                  disabled={chargementPdf}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={chargementPdf || !fichierPdf}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  {chargementPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {khassidaPdf?.pdf_url ? "Remplacer" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          LECTEUR PDF
      ======================================================== */}
      {lecteurPdfOuvert && pdfBlobUrl && (
        <div className="fixed inset-0 z-[60] bg-black/70 p-3 sm:p-5">
          <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-bold text-slate-900">
                    {khassidaPdf?.titre || "Khassida"}
                  </h2>
                  <p className="text-xs text-slate-500">Lecture du PDF</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={ouvrirPdfNouvelOnglet}
                  title="Nouvel onglet"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
                {khassidaPdf && peutConsulter && (
                  <button
                    type="button"
                    onClick={() => telechargerPdf(khassidaPdf)}
                    title="Télécharger"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={fermerLecteurPdf}
                  title="Fermer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 bg-slate-200">
              <iframe
                src={pdfBlobUrl}
                title={khassidaPdf?.titre || "Lecture PDF"}
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL AUDIO
      ======================================================== */}
      {modalAudio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <div className="flex items-center gap-2">
                  <FileAudio className="h-5 w-5 text-emerald-700" />
                  <h2 className="text-lg font-bold text-slate-900">
                    {modeAudio === "creation" ? "Ajouter un audio" : "Modifier l'audio"}
                  </h2>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {khassidaAudio?.titre}
                </p>
              </div>
              <button
                type="button"
                onClick={fermerModalAudio}
                disabled={chargementAudio}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={enregistrerAudio} className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Ton *
                </label>
                {chargementTons ? (
                  <div className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement des tons...
                  </div>
                ) : (
                  <select
                    name="ton_id"
                    value={formAudio.ton_id}
                    onChange={modifierChampAudio}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    required
                  >
                    <option value="">Sélectionner un ton</option>
                    {tons.map((ton) => (
                      <option key={ton.id} value={ton.id}>
                        {ton.nom}
                      </option>
                    ))}
                  </select>
                )}
                {!chargementTons && tons.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600">
                    Aucun ton disponible.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Titre *
                </label>
                <input
                  type="text"
                  name="titre"
                  value={formAudio.titre}
                  onChange={modifierChampAudio}
                  placeholder="Ex : Ton Baye Fall"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={2}
                  value={formAudio.description}
                  onChange={modifierChampAudio}
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  {modeAudio === "creation"
                    ? "Fichier audio *"
                    : "Nouveau fichier audio"}
                </label>
                <input
                  type="file"
                  accept=".mp3,.wav,.m4a,.ogg,audio/mpeg,audio/wav,audio/mp4,audio/ogg"
                  onChange={selectionnerFichier}
                  className="block w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
                  required={modeAudio === "creation"}
                />
                <p className="mt-2 text-xs text-slate-500">
                  MP3, WAV, M4A ou OGG.
                </p>
              </div>

              {modeAudio === "modification" && audioSelectionne?.fichier && (
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="mb-2 text-xs font-medium text-slate-500">
                    Audio actuel
                  </p>
                  <audio
                    controls
                    preload="metadata"
                    className="w-full"
                    src={getAudioUrl(audioSelectionne.fichier)}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={fermerModalAudio}
                  disabled={chargementAudio}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={chargementAudio || chargementTons}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  {chargementAudio ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : modeAudio === "creation" ? (
                    <Upload className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {modeAudio === "creation" ? "Ajouter" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
