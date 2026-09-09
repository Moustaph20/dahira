
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  Clock3,
  Heart,
  MapPin,
  Menu,
  Moon,
  Play,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";

import guideImage from "../assets/guide.jpg";
import api from "../api/client";

// ============================================================
// CONFIGURATION
// ============================================================

const DAKAR_LAT = 14.7167;
const DAKAR_LON = -17.4677;

const PRIERE_NOMS = {
  Fajr: "Fajr",
  Dhuhr: "Dhuhr",
  Asr: "Asr",
  Maghrib: "Maghrib",
  Isha: "Isha",
};

const RAPPELS = [
  "La constance dans le bien ouvre les portes.",
  "Un cœur uni renforce la communauté.",
  "Chaque pas vers le bien compte.",
  "La fraternité est une force.",
  "Servir avec sincérité, c'est avancer ensemble.",
];

const PIONNIERS = [
  {
    nom: "Massata DIALLO",
    fonction: "Pionnier",
  },
  {
    nom: "Diogop MBODJ",
    fonction: "Pionnière",
  },
  {
    nom: "Ousseynou KAMARA",
    fonction: "Pionnier",
  },
];

const HISTORIQUE = [
  {
    periode: "Les débuts",
    titre: "La naissance du Dahira",
    texte:
      "Une communauté réunie autour de la foi et de la fraternité.",
  },
  {
    periode: "La croissance",
    titre: "Une communauté grandissante",
    texte:
      "Le Dahira rassemble progressivement ses membres autour de ses activités.",
  },
  {
    periode: "La transmission",
    titre: "Préserver les valeurs",
    texte:
      "Les enseignements et les valeurs sont transmis aux générations suivantes.",
  },
  {
    periode: "Aujourd'hui",
    titre: "Regarder vers l'avenir",
    texte:
      "Une communauté organisée, engagée et tournée vers demain.",
  },
];

// ============================================================
// REVEAL
// ============================================================

