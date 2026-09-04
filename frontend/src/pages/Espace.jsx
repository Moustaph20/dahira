
import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import {
  AlertCircle,
  ArrowRight,
  Bell,
  BookOpen,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Compass,
  Headphones,
  Heart,
  Info,
  MapPin,
  Megaphone,
  Moon,
  Play,
  RefreshCw,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Volume2,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import {
  getCommunications,
} from "../services/communications";


// ============================================================
// CONFIGURATION
// ============================================================

const VILLE = "Dakar";
const PAYS = "Sénégal";


// ============================================================
// DUAS DE LA SEMAINE
// ============================================================

const DUAS = [
  {
    arabe:
      "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ",

    transliteration:
      "Allahumma a'inni 'ala dhikrika wa shukrika wa husni 'ibadatik.",

    traduction:
      "Ô Allah, aide-moi à T'évoquer, à Te remercier et à T'adorer de la meilleure manière.",
  },

  {
    arabe:
      "رَبِّ زِدْنِي عِلْمًا",

    transliteration:
      "Rabbi zidni 'ilma.",

    traduction:
      "Seigneur, augmente-moi en connaissance.",
  },

  {
    arabe:
      "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",

    transliteration:
      "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar.",

    traduction:
      "Seigneur, accorde-nous une belle part ici-bas et une belle part dans l'au-delà, et protège-nous du châtiment du Feu.",
  },

  {
    arabe:
      "اللَّهُمَّ اغْفِرْ لِي وَارْحَمْنِي وَاهْدِنِي وَعَافِنِي وَارْزُقْنِي",

    transliteration:
      "Allahummaghfir li warhamni wahdini wa 'afini warzuqni.",

    traduction:
      "Ô Allah, pardonne-moi, fais-moi miséricorde, guide-moi, accorde-moi la santé et pourvois à mes besoins.",
  },

  {
    arabe:
      "حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ ۖ عَلَيْهِ تَوَكَّلْتُ",

    transliteration:
      "Hasbiyallahu la ilaha illa Huwa, 'alayhi tawakkaltu.",

    traduction:
      "Allah me suffit. Il n'y a de divinité que Lui. En Lui je place ma confiance.",
  },

  {
    arabe:
      "اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى سَيِّدِنَا مُحَمَّدٍ",

    transliteration:
      "Allahumma salli wa sallim wa barik 'ala Sayyidina Muhammad.",

    traduction:
      "Ô Allah, prie sur notre maître Muhammad, accorde-lui le salut et bénis-le.",
  },

  {
    arabe:
      "يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ",

    transliteration:
      "Ya muqallibal-qulub, thabbit qalbi 'ala dinik.",

    traduction:
      "Ô Toi qui retournes les cœurs, affermis mon cœur sur Ta religion.",
  },
];


// ============================================================
// RAPPELS
// ============================================================

const RAPPELS = [
  {
    titre: "Le rappel apaise le cœur",
    texte:
      "Multiplions le dhikr et les prières sur le Prophète ﷺ tout au long de la journée.",
  },

  {
    titre: "Une journée bien commencée",
    texte:
      "Commencer sa journée par la prière, le rappel et une bonne intention donne un sens nouveau à chaque action.",
  },

  {
    titre: "La constance",
    texte:
      "Les petites œuvres accomplies avec constance sont précieuses. Avançons chaque jour avec sincérité.",
  },

  {
    titre: "La gratitude",
    texte:
      "Prenons quelques instants pour remercier Allah pour les bienfaits visibles et ceux que nous ne remarquons pas.",
  },

  {
    titre: "La fraternité",
    texte:
      "Un bon comportement, une parole douce et un geste de solidarité peuvent illuminer la journée d'un frère.",
  },

  {
    titre: "Le temps",
    texte:
      "Chaque journée est une nouvelle occasion de faire le bien. Utilisons notre temps avant qu'il ne passe.",
  },
];


// ============================================================
// KHASSIDA DU JOUR
// ============================================================

const KHASSIDAS_DU_JOUR = [
  {
    titre: "Khassida du jour",
    description:
      "Consacrez quelques instants à la lecture ou à l'écoute d'une Khassida.",
  },

  {
    titre: "Lecture spirituelle",
    description:
      "Prenez un moment de calme pour méditer et approfondir votre lecture.",
  },

  {
    titre: "Salatoul Fatihi",
    description:
      "Un moment privilégié pour multiplier les prières sur le Prophète ﷺ.",
  },

  {
    titre: "Dhikr et méditation",
    description:
      "Quelques minutes de rappel peuvent transformer l'ambiance de toute une journée.",
  },
];


// ============================================================
// OUTILS
// ============================================================

const obtenirCleJour = () => {
  const maintenant = new Date();

  return (
    maintenant.getFullYear() * 10000 +
    (maintenant.getMonth() + 1) * 100 +
    maintenant.getDate()
  );
};


const obtenirIndexDuJour = (longueur) => {
  if (!longueur) {
    return 0;
  }

  return obtenirCleJour() % longueur;
};


const formaterHeure = (heure) => {
  if (!heure) {
    return "--:--";
  }

  return heure.substring(0, 5);
};


const convertirHeureEnDate = (
  heure,
  date = new Date()
) => {
  if (!heure) {
    return null;
  }

  const [h, m] = heure
    .substring(0, 5)
    .split(":")
    .map(Number);

  if (
    Number.isNaN(h) ||
    Number.isNaN(m)
  ) {
    return null;
  }

  const resultat = new Date(date);

  resultat.setHours(h, m, 0, 0);

  return resultat;
};


const formaterDateComplete = (date) => {
  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ).format(date);
};


