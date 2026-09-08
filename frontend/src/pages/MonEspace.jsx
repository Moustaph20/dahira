import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

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
  Info,
  Landmark,
  MapPin,
  Megaphone,
  Menu,
  Moon,
  RefreshCw,
  Settings,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Users,
  Wallet,
  HandCoins,
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
// RUBRIQUES DU MENU
// ============================================================

const RUBRIQUES = [
  {
    id: "dashboard",
    nom: "Tableau de bord",
    description: "Vue générale du Dahira",
    route: "/dashboard",
    permission: "DASHBOARD_CONSULTER",
    icon: Landmark,
  },
  {
    id: "membres",
    nom: "Membres",
    description: "Gestion des membres",
    route: "/membres",
    permission: "MEMBRE_CONSULTER",
    icon: Users,
  },
  {
    id: "cotisations",
    nom: "Cotisations",
    description: "Gestion des cotisations",
    route: "/cotisations",
    permission: "COTISATION_CONSULTER",
    icon: Wallet,
  },
  
  {
    id: "finances",
    nom: "Finances",
    description: "Gestion financière",
    route: "/finances",
    permission: "FINANCE_CONSULTER",
    icon: Landmark,
  },
  {
    id: "reunions",
    nom: "Réunions",
    description: "Gestion des réunions",
    route: "/reunions",
    permission: "REUNION_CONSULTER",
    icon: Calendar,
  },
  {
    id: "programme-religieux",
    nom: "Programme religieux",
    description: "Programmes religieux",
    route: "/programme-religieux",
    permission: "KOUREL_CONSULTER",
    icon: CalendarDays,
  },
  {
    id: "communications",
    nom: "Communications",
    description: "Informations et annonces",
    route: "/communications",
    permission: "COMMUNICATION_CONSULTER",
    icon: Megaphone,
  },

  {
    id: "khassidas",
    nom: "Khassidas",
    description: "Bibliothèque des Khassidas",
    route: "/khassidas",
    permission: "KOUREL_CONSULTER",
    icon: BookOpen,
  },
  {
    id: "notifications",
    nom: "Notifications",
    description: "Vos notifications",
    route: "/notifications",
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

  const [chargementCommunications, setChargementCommunications] =
    useState(false);

  const [erreurCommunications, setErreurCommunications] =
    useState("");

  const [duaIndex, setDuaIndex] =
    useState(
      obtenirIndexDuJour(DUAS.length)
    );

  const [menuOuvert, setMenuOuvert] =
    useState(false);

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
  // MENU SELON LES PERMISSIONS
  // ==========================================================

  const rubriquesAutorisees = useMemo(() => {
    if (!utilisateur) {
      return [];
    }

    return RUBRIQUES.filter((rubrique) =>
      aPermission(rubrique.permission)
    );
  }, [
    utilisateur,
    aPermission,
  ]);


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
  // DU'A
  // ==========================================================

  useEffect(() => {
    const index =
      Math.floor(obtenirCleJour() / 7) %
      DUAS.length;

    setDuaIndex(index);
  }, []);


  // ==========================================================
  // HORAIRES DE PRIERE
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

      const params =
        new URLSearchParams({
          city: VILLE,
          country: PAYS,
          method: "3",
        });

      const url =
        `https://api.aladhan.com/v1/timingsByCity/${jour}-${mois}-${annee}?${params.toString()}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Erreur API horaires (${response.status})`
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

      setHoraires(donnees.data);
    } catch (err) {
      console.error(
        "Erreur horaires de prière :",
        err
      );

      setHoraires(null);

      setErreurHoraires(
        err?.message ||
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

  const chargerCommunications =
    async () => {
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
      } catch (err) {
        console.error(
          "Erreur communications :",
          err
        );

        setErreurCommunications(
          obtenirMessageErreur(err)
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
  // NOTIFICATIONS PUSH
  // ==========================================================

  const activerNotifications = async () => {
    setActivationNotifications(true);
    setErreurNotifications("");

    try {
      const token =
        await demanderTokenNotification();

      if (!token) {
        setErreurNotifications(
          "Les notifications n'ont pas pu être activées."
        );

        return;
      }

      const response =
        await api.post(
          "/notifications/appareil",
          {
            token,
            plateforme: "web",
          }
        );

      console.log(
        "APPAREIL FCM ENREGISTRÉ :",
        response.data
      );

      setNotificationsActivees(true);
    } catch (error) {
      console.error(
        "Erreur activation notifications :",
        error
      );

      const detail =
        error?.response?.data?.detail;

      setErreurNotifications(
        typeof detail === "string"
          ? detail
          : "Impossible d'activer les notifications."
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
        heure: formaterHeure(timings.Fajr),
        icone: Sunrise,
      },
      {
        nom: "Dhuhr",
        heure: formaterHeure(timings.Dhuhr),
        icone: Sun,
      },
      {
        nom: "Asr",
        heure: formaterHeure(timings.Asr),
        icone: Sun,
      },
      {
        nom: "Maghrib",
        heure: formaterHeure(timings.Maghrib),
        icone: Sunset,
      },
      {
        nom: "Isha",
        heure: formaterHeure(timings.Isha),
        icone: Moon,
      },
    ];
  }, [horaires]);


  // ==========================================================
  // PROCHAINE PRIERE
  // ==========================================================

  const prochainePriere =
    useMemo(() => {
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


  const prochainePriereFinale =
    prochainePriere ||
    (prieres.length
      ? {
          ...prieres[0],
          date: (() => {
            const demain =
              new Date(maintenant);

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
          (totalSecondes % 3600) / 60
        );

      const secondes =
        totalSecondes % 60;

      return [
        String(heures).padStart(2, "0"),
        String(minutes).padStart(2, "0"),
        String(secondes).padStart(2, "0"),
      ].join(":");
    }, [
      prochainePriereFinale,
      maintenant,
    ]);


  // ==========================================================
  // DONNEES DU JOUR
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

  const dua = DUAS[duaIndex];


  const indexProchainePriere =
    prieres.findIndex(
      (priere) =>
        prochainePriereFinale?.nom ===
        priere.nom
    );


  const prenom =
    obtenirPrenom(utilisateur);


  // ==========================================================
  // CHARGEMENT
  // ==========================================================

  if (chargement) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7f2]">
        <div className="text-center">
          <RefreshCw
            size={32}
            className="mx-auto text-emerald-700 animate-spin"
          />

          <p className="mt-3 text-slate-500">
            Chargement de votre espace...
          </p>
        </div>
      </div>
    );
  }


  // ==========================================================
  // NON CONNECTE
  // ==========================================================

  if (!utilisateur) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  // ==========================================================
  // RENDU
  // ==========================================================

  return (
    <div className="min-h-screen bg-[#f8f7f2] text-slate-900">


      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <header className="sticky top-0 z-50 border-b border-emerald-900/10 bg-white/95 backdrop-blur-xl">

        <div className="mx-auto max-w-7xl px-5">

          <div className="flex h-[76px] items-center justify-between">


            {/* LOGO */}

            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-3"
            >

              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-emerald-950 shadow-sm">

                <img
                  src="/logo.png"
                  alt="Dahira Mawahibou Naafih"
                  className="h-full w-full object-contain"
                />

              </div>


              <div className="hidden text-left sm:block">

                <p className="text-[15px] font-black tracking-tight text-emerald-950">
                  Dahira Mawahibou Naafih
                </p>

                <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                  Espace membre
                </p>

              </div>

            </button>


            {/* MENU DESKTOP */}

            <nav className="hidden items-center gap-1 lg:flex">

              {rubriquesAutorisees
                .slice(0, 6)
                .map((rubrique) => {

                  const Icon =
                    rubrique.icon;

                  return (
                    <button
                      key={rubrique.id}
                      type="button"
                      onClick={() =>
                        navigate(
                          rubrique.route
                        )
                      }
                      className="group inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-800"
                    >

                      <Icon
                        size={16}
                        className="transition group-hover:text-[#b88b28]"
                      />

                      {rubrique.nom}

                    </button>
                  );
                })}


              {rubriquesAutorisees.length >
                6 && (
                <button
                  type="button"
                  onClick={() =>
                    setMenuOuvert(
                      !menuOuvert
                    )
                  }
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    menuOuvert
                      ? "bg-emerald-950 text-white"
                      : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-800"
                  }`}
                >

                  <Menu size={17} />

                  Menu

                  <ChevronDown
                    size={14}
                    className={
                      menuOuvert
                        ? "rotate-180 transition"
                        : "transition"
                    }
                  />

                </button>
              )}

            </nav>


            {/* PROFIL + MOBILE */}

            <div className="flex items-center gap-2">


              <button
                type="button"
                onClick={() =>
                  navigate("/mon-espace")
                }
                className="hidden items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-emerald-50 sm:flex"
              >

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-950 text-sm font-black text-[#d6ac47]">

                  {prenom
                    ?.charAt(0)
                    ?.toUpperCase()}

                </div>


                <div className="text-left">

                  <p className="text-sm font-bold text-emerald-950">
                    {prenom}
                  </p>

                  <p className="text-[11px] text-slate-400">
                    Mon espace
                  </p>

                </div>

              </button>


              <button
                type="button"
                onClick={() =>
                  setMenuOuvert(
                    !menuOuvert
                  )
                }
                className="flex h-11 w-11 items-center justify-center rounded-2xl text-emerald-950 transition hover:bg-emerald-50 lg:hidden"
                aria-label="Ouvrir le menu"
              >

                {menuOuvert ? (
                  <X size={22} />
                ) : (
                  <Menu size={22} />
                )}

              </button>

            </div>

          </div>


          {/* ==================================================
              MENU MOBILE
          ================================================== */}

          {menuOuvert && (
            <div className="border-t border-slate-100 py-4 lg:hidden">

              <div className="mb-4 flex items-center gap-3 rounded-2xl bg-emerald-950 p-4 text-white">

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 font-black text-[#d6ac47]">

                  {prenom
                    ?.charAt(0)
                    ?.toUpperCase()}

                </div>

                <div>

                  <p className="font-bold">
                    As Salam 'Aleykum {prenom}
                  </p>

                  <p className="text-xs text-white/60">
                    Votre espace membre
                  </p>

                </div>

              </div>


              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">

                {rubriquesAutorisees.map(
                  (rubrique) => {

                    const Icon =
                      rubrique.icon;

                    return (
                      <button
                        key={rubrique.id}
                        type="button"
                        onClick={() => {
                          navigate(
                            rubrique.route
                          );

                          setMenuOuvert(false);
                        }}
                        className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 text-left shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                      >

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-950 group-hover:text-[#d6ac47]">

                          <Icon size={18} />

                        </div>

                        <div className="min-w-0">

                          <p className="text-sm font-bold text-emerald-950">
                            {rubrique.nom}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-slate-400">
                            {rubrique.description}
                          </p>

                        </div>

                        <ChevronRight
                          size={16}
                          className="ml-auto shrink-0 text-slate-300"
                        />

                      </button>
                    );
                  }
                )}

              </div>

            </div>
          )}

        </div>


        {/* ==================================================
            MENU COMPLET DESKTOP
        ================================================== */}

        {menuOuvert &&
          rubriquesAutorisees.length > 6 && (
            <div className="hidden border-t border-emerald-900/10 bg-[#fafaf7] lg:block">

              <div className="mx-auto max-w-7xl px-5 py-6">

                <div className="mb-5 flex items-end justify-between">

                  <div>

                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#b88b28]">
                      Navigation
                    </p>

                    <h2 className="mt-2 text-2xl font-black text-emerald-950">
                      Toutes les rubriques
                    </h2>

                  </div>

                  <p className="max-w-sm text-right text-sm text-slate-400">
                    Accédez aux fonctionnalités disponibles
                    selon vos droits.
                  </p>

                </div>


                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">

                  {rubriquesAutorisees.map(
                    (rubrique) => {

                      const Icon =
                        rubrique.icon;

                      return (
                        <button
                          key={rubrique.id}
                          type="button"
                          onClick={() => {
                            navigate(
                              rubrique.route
                            );

                            setMenuOuvert(false);
                          }}
                          className="group rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
                        >

                          <div className="flex items-start justify-between">

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-950 group-hover:text-[#d6ac47]">

                              <Icon size={20} />

                            </div>

                            <ArrowRight
                              size={16}
                              className="text-slate-200 transition group-hover:text-[#b88b28]"
                            />

                          </div>


                          <p className="mt-4 font-bold text-emerald-950">
                            {rubrique.nom}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-400">
                            {rubrique.description}
                          </p>

                        </button>
                      );
                    }
                  )}

                </div>

              </div>

            </div>
          )}

      </header>


      {/* ======================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden bg-emerald-950 text-white">

        <div className="absolute inset-0 opacity-20">

          <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full border border-[#d6ac47]/30" />

          <div className="absolute right-20 top-20 h-96 w-96 rounded-full border border-white/10" />

          <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full border border-[#d6ac47]/20" />

        </div>


        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:py-16 lg:py-20">

          <div className="grid gap-10 lg:grid-cols-[1fr_330px] lg:items-center">


            {/* TEXTE */}

            <div className="max-w-3xl">

              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#e7c96b]">

                <Sparkles size={14} />

                Espace membre

              </div>


              <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">

                As Salam
                <span className="text-[#d6ac47]">
                  {" "}‘Aleykum
                </span>

                <span className="block">
                  {prenom}
                </span>

              </h1>


              <p className="mt-5 max-w-2xl text-base leading-8 text-white/65 sm:text-lg">

                Bienvenue dans votre espace personnel.
                Retrouvez les informations essentielles
                du Dahira, les horaires de prière,
                les rappels et les communications
                de notre communauté.

              </p>


              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-white/60">

                <span className="inline-flex items-center gap-2">
                  <CalendarDays
                    size={16}
                    className="text-[#d6ac47]"
                  />

                  {formaterDateComplete(
                    maintenant
                  )}
                </span>


                <span className="hidden text-white/20 sm:block">
                  •
                </span>


                <span className="inline-flex items-center gap-2">
                  <MapPin
                    size={16}
                    className="text-[#d6ac47]"
                  />

                  Dakar, Sénégal
                </span>

              </div>

            </div>


            {/* HORLOGE */}

            <div>

              <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur">

                <div className="flex items-center gap-2 text-sm font-medium text-[#e7c96b]">

                  <Clock3 size={17} />

                  Heure locale

                </div>


                <p className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">

                  {maintenant.toLocaleTimeString(
                    "fr-FR",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    }
                  )}

                </p>


                <p className="mt-2 text-sm text-white/50">
                  {formaterDateCourte(
                    maintenant
                  )}
                </p>


                <div className="mt-5 h-px bg-white/10" />


                <div className="mt-4 flex items-center gap-2 text-xs text-white/50">

                  <Compass
                    size={14}
                    className="text-[#d6ac47]"
                  />

                  Horaires calculés pour Dakar

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ======================================================
          CONTENU
      ====================================================== */}

      <main className="mx-auto max-w-7xl px-5 py-12 sm:py-14">


        {/* ====================================================
            NOTIFICATIONS
        ==================================================== */}

        <section className="mb-7">

          <div className="rounded-[2rem] border border-emerald-900/10 bg-white p-5 shadow-sm md:p-6">

            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">

                  <Bell size={21} />

                </div>


                <div>

                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b88b28]">
                    Rester informé
                  </p>

                  <h2 className="mt-1 text-lg font-black text-emerald-950">
                    Notifications du Dahira
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Recevez les nouvelles communications
                    directement sur votre appareil.
                  </p>


                  {notificationsActivees && (
                    <p className="mt-2 text-sm font-semibold text-emerald-600">
                      ✓ Notifications activées
                    </p>
                  )}


                  {erreurNotifications && (
                    <p className="mt-2 text-sm text-red-600">
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
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {activationNotifications ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="animate-spin"
                      />

                      Activation...
                    </>
                  ) : (
                    <>
                      <Bell size={17} />

                      Activer les notifications
                    </>
                  )}

                </button>
              )}

            </div>

          </div>

        </section>


        {/* ====================================================
            PROCHAINE PRIERE
        ==================================================== */}

        <section className="mb-8">

          <div className="grid gap-5 lg:grid-cols-3">


            {/* PRIERE */}

            <div className="relative overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-emerald-900/10 lg:col-span-2">

              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-50" />

              <div className="relative p-6 md:p-8">

                <div className="flex flex-col justify-between gap-7 md:flex-row md:items-center">

                  <div>

                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#b88b28]">

                      <Compass size={17} />

                      Prochaine prière

                    </div>


                    {chargementHoraires ? (
                      <div className="mt-5">

                        <RefreshCw
                          size={30}
                          className="text-emerald-700 animate-spin"
                        />

                        <p className="mt-3 text-sm text-slate-500">
                          Chargement des horaires...
                        </p>

                      </div>
                    ) : erreurHoraires ? (
                      <div className="mt-5">

                        <div className="flex items-start gap-2 text-red-600">

                          <AlertCircle size={19} />

                          <span className="text-sm">
                            {erreurHoraires}
                          </span>

                        </div>


                        <button
                          type="button"
                          onClick={
                            chargerHoraires
                          }
                          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-900"
                        >

                          <RefreshCw size={15} />

                          Réessayer

                        </button>

                      </div>
                    ) : prochainePriereFinale ? (
                      <>

                        <h2 className="mt-3 text-3xl font-black text-emerald-950 md:text-4xl">

                          {
                            prochainePriereFinale.nom
                          }

                        </h2>


                        <div className="mt-2 flex items-baseline gap-3">

                          <span className="text-5xl font-black tracking-tight text-emerald-800 md:text-6xl">

                            {
                              prochainePriereFinale.heure
                            }

                          </span>

                          <span className="text-sm text-slate-400">
                            à Dakar
                          </span>

                        </div>

                      </>
                    ) : (
                      <p className="mt-4 text-sm text-slate-500">
                        Horaires indisponibles.
                      </p>
                    )}

                  </div>


                  {prochainePriereFinale &&
                    !erreurHoraires && (
                      <div className="shrink-0 rounded-2xl border border-emerald-900/10 bg-emerald-950 px-6 py-5 text-center text-white">

                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d6ac47]">
                          Dans
                        </p>

                        <p className="mt-1 font-mono text-2xl font-black md:text-3xl">
                          {compteARebours}
                        </p>

                      </div>
                    )}

                </div>

              </div>

            </div>


            {/* LOCALISATION */}

            <div className="rounded-[2rem] bg-emerald-950 p-6 text-white shadow-sm">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#d6ac47]">

                  <MapPin size={20} />

                </div>

                <div>

                  <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                    Localisation
                  </p>

                  <p className="mt-1 font-bold">
                    Dakar, Sénégal
                  </p>

                </div>

              </div>


              <div className="mt-7 border-t border-white/10 pt-6">

                <p className="text-xs uppercase tracking-[0.16em] text-[#d6ac47]">
                  Aujourd'hui
                </p>

                <p className="mt-2 text-xl font-black">
                  {new Intl.DateTimeFormat(
                    "fr-FR",
                    {
                      day: "numeric",
                      month: "long",
                    }
                  ).format(maintenant)}
                </p>

                <p className="mt-3 text-sm leading-6 text-white/50">
                  Les horaires de prière sont
                  calculés pour la ville de Dakar.
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* ====================================================
            HORAIRES
        ==================================================== */}

        <section className="mb-8">

          <div className="mb-4 flex items-end justify-between gap-4">

            <div>

              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b88b28]">
                Spiritualité
              </p>

              <h2 className="mt-2 text-2xl font-black text-emerald-950">
                Horaires des prières
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Les cinq prières quotidiennes
              </p>

            </div>


            <button
              type="button"
              onClick={chargerHoraires}
              disabled={chargementHoraires}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-900/10 bg-white px-3 py-2 text-sm font-semibold text-slate-500 transition hover:border-emerald-200 hover:text-emerald-800 disabled:opacity-50"
            >

              <RefreshCw
                size={15}
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


          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">

            {prieres.map(
              (priere, index) => {

                const Icon =
                  priere.icone;

                const estProchaine =
                  index ===
                  indexProchainePriere;

                return (
                  <div
                    key={priere.nom}
                    className={`rounded-2xl border p-4 transition ${
                      estProchaine
                        ? "border-emerald-950 bg-emerald-950 text-white shadow-lg shadow-emerald-900/10"
                        : "border-slate-100 bg-white text-slate-900 shadow-sm hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
                    }`}
                  >

                    <div className="flex items-center justify-between">

                      <span
                        className={`text-xs font-bold ${
                          estProchaine
                            ? "text-white/50"
                            : "text-slate-400"
                        }`}
                      >
                        {priere.nom}
                      </span>

                      <Icon
                        size={17}
                        className={
                          estProchaine
                            ? "text-[#d6ac47]"
                            : "text-emerald-700"
                        }
                      />

                    </div>


                    <p
                      className={`mt-3 text-2xl font-black ${
                        estProchaine
                          ? "text-white"
                          : "text-emerald-950"
                      }`}
                    >
                      {priere.heure}
                    </p>


                    {estProchaine && (
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#d6ac47]">
                        Prochaine
                      </p>
                    )}

                  </div>
                );
              }
            )}


            {!prieres.length &&
              !chargementHoraires && (
                <div className="col-span-full rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-400">
                  Aucun horaire disponible.
                </div>
              )}

          </div>

        </section>


        {/* ====================================================
            DU'A + RAPPEL
        ==================================================== */}

        <section className="mb-8 grid gap-5 lg:grid-cols-2">


          {/* DU'A */}

          <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-emerald-900/10">

            <div className="bg-emerald-950 p-6 text-white">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#d6ac47]">

                  <Heart size={20} />

                </div>

                <div>

                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d6ac47]">
                    Invocation
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    Du'a de la semaine
                  </h2>

                </div>

              </div>

            </div>


            <div className="p-6">

              <div className="rounded-2xl bg-[#f8f7f2] p-5">

                <p
                  dir="rtl"
                  className="text-right font-serif text-2xl leading-loose text-emerald-950 md:text-3xl"
                >
                  {dua.arabe}
                </p>

              </div>


              <p className="mt-5 text-sm italic leading-relaxed text-slate-500">
                {dua.transliteration}
              </p>


              <div className="mt-4 border-l-4 border-[#b88b28] pl-4">

                <p className="leading-relaxed text-slate-600">
                  {dua.traduction}
                </p>

              </div>


              <div className="mt-5 flex justify-end">

                <button
                  type="button"
                  onClick={() =>
                    setDuaIndex(
                      (duaIndex + 1) %
                        DUAS.length
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-900"
                >

                  Nouvelle invocation

                  <ChevronRight size={16} />

                </button>

              </div>

            </div>

          </div>


          {/* RAPPEL */}

          <div className="relative overflow-hidden rounded-[2rem] border border-[#d6ac47]/20 bg-[#f7f1df] p-6">

            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full border border-[#b88b28]/20" />


            <div className="relative">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-950 text-[#d6ac47]">

                  <Sparkles size={20} />

                </div>

                <div>

                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#a77919]">
                    Méditation
                  </p>

                  <h2 className="mt-1 text-xl font-black text-emerald-950">
                    {rappelDuJour.titre}
                  </h2>

                </div>

              </div>


              <p className="mt-7 text-base leading-8 text-slate-600">
                {rappelDuJour.texte}
              </p>


              <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-emerald-800">

                <Heart size={16} />

                Qu'Allah nous accorde
                la constance et la sincérité.

              </div>

            </div>

          </div>

        </section>


        {/* ====================================================
            KHASSIDA
        ==================================================== */}

        <section className="mb-8">

          <div className="rounded-[2rem] bg-emerald-950 p-6 text-white shadow-sm md:p-7">

            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

              <div className="flex items-start gap-4">

                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#d6ac47]">

                  <BookOpen size={25} />

                </div>


                <div>

                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d6ac47]">
                    Lecture spirituelle
                  </p>

                  <h2 className="mt-1 text-xl font-black md:text-2xl">
                    {khassidaDuJour.titre}
                  </h2>

                  <p className="mt-2 max-w-2xl leading-7 text-white/55">
                    {khassidaDuJour.description}
                  </p>

                </div>

              </div>


              <div className="flex flex-wrap gap-2">

                <button
                  type="button"
                  onClick={() =>
                    navigate("/khassidas")
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
                >

                  <BookOpen size={16} />

                  Consulter

                </button>


                <button
                  type="button"
                  onClick={() =>
                    navigate("/khassidas")
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d6ac47] px-4 py-2.5 text-sm font-black text-emerald-950 transition hover:bg-[#e3c15f]"
                >

                  <Volume2 size={16} />

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
          <section className="mb-8">

            <div className="mb-5 flex items-end justify-between gap-4">

              <div>

                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b88b28]">
                  Vie du Dahira
                </p>

                <h2 className="mt-2 text-2xl font-black text-emerald-950">
                  Communications
                </h2>

                <p className="mt-1 text-sm text-slate-400">
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
                className="inline-flex items-center gap-1 text-sm font-bold text-emerald-800 transition hover:text-[#a77919]"
              >

                Tout voir

                <ArrowRight size={16} />

              </button>

            </div>


            {chargementCommunications ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center">

                <RefreshCw
                  size={25}
                  className="mx-auto animate-spin text-emerald-700"
                />

                <p className="mt-3 text-sm text-slate-400">
                  Chargement des communications...
                </p>

              </div>
            ) : erreurCommunications ? (
              <div className="rounded-2xl border border-red-100 bg-white p-5">

                <div className="flex items-start gap-3 text-red-600">

                  <AlertCircle size={19} />

                  <p className="text-sm">
                    {erreurCommunications}
                  </p>

                </div>

              </div>
            ) : communications.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-7 text-center">

                <Megaphone
                  size={30}
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
                      type="button"
                      key={communication.id}
                      onClick={() =>
                        navigate(
                          `/communications/${communication.id}`
                        )
                      }
                      className="group rounded-[1.75rem] border border-slate-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
                    >

                      <div className="flex items-center justify-between">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">

                          <Megaphone size={18} />

                        </div>


                        <ArrowRight
                          size={17}
                          className="text-slate-200 transition group-hover:text-[#b88b28]"
                        />

                      </div>


                      <h3 className="mt-4 line-clamp-2 font-bold text-emerald-950">
                        {communication.titre}
                      </h3>


                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                        {communication.contenu}
                      </p>


                      <div className="mt-4 flex items-center gap-2 text-xs text-slate-300">

                        <Calendar size={13} />

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

            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b88b28]">
              Mon espace
            </p>

            <h2 className="mt-2 text-2xl font-black text-emerald-950">
              Accès rapides
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Retrouvez rapidement les services qui vous sont accessibles.
            </p>

          </div>


          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {aPermission(
              "REUNION_CONSULTER"
            ) && (
              <button
                type="button"
                onClick={() =>
                  navigate("/reunions")
                }
                className="group rounded-[1.75rem] border border-slate-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
              >

                <div className="flex items-center justify-between">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">

                    <Calendar size={19} />

                  </div>

                  <ArrowRight
                    size={17}
                    className="text-slate-200 transition group-hover:text-[#b88b28]"
                  />

                </div>


                <h3 className="mt-5 font-black text-emerald-950">
                  Réunions
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Consultez les prochaines réunions.
                </p>

              </button>
            )}


            {aPermission(
              "COMMUNICATION_CONSULTER"
            ) && (
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/communications"
                  )
                }
                className="group rounded-[1.75rem] border border-slate-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
              >

                <div className="flex items-center justify-between">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">

                    <Megaphone size={19} />

                  </div>

                  <ArrowRight
                    size={17}
                    className="text-slate-200 transition group-hover:text-[#b88b28]"
                  />

                </div>


                <h3 className="mt-5 font-black text-emerald-950">
                  Communications
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Consultez les annonces du Dahira.
                </p>

              </button>
            )}


            {aPermission(
              "KOUREL_CONSULTER"
            ) && (
              <button
                type="button"
                onClick={() =>
                  navigate("/khassidas")
                }
                className="group rounded-[1.75rem] border border-slate-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
              >

                <div className="flex items-center justify-between">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">

                    <BookOpen size={19} />

                  </div>

                  <ArrowRight
                    size={17}
                    className="text-slate-200 transition group-hover:text-[#b88b28]"
                  />

                </div>


                <h3 className="mt-5 font-black text-emerald-950">
                  Khassidas
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Consultez les Khassidas disponibles.
                </p>

              </button>
            )}


            {aPermission(
              "NOTIFICATION_CONSULTER"
            ) && (
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/notifications"
                  )
                }
                className="group rounded-[1.75rem] border border-slate-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
              >

                <div className="flex items-center justify-between">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">

                    <Bell size={19} />

                  </div>

                  <ArrowRight
                    size={17}
                    className="text-slate-200 transition group-hover:text-[#b88b28]"
                  />

                </div>


                <h3 className="mt-5 font-black text-emerald-950">
                  Notifications
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Consultez vos notifications.
                </p>

              </button>
            )}

          </div>

        </section>


        {/* ====================================================
            FOOTER SPIRITUEL
        ==================================================== */}

        <section className="relative overflow-hidden rounded-[2rem] bg-emerald-950 p-7 text-white md:p-9">

          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border border-[#d6ac47]/20" />

          <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full border border-white/10" />


          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div>

              <div className="flex items-center gap-2 text-sm font-bold text-[#d6ac47]">

                <Heart size={16} />

                Rappel

              </div>


              <h2 className="mt-2 text-xl font-black md:text-2xl">
                Qu'Allah bénisse votre journée.
              </h2>


              <p className="mt-2 max-w-2xl leading-7 text-white/50">

                Que chaque prière, chaque invocation
                et chaque bonne action soit une source
                de lumière, de paix et de bénédiction.

              </p>

            </div>


            <div className="flex shrink-0 items-center gap-3">

              <Volume2
                size={23}
                className="text-[#d6ac47]"
              />

              <span className="text-sm text-white/50">
                Dhikr • Prière • Fraternité
              </span>

            </div>

          </div>

        </section>

      </main>


      {/* ======================================================
          PETIT PIED DE PAGE
      ====================================================== */}

      <footer className="border-t border-emerald-900/10 bg-white">

        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-center text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:text-left">

          <p>
            © {new Date().getFullYear()} Dahira Mawahibou Naafih
          </p>

          <p>
            Spiritualité • Fraternité • Solidarité
          </p>

        </div>

      </footer>

    </div>
  );
}

export default MonEspace;