function Reveal({ children, className = "", delay = 0 }) {
  const [visible, setVisible] = useState(false);
  const [element, setElement] = useState(null);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.12,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [element]);

  return (
    <div
      ref={setElement}
      className={`
        transition-all duration-1000 ease-out
        ${
          visible
            ? "translate-y-0 opacity-100"
            : "translate-y-10 opacity-0"
        }
        ${className}
      `}
      style={{
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ============================================================
// HOME
// ============================================================

export default function Home() {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [galerie, setGalerie] = useState([]);
  const [horaires, setHoraires] = useState(null);
  const [erreurHoraires, setErreurHoraires] = useState(false);

  const [rappelIndex, setRappelIndex] = useState(0);
  const [heureActuelle, setHeureActuelle] = useState(
    new Date()
  );

  // ==========================================================
  // NAVBAR
  // ==========================================================

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // ==========================================================
  // HORLOGE
  // ==========================================================

  useEffect(() => {
    const timer = setInterval(() => {
      setHeureActuelle(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ==========================================================
  // RAPPELS
  // ==========================================================

  useEffect(() => {
    const timer = setInterval(() => {
      setRappelIndex(
        (ancien) => (ancien + 1) % RAPPELS.length
      );
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  // ==========================================================
  // GALERIE
  // ==========================================================

  useEffect(() => {
    let actif = true;

    async function chargerGalerie() {
      try {
        const response = await api.get(
          "/galerie/public"
        );

        if (!actif) return;

        const donnees = Array.isArray(response.data)
          ? response.data
          : response.data?.items || [];

        setGalerie(donnees);
      } catch (error) {
        console.error(
          "Erreur chargement galerie :",
          error
        );

        if (actif) {
          setGalerie([]);
        }
      }
    }

    chargerGalerie();

    return () => {
      actif = false;
    };
  }, []);

  // ==========================================================
  // HORAIRES DE PRIÈRE
  // ==========================================================

  useEffect(() => {
    let actif = true;

    async function chargerHoraires() {
      try {
        const aujourdHui = new Date();

        const jour = String(
          aujourdHui.getDate()
        ).padStart(2, "0");

        const mois = String(
          aujourdHui.getMonth() + 1
        ).padStart(2, "0");

        const annee =
          aujourdHui.getFullYear();

        const url =
          `https://api.aladhan.com/v1/timings/` +
          `${jour}-${mois}-${annee}` +
          `?latitude=${DAKAR_LAT}` +
          `&longitude=${DAKAR_LON}` +
          `&method=3`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            "Impossible de récupérer les horaires."
          );
        }

        const data = await response.json();

        if (!actif) return;

        setHoraires(
          data?.data?.timings || null
        );

        setErreurHoraires(false);
      } catch (error) {
        console.error(
          "Erreur horaires de prière :",
          error
        );

        if (actif) {
          setErreurHoraires(true);
        }
      }
    }

    chargerHoraires();

    return () => {
      actif = false;
    };
  }, []);

  // ==========================================================
  // PROCHAINE PRIÈRE
  // ==========================================================

  const prochainePriere = useMemo(() => {
    if (!horaires) {
      return null;
    }

    const maintenant =
      heureActuelle.getHours() * 60 +
      heureActuelle.getMinutes();

    const ordre = [
      "Fajr",
      "Dhuhr",
      "Asr",
      "Maghrib",
      "Isha",
    ];

    for (const nom of ordre) {
      const valeur = horaires[nom];

      if (!valeur) continue;

      const [heures, minutes] = valeur
        .split(":")
        .map(Number);

      const total =
        heures * 60 + minutes;

      if (total > maintenant) {
        return {
          nom,
          heure: valeur,
          demain: false,
        };
      }
    }

    return {
      nom: "Fajr",
      heure: horaires.Fajr,
      demain: true,
    };
  }, [horaires, heureActuelle]);

  // ==========================================================
  // GALERIE
  // ==========================================================

  const galerieVisible = useMemo(() => {
    return galerie.slice(0, 6);
  }, [galerie]);

  // ==========================================================
  // URL MEDIA
  // ==========================================================

  function construireUrlMedia(url) {
    if (!url) {
      return "";
    }

    if (
      url.startsWith("http://") ||
      url.startsWith("https://")
    ) {
      return url;
    }

    const baseUrl = (
      api.defaults.baseURL || ""
    ).replace(/\/$/, "");

    const chemin = url.startsWith("/")
      ? url
      : `/${url}`;

    return `${baseUrl}${chemin}`;
  }

  // ==========================================================
  // FERMER MENU
  // ==========================================================

  function fermerMenu() {
    setMenuOuvert(false);
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#faf8f1] text-slate-900">

      {/* ======================================================
          ANIMATIONS
      ====================================================== */}

      <style>{`
        @keyframes floatSlow {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }

          50% {
            transform: translateY(-18px) translateX(8px);
          }
        }

        @keyframes floatReverse {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }

          50% {
            transform: translateY(18px) translateX(-10px);
          }
        }

        @keyframes pulseGlow {
          0%, 100% {
            box-shadow:
              0 0 0 0 rgba(214, 172, 71, 0.15),
              0 0 35px rgba(214, 172, 71, 0.10);
          }

          50% {
            box-shadow:
              0 0 0 20px rgba(214, 172, 71, 0),
              0 0 70px rgba(214, 172, 71, 0.25);
          }
        }

        @keyframes rotateSlow {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }

          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }

        @keyframes rotateReverse {
          from {
            transform: translate(-50%, -50%) rotate(360deg);
          }

          to {
            transform: translate(-50%, -50%) rotate(0deg);
          }
        }

        @keyframes scrollDown {
          0%, 100% {
            transform: translateY(-4px);
            opacity: 0.4;
          }

          50% {
            transform: translateY(5px);
            opacity: 1;
          }
        }

        @keyframes softAppear {
          from {
            opacity: 0;
            transform: scale(0.94);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }

          100% {
            transform: translateX(100%);
          }
        }

        .animate-float-slow {
          animation: floatSlow 7s ease-in-out infinite;
        }

        .animate-float-reverse {
          animation: floatReverse 8s ease-in-out infinite;
        }

        .animate-pulse-glow {
          animation: pulseGlow 3.5s ease-in-out infinite;
        }

        .animate-rotate-slow {
          animation: rotateSlow 24s linear infinite;
        }

        .animate-rotate-reverse {
          animation: rotateReverse 30s linear infinite;
        }

        .animate-scroll-down {
          animation: scrollDown 1.8s ease-in-out infinite;
        }

        .animate-soft-appear {
          animation: softAppear 0.9s ease-out forwards;
        }

        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <header
        className={`
          fixed left-0 right-0 top-0 z-50
          transition-all duration-500
          ${
            scrolled
              ? "bg-white/95 py-3 shadow-lg backdrop-blur-xl"
              : "bg-transparent py-5"
          }
        `}
      >
        <div className="mx-auto max-w-7xl px-5 lg:px-8">

          <div className="flex items-center justify-between">

            {/* LOGO */}

            <Link
              to="/"
              onClick={fermerMenu}
              className="flex items-center gap-3"
            >
              <div className="relative">

                <div
                  className={`
                    absolute inset-0 rounded-2xl blur-lg
                    ${
                      scrolled
                        ? "bg-emerald-500/10"
                        : "bg-white/20"
                    }
                  `}
                />

                <img
                  src="/logo.png"
                  alt="Dahira Mawahibou Naafih"
                  className="
                    relative h-11 w-11
                    rounded-2xl
                    object-contain
                    sm:h-12 sm:w-12
                  "
                />
              </div>

              <div className="hidden sm:block">

                <div
                  className={`
                    text-sm font-black tracking-tight
                    ${
                      scrolled
                        ? "text-emerald-950"
                        : "text-white"
                    }
                  `}
                >
                  MAWAHIBOU NAAFIH
                </div>

                <div
                  className={`
                    text-[10px] uppercase tracking-[0.25em]
                    ${
                      scrolled
                        ? "text-emerald-700"
                        : "text-white/70"
                    }
                  `}
                >
                  Castors
                </div>

              </div>
            </Link>

            {/* DESKTOP */}

            <nav className="hidden items-center gap-8 md:flex">

              {[
                ["Accueil", "#accueil"],
                ["Le Dahira", "#dahira"],
                ["Galerie", "#galerie"],
                ["Histoire", "#histoire"],
                ["Contact", "#contact"],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className={`
                    text-sm font-semibold transition-colors
                    ${
                      scrolled
                        ? "text-slate-600 hover:text-emerald-700"
                        : "text-white/85 hover:text-white"
                    }
                  `}
                >
                  {label}
                </a>
              ))}

              <Link
                to="/login"
                className="
                  group inline-flex items-center gap-2
                  rounded-full
                  bg-[#d6ac47]
                  px-5 py-2.5
                  text-sm font-bold
                  text-emerald-950
                  shadow-lg shadow-black/10
                  transition-all duration-300
                  hover:-translate-y-1
                  hover:shadow-xl
                "
              >
                Mon espace

                <ArrowRight
                  size={15}
                  className="
                    transition-transform
                    group-hover:translate-x-1
                  "
                />
              </Link>

            </nav>

            {/* MOBILE */}

            <button
              type="button"
              onClick={() =>
                setMenuOuvert((ancien) => !ancien)
              }
              className={`
                rounded-xl p-2 md:hidden
                ${
                  scrolled
                    ? "bg-emerald-50 text-emerald-900"
                    : "bg-white/10 text-white"
                }
              `}
              aria-label="Menu"
            >
              {menuOuvert ? (
                <X size={24} />
              ) : (
                <Menu size={24} />
              )}
            </button>

          </div>
        </div>

        {/* MENU MOBILE */}

        <div
          className={`
            overflow-hidden md:hidden
            transition-all duration-500
            ${
              menuOuvert
                ? "max-h-[420px] opacity-100"
                : "max-h-0 opacity-0"
            }
          `}
        >
          <div className="mx-4 mb-2 mt-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-2xl">

            <nav className="flex flex-col gap-1">

              {[
                ["Accueil", "#accueil"],
                ["Le Dahira", "#dahira"],
                ["Galerie", "#galerie"],
                ["Histoire", "#histoire"],
                ["Contact", "#contact"],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={fermerMenu}
                  className="
                    rounded-2xl px-4 py-3
                    font-semibold text-slate-700
                    transition
                    hover:bg-emerald-50
                    hover:text-emerald-800
                  "
                >
                  {label}
                </a>
              ))}

              <Link
                to="/login"
                onClick={fermerMenu}
                className="
                  mt-2 flex items-center
                  justify-center gap-2
                  rounded-2xl
                  bg-emerald-900
                  px-4 py-3
                  font-bold text-white
                "
              >
                Mon espace
                <ArrowRight size={17} />
              </Link>

            </nav>
          </div>
        </div>
      </header>

      {/* ======================================================
          HERO
      ====================================================== */}

      <section
        id="accueil"
        className="
          relative min-h-[100svh]
          overflow-hidden
          bg-emerald-950
        "
      >

        {/* FOND */}

        <div
          className="
            absolute inset-0
            bg-[radial-gradient(circle_at_50%_20%,rgba(30,130,91,0.7),transparent_42%),linear-gradient(135deg,#022c22,#064e3b_50%,#022c22)]
          "
        />

        {/* HALO GAUCHE */}

        <div
          className="
            absolute -left-32 -top-32
            h-96 w-96
            rounded-full
            bg-emerald-400/15
            blur-3xl
            animate-float-slow
          "
        />

        {/* HALO DROIT */}

        <div
          className="
            absolute -right-40 top-1/3
            h-[32rem] w-[32rem]
            rounded-full
            bg-[#d6ac47]/10
            blur-3xl
            animate-float-reverse
          "
        />

        {/* CERCLES */}

        <div
          className="
            absolute left-1/2 top-[44%]
            h-[440px] w-[440px]
            rounded-full
            border border-white/5
            sm:h-[620px] sm:w-[620px]
            animate-rotate-slow
          "
        />

        <div
          className="
            absolute left-1/2 top-[44%]
            h-[330px] w-[330px]
            rounded-full
            border border-[#d6ac47]/10
            sm:h-[480px] sm:w-[480px]
            animate-rotate-reverse
          "
        />

        {/* PARTICULES */}

        <div
          className="
            absolute left-[12%] top-[25%]
            h-2 w-2 rounded-full
            bg-[#d6ac47]
            shadow-[0_0_20px_rgba(214,172,71,0.8)]
            animate-pulse
          "
        />

        <div
          className="
            absolute right-[16%] top-[34%]
            h-1.5 w-1.5
            rounded-full bg-white
            opacity-70 animate-ping
          "
        />

        <div
          className="
            absolute bottom-[28%] left-[20%]
            h-1 w-1 rounded-full
            bg-[#d6ac47]
            animate-pulse
          "
        />

        <div
          className="
            absolute bottom-[24%] right-[25%]
            h-1 w-1 rounded-full
            bg-white/60
            animate-pulse
          "
        />

        {/* CONTENU */}

        <div
          className="
            relative z-10
            flex min-h-[100svh]
            items-center justify-center
            px-5 pb-20 pt-28
          "
        >
          <div className="w-full max-w-5xl text-center">

            {/* BADGE */}

            <div
              className="
                inline-flex items-center gap-2
                rounded-full
                border border-white/10
                bg-white/5
                px-4 py-2
                text-[10px] font-semibold
                uppercase tracking-[0.3em]
                text-white/70
                backdrop-blur-xl
                animate-soft-appear
              "
            >
              <Sparkles
                size={13}
                className="text-[#d6ac47]"
              />

              Dahira Mawahibou Naafih
            </div>

            {/* LOGO */}

            <div
              className="
                relative mx-auto mt-8
                h-36 w-36
                sm:h-44 sm:w-44
              "
            >

              <div
                className="
                  absolute inset-0
                  rounded-full
                  bg-[#d6ac47]/20
                  blur-2xl
                "
              />

              <div
                className="
                  relative flex h-full w-full
                  items-center justify-center
                  rounded-full
                  border border-white/20
                  bg-white/10
                  backdrop-blur-xl
                  animate-pulse-glow
                "
              >
                <img
                  src="/logo.png"
                  alt="Dahira Mawahibou Naafih"
                  className="
                    h-28 w-28
                    rounded-full
                    object-contain
                    sm:h-36 sm:w-36
                  "
                />
              </div>
            </div>

            {/* TITRE */}

            <h1
              className="
                mt-8
                text-4xl font-black
                leading-[0.95]
                tracking-tight text-white
                sm:text-6xl
                lg:text-7xl
              "
            >
              Une voie.
              <br />

              <span className="text-[#d6ac47]">
                Une communauté.
              </span>
            </h1>

            {/* SOUS-TITRE */}

            <p
              className="
                mx-auto mt-6 max-w-xl
                text-sm leading-relaxed
                text-white/65
                sm:text-base
              "
            >
              Foi. Fraternité. Engagement.
            </p>

            {/* BOUTONS */}

            <div
              className="
                mt-8 flex
                flex-col items-center
                justify-center gap-3
                sm:flex-row
              "
            >
              <Link
                to="/login"
                className="
                  group flex w-full
                  items-center justify-center gap-2
                  rounded-2xl
                  bg-[#d6ac47]
                  px-7 py-4
                  text-sm font-black
                  text-emerald-950
                  shadow-xl shadow-black/20
                  transition-all duration-300
                  hover:-translate-y-1
                  hover:shadow-2xl
                  sm:w-auto
                "
              >
                Accéder à mon espace

                <ArrowRight
                  size={17}
                  className="
                    transition-transform
                    group-hover:translate-x-1
                  "
                />
              </Link>

              <a
                href="#dahira"
                className="
                  flex w-full
                  items-center justify-center
                  rounded-2xl
                  border border-white/15
                  bg-white/5
                  px-7 py-4
                  text-sm font-bold
                  text-white
                  backdrop-blur
                  transition-all duration-300
                  hover:-translate-y-1
                  hover:bg-white/10
                  sm:w-auto
                "
              >
                Découvrir
              </a>
            </div>

            {/* SCROLL */}

            <a
              href="#prieres"
              className="
                absolute bottom-6 left-1/2
                flex -translate-x-1/2
                flex-col items-center gap-2
                text-white/45
                transition
                hover:text-white
              "
            >
              <span
                className="
                  text-[9px]
                  uppercase tracking-[0.3em]
                "
              >
                Explorer
              </span>

              <ArrowDown
                size={17}
                className="animate-scroll-down"
              />
            </a>

          </div>
        </div>
      </section>

      {/* ======================================================
          HORAIRES DE PRIÈRE
      ====================================================== */}

      <section
        id="prieres"
        className="
          relative z-20
          -mt-8 px-4
          sm:-mt-14
        "
      >
        <div className="mx-auto max-w-6xl">

          <div
            className="
              overflow-hidden
              rounded-[2rem]
              border border-slate-100
              bg-white
              shadow-2xl
              shadow-emerald-950/10
            "
          >

            <div className="grid lg:grid-cols-[1.1fr_2fr]">

              {/* PROCHAINE PRIÈRE */}

              <div
                className="
                  relative overflow-hidden
                  bg-emerald-900
                  p-7 text-white
                  sm:p-9
                "
              >

                <div
                  className="
                    absolute -right-16 -top-16
                    h-40 w-40
                    rounded-full
                    bg-[#d6ac47]/15
                    blur-2xl
                  "
                />

                <div className="relative z-10">

                  <div
                    className="
                      flex items-center gap-2
                      text-xs font-bold
                      uppercase tracking-[0.2em]
                      text-[#d6ac47]
                    "
                  >
                    <Clock3 size={15} />
                    À venir
                  </div>

                  <div
                    className="
                      mt-5 text-4xl
                      font-black
                      sm:text-5xl
                    "
                  >
                    {prochainePriere?.heure ||
                      "--:--"}
                  </div>

                  <div
                    className="
                      mt-1 text-xl
                      font-bold
                    "
                  >
                    {prochainePriere
                      ? PRIERE_NOMS[
                          prochainePriere.nom
                        ] ||
                        prochainePriere.nom
                      : "Prochaine prière"}
                  </div>

                  <p
                    className="
                      mt-3 text-sm
                      text-white/60
                    "
                  >
                    {prochainePriere?.demain
                      ? "Demain à Dakar"
                      : "Aujourd'hui à Dakar"}
                  </p>

                  <div
                    className="
                      mt-6 flex items-center gap-2
                      text-xs text-white/50
                    "
                  >
                    <MapPin size={13} />
                    Dakar
                  </div>

                </div>
              </div>

              {/* LISTE */}

              <div className="p-5 sm:p-7">

                <div
                  className="
                    mb-5 flex
                    items-center justify-between
                  "
                >
                  <div>

                    <p
                      className="
                        text-xs font-bold
                        uppercase
                        tracking-[0.2em]
                        text-emerald-700
                      "
                    >
                      Aujourd'hui
                    </p>

                    <h2
                      className="
                        mt-1 text-xl
                        font-black text-slate-900
                      "
                    >
                      Horaires de prière
                    </h2>

                  </div>

                  <Moon
                    size={23}
                    className="text-[#d6ac47]"
                  />
                </div>

                {erreurHoraires ? (
                  <div
                    className="
                      rounded-2xl
                      bg-red-50 p-4
                      text-sm text-red-700
                    "
                  >
                    Impossible de charger les horaires.
                  </div>
                ) : (
                  <div
                    className="
                      grid grid-cols-2
                      gap-2
                      sm:grid-cols-5
                    "
                  >
                    {[
                      "Fajr",
                      "Dhuhr",
                      "Asr",
                      "Maghrib",
                      "Isha",
                    ].map((nom) => (
                      <div
                        key={nom}
                        className="
                          group rounded-2xl
                          bg-slate-50 p-4
                          transition-all duration-300
                          hover:-translate-y-1
                          hover:bg-emerald-50
                        "
                      >
                        <div
                          className="
                            text-[11px]
                            font-bold uppercase
                            text-slate-400
                          "
                        >
                          {PRIERE_NOMS[nom]}
                        </div>

                        <div
                          className="
                            mt-2 text-xl
                            font-black
                            text-emerald-950
                            group-hover:text-emerald-700
                          "
                        >
                          {horaires?.[nom] ||
                            "--:--"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          DAHIRA
      ====================================================== */}

      <section
        id="dahira"
        className="px-5 py-24 sm:py-32"
      >
        <div className="mx-auto max-w-6xl">

          <Reveal>

            <div className="max-w-2xl">

              <div
                className="
                  flex items-center gap-2
                  text-xs font-black
                  uppercase tracking-[0.25em]
                  text-emerald-700
                "
              >
                <span
                  className="
                    h-px w-8
                    bg-[#d6ac47]
                  "
                />

                Notre identité
              </div>

              <h2
                className="
                  mt-5
                  text-4xl font-black
                  tracking-tight
                  text-emerald-950
                  sm:text-5xl
                "
              >
                Plus qu'un Dahira.
                <br />

                <span className="text-[#b88b28]">
                  Une famille.
                </span>
              </h2>

              <p
                className="
                  mt-5 max-w-xl
                  leading-relaxed
                  text-slate-500
                "
              >
                Foi, fraternité et service.
              </p>

            </div>

          </Reveal>

          <div
            className="
              mt-14 grid gap-4
              sm:grid-cols-2
              lg:grid-cols-4
            "
          >

            {[
              {
                icon: Heart,
                titre: "Spiritualité",
                texte: "Cultiver la foi.",
              },
              {
                icon: Users,
                titre: "Fraternité",
                texte: "Avancer ensemble.",
              },
              {
                icon: Star,
                titre: "Engagement",
                texte: "Servir avec sincérité.",
              },
              {
                icon: Sparkles,
                titre: "Transmission",
                texte: "Préserver les valeurs.",
              },
            ].map((item, index) => {
              const Icon = item.icon;

              return (
                <Reveal
                  key={item.titre}
                  delay={index * 100}
                >
                  <div
                    className="
                      group h-full
                      rounded-[1.75rem]
                      border border-slate-100
                      bg-white p-6
                      shadow-sm
                      transition-all duration-500
                      hover:-translate-y-2
                      hover:shadow-xl
                    "
                  >

                    <div
                      className="
                        flex h-12 w-12
                        items-center justify-center
                        rounded-2xl
                        bg-emerald-50
                        text-emerald-800
                        transition-all duration-300
                        group-hover:bg-emerald-900
                        group-hover:text-[#d6ac47]
                      "
                    >
                      <Icon size={21} />
                    </div>

                    <h3
                      className="
                        mt-5 text-lg
                        font-black
                        text-emerald-950
                      "
                    >
                      {item.titre}
                    </h3>

                    <p
                      className="
                        mt-2 text-sm
                        leading-relaxed
                        text-slate-500
                      "
                    >
                      {item.texte}
                    </p>

                  </div>
                </Reveal>
              );
            })}

          </div>
        </div>
      </section>

      {/* ======================================================
          RAPPEL
      ====================================================== */}

      <section className="px-5 pb-24 sm:pb-32">

        <Reveal>

          <div
            className="
              relative mx-auto
              max-w-6xl
              overflow-hidden
              rounded-[2.5rem]
              bg-emerald-950
              px-7 py-14
              text-center
              sm:px-14 sm:py-20
            "
          >

            <div
              className="
                absolute -top-32 left-1/2
                h-80 w-80
                -translate-x-1/2
                rounded-full
                bg-[#d6ac47]/10
                blur-3xl
              "
            />

            <div
              className="
                absolute left-10 top-10
                h-2 w-2 rounded-full
                bg-[#d6ac47]
                animate-pulse
              "
            />

            <div
              className="
                absolute bottom-10 right-12
                h-1.5 w-1.5 rounded-full
                bg-white animate-ping
              "
            />

            <div className="relative z-10">

              <Sparkles
                size={28}
                className="
                  mx-auto text-[#d6ac47]
                "
              />

              <div
                key={rappelIndex}
                className="animate-soft-appear"
              >
                <p
                  className="
                    mt-7
                    text-2xl font-black
                    leading-tight text-white
                    sm:text-4xl
                    lg:text-5xl
                  "
                >
                  « {RAPPELS[rappelIndex]} »
                </p>
              </div>

              <div
                className="
                  mt-7 flex
                  justify-center gap-1.5
                "
              >
                {RAPPELS.map((_, index) => (
                  <span
                    key={index}
                    className={`
                      h-1.5 rounded-full
                      transition-all duration-500
                      ${
                        index === rappelIndex
                          ? "w-7 bg-[#d6ac47]"
                          : "w-1.5 bg-white/20"
                      }
                    `}
                  />
                ))}
              </div>

            </div>
          </div>

        </Reveal>

      </section>

      {/* ======================================================
          GUIDE
      ====================================================== */}

      <section
        id="guide"
        className="
          bg-emerald-950
          px-6 py-20
          text-white
          lg:py-24
        "
      >
        <div className="mx-auto max-w-6xl">

          <Reveal>

            <div
              className="
                grid gap-10
                lg:grid-cols-[280px_1fr]
                lg:items-center
                lg:gap-16
              "
            >

              {/* PHOTO */}

              <div className="flex justify-center lg:justify-start">

                <div className="relative">

                  <div
                    className="
                      absolute -inset-3
                      rounded-[2rem]
                      border border-amber-300/20
                    "
                  />

                  <div
                    className="
                      relative
                      h-[390px] w-[280px]
                      overflow-hidden
                      rounded-[1.75rem]
                      shadow-2xl
                    "
                  >
                    <img
                      src={guideImage}
                      alt="Serigne Moustapha Abdou Khadr Mbacké"
                      className="
                        h-full w-full
                        object-cover
                        transition duration-700
                        hover:scale-105
                      "
                    />
                  </div>

                </div>
              </div>

              {/* TEXTE */}

              <div>

                <p
                  className="
                    text-xs font-semibold
                    uppercase tracking-[0.2em]
                    text-amber-300
                  "
                >
                  Notre guide
                </p>

                <h2
                  className="
                    mt-4
                    text-3xl font-bold
                    leading-tight
                    sm:text-4xl
                    lg:text-5xl
                  "
                >
                  Serigne Moustapha
                  <span
                    className="
                      block text-amber-300
                    "
                  >
                    Abdou Khadr Mbacké
                  </span>
                </h2>

                <div
                  className="
                    mt-6 h-1 w-16
                    rounded-full
                    bg-amber-400
                  "
                />

                <p
                  className="
                    mt-7 max-w-2xl
                    text-lg leading-8
                    text-white/70
                  "
                >
                  Un guide, une transmission,
                  une orientation.
                </p>

              </div>

            </div>

          </Reveal>

        </div>
      </section>

      {/* ======================================================
          PIONNIERS
      ====================================================== */}

      <section
        id="pionniers"
        className="
          px-5 py-24
          sm:py-32
        "
      >
        <div className="mx-auto max-w-6xl">

          <Reveal>

            <div
              className="
                flex flex-col gap-5
                sm:flex-row
                sm:items-end
                sm:justify-between
              "
            >

              <div>

                <div
                  className="
                    flex items-center gap-2
                    text-xs font-black
                    uppercase
                    tracking-[0.25em]
                    text-emerald-700
                  "
                >
                  <Users size={14} />
                  Mémoire
                </div>

                <h2
                  className="
                    mt-4
                    text-3xl font-black
                    text-emerald-950
                    sm:text-4xl
                  "
                >
                  Ceux qui ont ouvert
                  <span className="text-[#b88b28]">
                    {" "}la voie.
                  </span>
                </h2>

              </div>

              <p
                className="
                  max-w-md text-sm
                  text-slate-500
                "
              >
                Honorer nos pionniers.
              </p>

            </div>

          </Reveal>

          <div
            className="
              mt-12 grid gap-4
              sm:grid-cols-3
            "
          >

            {PIONNIERS.map(
              (pionnier, index) => (
                <Reveal
                  key={`${pionnier.nom}-${index}`}
                  delay={index * 120}
                >

                  <div
                    className="
                      group relative
                      overflow-hidden
                      rounded-[2rem]
                      border border-slate-100
                      bg-white p-7
                      shadow-sm
                      transition-all duration-500
                      hover:-translate-y-2
                      hover:shadow-xl
                    "
                  >

                    <div
                      className="
                        absolute -right-8 -top-8
                        h-24 w-24
                        rounded-full
                        bg-[#d6ac47]/10
                      "
                    />

                    <div
                      className="
                        relative flex h-14 w-14
                        items-center justify-center
                        rounded-2xl
                        bg-emerald-900
                        font-black
                        text-[#d6ac47]
                      "
                    >
                      {index + 1}
                    </div>

                    <h3
                      className="
                        mt-6 text-xl
                        font-black
                        text-emerald-950
                      "
                    >
                      {pionnier.nom}
                    </h3>

                    <p
                      className="
                        mt-1 text-sm
                        text-slate-400
                      "
                    >
                      {pionnier.fonction}
                    </p>

                  </div>

                </Reveal>
              )
            )}

          </div>
        </div>
      </section>

      {/* ======================================================
          HISTOIRE
      ====================================================== */}

      <section
        id="histoire"
        className="
          bg-white
          px-5 py-24
          sm:py-32
        "
      >
        <div className="mx-auto max-w-6xl">

          <Reveal>

            <div className="mx-auto max-w-3xl text-center">

              <div
                className="
                  inline-flex
                  items-center gap-2
                  text-xs font-black
                  uppercase tracking-[0.25em]
                  text-emerald-700
                "
              >
                <CalendarDays size={14} />
                Notre histoire
              </div>

              <h2
                className="
                  mt-4
                  text-4xl font-black
                  tracking-tight
                  text-emerald-950
                  sm:text-5xl
                "
              >
                Une histoire.
                <br />

                <span className="text-[#b88b28]">
                  Une mémoire. Un avenir.
                </span>
              </h2>

            </div>

          </Reveal>

          {/* TIMELINE */}

          <div className="relative mt-16">

            <div
              className="
                absolute bottom-0 left-1/2
                top-0 hidden w-px
                -translate-x-1/2
                bg-gradient-to-b
                from-transparent
                via-[#d6ac47]/50
                to-transparent
                md:block
              "
            />

            <div className="space-y-8 md:space-y-12">

              {HISTORIQUE.map(
                (etape, index) => {
                  const gauche =
                    index % 2 === 0;

                  return (
                    <Reveal
                      key={etape.titre}
                      delay={index * 120}
                    >

                      <div
                        className="
                          relative grid
                          gap-6
                          md:grid-cols-2
                          md:gap-12
                        "
                      >

                        <div
                          className={
                            gauche
                              ? "md:text-right"
                              : "md:col-start-2"
                          }
                        >

                          <div
                            className="
                              rounded-[2rem]
                              border
                              border-slate-100
                              bg-[#faf8f1]
                              p-7
                              shadow-sm
                              transition-all duration-500
                              hover:-translate-y-1
                              hover:shadow-xl
                            "
                          >

                            <span
                              className="
                                inline-flex
                                rounded-full
                                bg-emerald-50
                                px-3 py-1.5
                                text-[10px]
                                font-black
                                uppercase
                                tracking-[0.15em]
                                text-emerald-700
                              "
                            >
                              {etape.periode}
                            </span>

                            <h3
                              className="
                                mt-4
                                text-2xl font-black
                                text-emerald-950
                              "
                            >
                              {etape.titre}
                            </h3>

                            <p
                              className="
                                mt-3 text-sm
                                leading-relaxed
                                text-slate-500
                              "
                            >
                              {etape.texte}
                            </p>

                          </div>
                        </div>

                        {/* POINT CENTRAL */}

                        <div
                          className="
                            absolute left-1/2
                            top-1/2 hidden
                            h-11 w-11
                            -translate-x-1/2
                            -translate-y-1/2
                            items-center justify-center
                            rounded-full
                            border-4 border-white
                            bg-emerald-950
                            text-[#d6ac47]
                            shadow-lg
                            md:flex
                          "
                        >
                          <span
                            className="
                              text-xs font-black
                            "
                          >
                            {index + 1}
                          </span>
                        </div>

                      </div>

                    </Reveal>
                  );
                }
              )}

            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          GALERIE
      ====================================================== */}

      <section
        id="galerie"
        className="
          px-5 py-24
          sm:py-32
        "
      >
        <div className="mx-auto max-w-6xl">

          <Reveal>

            <div
              className="
                flex flex-col gap-5
                sm:flex-row
                sm:items-end
                sm:justify-between
              "
            >

              <div>

                <div
                  className="
                    flex items-center gap-2
                    text-xs font-black
                    uppercase
                    tracking-[0.25em]
                    text-emerald-700
                  "
                >
                  <Star size={14} />
                  Moments
                </div>

                <h2
                  className="
                    mt-4
                    text-4xl font-black
                    tracking-tight
                    text-emerald-950
                    sm:text-5xl
                  "
                >
                  Notre galerie.
                </h2>

              </div>

              <p
                className="
                  max-w-sm text-sm
                  leading-relaxed
                  text-slate-500
                "
              >
                Les moments du Dahira.
              </p>

            </div>

          </Reveal>

          {galerieVisible.length > 0 ? (

            <div
              className="
                mt-12 grid
                grid-cols-2
                gap-3
                sm:gap-5
                lg:grid-cols-3
              "
            >

              {galerieVisible.map(
                (element, index) => {

                  const mediaUrl =
                    element.url ||
                    element.image_url ||
                    element.media_url ||
                    element.fichier_url;

                  const url =
                    construireUrlMedia(
                      mediaUrl
                    );

                  const type =
                    element.type_media ||
                    element.type ||
                    "";

                  const estVideo =
                    type === "video" ||
                    type === "VIDÉO" ||
                    type === "VIDEO";

                  return (
                    <Reveal
                      key={
                        element.id ||
                        `${url}-${index}`
                      }
                      delay={index * 80}
                    >

                      <div
                        className={`
                          group relative
                          overflow-hidden
                          rounded-3xl
                          bg-slate-100
                          ${
                            index === 0
                              ? "lg:row-span-2"
                              : ""
                          }
                        `}
                      >

                        {url ? (

                          estVideo ? (

                            <video
                              src={url}
                              controls
                              preload="metadata"
                              playsInline
                              className="
                                aspect-square
                                w-full
                                object-cover
                                lg:aspect-[4/3]
                              "
                            />

                          ) : (

                            <img
                              src={url}
                              alt={
                                element.titre ||
                                "Galerie du Dahira"
                              }
                              loading="lazy"
                              className="
                                aspect-square
                                w-full
                                object-cover
                                transition-transform
                                duration-700
                                group-hover:scale-110
                                lg:aspect-[4/3]
                              "
                            />

                          )

                        ) : (

                          <div
                            className="
                              flex aspect-square
                              items-center
                              justify-center
                              text-sm
                              text-slate-400
                            "
                          >
                            Média indisponible
                          </div>

                        )}

                        {/* OVERLAY */}

                        <div
                          className="
                            pointer-events-none
                            absolute inset-0
                            bg-gradient-to-t
                            from-black/65
                            via-transparent
                            to-transparent
                            opacity-0
                            transition-opacity
                            duration-500
                            group-hover:opacity-100
                          "
                        />

                        {/* TITRE */}

                        <div
                          className="
                            pointer-events-none
                            absolute bottom-4
                            left-4 right-4
                            translate-y-4
                            opacity-0
                            transition-all duration-500
                            group-hover:translate-y-0
                            group-hover:opacity-100
                          "
                        >

                          <div
                            className="
                              flex items-center gap-2
                              text-sm font-bold
                              text-white
                            "
                          >
                            {estVideo && (
                              <Play
                                size={14}
                                fill="currentColor"
                              />
                            )}

                            {element.titre ||
                              "Moment partagé"}
                          </div>

                        </div>

                      </div>

                    </Reveal>
                  );
                }
              )}

            </div>

          ) : (

            <div
              className="
                mt-12
                rounded-[2rem]
                border border-dashed
                border-slate-200
                p-12
                text-center
              "
            >

              <Star
                size={30}
                className="
                  mx-auto
                  text-[#d6ac47]
                "
              />

              <p
                className="
                  mt-4 font-bold
                  text-slate-600
                "
              >
                Les prochains moments
                apparaîtront ici.
              </p>

            </div>

          )}

        </div>
      </section>

      {/* ======================================================
          CONTACT / CTA
      ====================================================== */}

      <section
        id="contact"
        className="
          px-5 pb-24
          sm:pb-32
        "
      >

        <Reveal>

          <div
            className="
              relative mx-auto
              max-w-6xl
              overflow-hidden
              rounded-[2.5rem]
              bg-[#d6ac47]
              px-7 py-14
              sm:px-14 sm:py-16
            "
          >

            <div
              className="
                absolute -right-24 -top-24
                h-72 w-72
                rounded-full
                bg-white/20
                blur-2xl
              "
            />

            <div
              className="
                absolute -bottom-20 -left-20
                h-60 w-60
                rounded-full
                bg-emerald-900/10
                blur-2xl
              "
            />

            <div
              className="
                relative z-10
                grid items-center gap-10
                lg:grid-cols-[1fr_auto]
              "
            >

              <div>

                <div
                  className="
                    flex items-center gap-2
                    text-xs font-black
                    uppercase
                    tracking-[0.25em]
                    text-emerald-950/60
                  "
                >
                  <MapPin size={14} />
                  Castors — Dakar
                </div>

                <h2
                  className="
                    mt-4
                    text-4xl font-black
                    tracking-tight
                    text-emerald-950
                    sm:text-5xl
                  "
                >
                  Restons connectés.
                </h2>

                <p
                  className="
                    mt-4 max-w-lg
                    text-sm leading-relaxed
                    text-emerald-950/65
                  "
                >
                  La communauté continue.
                </p>

              </div>

              <Link
                to="/login"
                className="
                  group inline-flex
                  items-center justify-center
                  gap-3
                  rounded-2xl
                  bg-emerald-950
                  px-7 py-4
                  font-black
                  text-white
                  shadow-xl
                  transition-all duration-300
                  hover:-translate-y-1
                  hover:shadow-2xl
                "
              >
                Rejoindre mon espace

                <ArrowRight
                  size={18}
                  className="
                    transition-transform
                    group-hover:translate-x-1
                  "
                />
              </Link>

            </div>
          </div>

        </Reveal>

      </section>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer
        className="
          bg-emerald-950
          px-5 py-12
          text-white
        "
      >
        <div
          className="
            mx-auto
            flex max-w-6xl
            flex-col
            items-center
            justify-between
            gap-7
            sm:flex-row
          "
        >

          <div
            className="
              flex items-center gap-3
            "
          >

            <img
              src="/logo.png"
              alt="Dahira Mawahibou Naafih"
              className="
                h-12 w-12
                rounded-xl
                object-contain
              "
            />

            <div>

              <div
                className="
                  text-sm font-black
                "
              >
                MAWAHIBOU NAAFIH
              </div>

              <div
                className="
                  text-[10px]
                  uppercase
                  tracking-[0.25em]
                  text-white/40
                "
              >
                Castors
              </div>

            </div>

          </div>

          <div className="text-center sm:text-right">

            <p
              className="
                text-xs text-white/40
              "
            >
              © {new Date().getFullYear()}
              {" "}
              Dahira Mawahibou Naafih
            </p>

            <p
              className="
                mt-1 text-[10px]
                text-white/25
              "
            >
              Fraternité • Spiritualité • Engagement
            </p>

          </div>

        </div>
      </footer>

    </div>
  );
}