const formaterDateCourte = (date) => {
  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ).format(date);
};


const obtenirSalutation = () => {
  const heure = new Date().getHours();

  if (heure < 12) {
    return "Bonjour";
  }

  if (heure < 18) {
    return "Bon après-midi";
  }

  return "Bonsoir";
};


const obtenirPrenom = (utilisateur) => {
  return (
    utilisateur?.membre?.prenom ||
    utilisateur?.prenom ||
    utilisateur?.nom_complet?.split(" ")[0] ||
    utilisateur?.identifiant ||
    "Membre"
  );
};


const obtenirMessageErreur = (erreur) => {
  const detail =
    erreur?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map(
        (item) =>
          item?.msg ||
          "Erreur de validation."
      )
      .join(" ");
  }

  return (
    erreur?.message ||
    "Une erreur est survenue."
  );
};


// ============================================================
// COMPOSANT
// ============================================================

function Espace() {
  const navigate = useNavigate();

  const {
    utilisateur,
    chargement,
    aPermission,
  } = useAuth();


  // ==========================================================
  // REDIRECTION ADMINISTRATIVE
  // ==========================================================

  if (chargement) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw
            size={32}
            className="mx-auto text-blue-600 animate-spin"
          />

          <p className="mt-3 text-gray-500">
            Chargement...
          </p>
        </div>
      </div>
    );
  }


  if (!utilisateur) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  if (
    aPermission(
      "DASHBOARD_CONSULTER"
    )
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }


  // ==========================================================
  // ETATS
  // ==========================================================

  const [maintenant, setMaintenant] =
    useState(new Date());

  const [
    horaires,
    setHoraires,
  ] = useState(null);

  const [
    chargementHoraires,
    setChargementHoraires,
  ] = useState(true);

  const [
    erreurHoraires,
    setErreurHoraires,
  ] = useState("");

  const [
    communications,
    setCommunications,
  ] = useState([]);

  const [
    chargementCommunications,
    setChargementCommunications,
  ] = useState(false);

  const [
    erreurCommunications,
    setErreurCommunications,
  ] = useState("");

  const [
    duaIndex,
    setDuaIndex,
  ] = useState(
    obtenirIndexDuJour(
      DUAS.length
    )
  );


  // ==========================================================
  // HORLOGE
  // ==========================================================

  useEffect(() => {
    const interval = setInterval(() => {
      setMaintenant(
        new Date()
      );
    }, 1000);

    return () =>
      clearInterval(interval);
  }, []);


  // ==========================================================
  // DU'A DE LA SEMAINE
  // ==========================================================

  useEffect(() => {
    const index =
      Math.floor(
        obtenirCleJour() / 7
      ) % DUAS.length;

    setDuaIndex(index);
  }, []);


  // ==========================================================
  // CHARGER HORAIRES DE PRIERE
  // ==========================================================

  const chargerHoraires = async () => {
    setChargementHoraires(true);
    setErreurHoraires("");

    try {
      const date = new Date();

      const jour = String(
        date.getDate()
      ).padStart(2, "0");

      const mois = String(
        date.getMonth() + 1
      ).padStart(2, "0");

      const annee =
        date.getFullYear();

      const url =
        `https://api.aladhan.com/v1/timingsByCity/${jour}-${mois}-${annee}?city=${encodeURIComponent(
          VILLE
        )}&country=${encodeURIComponent(
          PAYS
        )}&method=3`;

      const response =
        await fetch(url);

      if (!response.ok) {
        throw new Error(
          "Impossible de récupérer les horaires de prière."
        );
      }

      const donnees =
        await response.json();

      if (
        donnees?.code !== 200 ||
        !donnees?.data?.timings
      ) {
        throw new Error(
          "Les horaires de prière sont indisponibles."
        );
      }

      setHoraires(
        donnees.data
      );
    } catch (err) {
      console.error(
        "Erreur horaires de prière :",
        err
      );

      setErreurHoraires(
        err?.message ||
          "Impossible de charger les horaires."
      );
    } finally {
      setChargementHoraires(
        false
      );
    }
  };


  useEffect(() => {
    chargerHoraires();
  }, []);


  // ==========================================================
  // CHARGER COMMUNICATIONS
  // ==========================================================

  const chargerCommunications =
    async () => {
      if (
        !aPermission(
          "COMMUNICATION_CONSULTER"
        )
      ) {
        return;
      }

      setChargementCommunications(
        true
      );

      setErreurCommunications(
        ""
      );

      try {
        const donnees =
          await getCommunications({
            actif: true,
          });

        setCommunications(
          Array.isArray(donnees)
            ? donnees.slice(0, 3)
            : []
        );
      } catch (err) {
        console.error(
          "Erreur communications :",
          err
        );

        setErreurCommunications(
          obtenirMessageErreur(err)
        );
      } finally {
        setChargementCommunications(
          false
        );
      }
    };


  useEffect(() => {
    chargerCommunications();
  }, []);


  // ==========================================================
  // PRIÈRES
  // ==========================================================

  const prieres = useMemo(() => {
    if (!horaires) {
      return [];
    }

    return [
      {
        nom: "Fajr",
        heure: formaterHeure(
          horaires.Fajr
        ),
        icone: Sunrise,
      },
      {
        nom: "Dhuhr",
        heure: formaterHeure(
          horaires.Dhuhr
        ),
        icone: Sun,
      },
      {
        nom: "Asr",
        heure: formaterHeure(
          horaires.Asr
        ),
        icone: Sun,
      },
      {
        nom: "Maghrib",
        heure: formaterHeure(
          horaires.Maghrib
        ),
        icone: Sunset,
      },
      {
        nom: "Isha",
        heure: formaterHeure(
          horaires.Isha
        ),
        icone: Moon,
      },
    ];
  }, [horaires]);


  // ==========================================================
  // PROCHAINE PRIERE
  // ==========================================================

  const prochainePriere = useMemo(() => {
    if (!prieres.length) {
      return null;
    }

    for (const priere of prieres) {
      const datePriere =
        convertirHeureEnDate(
          priere.heure,
          maintenant
        );

      if (
        datePriere &&
        datePriere > maintenant
      ) {
        return {
          ...priere,
          date: datePriere,
        };
      }
    }

    return null;
  }, [
    prieres,
    maintenant,
  ]);


  // ==========================================================
  // PROCHAINE PRIERE DU LENDEMAIN
  // ==========================================================

  const prochainePriereFinale =
    prochainePriere ||
    (prieres.length
      ? {
          ...prieres[0],
          date:
            (() => {
              const demain =
                new Date(
                  maintenant
                );

              demain.setDate(
                demain.getDate() + 1
              );

              return convertirHeureEnDate(
                prieres[0].heure,
                demain
              );
            })(),
        }
      : null);


  // ==========================================================
  // COMPTE A REBOURS
  // ==========================================================

  const compteARebours =
    useMemo(() => {
      if (
        !prochainePriereFinale?.date
      ) {
        return "--:--:--";
      }

      let difference =
        prochainePriereFinale.date.getTime() -
        maintenant.getTime();

      if (difference < 0) {
        difference = 0;
      }

      const totalSecondes =
        Math.floor(
          difference / 1000
        );

      const heures =
        Math.floor(
          totalSecondes / 3600
        );

      const minutes =
        Math.floor(
          (totalSecondes % 3600) /
            60
        );

      const secondes =
        totalSecondes % 60;

      return [
        String(heures).padStart(
          2,
          "0"
        ),
        String(minutes).padStart(
          2,
          "0"
        ),
        String(secondes).padStart(
          2,
          "0"
        ),
      ].join(":");
    }, [
      prochainePriereFinale,
      maintenant,
    ]);


  // ==========================================================
  // INDEX DU JOUR
  // ==========================================================

  const khassidaDuJour =
    KHASSIDAS_DU_JOUR[
      obtenirIndexDuJour(
        KHASSIDAS_DU_JOUR.length
      )
    ];

  const rappelDuJour =
    RAPPELS[
      obtenirIndexDuJour(
        RAPPELS.length
      )
    ];

  const dua =
    DUAS[duaIndex];


  // ==========================================================
  // HORAIRE SUIVANT
  // ==========================================================

  const indexProchainePriere =
    prieres.findIndex(
      (priere) =>
        prochainePriereFinale?.nom ===
        priere.nom
    );

  // ==========================================================
  // PRENOM
  // ==========================================================

  const prenom =
    obtenirPrenom(
      utilisateur
    );


  // ==========================================================
  // RENDU
  // ==========================================================

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ======================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white">

        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full border border-white/40" />
          <div className="absolute top-20 right-20 w-96 h-96 rounded-full border border-white/20" />
          <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full border border-white/20" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

            <div className="max-w-2xl">

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-sm text-blue-100 mb-5">
                <Sparkles
                  size={15}
                />

                Espace spirituel
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                {obtenirSalutation()},
                {" "}
                {prenom} 👋
              </h1>

              <p className="mt-4 text-blue-100 text-base md:text-lg leading-relaxed">
                Bienvenue dans votre espace.
                Retrouvez ici les informations
                essentielles de votre journée,
                les prières, les rappels et les
                communications du Dahira.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-blue-100">

                <span className="inline-flex items-center gap-2">
                  <CalendarDays
                    size={16}
                  />

                  {formaterDateComplete(
                    maintenant
                  )}
                </span>

                <span className="hidden sm:block text-white/30">
                  •
                </span>

                <span className="inline-flex items-center gap-2">
                  <MapPin
                    size={16}
                  />

                  {VILLE}
                </span>

              </div>

            </div>


            {/* HORLOGE */}

            <div className="lg:min-w-[280px]">

              <div className="rounded-3xl bg-white/10 backdrop-blur border border-white/10 p-6">

                <div className="flex items-center gap-2 text-blue-200 text-sm">
                  <Clock3 size={17} />

                  Heure locale
                </div>

                <div className="mt-2 text-4xl md:text-5xl font-bold tracking-tight">
                  {maintenant.toLocaleTimeString(
                    "fr-FR",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    }
                  )}
                </div>

                <div className="mt-2 text-sm text-blue-200">
                  {formaterDateCourte(
                    maintenant
                  )}
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>


      {/* ======================================================
          CONTENU
      ====================================================== */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


        {/* ====================================================
            PROCHAINE PRIERE
        ==================================================== */}

        <section className="mb-8">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* CARTE PROCHAINE PRIERE */}

            <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-white border border-gray-200 shadow-sm">

              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-blue-50 -translate-y-1/2 translate-x-1/2" />

              <div className="relative p-6 md:p-8">

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                  <div>

                    <div className="flex items-center gap-2 text-blue-600 font-medium text-sm">
                      <Compass
                        size={18}
                      />

                      PROCHAINE PRIÈRE
                    </div>

                    {chargementHoraires ? (
                      <div className="mt-4">
                        <RefreshCw
                          size={30}
                          className="text-blue-600 animate-spin"
                        />

                        <p className="mt-3 text-gray-500">
                          Chargement des horaires...
                        </p>
                      </div>
                    ) : erreurHoraires ? (
                      <div className="mt-4">

                        <div className="flex items-start gap-2 text-red-600">
                          <AlertCircle
                            size={20}
                          />

                          <span>
                            {erreurHoraires}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={
                            chargerHoraires
                          }
                          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                        >
                          <RefreshCw
                            size={16}
                          />

                          Réessayer
                        </button>

                      </div>
                    ) : prochainePriereFinale ? (
                      <>
                        <h2 className="mt-3 text-3xl md:text-4xl font-bold text-gray-900">
                          {prochainePriereFinale.nom}
                        </h2>

                        <div className="mt-2 flex items-baseline gap-3">
                          <span className="text-5xl md:text-6xl font-bold text-blue-600">
                            {
                              prochainePriereFinale.heure
                            }
                          </span>

                          <span className="text-gray-500">
                            à Dakar
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="mt-4 text-gray-500">
                        Horaires indisponibles.
                      </p>
                    )}

                  </div>


                  {prochainePriereFinale &&
                    !erreurHoraires && (
                      <div className="shrink-0">

                        <div className="rounded-2xl bg-blue-50 border border-blue-100 px-6 py-5 text-center">

                          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                            Dans
                          </p>

                          <p className="mt-1 text-2xl md:text-3xl font-bold text-blue-700 font-mono">
                            {compteARebours}
                          </p>

                        </div>

                      </div>
                    )}

                </div>

              </div>

            </div>


            {/* CALENDRIER */}

            <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-6">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <CalendarDays
                    size={21}
                    className="text-indigo-600"
                  />
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Aujourd'hui
                  </p>

                  <p className="font-semibold text-gray-800">
                    {new Intl.DateTimeFormat(
                      "fr-FR",
                      {
                        day: "numeric",
                        month: "long",
                      }
                    ).format(
                      maintenant
                    )}
                  </p>
                </div>

              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-5">

                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Localisation
                </p>

                <div className="mt-2 flex items-center gap-2 text-gray-800 font-medium">
                  <MapPin
                    size={17}
                    className="text-blue-600"
                  />

                  Dakar, Sénégal
                </div>

                <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                  Les horaires affichés sont
                  calculés pour Dakar.
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* ====================================================
            HORAIRES DES 5 PRIERES
        ==================================================== */}

        <section className="mb-8">

          <div className="flex items-center justify-between mb-4">

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Horaires des prières
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Les cinq prières quotidiennes
              </p>
            </div>

            <button
              type="button"
              onClick={
                chargerHoraires
              }
              disabled={
                chargementHoraires
              }
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={
                  chargementHoraires
                    ? "animate-spin"
                    : ""
                }
              />

              <span className="hidden sm:inline">
                Actualiser
              </span>
            </button>

          </div>


          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">

            {prieres.map(
              (priere, index) => {

                const Icon =
                  priere.icone;

                const estProchaine =
                  index ===
                  indexProchainePriere;

                return (
                  <div
                    key={
                      priere.nom
                    }
                    className={`rounded-2xl border p-4 transition ${
                      estProchaine
                        ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100"
                        : "bg-white border-gray-200 text-gray-800"
                    }`}
                  >

                    <div className="flex items-center justify-between">

                      <span
                        className={`text-sm font-medium ${
                          estProchaine
                            ? "text-blue-100"
                            : "text-gray-500"
                        }`}
                      >
                        {priere.nom}
                      </span>

                      <Icon
                        size={18}
                        className={
                          estProchaine
                            ? "text-blue-100"
                            : "text-blue-600"
                        }
                      />

                    </div>

                    <p
                      className={`mt-3 text-2xl font-bold ${
                        estProchaine
                          ? "text-white"
                          : "text-gray-900"
                      }`}
                    >
                      {priere.heure}
                    </p>

                    {estProchaine && (
                      <p className="mt-1 text-xs text-blue-100">
                        Prochaine
                      </p>
                    )}

                  </div>
                );
              }
            )}

            {!prieres.length &&
              !chargementHoraires && (
                <div className="col-span-full bg-white border border-gray-200 rounded-2xl p-6 text-center text-gray-500">
                  Aucun horaire disponible.
                </div>
              )}

          </div>

        </section>


        {/* ====================================================
            DU'A + RAPPEL
        ==================================================== */}

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">


          {/* DU'A */}

          <div className="rounded-3xl bg-white border border-gray-200 shadow-sm overflow-hidden">

            <div className="bg-gradient-to-r from-indigo-950 to-blue-900 text-white p-6">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
                  <Heart
                    size={21}
                  />
                </div>

                <div>
                  <p className="text-blue-200 text-xs uppercase tracking-wide font-medium">
                    Invocation
                  </p>

                  <h2 className="text-xl font-bold">
                    Du'a de la semaine
                  </h2>
                </div>

              </div>

            </div>


            <div className="p-6">

              <div className="rounded-2xl bg-slate-50 p-5">

                <p
                  dir="rtl"
                  className="text-2xl md:text-3xl leading-loose text-gray-900 text-right font-serif"
                >
                  {dua.arabe}
                </p>

              </div>

              <p className="mt-5 text-sm italic text-gray-600 leading-relaxed">
                {dua.transliteration}
              </p>

              <div className="mt-4 border-l-4 border-blue-500 pl-4">
                <p className="text-gray-700 leading-relaxed">
                  {dua.traduction}
                </p>
              </div>

              <div className="mt-5 flex justify-end">

                <button
                  type="button"
                  onClick={() =>
                    setDuaIndex(
                      (
                        duaIndex + 1
                      ) %
                        DUAS.length
                    )
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
                >
                  Nouvelle invocation

                  <ChevronRight
                    size={16}
                  />
                </button>

              </div>

            </div>

          </div>


          {/* RAPPEL */}

          <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-100 shadow-sm p-6">

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center">
                <Sparkles
                  size={21}
                  className="text-orange-600"
                />
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-orange-600 font-medium">
                  Méditation
                </p>

                <h2 className="text-xl font-bold text-gray-900">
                  {rappelDuJour.titre}
                </h2>
              </div>

            </div>

            <p className="mt-6 text-gray-700 leading-relaxed text-base">
              {rappelDuJour.texte}
            </p>

            <div className="mt-8 flex items-center gap-2 text-sm text-orange-700">
              <Heart
                size={16}
              />

              Qu'Allah nous accorde
              la constance et la sincérité.
            </div>

          </div>

        </section>


        {/* ====================================================
            KHASSIDA
        ==================================================== */}

        <section className="mb-8">

          <div className="rounded-3xl overflow-hidden bg-white border border-gray-200 shadow-sm">

            <div className="p-6 md:p-7">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                <div className="flex items-start gap-4">

                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <BookOpen
                      size={26}
                      className="text-emerald-600"
                    />
                  </div>

                  <div>

                    <p className="text-xs uppercase tracking-wide text-emerald-600 font-semibold">
                      Lecture spirituelle
                    </p>

                    <h2 className="mt-1 text-xl md:text-2xl font-bold text-gray-900">
                      {khassidaDuJour.titre}
                    </h2>

                    <p className="mt-2 text-gray-500 leading-relaxed">
                      {
                        khassidaDuJour.description
                      }
                    </p>

                  </div>

                </div>


                <div className="flex flex-wrap gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/khassidas"
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
                  >
                    <BookOpen
                      size={17}
                    />

                    Consulter
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/khassidas"
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition"
                  >
                    <Headphones
                      size={17}
                    />

                    Écouter
                  </button>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* ====================================================
            COMMUNICATIONS
        ==================================================== */}

        {aPermission(
          "COMMUNICATION_CONSULTER"
        ) && (
          <section className="mb-8">

            <div className="flex items-center justify-between mb-4">

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Communications
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Les dernières informations du Dahira
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/communications"
                  )
                }
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Tout voir

                <ArrowRight
                  size={16}
                />
              </button>

            </div>


            {chargementCommunications ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
                <RefreshCw
                  size={25}
                  className="mx-auto text-blue-600 animate-spin"
                />

                <p className="mt-3 text-sm text-gray-500">
                  Chargement des communications...
                </p>
              </div>
            ) : erreurCommunications ? (
              <div className="bg-white border border-red-200 rounded-2xl p-5">

                <div className="flex items-start gap-3 text-red-600">
                  <AlertCircle
                    size={19}
                  />

                  <p className="text-sm">
                    {erreurCommunications}
                  </p>
                </div>

              </div>
            ) : communications.length ===
              0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-7 text-center">

                <Megaphone
                  size={30}
                  className="mx-auto text-gray-300"
                />

                <p className="mt-3 text-sm text-gray-500">
                  Aucune communication récente.
                </p>

              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {communications.map(
                  (communication) => (
                    <button
                      type="button"
                      key={
                        communication.id
                      }
                      onClick={() =>
                        navigate(
                          `/communications/${communication.id}`
                        )
                      }
                      className="text-left bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition group"
                    >

                      <div className="flex items-center justify-between gap-3">

                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                          <Megaphone
                            size={18}
                            className="text-blue-600"
                          />
                        </div>

                        <ArrowRight
                          size={17}
                          className="text-gray-300 group-hover:text-blue-600 transition"
                        />

                      </div>

                      <h3 className="mt-4 font-semibold text-gray-900 line-clamp-2">
                        {
                          communication.titre
                        }
                      </h3>

                      <p className="mt-2 text-sm text-gray-500 line-clamp-3 leading-relaxed">
                        {
                          communication.contenu
                        }
                      </p>

                      <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                        <Calendar
                          size={13}
                        />

                        {communication.date_publication
                          ? new Intl.DateTimeFormat(
                              "fr-FR",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            ).format(
                              new Date(
                                communication.date_publication
                              )
                            )
                          : "-"}
                      </div>

                    </button>
                  )
                )}

              </div>
            )}

          </section>
        )}


        {/* ====================================================
            RESUME PERSONNEL
        ==================================================== */}

        <section className="mb-8">

          <div className="flex items-center gap-3 mb-4">

            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Info
                size={19}
                className="text-blue-600"
              />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Mon espace
              </h2>

              <p className="text-sm text-gray-500">
                Accédez rapidement à vos informations
              </p>
            </div>

          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/mon-espace"
                )
              }
              className="bg-white border border-gray-200 rounded-2xl p-5 text-left hover:border-blue-300 hover:shadow-md transition group"
            >

              <div className="flex items-center justify-between">

                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Bell
                    size={19}
                    className="text-blue-600"
                  />
                </div>

                <ArrowRight
                  size={17}
                  className="text-gray-300 group-hover:text-blue-600"
                />

              </div>

              <h3 className="mt-4 font-semibold text-gray-900">
                Mon espace personnel
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Retrouvez vos fonctionnalités personnelles.
              </p>

            </button>


            <button
              type="button"
              onClick={() =>
                navigate(
                  "/reunions"
                )
              }
              className="bg-white border border-gray-200 rounded-2xl p-5 text-left hover:border-indigo-300 hover:shadow-md transition group"
            >

              <div className="flex items-center justify-between">

                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Calendar
                    size={19}
                    className="text-indigo-600"
                  />
                </div>

                <ArrowRight
                  size={17}
                  className="text-gray-300 group-hover:text-indigo-600"
                />

              </div>

              <h3 className="mt-4 font-semibold text-gray-900">
                Réunions
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Consultez les prochaines réunions.
              </p>

            </button>


            <button
              type="button"
              onClick={() =>
                navigate(
                  "/communications"
                )
              }
              className="bg-white border border-gray-200 rounded-2xl p-5 text-left hover:border-emerald-300 hover:shadow-md transition group"
            >

              <div className="flex items-center justify-between">

                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Megaphone
                    size={19}
                    className="text-emerald-600"
                  />
                </div>

                <ArrowRight
                  size={17}
                  className="text-gray-300 group-hover:text-emerald-600"
                />

              </div>

              <h3 className="mt-4 font-semibold text-gray-900">
                Communications
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Consultez les annonces du Dahira.
              </p>

            </button>


            <button
              type="button"
              onClick={() =>
                navigate(
                  "/khassidas"
                )
              }
              className="bg-white border border-gray-200 rounded-2xl p-5 text-left hover:border-orange-300 hover:shadow-md transition group"
            >

              <div className="flex items-center justify-between">

                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <BookOpen
                    size={19}
                    className="text-orange-600"
                  />
                </div>

                <ArrowRight
                  size={17}
                  className="text-gray-300 group-hover:text-orange-600"
                />

              </div>

              <h3 className="mt-4 font-semibold text-gray-900">
                Khassidas
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Consultez les Khassidas disponibles.
              </p>

            </button>

          </div>

        </section>


        {/* ====================================================
            FOOTER SPIRITUEL
        ==================================================== */}

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-blue-950 text-white p-7 md:p-9">

          <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full border border-white/10" />
          <div className="absolute -left-10 -bottom-20 w-56 h-56 rounded-full border border-white/10" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">

            <div>

              <div className="flex items-center gap-2 text-blue-300 text-sm font-medium">
                <Heart
                  size={16}
                />

                Rappel
              </div>

              <h2 className="mt-2 text-xl md:text-2xl font-bold">
                Qu'Allah bénisse votre journée.
              </h2>

              <p className="mt-2 text-blue-200 max-w-2xl leading-relaxed">
                Que chaque prière, chaque
                invocation et chaque bonne action
                soit une source de lumière,
                de paix et de bénédiction.
              </p>

            </div>


            <div className="flex items-center gap-3 shrink-0">

              <Volume2
                size={24}
                className="text-blue-300"
              />

              <span className="text-sm text-blue-200">
                Dhikr • Prière • Fraternité
              </span>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Espace;

