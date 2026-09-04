
import { useEffect, useMemo, useState } from "react";
import { Headphones, Play, Pause, Music2, ExternalLink } from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";


function construireUrlAudio(fichier) {
  if (!fichier) {
    return "";
  }

  const valeur = String(fichier).trim();

  if (
    valeur.startsWith("http://") ||
    valeur.startsWith("https://")
  ) {
    return valeur;
  }

  const baseURL =
    api.defaults.baseURL ||
    "http://127.0.0.1:8000";

  /*
   * On évite volontairement les caractères "\" dans le code.
   * Les chemins Windows éventuels sont convertis grâce au
   * code ASCII 92 qui correspond au caractère "\".
   */
  const chemin = valeur
    .split(String.fromCharCode(92))
    .join("/")
    .replace(/^\/+/, "");

  return `${baseURL}/${chemin}`;
}


function choisirAudioDuJour(audios) {
  if (!Array.isArray(audios) || audios.length === 0) {
    return null;
  }

  const audiosValides = audios.filter(
    (audio) => audio && audio.fichier
  );

  if (audiosValides.length === 0) {
    return null;
  }

  /*
   * Sélection déterministe basée sur la date.
   * Ainsi, tous les utilisateurs voient le même audio
   * du jour et l'audio change automatiquement chaque jour.
   */
  const aujourdHui = new Date();

  const cleDate =
    aujourdHui.getFullYear() * 10000 +
    (aujourdHui.getMonth() + 1) * 100 +
    aujourdHui.getDate();

  const index =
    cleDate % audiosValides.length;

  return audiosValides[index];
}


export default function AudioDuJour() {
  const { utilisateur, aPermission } = useAuth();

  const [audios, setAudios] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [lecture, setLecture] = useState(false);

  const peutConsulter =
    typeof aPermission === "function"
      ? aPermission("KOUREL_CONSULTER")
      : true;

  useEffect(() => {
    if (!peutConsulter) {
      setChargement(false);
      return;
    }

    let actif = true;

    async function chargerAudios() {
      try {
        setChargement(true);
        setErreur("");

        const response = await api.get("/audios");

        if (!actif) {
          return;
        }

        const donnees = Array.isArray(response.data)
          ? response.data
          : [];

        setAudios(donnees);
      } catch (error) {
        console.error(
          "Erreur lors du chargement des audios :",
          error
        );

        if (!actif) {
          return;
        }

        setErreur(
          "Impossible de charger l'audio du jour."
        );
      } finally {
        if (actif) {
          setChargement(false);
        }
      }
    }

    chargerAudios();

    return () => {
      actif = false;
    };
  }, [peutConsulter]);


  const audioDuJour = useMemo(
    () => choisirAudioDuJour(audios),
    [audios]
  );


  const urlAudio = useMemo(
    () =>
      audioDuJour
        ? construireUrlAudio(audioDuJour.fichier)
        : "",
    [audioDuJour]
  );


  if (!peutConsulter) {
    return null;
  }


  function ouvrirToutesLesKhassidas() {
    window.location.href = "/khassidas";
  }


  function gererLecture() {
    const element = document.getElementById(
      "audio-du-jour-player"
    );

    if (!element) {
      return;
    }

    if (element.paused) {
      element.play().catch((error) => {
        console.error(
          "Impossible de lancer la lecture :",
          error
        );
      });
    } else {
      element.pause();
    }
  }


  function gererLectureDemarree() {
    setLecture(true);
  }


  function gererLectureArretee() {
    setLecture(false);
  }


  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
              <Headphones
                size={23}
                className="text-white"
              />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">
                Audio du jour
              </h2>

              <p className="text-sm text-emerald-50">
                Votre Khassida à écouter aujourd'hui
              </p>
            </div>
          </div>

          <Music2
            size={28}
            className="text-white/70"
          />
        </div>
      </div>


      <div className="p-5">
        {chargement && (
          <div className="flex items-center gap-3 py-6">
            <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />

            <p className="text-sm text-gray-500">
              Chargement de l'audio...
            </p>
          </div>
        )}


        {!chargement && erreur && (
          <div className="rounded-xl bg-red-50 border border-red-100 p-4">
            <p className="text-sm text-red-600">
              {erreur}
            </p>
          </div>
        )}


        {!chargement &&
          !erreur &&
          !audioDuJour && (
            <div className="text-center py-7">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                <Music2
                  size={25}
                  className="text-gray-400"
                />
              </div>

              <h3 className="font-semibold text-gray-700">
                Aucun audio disponible
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Aucun audio de Khassida n'est actuellement
                disponible.
              </p>
            </div>
          )}


        {!chargement &&
          !erreur &&
          audioDuJour && (
            <div>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 shrink-0 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Music2
                    size={28}
                    className="text-emerald-600"
                  />
                </div>


                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 mb-1">
                    Khassida du jour
                  </p>

                  <h3 className="font-bold text-gray-900 text-lg leading-tight">
                    {audioDuJour.titre ||
                      audioDuJour.khassida?.titre ||
                      "Khassida"}
                  </h3>

                  {audioDuJour.khassida?.titre &&
                    audioDuJour.titre !==
                      audioDuJour.khassida.titre && (
                      <p className="text-sm text-gray-500 mt-1">
                        {audioDuJour.khassida.titre}
                      </p>
                    )}

                  {audioDuJour.ton?.nom && (
                    <div className="inline-flex items-center mt-2 px-2.5 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                      Ton : {audioDuJour.ton.nom}
                    </div>
                  )}
                </div>
              </div>


              {audioDuJour.description && (
                <p className="text-sm text-gray-600 mt-4 leading-relaxed">
                  {audioDuJour.description}
                </p>
              )}


              <div className="mt-5">
                <audio
                  id="audio-du-jour-player"
                  src={urlAudio}
                  controls
                  preload="metadata"
                  className="w-full"
                  onPlay={gererLectureDemarree}
                  onPause={gererLectureArretee}
                  onEnded={gererLectureArretee}
                />
              </div>


              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={gererLecture}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition"
                >
                  {lecture ? (
                    <>
                      <Pause size={18} />
                      Mettre en pause
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      Écouter l'audio
                    </>
                  )}
                </button>


                <button
                  type="button"
                  onClick={ouvrirToutesLesKhassidas}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium transition"
                >
                  <ExternalLink size={17} />
                  Toutes les Khassidas
                </button>
              </div>
            </div>
          )}
      </div>
    </section>
  );
}
