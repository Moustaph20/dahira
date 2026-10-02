import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import {
  AlertCircle,
  ArrowRight,
  Bell,
  BookOpen,
  Calendar,
  CalendarDays,
  ChevronRight,
  Clock3,
  Compass,
  Heart,
  MapPin,
  Megaphone,
  RefreshCw,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Users,
  Volume2,
  Wallet,
  Moon,
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
    traduction: "Seigneur, augmente-moi en connaissance.",
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
  if (!longueur) return 0;

  return obtenirCleJour() % longueur;
};

const formaterHeure = (heure) => {
  if (!heure) return "--:--";

  return heure.substring(0, 5);
};

const convertirHeureEnDate = (heure, date = new Date()) => {
  if (!heure) return null;

  const [h, m] = heure
    .substring(0, 5)
    .split(":")
    .map(Number);

  if (Number.isNaN(h) || Number.isNaN(m)) {
    return null;
  }

  const resultat = new Date(date);

  resultat.setHours(h, m, 0, 0);

  return resultat;
};

const formaterDateComplete = (date) =>
  new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

const formaterDateCourte = (date) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

const obtenirPrenom = (utilisateur) =>
  utilisateur?.membre?.prenom ||
  utilisateur?.prenom ||
  utilisateur?.nom_complet?.split(" ")[0] ||
  utilisateur?.identifiant ||
  "Membre";

const obtenirMessageErreur = (erreur) => {
  const detail = erreur?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || "Erreur de validation.")
      .join(" ");
  }

  return erreur?.message || "Une erreur est survenue.";
};

// ============================================================
// PETITS COMPOSANTS UI
// ============================================================

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#a77919] sm:text-xs">
            {eyebrow}
          </p>
        )}

        <h2 className="mt-1.5 text-xl font-black tracking-tight text-emerald-950 sm:text-2xl">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}

