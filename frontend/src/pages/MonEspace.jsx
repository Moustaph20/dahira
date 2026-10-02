import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  AlertCircle,
  ArrowRight,
  Bell,
  BookOpen,
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock3,
  Compass,
  Heart,
  MapPin,
  Menu,
  Megaphone,
  Moon,
  RefreshCw,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  User,
  Users,
  Wallet,
  Volume2,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { getCommunications } from "../services/communications";
import api from "../api/client";
import { demanderTokenNotification } from "../firebase-messaging";

// ============================================================
// CONFIGURATION
// ============================================================

const VILLE = "Dakar";
const PAYS = "Sénégal";

// ============================================================
// DUAS
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
    arabe: "رَبِّ زِدْنِي عِلْمًا",
    transliteration: "Rabbi zidni 'ilma.",
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
];

// ============================================================
// KHASSIDAS DU JOUR
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
// RUBRIQUES
// ============================================================

const RUBRIQUES = [
  {
    label: "Accueil",
    path: "/dashboard",
    permission: null,
    icon: Compass,
  },
  {
    label: "Membres",
    path: "/membres",
    permission: "MEMBRE_CONSULTER",
    icon: Users,
  },
  {
    label: "Cotisations",
    path: "/cotisations",
    permission: "COTISATION_CONSULTER",
    icon: Wallet,
  },
  {
    label: "Communications",
    path: "/communications",
    permission: "COMMUNICATION_CONSULTER",
    icon: Megaphone,
  },
  {
    label: "Réunions",
    path: "/reunions",
    permission: "REUNION_CONSULTER",
    icon: Calendar,
  },
  {
    label: "Khassidas",
    path: "/khassidas",
    permission: "KOUREL_CONSULTER",
    icon: BookOpen,
  },
  {
    label: "Notifications",
    path: "/notifications",
    permission: "NOTIFICATION_CONSULTER",
    icon: Bell,
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

const formaterHeure = (heure) => {
  if (!heure) return "--:--";

  return String(heure).substring(0, 5);
};

const convertirHeureEnDate = (heure, date = new Date()) => {
  if (!heure) return null;

  const [heures, minutes] = String(heure)
    .substring(0, 5)
    .split(":")
    .map(Number);

  if (
    Number.isNaN(heures) ||
    Number.isNaN(minutes)
  ) {
    return null;
  }

  const resultat = new Date(date);

  resultat.setHours(
    heures,
    minutes,
    0,
    0
  );

  return resultat;
};

const obtenirPrenom = (utilisateur) => {
  return (
    utilisateur?.membre?.prenom ||
    utilisateur?.prenom ||
    utilisateur?.nom_complet?.split(" ")?.[0] ||
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
      .map((item) => item?.msg)
      .filter(Boolean)
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

function MonEspace() {
  const navigate = useNavigate();

  const {
    utilisateur,
    chargement,
    aPermission,
  } = useAuth();

  // ==========================================================
  // ETATS
  // ==========================================================

  const [menuOuvert, setMenuOuvert] =
    useState(false);

  const [rubriquesOuvertes, setRubriquesOuvertes] =
    useState(false);

  const [maintenant, setMaintenant] =
    useState(new Date());

  const [horaires, setHoraires] =
    useState(null);

  const [chargementHoraires, setChargementHoraires] =
    useState(true);

  const [erreurHoraires, setErreurHoraires] =
    useState("");

  const [communications, setCommunications] =
    useState([]);

  const [
    chargementCommunications,
    setChargementCommunications,
  ] = useState(false);

  const [
    erreurCommunications,
    setErreurCommunications,
  ] = useState("");

  const [duaIndex, setDuaIndex] =
    useState(
      obtenirCleJour() % DUAS.length
    );

  const [
    activationNotifications,
    setActivationNotifications,
  ] = useState(false);

  const [
    notificationsActivees,
    setNotificationsActivees,
  ] = useState(false);

  const [
    erreurNotifications,
    setErreurNotifications,
  ] = useState("");

  // ==========================================================
  // HORLOGE
  // ==========================================================

  useEffect(() => {
    const interval = setInterval(() => {
      setMaintenant(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ==========================================================
  // HORAIRES PRIERE
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

      const annee = date.getFullYear();

      const url =
        `https://api.aladhan.com/v1/timingsByCity/${jour}-${mois}-${annee}` +
        `?city=${encodeURIComponent(VILLE)}` +
        `&country=${encodeURIComponent(PAYS)}` +
        `&method=3`;

      const response =
        await fetch(url);

      if (!response.ok) {
        throw new Error(
          "Impossible de récupérer les horaires."
        );
      }

      const donnees =
        await response.json();

      if (
        donnees?.code !== 200 ||
        !donnees?.data?.timings
      ) {
        throw new Error(
          "Horaires indisponibles."
        );
      }

      setHoraires(donnees.data);
    } catch (error) {
      console.error(
        "Erreur horaires :",
        error
      );

      setHoraires(null);

      setErreurHoraires(
        error?.message ||
          "Impossible de charger les horaires."
      );
    } finally {
      setChargementHoraires(false);
    }
  };

  useEffect(() => {
    chargerHoraires();
  }, []);

  // ==========================================================
  // COMMUNICATIONS
  // ==========================================================

  const chargerCommunications = async () => {
    if (
      !aPermission(
        "COMMUNICATION_CONSULTER"
      )
    ) {
      return;
    }

    setChargementCommunications(true);
    setErreurCommunications("");

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
    } catch (error) {
      console.error(
        "Erreur communications :",
        error
      );

      setErreurCommunications(
        obtenirMessageErreur(error)
      );
    } finally {
      setChargementCommunications(false);
    }
  };

  useEffect(() => {
    if (utilisateur) {
      chargerCommunications();
    }
  }, [utilisateur]);

  // ==========================================================
  // NOTIFICATIONS
  // ==========================================================

  const activerNotifications = async () => {
    setActivationNotifications(true);
    setErreurNotifications("");

    try {
      const token =
        await demanderTokenNotification();

      if (!token) {
        throw new Error(
          "Aucun token de notification n'a été obtenu."
        );
      }

      await api.post(
        "/notifications/appareil",
        {
          token,
          plateforme: "web",
        }
      );

      setNotificationsActivees(true);
    } catch (error) {
      console.error(
        "Erreur notifications :",
        error
      );

      setErreurNotifications(
        obtenirMessageErreur(error)
      );
    } finally {
      setActivationNotifications(false);
    }
  };

  // ==========================================================
  // PRIERES
  // ==========================================================

  const prieres = useMemo(() => {
    const timings = horaires?.timings;

    if (!timings) {
      return [];
    }

    return [
      {
        nom: "Fajr",
        heure: formaterHeure(
          timings.Fajr
        ),
        icon: Sunrise,
      },
      {
        nom: "Dhuhr",
        heure: formaterHeure(
          timings.Dhuhr
        ),
        icon: Sun,
      },
      {
        nom: "Asr",
        heure: formaterHeure(
          timings.Asr
        ),
        icon: Sun,
      },
      {
        nom: "Maghrib",
        heure: formaterHeure(
          timings.Maghrib
        ),
        icon: Sunset,
      },
      {
        nom: "Isha",
        heure: formaterHeure(
          timings.Isha
        ),
        icon: Moon,
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

    const demain = new Date(
      maintenant
    );

    demain.setDate(
      demain.getDate() + 1
    );

    return {
      ...prieres[0],
      date: convertirHeureEnDate(
        prieres[0].heure,
        demain
      ),
    };
  }, [prieres, maintenant]);

  // ==========================================================
  // COMPTE A REBOURS
  // ==========================================================

  const compteARebours = useMemo(() => {
    if (!prochainePriere?.date) {
      return "--:--:--";
    }

    let difference =
      prochainePriere.date.getTime() -
      maintenant.getTime();

    if (difference < 0) {
      difference = 0;
    }

    const secondes = Math.floor(
      difference / 1000
    );

    const heures = Math.floor(
      secondes / 3600
    );

    const minutes = Math.floor(
      (secondes % 3600) / 60
    );

    const secondesRestantes =
      secondes % 60;

    return [
      String(heures).padStart(2, "0"),
      String(minutes).padStart(2, "0"),
      String(
        secondesRestantes
      ).padStart(2, "0"),
    ].join(":");
  }, [prochainePriere, maintenant]);

  // ==========================================================
  // DONNEES DU JOUR
  // ==========================================================

  const dua = DUAS[duaIndex];

  const rappelDuJour =
    RAPPELS[
      obtenirCleJour() % RAPPELS.length
    ];

  const khassidaDuJour =
    KHASSIDAS_DU_JOUR[
      obtenirCleJour() %
        KHASSIDAS_DU_JOUR.length
    ];

  const prenom =
    obtenirPrenom(utilisateur);

  const indexProchainePriere =
    prieres.findIndex(
      (priere) =>
        priere.nom ===
        prochainePriere?.nom
    );

  // ==========================================================
  // RUBRIQUES AUTORISEES
  // ==========================================================

  const rubriquesAutorisees =
    RUBRIQUES.filter(
      (rubrique) =>
        !rubrique.permission ||
        aPermission(
          rubrique.permission
        )
    );

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const naviguer = (path) => {
    setMenuOuvert(false);
    setRubriquesOuvertes(false);
    navigate(path);
  };

  // ==========================================================
  // CHARGEMENT
  // ==========================================================

  if (chargement) {
    return (
      <div className="min-h-screen bg-[#f8f7f2]">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <RefreshCw
              size={32}
              className="mx-auto animate-spin text-emerald-800"
            />

            <p className="mt-4 text-sm text-slate-500">
              Chargement de votre espace...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDU
  // ==========================================================

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f7f2] text-slate-800">

      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <header className="sticky top-0 z-50 border-b border-emerald-950/10 bg-white/95 shadow-sm backdrop-blur">

        <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">

          <div className="flex h-[70px] items-center justify-between gap-4">

            {/* LOGO */}

            <button
              type="button"
              onClick={() =>
                naviguer("/dashboard")
              }
              className="flex min-w-0 items-center gap-3 text-left"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-950 shadow-sm">
                <img
                  src="/logo.png"
                  alt="Dahira"
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display =
                      "none";
                  }}
                />
              </div>

              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-black text-emerald-950 lg:text-base">
                  Dahira Mawahibou Naafih
                </p>

                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#a77919]">
                  Mon espace
                </p>
              </div>
            </button>

            {/* MENU DESKTOP */}

            <nav className="hidden items-center gap-1 xl:flex">

              {rubriquesAutorisees
                .slice(0, 5)
                .map((rubrique) => {
                  const Icon =
                    rubrique.icon;

                  return (
                    <button
                      key={rubrique.path}
                      type="button"
                      onClick={() =>
                        naviguer(
                          rubrique.path
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-900"
                    >
                      <Icon size={15} />
                      {rubrique.label}
                    </button>
                  );
                })}

              {rubriquesAutorisees.length >
                5 && (
                <div className="relative">

                  <button
                    type="button"
                    onClick={() =>
                      setRubriquesOuvertes(
                        (value) => !value
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-900"
                  >
                    Plus
                    <ChevronDown
                      size={15}
                    />
                  </button>

                  {rubriquesOuvertes && (
                    <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">

                      {rubriquesAutorisees
                        .slice(5)
                        .map(
                          (rubrique) => {
                            const Icon =
                              rubrique.icon;

                            return (
                              <button
                                key={
                                  rubrique.path
                                }
                                type="button"
                                onClick={() =>
                                  naviguer(
                                    rubrique.path
                                  )
                                }
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-900"
                              >
                                <Icon
                                  size={16}
                                />

                                {
                                  rubrique.label
                                }
                              </button>
                            );
                          }
                        )}

                    </div>
                  )}

                </div>
              )}

            </nav>

            {/* PROFIL + MOBILE */}

            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={() =>
                  naviguer("/mon-espace")
                }
                className="hidden items-center gap-2 rounded-xl border border-emerald-900/10 bg-emerald-50 px-3 py-2 sm:flex"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-950 text-white">
                  <User size={14} />
                </div>

                <span className="max-w-[120px] truncate text-xs font-bold text-emerald-950">
                  {prenom}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setMenuOuvert(
                    (value) => !value
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950 text-white xl:hidden"
                aria-label="Ouvrir le menu"
              >
                {menuOuvert ? (
                  <X size={19} />
                ) : (
                  <Menu size={19} />
                )}
              </button>

            </div>

          </div>

        </div>

        {/* MENU MOBILE */}

        {menuOuvert && (
          <div className="border-t border-slate-100 bg-white xl:hidden">

            <div className="mx-auto max-w-[1500px] space-y-1 px-4 py-3 sm:px-6">

              {rubriquesAutorisees.map(
                (rubrique) => {
                  const Icon =
                    rubrique.icon;

                  return (
                    <button
                      key={rubrique.path}
                      type="button"
                      onClick={() =>
                        naviguer(
                          rubrique.path
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900"
                    >
                      <Icon
                        size={17}
                        className="text-emerald-700"
                      />

                      {rubrique.label}

                      <ChevronRight
                        size={15}
                        className="ml-auto text-slate-300"
                      />
                    </button>
                  );
                }
              )}

            </div>

          </div>
        )}

      </header>

      {/* ======================================================
          CONTENU
      ====================================================== */}

      <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">

        {/* ====================================================
            HERO
        ==================================================== */}

        <section className="relative mb-6 overflow-hidden rounded-3xl bg-emerald-950 shadow-xl">

          <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full border border-[#d6ac47]/20" />

          <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full border border-white/5" />

          <div className="absolute right-20 top-10 hidden h-2 w-2 rounded-full bg-[#d6ac47] sm:block" />

          <div className="relative p-6 sm:p-8 lg:p-10">

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">

              <div>

                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#e5c568]">
                  <Sparkles size={13} />
                  Espace personnel
                </div>

                <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                  As Salam 'Aleykum{" "}
                  <span className="text-[#d6ac47]">
                    {prenom}
                  </span>
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
                  Retrouvez ici les informations
                  essentielles de votre Dahira,
                  vos rappels spirituels et les
                  services accessibles depuis votre
                  espace.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">

                  <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">
                    <CalendarDays
                      size={15}
                      className="text-[#d6ac47]"
                    />

                    {new Intl.DateTimeFormat(
                      "fr-FR",
                      {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    ).format(maintenant)}
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">
                    <MapPin
                      size={15}
                      className="text-[#d6ac47]"
                    />

                    Dakar, Sénégal
                  </div>

                </div>

              </div>

              {/* HEURE */}

              <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">

                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#d6ac47]">
                  <Clock3 size={14} />
                  Heure locale
                </div>

                <p className="mt-3 font-mono text-3xl font-black tracking-tight text-white sm:text-4xl">
                  {maintenant.toLocaleTimeString(
                    "fr-FR",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    }
                  )}
                </p>

                <p className="mt-2 text-xs text-white/40">
                  Votre espace personnel
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* ====================================================
            NOTIFICATIONS
        ==================================================== */}

        <section className="mb-6">

          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-start gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Bell size={18} />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a77919]">
                  Notifications
                </p>

                <h2 className="mt-1 font-black text-emerald-950">
                  Ne manquez aucune information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Recevez les communications
                  importantes directement sur votre
                  appareil.
                </p>

                {notificationsActivees && (
                  <p className="mt-2 text-xs font-bold text-emerald-600">
                    ✓ Notifications activées
                  </p>
                )}

                {erreurNotifications && (
                  <p className="mt-2 text-xs text-red-600">
                    {erreurNotifications}
                  </p>
                )}
              </div>

            </div>

            {!notificationsActivees && (
              <button
                type="button"
                onClick={
                  activerNotifications
                }
                disabled={
                  activationNotifications
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-900 disabled:opacity-50"
              >
                {activationNotifications ? (
                  <>
                    <RefreshCw
                      size={15}
                      className="animate-spin"
                    />
                    Activation...
                  </>
                ) : (
                  <>
                    <Bell size={15} />
                    Activer
                  </>
                )}
              </button>
            )}

          </div>

        </section>

        {/* ====================================================
            PRIERE + COMPTE A REBOURS
        ==================================================== */}

        <section className="mb-6">

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">

            {/* PROCHAINE PRIERE */}

            <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">

              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-50/70" />

              <div className="relative p-5 sm:p-7">

                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#a77919] sm:text-xs">
                  <Compass size={15} />
                  Prochaine prière
                </div>

                {chargementHoraires ? (
                  <div className="mt-8 flex items-center gap-3">
                    <RefreshCw
                      size={24}
                      className="animate-spin text-emerald-700"
                    />

                    <span className="text-sm text-slate-500">
                      Chargement des horaires...
                    </span>
                  </div>
                ) : erreurHoraires ? (
                  <div className="mt-6">

                    <div className="flex items-start gap-2 text-red-600">
                      <AlertCircle
                        size={18}
                        className="mt-0.5 shrink-0"
                      />

                      <p className="text-sm">
                        {erreurHoraires}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={
                        chargerHoraires
                      }
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-950 px-4 py-2 text-sm font-bold text-white"
                    >
                      <RefreshCw
                        size={14}
                      />
                      Réessayer
                    </button>

                  </div>
                ) : prochainePriere ? (
                  <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">

                    <div>

                      <h2 className="text-3xl font-black text-emerald-950 sm:text-4xl">
                        {prochainePriere.nom}
                      </h2>

                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-4xl font-black text-emerald-800 sm:text-5xl">
                          {
                            prochainePriere.heure
                          }
                        </span>

                        <span className="text-sm text-slate-400">
                          Dakar
                        </span>
                      </div>

                    </div>

                    <div className="rounded-2xl bg-emerald-950 px-6 py-4 text-center text-white">

                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#d6ac47]">
                        Dans
                      </p>

                      <p className="mt-1 font-mono text-2xl font-black">
                        {compteARebours}
                      </p>

                    </div>

                  </div>
                ) : (
                  <p className="mt-5 text-sm text-slate-500">
                    Horaires indisponibles.
                  </p>
                )}

              </div>

            </div>

            {/* LOCALISATION */}

            <div className="rounded-2xl bg-emerald-950 p-5 text-white shadow-sm sm:p-6">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#d6ac47]">
                  <MapPin size={19} />
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">
                    Localisation
                  </p>

                  <p className="mt-1 font-black">
                    Dakar, Sénégal
                  </p>
                </div>

              </div>

              <div className="mt-6 border-t border-white/10 pt-5">

                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#d6ac47]">
                  Aujourd'hui
                </p>

                <p className="mt-2 text-lg font-black">
                  {new Intl.DateTimeFormat(
                    "fr-FR",
                    {
                      day: "numeric",
                      month: "long",
                    }
                  ).format(maintenant)}
                </p>

                <p className="mt-2 text-xs leading-5 text-white/40">
                  Horaires de prière calculés
                  pour Dakar.
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* ====================================================
            HORAIRES
        ==================================================== */}

        <section className="mb-6">

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#a77919] sm:text-xs">
                Spiritualité
              </p>

              <h2 className="mt-1 text-2xl font-black text-emerald-950">
                Horaires des prières
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Les cinq prières quotidiennes à Dakar.
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
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:border-emerald-200 hover:text-emerald-800 sm:self-auto"
            >
              <RefreshCw
                size={14}
                className={
                  chargementHoraires
                    ? "animate-spin"
                    : ""
                }
              />

              Actualiser
            </button>

          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">

            {prieres.map(
              (priere, index) => {
                const Icon =
                  priere.icon;

                const estProchaine =
                  index ===
                  indexProchainePriere;

                return (
                  <div
                    key={priere.nom}
                    className={`rounded-2xl border p-4 shadow-sm transition sm:p-5 ${
                      estProchaine
                        ? "border-emerald-950 bg-emerald-950 text-white"
                        : "border-slate-200 bg-white hover:border-emerald-200"
                    }`}
                  >

                    <div className="flex items-center justify-between">

                      <span
                        className={`text-xs font-bold ${
                          estProchaine
                            ? "text-white/60"
                            : "text-slate-400"
                        }`}
                      >
                        {priere.nom}
                      </span>

                      <Icon
                        size={16}
                        className={
                          estProchaine
                            ? "text-[#d6ac47]"
                            : "text-emerald-700"
                        }
                      />

                    </div>

                    <p
                      className={`mt-4 text-2xl font-black ${
                        estProchaine
                          ? "text-white"
                          : "text-emerald-950"
                      }`}
                    >
                      {priere.heure}
                    </p>

                    {estProchaine && (
                      <p className="mt-1 text-[9px] font-black uppercase tracking-wider text-[#d6ac47]">
                        Prochaine
                      </p>
                    )}

                  </div>
                );
              }
            )}

          </div>

        </section>

        {/* ====================================================
            DUA + RAPPEL
        ==================================================== */}

        <section className="mb-6 grid gap-5 lg:grid-cols-2">

          {/* DUA */}

          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">

            <div className="bg-emerald-950 p-5 text-white sm:p-6">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#d6ac47]">
                  <Heart size={18} />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#d6ac47]">
                    Invocation
                  </p>

                  <h2 className="mt-1 font-black">
                    Du'a du jour
                  </h2>
                </div>

              </div>

            </div>

            <div className="p-5 sm:p-6">

              <div className="rounded-2xl bg-[#f8f7f2] p-5">

                <p
                  dir="rtl"
                  className="font-serif text-xl leading-[2.1] text-emerald-950 sm:text-2xl"
                >
                  {dua.arabe}
                </p>

              </div>

              <p className="mt-4 text-sm italic leading-6 text-slate-500">
                {dua.transliteration}
              </p>

              <p className="mt-4 border-l-4 border-[#b88b28] pl-4 text-sm leading-6 text-slate-600">
                {dua.traduction}
              </p>

              <button
                type="button"
                onClick={() =>
                  setDuaIndex(
                    (duaIndex + 1) %
                      DUAS.length
                  )
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-900"
              >
                Nouvelle invocation
                <ChevronRight
                  size={15}
                />
              </button>

            </div>

          </div>

          {/* RAPPEL */}

          <div className="relative overflow-hidden rounded-2xl bg-[#f5efdE] p-5 shadow-sm ring-1 ring-[#d6ac47]/20 sm:p-6">

            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full border border-[#b88b28]/20" />

            <div className="relative">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950 text-[#d6ac47]">
                  <Sparkles size={18} />
                </div>

                <div>

                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a77919]">
                    Méditation
                  </p>

                  <h2 className="mt-1 text-xl font-black text-emerald-950">
                    {rappelDuJour.titre}
                  </h2>

                </div>

              </div>

              <p className="mt-7 text-sm leading-7 text-slate-600 sm:text-base">
                {rappelDuJour.texte}
              </p>

              <div className="mt-7 flex items-start gap-2 text-sm font-semibold leading-6 text-emerald-800">

                <Heart
                  size={16}
                  className="mt-1 shrink-0"
                />

                <span>
                  Qu'Allah nous accorde la
                  constance et la sincérité.
                </span>

              </div>

            </div>

          </div>

        </section>

        {/* ====================================================
            KHASSIDA
        ==================================================== */}

        <section className="mb-6">

          <div className="relative overflow-hidden rounded-2xl bg-emerald-950 p-5 text-white shadow-sm sm:p-7">

            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full border border-[#d6ac47]/15" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex min-w-0 items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#d6ac47]">
                  <BookOpen size={21} />
                </div>

                <div>

                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#d6ac47]">
                    Lecture spirituelle
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    {khassidaDuJour.titre}
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                    {khassidaDuJour.description}
                  </p>

                </div>

              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">

                <button
                  type="button"
                  onClick={() =>
                    naviguer(
                      "/khassidas"
                    )
                  }
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 sm:flex-none"
                >
                  <BookOpen
                    size={15}
                  />
                  Consulter
                </button>

                <button
                  type="button"
                  onClick={() =>
                    naviguer(
                      "/khassidas"
                    )
                  }
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#d6ac47] px-4 py-2.5 text-sm font-black text-emerald-950 transition hover:bg-[#e3c15f] sm:flex-none"
                >
                  <Volume2
                    size={15}
                  />
                  Écouter
                </button>

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
          <section className="mb-6">

            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

              <div>

                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#a77919] sm:text-xs">
                  Vie du Dahira
                </p>

                <h2 className="mt-1 text-2xl font-black text-emerald-950">
                  Communications
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Les dernières informations du Dahira.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  naviguer(
                    "/communications"
                  )
                }
                className="inline-flex items-center gap-2 self-start text-sm font-bold text-emerald-800 hover:text-[#a77919]"
              >
                Tout voir
                <ArrowRight
                  size={15}
                />
              </button>

            </div>

            {chargementCommunications ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">

                <RefreshCw
                  size={25}
                  className="mx-auto animate-spin text-emerald-700"
                />

                <p className="mt-3 text-sm text-slate-400">
                  Chargement...
                </p>

              </div>
            ) : erreurCommunications ? (
              <div className="rounded-2xl border border-red-100 bg-white p-5">

                <div className="flex items-start gap-3 text-red-600">

                  <AlertCircle
                    size={18}
                  />

                  <p className="text-sm">
                    {erreurCommunications}
                  </p>

                </div>

              </div>
            ) : communications.length ===
              0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">

                <Megaphone
                  size={28}
                  className="mx-auto text-slate-200"
                />

                <p className="mt-3 text-sm text-slate-400">
                  Aucune communication récente.
                </p>

              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">

                {communications.map(
                  (communication) => (
                    <button
                      key={
                        communication.id
                      }
                      type="button"
                      onClick={() =>
                        naviguer(
                          `/communications/${communication.id}`
                        )
                      }
                      className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
                    >

                      <div className="flex items-center justify-between">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                          <Megaphone
                            size={18}
                          />
                        </div>

                        <ArrowRight
                          size={16}
                          className="text-slate-300 transition group-hover:text-[#b88b28]"
                        />

                      </div>

                      <h3 className="mt-4 line-clamp-2 font-black text-emerald-950">
                        {
                          communication.titre
                        }
                      </h3>

                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                        {
                          communication.contenu
                        }
                      </p>

                      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
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
            ACCES RAPIDES
        ==================================================== */}

        <section className="mb-8">

          <div className="mb-5">

            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#a77919] sm:text-xs">
              Mon espace
            </p>

            <h2 className="mt-1 text-2xl font-black text-emerald-950">
              Accès rapides
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Les services accessibles selon vos permissions.
            </p>

          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            {aPermission(
              "MEMBRE_CONSULTER"
            ) && (
              <button
                type="button"
                onClick={() =>
                  naviguer("/membres")
                }
                className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Users size={18} />
                  </div>

                  <ArrowRight
                    size={16}
                    className="text-slate-300 group-hover:text-[#b88b28]"
                  />

                </div>

                <h3 className="mt-4 font-black text-emerald-950">
                  Membres
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Consulter les membres accessibles.
                </p>
              </button>
            )}

            {aPermission(
              "COTISATION_CONSULTER"
            ) && (
              <button
                type="button"
                onClick={() =>
                  naviguer(
                    "/cotisations"
                  )
                }
                className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Wallet size={18} />
                  </div>

                  <ArrowRight
                    size={16}
                    className="text-slate-300 group-hover:text-[#b88b28]"
                  />

                </div>

                <h3 className="mt-4 font-black text-emerald-950">
                  Cotisations
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Consultez les cotisations accessibles.
                </p>
              </button>
            )}

            {aPermission(
              "COMMUNICATION_CONSULTER"
            ) && (
              <button
                type="button"
                onClick={() =>
                  naviguer(
                    "/communications"
                  )
                }
                className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Megaphone
                      size={18}
                    />
                  </div>

                  <ArrowRight
                    size={16}
                    className="text-slate-300 group-hover:text-[#b88b28]"
                  />

                </div>

                <h3 className="mt-4 font-black text-emerald-950">
                  Communications
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Retrouvez les annonces du Dahira.
                </p>
              </button>
            )}

            {aPermission(
              "KOUREL_CONSULTER"
            ) && (
              <button
                type="button"
                onClick={() =>
                  naviguer(
                    "/khassidas"
                  )
                }
                className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <BookOpen
                      size={18}
                    />
                  </div>

                  <ArrowRight
                    size={16}
                    className="text-slate-300 group-hover:text-[#b88b28]"
                  />

                </div>

                <h3 className="mt-4 font-black text-emerald-950">
                  Khassidas
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Consulter les Khassidas disponibles.
                </p>
              </button>
            )}

          </div>

        </section>

      </main>

      {/* ======================================================
          FOOTER SPIRITUEL
      ====================================================== */}

      <section className="border-t border-emerald-950/10 bg-emerald-950">

        <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 lg:px-8">

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 text-center sm:p-8">

            <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full border border-[#d6ac47]/10" />

            <div className="absolute -bottom-20 -right-16 h-48 w-48 rounded-full border border-white/5" />

            <div className="relative">

              <Heart
                size={22}
                className="mx-auto text-[#d6ac47]"
              />

              <h2 className="mt-4 text-xl font-black text-white sm:text-2xl">
                Qu'Allah bénisse votre journée
              </h2>

              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/45">
                Que chaque prière, chaque invocation
                et chaque bonne action soit une source
                de lumière, de paix et de bénédiction.
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-white/35">
                <span>Dhikr</span>
                <span>•</span>
                <span>Prière</span>
                <span>•</span>
                <span>Fraternité</span>
                <span>•</span>
                <span>Service</span>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="bg-[#04251e]">

        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-5 text-center text-xs text-white/35 sm:px-6 sm:flex-row sm:items-center sm:justify-between sm:text-left lg:px-8">

          <p>
            © {new Date().getFullYear()} Dahira Mawahibou Naafih
          </p>

          <p>
            Dakar, Sénégal
          </p>

        </div>

      </footer>

    </div>
  );
}

export default MonEspace;