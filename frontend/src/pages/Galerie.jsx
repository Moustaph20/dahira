import {
  Check,
  Edit3,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Plus,
  Save,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import api from "../api/client";
import { useAuth } from "../context/AuthContext";


const GALERIE_ENDPOINT = "/galerie";


function construireUrl(url) {
  if (!url) return "";

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  const baseURL = (
    api.defaults.baseURL || ""
  ).replace(/\/$/, "");

  return `${baseURL}${url}`;
}


export default function Galerie() {

  const {
    aPermission,
  } = useAuth();

  const inputFichierRef = useRef(null);

  const [medias, setMedias] = useState([]);

  const [chargement, setChargement] = useState(true);

  const [erreur, setErreur] = useState("");

  const [message, setMessage] = useState("");

  const [modalOuverte, setModalOuverte] = useState(false);

  const [mediaModifie, setMediaModifie] = useState(null);

  const [titre, setTitre] = useState("");

  const [description, setDescription] = useState("");

  const [ordre, setOrdre] = useState(0);

  const [actif, setActif] = useState(true);

  const [fichier, setFichier] = useState(null);

  const [apercu, setApercu] = useState("");

  const [enregistrement, setEnregistrement] =
    useState(false);


  const peutConsulter =
    aPermission("GALERIE_CONSULTER");

  const peutCreer =
    aPermission("GALERIE_CREER");

  const peutModifier =
    aPermission("GALERIE_MODIFIER");

  const peutSupprimer =
    aPermission("GALERIE_SUPPRIMER");


  // ========================================================
  // CHARGER LA GALERIE
  // ========================================================

  async function chargerGalerie() {

    try {

      setChargement(true);
      setErreur("");

      const response = await api.get(
        GALERIE_ENDPOINT
      );

      setMedias(
        Array.isArray(response.data)
          ? response.data
          : []
      );

    } catch (error) {

      console.error(
        "Erreur chargement galerie :",
        error
      );

      setErreur(
        error?.response?.data?.detail ||
        "Impossible de charger la galerie."
      );

    } finally {

      setChargement(false);
    }
  }


  useEffect(() => {

    if (peutConsulter) {
      chargerGalerie();
    } else {
      setChargement(false);
    }

  }, [peutConsulter]);


  // ========================================================
  // RESET FORMULAIRE
  // ========================================================

  function reinitialiserFormulaire() {

    setTitre("");
    setDescription("");
    setOrdre(medias.length);
    setActif(true);
    setFichier(null);
    setApercu("");
    setMediaModifie(null);

    if (inputFichierRef.current) {
      inputFichierRef.current.value = "";
    }
  }


  // ========================================================
  // OUVRIR AJOUT
  // ========================================================

  function ouvrirAjout() {

    reinitialiserFormulaire();

    setModalOuverte(true);
  }


  // ========================================================
  // OUVRIR MODIFICATION
  // ========================================================

  function ouvrirModification(media) {

    setMediaModifie(media);

    setTitre(media.titre || "");

    setDescription(
      media.description || ""
    );

    setOrdre(
      media.ordre ?? 0
    );

    setActif(
      media.actif
    );

    setFichier(null);

    setApercu(
      construireUrl(media.url)
    );

    setModalOuverte(true);
  }


  // ========================================================
  // SELECTION FICHIER
  // ========================================================

  function gererSelectionFichier(event) {

    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    const estImage =
      selectedFile.type.startsWith(
        "image/"
      );

    const estVideo =
      selectedFile.type.startsWith(
        "video/"
      );

    if (!estImage && !estVideo) {

      setErreur(
        "Veuillez sélectionner une image ou une vidéo."
      );

      event.target.value = "";

      return;
    }

    const tailleMax =
      100 * 1024 * 1024;

    if (selectedFile.size > tailleMax) {

      setErreur(
        "Le fichier ne doit pas dépasser 100 MB."
      );

      event.target.value = "";

      return;
    }

    setErreur("");

    setFichier(selectedFile);

    setApercu(
      URL.createObjectURL(
        selectedFile
      )
    );
  }


  // ========================================================
  // ENREGISTRER
  // ========================================================

  async function enregistrerMedia(event) {

    event.preventDefault();

    if (!titre.trim()) {

      setErreur(
        "Le titre est obligatoire."
      );

      return;
    }

    if (
      titre.trim().length < 2
    ) {

      setErreur(
        "Le titre doit contenir au moins 2 caractères."
      );

      return;
    }

    if (
      !mediaModifie &&
      !fichier
    ) {

      setErreur(
        "Veuillez sélectionner une image ou une vidéo."
      );

      return;
    }

    try {

      setEnregistrement(true);
      setErreur("");
      setMessage("");

      const formData =
        new FormData();

      formData.append(
        "titre",
        titre.trim()
      );

      formData.append(
        "description",
        description.trim()
      );

      formData.append(
        "ordre",
        String(ordre)
      );

      formData.append(
        "actif",
        String(actif)
      );

      if (fichier) {

        formData.append(
          "fichier",
          fichier
        );
      }


      if (mediaModifie) {

        await api.put(
          `${GALERIE_ENDPOINT}/${mediaModifie.id}`,
          formData
        );

        setMessage(
          "Média modifié avec succès."
        );

      } else {

        await api.post(
          GALERIE_ENDPOINT,
          formData
        );

        setMessage(
          "Média ajouté avec succès."
        );
      }

      setModalOuverte(false);

      reinitialiserFormulaire();

      await chargerGalerie();

    } catch (error) {

      console.error(
        "Erreur enregistrement média :",
        error
      );

      setErreur(
        error?.response?.data?.detail ||
        "Impossible d'enregistrer le média."
      );

    } finally {

      setEnregistrement(false);
    }
  }


  // ========================================================
  // ACTIVATION / DESACTIVATION
  // ========================================================

  async function changerStatut(media) {

    if (!peutModifier) {
      return;
    }

    try {

      setErreur("");
      setMessage("");

      const formData =
        new FormData();

      formData.append(
        "actif",
        String(!media.actif)
      );

      await api.patch(
        `${GALERIE_ENDPOINT}/${media.id}/statut`,
        formData
      );

      setMessage(
        media.actif
          ? "Média masqué de la galerie publique."
          : "Média publié dans la galerie."
      );

      await chargerGalerie();

    } catch (error) {

      console.error(
        "Erreur changement statut :",
        error
      );

      setErreur(
        error?.response?.data?.detail ||
        "Impossible de modifier le statut."
      );
    }
  }


  // ========================================================
  // SUPPRESSION
  // ========================================================

  async function supprimerMedia(media) {

    if (!peutSupprimer) {
      return;
    }

    const confirmation =
      window.confirm(
        `Voulez-vous vraiment supprimer "${media.titre}" ?`
      );

    if (!confirmation) {
      return;
    }

    try {

      setErreur("");
      setMessage("");

      await api.delete(
        `${GALERIE_ENDPOINT}/${media.id}`
      );

      setMessage(
        "Média supprimé avec succès."
      );

      await chargerGalerie();

    } catch (error) {

      console.error(
        "Erreur suppression média :",
        error
      );

      setErreur(
        error?.response?.data?.detail ||
        "Impossible de supprimer le média."
      );
    }
  }


  // ========================================================
  // DEPLACER VERS LE HAUT
  // ========================================================

  async function monter(media) {

    if (!peutModifier) {
      return;
    }

    const index =
      medias.findIndex(
        (item) => item.id === media.id
      );

    if (index <= 0) {
      return;
    }

    const precedent =
      medias[index - 1];

    try {

      await Promise.all([

        api.patch(
          `${GALERIE_ENDPOINT}/${media.id}/ordre`,
          {
            ordre: precedent.ordre,
          }
        ),

        api.patch(
          `${GALERIE_ENDPOINT}/${precedent.id}/ordre`,
          {
            ordre: media.ordre,
          }
        ),

      ]);

      await chargerGalerie();

    } catch (error) {

      console.error(
        "Erreur réorganisation :",
        error
      );

      setErreur(
        "Impossible de réorganiser la galerie."
      );
    }
  }


  // ========================================================
  // DEPLACER VERS LE BAS
  // ========================================================

  async function descendre(media) {

    if (!peutModifier) {
      return;
    }

    const index =
      medias.findIndex(
        (item) => item.id === media.id
      );

    if (
      index === -1 ||
      index >= medias.length - 1
    ) {
      return;
    }

    const suivant =
      medias[index + 1];

    try {

      await Promise.all([

        api.patch(
          `${GALERIE_ENDPOINT}/${media.id}/ordre`,
          {
            ordre: suivant.ordre,
          }
        ),

        api.patch(
          `${GALERIE_ENDPOINT}/${suivant.id}/ordre`,
          {
            ordre: media.ordre,
          }
        ),

      ]);

      await chargerGalerie();

    } catch (error) {

      console.error(
        "Erreur réorganisation :",
        error
      );

      setErreur(
        "Impossible de réorganiser la galerie."
      );
    }
  }


  if (!peutConsulter) {

    return (
      <div className="p-6">

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">

          Vous n'avez pas la permission
          d'accéder à la gestion de la galerie.

        </div>

      </div>
    );
  }


  return (

    <div className="min-h-screen bg-slate-50 p-4 md:p-6">

      <div className="mx-auto max-w-7xl">

        {/* ================================================= */}
        {/* EN-TÊTE */}
        {/* ================================================= */}

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>

            <h1 className="text-2xl font-bold text-slate-900">
              Galerie
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Gérez les photos et vidéos
              affichées sur le site public.
            </p>

          </div>


          {peutCreer && (

            <button
              type="button"
              onClick={ouvrirAjout}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >

              <Plus size={18} />

              Ajouter un média

            </button>
          )}

        </div>


        {/* ================================================= */}
        {/* MESSAGES */}
        {/* ================================================= */}

        {erreur && (

          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

            {erreur}

          </div>
        )}


        {message && (

          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">

            {message}

          </div>
        )}


        {/* ================================================= */}
        {/* CHARGEMENT */}
        {/* ================================================= */}

        {chargement ? (

          <div className="flex min-h-[300px] items-center justify-center">

            <Loader2
              className="animate-spin text-slate-500"
              size={32}
            />

          </div>

        ) : medias.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">

            <ImageIcon
              size={45}
              className="mx-auto mb-4 text-slate-400"
            />

            <h2 className="font-semibold text-slate-800">
              Aucun média
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Commencez par ajouter une photo
              ou une vidéo.
            </p>

          </div>

        ) : (

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {medias.map((media, index) => (

              <div
                key={media.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >

                {/* APERCU */}

                <div className="relative aspect-video bg-slate-100">

                  {media.type_media === "image" ? (

                    <img
                      src={construireUrl(media.url)}
                      alt={media.titre}
                      className="h-full w-full object-cover"
                    />

                  ) : (

                    <video
                      src={construireUrl(media.url)}
                      className="h-full w-full object-cover"
                      controls
                      preload="metadata"
                    />

                  )}


                  <div className="absolute left-3 top-3">

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                        media.actif
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-700 text-white"
                      }`}
                    >

                      {media.actif ? (
                        <>
                          <Eye size={13} />
                          Publié
                        </>
                      ) : (
                        <>
                          <EyeOff size={13} />
                          Masqué
                        </>
                      )}

                    </span>

                  </div>

                </div>


                {/* INFORMATIONS */}

                <div className="p-4">

                  <div className="flex items-start justify-between gap-3">

                    <div className="min-w-0">

                      <h3 className="truncate font-semibold text-slate-900">
                        {media.titre}
                      </h3>

                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">

                        {media.type_media === "image" ? (
                          <ImageIcon size={14} />
                        ) : (
                          <Video size={14} />
                        )}

                        {media.type_media === "image"
                          ? "Photo"
                          : "Vidéo"}

                        <span>
                          •
                        </span>

                        Ordre {media.ordre}

                      </div>

                    </div>

                  </div>


                  {media.description && (

                    <p className="mt-3 line-clamp-2 text-sm text-slate-500">
                      {media.description}
                    </p>

                  )}


                  {/* ACTIONS */}

                  <div className="mt-4 flex flex-wrap items-center gap-2">

                    {peutModifier && (

                      <>

                        <button
                          type="button"
                          onClick={() =>
                            monter(media)
                          }
                          disabled={index === 0}
                          className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                          title="Monter"
                        >
                          ↑
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            descendre(media)
                          }
                          disabled={
                            index ===
                            medias.length - 1
                          }
                          className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                          title="Descendre"
                        >
                          ↓
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            ouvrirModification(media)
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >

                          <Edit3 size={14} />

                          Modifier

                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            changerStatut(media)
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >

                          {media.actif ? (
                            <>
                              <EyeOff size={14} />
                              Masquer
                            </>
                          ) : (
                            <>
                              <Eye size={14} />
                              Publier
                            </>
                          )}

                        </button>

                      </>
                    )}


                    {peutSupprimer && (

                      <button
                        type="button"
                        onClick={() =>
                          supprimerMedia(media)
                        }
                        className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                      >

                        <Trash2 size={14} />

                        Supprimer

                      </button>

                    )}

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>


      {/* =================================================== */}
      {/* MODAL */}
      {/* =================================================== */}

      {modalOuverte && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">

          <div className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div>

                <h2 className="text-lg font-bold text-slate-900">

                  {mediaModifie
                    ? "Modifier le média"
                    : "Ajouter un média"}

                </h2>

                <p className="text-xs text-slate-500">
                  Photo ou vidéo
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setModalOuverte(false)
                }
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >

                <X size={20} />

              </button>

            </div>


            {/* FORMULAIRE */}

            <form
              onSubmit={enregistrerMedia}
              className="space-y-5 p-5"
            >

              {/* TITRE */}

              <div>

                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Titre *
                </label>

                <input
                  type="text"
                  value={titre}
                  onChange={(e) =>
                    setTitre(e.target.value)
                  }
                  placeholder="Ex : Déclamation de Khassida"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                  required
                />

              </div>


              {/* DESCRIPTION */}

              <div>

                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  rows={3}
                  placeholder="Description du média..."
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                />

              </div>


              {/* FICHIER */}

              <div>

                <label className="mb-1.5 block text-sm font-medium text-slate-700">

                  {mediaModifie
                    ? "Remplacer le fichier"
                    : "Fichier *"}

                </label>

                <input
                  ref={inputFichierRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={
                    gererSelectionFichier
                  }
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() =>
                    inputFichierRef.current?.click()
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-6 text-sm font-medium text-slate-600 hover:border-slate-500 hover:bg-slate-50"
                >

                  <Upload size={20} />

                  {fichier
                    ? fichier.name
                    : "Choisir une photo ou une vidéo"}

                </button>

                <p className="mt-1.5 text-xs text-slate-400">
                  Images : JPG, JPEG, PNG, WEBP, GIF.
                  Vidéos : MP4, WEBM, MOV, M4V.
                  Maximum 100 MB.
                </p>

              </div>


              {/* APERCU */}

              {apercu && (

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Aperçu
                  </label>

                  <div className="overflow-hidden rounded-xl bg-slate-100">

                    {(
                      fichier?.type?.startsWith(
                        "video/"
                      ) ||
                      (
                        !fichier &&
                        mediaModifie?.type_media ===
                          "video"
                      )
                    ) ? (

                      <video
                        src={apercu}
                        controls
                        className="max-h-80 w-full object-contain"
                      />

                    ) : (

                      <img
                        src={apercu}
                        alt="Aperçu"
                        className="max-h-80 w-full object-contain"
                      />

                    )}

                  </div>

                </div>

              )}


              {/* ORDRE */}

              <div className="grid gap-4 sm:grid-cols-2">

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Ordre d'affichage
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={ordre}
                    onChange={(e) =>
                      setOrdre(
                        Number(e.target.value)
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                  />

                </div>


                <div>

                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Visibilité
                  </label>

                  <label className="flex h-[46px] cursor-pointer items-center gap-3 rounded-xl border border-slate-300 px-4">

                    <input
                      type="checkbox"
                      checked={actif}
                      onChange={(e) =>
                        setActif(
                          e.target.checked
                        )
                      }
                      className="h-4 w-4"
                    />

                    <span className="text-sm text-slate-700">

                      {actif
                        ? "Publié sur le site"
                        : "Masqué du site"}

                    </span>

                  </label>

                </div>

              </div>


              {/* ERREUR */}

              {erreur && (

                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {erreur}
                </div>

              )}


              {/* FOOTER */}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">

                <button
                  type="button"
                  onClick={() =>
                    setModalOuverte(false)
                  }
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >

                  Annuler

                </button>


                <button
                  type="submit"
                  disabled={enregistrement}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {enregistrement ? (

                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                      Enregistrement...

                    </>

                  ) : (

                    <>
                      {mediaModifie ? (
                        <Save size={17} />
                      ) : (
                        <Check size={17} />
                      )}

                      {mediaModifie
                        ? "Enregistrer"
                        : "Ajouter"}

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