function AccessCard({
  icon: Icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-950 group-hover:text-[#d6ac47]">
          <Icon size={18} />
        </div>

        <ArrowRight
          size={16}
          className="mt-1 shrink-0 text-slate-300 transition group-hover:text-[#b88b28]"
        />
      </div>

      <h3 className="mt-4 font-black text-emerald-950">
        {title}
      </h3>

      <p className="mt-1 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </button>
  );
}

// ============================================================
// COMPOSANT PRINCIPAL
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

  const [maintenant, setMaintenant] = useState(new Date());

  const [horaires, setHoraires] = useState(null);
  const [chargementHoraires, setChargementHoraires] =
    useState(true);
  const [erreurHoraires, setErreurHoraires] =
    useState("");

  const [communications, setCommunications] = useState([]);
  const [chargementCommunications, setChargementCommunications] =
    useState(false);
  const [erreurCommunications, setErreurCommunications] =
    useState("");

  const [duaIndex, setDuaIndex] = useState(
    obtenirIndexDuJour(DUAS.length)
  );

  const [activationNotifications, setActivationNotifications] =
    useState(false);

  const [notificationsActivees, setNotificationsActivees] =
    useState(false);

  const [erreurNotifications, setErreurNotifications] =
    useState("");

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
      Math.floor(obtenirCleJour() / 7) % DUAS.length;

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

      const jour = String(date.getDate()).padStart(2, "0");
      const mois = String(date.getMonth() + 1).padStart(2, "0");
      const annee = date.getFullYear();

      const params = new URLSearchParams({
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

      const donnees = await response.json();

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

  const chargerCommunications = async () => {
    if (!aPermission("COMMUNICATION_CONSULTER")) {
      return;
    }

    setChargementCommunications(true);
    setErreurCommunications("");

    try {
      const donnees = await getCommunications({
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

      const response = await api.post(
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
  }, [prieres, maintenant]);

  const prochainePriereFinale =
    prochainePriere ||
    (prieres.length
      ? {
          ...prieres[0],
          date: (() => {
            const demain = new Date(maintenant);

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

  const compteARebours = useMemo(() => {
    if (!prochainePriereFinale?.date) {
      return "--:--:--";
    }

    let difference =
      prochainePriereFinale.date.getTime() -
      maintenant.getTime();

    if (difference < 0) {
      difference = 0;
    }

    const totalSecondes = Math.floor(
      difference / 1000
    );

    const heures = Math.floor(
      totalSecondes / 3600
    );

    const minutes = Math.floor(
      (totalSecondes % 3600) / 60
    );

    const secondes = totalSecondes % 60;

    return [
      String(heures).padStart(2, "0"),
      String(minutes).padStart(2, "0"),
      String(secondes).padStart(2, "0"),
    ].join(":");
  }, [prochainePriereFinale, maintenant]);

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

  const prenom = obtenirPrenom(utilisateur);

  // ==========================================================
  // CHARGEMENT
  // ==========================================================

  if (chargement) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-7 text-center shadow-sm">
          <RefreshCw
            size={30}
            className="mx-auto animate-spin text-emerald-700"
          />

          <p className="mt-3 text-sm font-medium text-slate-500">
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
    <div className="w-full min-w-0">

      {/* ======================================================
          EN-TETE DE PAGE
      ====================================================== */}

      <section className="mb-6 overflow-hidden rounded-2xl border border-emerald-900/10 bg-emerald-950 text-white shadow-sm sm:mb-7 lg:rounded-3xl">

        <div className="relative overflow-hidden">

          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full border border-[#d6ac47]/20" />

          <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full border border-white/5" />

          <div className="relative p-5 sm:p-7 lg:p-8">

            <div className="flex flex-col gap-7 xl:flex-row xl:items-center xl:justify-between">

              {/* IDENTITE */}

              <div className="min-w-0">

                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#e7c96b]">
                  <Sparkles size={13} />
                  Mon espace
                </div>

                <h1 className="mt-4 break-words text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
                  As Salam 'Aleykum{" "}
                  <span className="text-[#d6ac47]">
                    {prenom}
                  </span>
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
                  Bienvenue dans votre espace personnel.
                  Retrouvez ici les informations essentielles
                  de votre Dahira et les services auxquels
                  vous avez accès.
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/55 sm:text-sm">

                  <span className="inline-flex items-center gap-2">
                    <CalendarDays
                      size={15}
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
                      size={15}
                      className="text-[#d6ac47]"
                    />

                    Dakar, Sénégal
                  </span>

                </div>

              </div>

              {/* HEURE */}

              <div className="w-full shrink-0 xl:w-[270px]">

                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur sm:p-5">

                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#e7c96b]">
                    <Clock3 size={15} />
                    Heure locale
                  </div>

                  <p className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                    {maintenant.toLocaleTimeString(
                      "fr-FR",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      }
                    )}
                  </p>

                  <p className="mt-1 text-xs text-white/40">
                    {formaterDateCourte(
                      maintenant
                    )}
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ======================================================
          NOTIFICATIONS
      ====================================================== */}

      <section className="mb-6">

        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex min-w-0 items-start gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Bell size={18} />
            </div>

            <div className="min-w-0">

              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a77919]">
                Notifications
              </p>

              <h2 className="mt-1 font-black text-emerald-950">
                Rester informé
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Recevez directement les nouvelles
                communications du Dahira.
              </p>

              {notificationsActivees && (
                <p className="mt-2 text-xs font-bold text-emerald-600">
                  ✓ Notifications activées
                </p>
              )}

              {erreurNotifications && (
                <p className="mt-2 break-words text-xs text-red-600">
                  {erreurNotifications}
                </p>
              )}

            </div>

          </div>

          {!notificationsActivees && (
            <button
              type="button"
              onClick={activerNotifications}
              disabled={activationNotifications}
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto"
            >
              {activationNotifications ? (
                <>
                  <RefreshCw
                    size={16}
                    className="animate-spin"
                  />
                  Activation...
                </>
              ) : (
                <>
                  <Bell size={16} />
                  Activer les notifications
                </>
              )}
            </button>
          )}

        </div>

      </section>

      {/* ======================================================
          PROCHAINE PRIERE
      ====================================================== */}

      <section className="mb-6">

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">

          {/* PRIERE */}

          <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">

            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald-50" />

            <div className="relative p-5 sm:p-6 lg:p-7">

              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

                <div className="min-w-0">

                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.17em] text-[#a77919] sm:text-xs">
                    <Compass size={15} />
                    Prochaine prière
                  </div>

                  {chargementHoraires ? (
                    <div className="mt-5 flex items-center gap-3">
                      <RefreshCw
                        size={24}
                        className="animate-spin text-emerald-700"
                      />

                      <p className="text-sm text-slate-500">
                        Chargement des horaires...
                      </p>
                    </div>
                  ) : erreurHoraires ? (
                    <div className="mt-5">

                      <div className="flex items-start gap-2 text-red-600">
                        <AlertCircle
                          size={18}
                          className="mt-0.5 shrink-0"
                        />

                        <span className="text-sm">
                          {erreurHoraires}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={chargerHoraires}
                        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-900"
                      >
                        <RefreshCw size={14} />
                        Réessayer
                      </button>

                    </div>
                  ) : prochainePriereFinale ? (
                    <>
                      <h2 className="mt-3 text-2xl font-black text-emerald-950 sm:text-3xl">
                        {prochainePriereFinale.nom}
                      </h2>

                      <div className="mt-1 flex flex-wrap items-baseline gap-2">
                        <span className="text-4xl font-black tracking-tight text-emerald-800 sm:text-5xl">
                          {prochainePriereFinale.heure}
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
                    <div className="shrink-0 rounded-2xl bg-emerald-950 px-6 py-4 text-center text-white">

                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d6ac47]">
                        Dans
                      </p>

                      <p className="mt-1 font-mono text-2xl font-black">
                        {compteARebours}
                      </p>

                    </div>
                  )}

              </div>

            </div>

          </div>

          {/* LOCALISATION */}

          <div className="rounded-2xl bg-emerald-950 p-5 text-white shadow-sm sm:p-6">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#d6ac47]">
                <MapPin size={18} />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">
                  Localisation
                </p>

                <p className="mt-1 font-bold">
                  Dakar, Sénégal
                </p>
              </div>

            </div>

            <div className="mt-5 border-t border-white/10 pt-5">

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

              <p className="mt-2 text-xs leading-5 text-white/45">
                Horaires calculés pour la ville de Dakar.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* ======================================================
          HORAIRES DES PRIERES
      ====================================================== */}

      <section className="mb-6">

        <SectionHeader
          eyebrow="Spiritualité"
          title="Horaires des prières"
          description="Les cinq prières quotidiennes."
          action={
            <button
              type="button"
              onClick={chargerHoraires}
              disabled={chargementHoraires}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-800 disabled:opacity-50"
            >
              <RefreshCw
                size={14}
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
          }
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">

          {prieres.map((priere, index) => {
            const Icon = priere.icone;

            const estProchaine =
              index === indexProchainePriere;

            return (
              <div
                key={priere.nom}
                className={`rounded-2xl border p-4 transition ${
                  estProchaine
                    ? "border-emerald-950 bg-emerald-950 text-white shadow-md"
                    : "border-slate-200/80 bg-white shadow-sm hover:border-emerald-200 hover:shadow-md"
                }`}
              >

                <div className="flex items-center justify-between gap-2">

                  <span
                    className={`text-xs font-bold ${
                      estProchaine
                        ? "text-white/55"
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
                  className={`mt-3 text-2xl font-black ${
                    estProchaine
                      ? "text-white"
                      : "text-emerald-950"
                  }`}
                >
                  {priere.heure}
                </p>

                {estProchaine && (
                  <p className="mt-1 text-[9px] font-black uppercase tracking-wide text-[#d6ac47]">
                    Prochaine
                  </p>
                )}

              </div>
            );
          })}

          {!prieres.length &&
            !chargementHoraires && (
              <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-7 text-center text-sm text-slate-400">
                Aucun horaire disponible.
              </div>
            )}

        </div>

      </section>

      {/* ======================================================
          DU'A + RAPPEL
      ====================================================== */}

      <section className="mb-6 grid gap-4 lg:grid-cols-2">

        {/* DU'A */}

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">

          <div className="border-b border-slate-100 bg-emerald-950 p-5 text-white sm:p-6">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#d6ac47]">
                <Heart size={18} />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#d6ac47]">
                  Invocation
                </p>

                <h2 className="mt-1 font-black">
                  Du'a de la semaine
                </h2>
              </div>

            </div>

          </div>

          <div className="p-5 sm:p-6">

            <div className="rounded-xl bg-[#f8f7f2] p-4 sm:p-5">

              <p
                dir="rtl"
                className="break-words text-right font-serif text-xl leading-[2.1] text-emerald-950 sm:text-2xl"
              >
                {dua.arabe}
              </p>

            </div>

            <p className="mt-4 text-sm italic leading-6 text-slate-500">
              {dua.transliteration}
            </p>

            <div className="mt-4 border-l-4 border-[#b88b28] pl-4">

              <p className="text-sm leading-6 text-slate-600">
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-900 sm:w-auto"
              >
                Nouvelle invocation
                <ChevronRight size={15} />
              </button>

            </div>

          </div>

        </div>

        {/* RAPPEL */}

        <div className="relative overflow-hidden rounded-2xl border border-[#d6ac47]/20 bg-[#f7f1df] p-5 shadow-sm sm:p-6">

          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full border border-[#b88b28]/20" />

          <div className="relative">

            <div className="flex items-start gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-950 text-[#d6ac47]">
                <Sparkles size={18} />
              </div>

              <div className="min-w-0">

                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a77919]">
                  Méditation
                </p>

                <h2 className="mt-1 text-lg font-black text-emerald-950 sm:text-xl">
                  {rappelDuJour.titre}
                </h2>

              </div>

            </div>

            <p className="mt-6 text-sm leading-7 text-slate-600 sm:text-base">
              {rappelDuJour.texte}
            </p>

            <div className="mt-6 flex items-start gap-2 text-sm font-semibold leading-6 text-emerald-800">

              <Heart
                size={16}
                className="mt-1 shrink-0"
              />

              <span>
                Qu'Allah nous accorde la constance
                et la sincérité.
              </span>

            </div>

          </div>

        </div>

      </section>

      {/* ======================================================
          KHASSIDA
      ====================================================== */}

      <section className="mb-6">

        <div className="rounded-2xl bg-emerald-950 p-5 text-white shadow-sm sm:p-6 lg:p-7">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex min-w-0 items-start gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#d6ac47]">
                <BookOpen size={21} />
              </div>

              <div className="min-w-0">

                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#d6ac47]">
                  Lecture spirituelle
                </p>

                <h2 className="mt-1 text-lg font-black sm:text-xl">
                  {khassidaDuJour.titre}
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                  {khassidaDuJour.description}
                </p>

              </div>

            </div>

            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">

              <button
                type="button"
                onClick={() =>
                  navigate("/khassidas")
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/10 sm:text-sm"
              >
                <BookOpen size={15} />
                Consulter
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/khassidas")
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d6ac47] px-4 py-2.5 text-xs font-black text-emerald-950 transition hover:bg-[#e3c15f] sm:text-sm"
              >
                <Volume2 size={15} />
                Écouter
              </button>

            </div>

          </div>

        </div>

      </section>

      {/* ======================================================
          COMMUNICATIONS
      ====================================================== */}

      {aPermission("COMMUNICATION_CONSULTER") && (
        <section className="mb-6">

          <SectionHeader
            eyebrow="Vie du Dahira"
            title="Communications"
            description="Les dernières informations du Dahira."
            action={
              <button
                type="button"
                onClick={() =>
                  navigate("/communications")
                }
                className="inline-flex items-center gap-1 text-sm font-bold text-emerald-800 transition hover:text-[#a77919]"
              >
                Tout voir
                <ArrowRight size={15} />
              </button>
            }
          />

          {chargementCommunications ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

              <RefreshCw
                size={24}
                className="mx-auto animate-spin text-emerald-700"
              />

              <p className="mt-3 text-sm text-slate-400">
                Chargement des communications...
              </p>

            </div>
          ) : erreurCommunications ? (
            <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">

              <div className="flex items-start gap-3 text-red-600">

                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <p className="text-sm">
                  {erreurCommunications}
                </p>

              </div>

            </div>
          ) : communications.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

              <Megaphone
                size={28}
                className="mx-auto text-slate-200"
              />

              <p className="mt-3 text-sm text-slate-400">
                Aucune communication récente.
              </p>

            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">

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
                    className="group min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md sm:p-5"
                  >

                    <div className="flex items-center justify-between">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                        <Megaphone size={18} />
                      </div>

                      <ArrowRight
                        size={16}
                        className="text-slate-300 transition group-hover:text-[#b88b28]"
                      />

                    </div>

                    <h3 className="mt-4 line-clamp-2 font-black text-emerald-950">
                      {communication.titre}
                    </h3>

                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                      {communication.contenu}
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">

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

      {/* ======================================================
          ACCES RAPIDES
      ====================================================== */}

      <section className="mb-6">

        <SectionHeader
          eyebrow="Mon espace"
          title="Accès rapides"
          description="Retrouvez rapidement les services accessibles selon vos droits."
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

          {aPermission("REUNION_CONSULTER") && (
            <AccessCard
              icon={Calendar}
              title="Réunions"
              description="Consultez les prochaines réunions."
              onClick={() =>
                navigate("/reunions")
              }
            />
          )}

          {aPermission("COMMUNICATION_CONSULTER") && (
            <AccessCard
              icon={Megaphone}
              title="Communications"
              description="Consultez les annonces du Dahira."
              onClick={() =>
                navigate("/communications")
              }
            />
          )}

          {aPermission("KOUREL_CONSULTER") && (
            <AccessCard
              icon={BookOpen}
              title="Khassidas"
              description="Consultez les Khassidas disponibles."
              onClick={() =>
                navigate("/khassidas")
              }
            />
          )}

          {aPermission("NOTIFICATION_CONSULTER") && (
            <AccessCard
              icon={Bell}
              title="Notifications"
              description="Consultez vos notifications."
              onClick={() =>
                navigate("/notifications")
              }
            />
          )}

          {aPermission("COTISATION_CONSULTER") && (
            <AccessCard
              icon={Wallet}
              title="Cotisations"
              description="Consultez les cotisations accessibles."
              onClick={() =>
                navigate("/cotisations")
              }
            />
          )}

          {aPermission("MEMBRE_CONSULTER") && (
            <AccessCard
              icon={Users}
              title="Membres"
              description="Accédez à l'espace des membres."
              onClick={() =>
                navigate("/membres")
              }
            />
          )}

        </div>

      </section>

      {/* ======================================================
          RAPPEL FINAL
      ====================================================== */}

      <section className="overflow-hidden rounded-2xl bg-emerald-950 p-5 text-white shadow-sm sm:p-6 lg:p-7">

        <div className="relative">

          <div className="absolute -right-16 -top-20 h-40 w-40 rounded-full border border-[#d6ac47]/15" />

          <div className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full border border-white/5" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="min-w-0">

              <div className="flex items-center gap-2 text-sm font-bold text-[#d6ac47]">
                <Heart size={15} />
                Rappel
              </div>

              <h2 className="mt-2 text-lg font-black sm:text-xl">
                Qu'Allah bénisse votre journée.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                Que chaque prière, chaque invocation
                et chaque bonne action soit une source
                de lumière, de paix et de bénédiction.
              </p>

            </div>

            <div className="flex shrink-0 items-center gap-3">

              <Volume2
                size={21}
                className="text-[#d6ac47]"
              />

              <span className="text-xs text-white/45 sm:text-sm">
                Dhikr • Prière • Fraternité
              </span>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default MonEspace;