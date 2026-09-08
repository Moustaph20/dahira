
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  ChevronRight,
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

// ==========================================================
// CONFIGURATION
// ==========================================================

const DAKAR_LAT = 14.7167;
const DAKAR_LON = -17.4677;

const PRIERE_NOMS = {
  Fajr: "Fajr",
  Sunrise: "Lever du soleil",
  Dhuhr: "Dhuhr",
  Asr: "Asr",
  Maghrib: "Maghrib",
  Isha: "Isha",
};

const RAPPELS = [
  "La constance dans le bien ouvre les portes.",
  "Un cœur uni renforce toute une communauté.",
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

// ==========================================================
// HISTORIQUE DU DAHIRA
// ==========================================================

const HISTORIQUE = [
  {
    periode: "Les débuts",
    titre: "La naissance du Dahira",
    texte:
      "Une communauté fondée autour de la spiritualité, de la fraternité et de la volonté de servir ensemble.",
  },
  {
    periode: "Une communauté grandissante",
    titre: "Une présence qui s'affirme",
    texte:
      "Au fil des années, le Dahira rassemble davantage de membres et développe ses activités religieuses et communautaires.",
  },
  {
    periode: "La transmission",
    titre: "Préserver et transmettre",
    texte:
      "Les enseignements, les valeurs et les pratiques sont transmis aux nouvelles générations dans un esprit de continuité.",
  },
  {
    periode: "Aujourd'hui",
    titre: "Une communauté tournée vers l'avenir",
    texte:
      "Le Dahira poursuit son chemin en renforçant son organisation, sa fraternité et son engagement au service de la communauté.",
  },
];

// ==========================================================
// REVEAL — ANIMATION AU SCROLL
// ==========================================================

function Reveal({
  children,
  className = "",
  delay = 0,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <RevealElement
      visible={visible}
      setVisible={setVisible}
      className={className}
      delay={delay}
    >
      {children}
    </RevealElement>
  );
}

function RevealElement({
  children,
  visible,
  setVisible,
  className,
  delay,
}) {
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
  }, [element, setVisible]);

  return (
    <div
      ref={setElement}
      className={`
        transition-all duration-1000 ease-out
        ${
          visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10"
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

// ==========================================================
// HOME
// ==========================================================

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

  // ========================================================
  // SCROLL NAVBAR
  // ========================================================

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll);

    handleScroll();

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, []);

  // ========================================================
  // HORLOGE
  // ========================================================

  useEffect(() => {
    const timer = setInterval(() => {
      setHeureActuelle(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ========================================================
  // RAPPELS
  // ========================================================

  useEffect(() => {
    const timer = setInterval(() => {
      setRappelIndex((ancien) => {
        return (ancien + 1) % RAPPELS.length;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  // ========================================================
  // GALERIE
  // ========================================================

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

  // ========================================================
  // HORAIRES DE PRIERE
  // ========================================================

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

        const annee = aujourdHui.getFullYear();

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

  // ========================================================
  // PROCHAINE PRIERE
  // ========================================================

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
        };
      }
    }

    return {
      nom: "Fajr",
      heure: horaires.Fajr,
      demain: true,
    };
  }, [horaires, heureActuelle]);

  // ========================================================
  // GALERIE LIMITEE
  // ========================================================

  const galerieVisible = useMemo(() => {
    return galerie.slice(0, 6);
  }, [galerie]);

  // ========================================================
  // FERMER MENU
  // ========================================================

  const fermerMenu = () => {
    setMenuOuvert(false);
  };

  return (
    <div className="min-h-screen bg-[#faf8f1] text-slate-900 overflow-x-hidden">

      {/* ====================================================
          ANIMATIONS CSS
      ==================================================== */}

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
            transform: translateY(16px) translateX(-10px);
          }
        }

        @keyframes pulseGlow {
          0%, 100% {
            box-shadow:
              0 0 0 0 rgba(214, 172, 71, 0.18),
              0 0 40px rgba(214, 172, 71, 0.12);
          }

          50% {
            box-shadow:
              0 0 0 22px rgba(214, 172, 71, 0),
              0 0 70px rgba(214, 172, 71, 0.28);
          }
        }

        @keyframes rotateSlow {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes scrollDown {
          0% {
            transform: translateY(-4px);
            opacity: 0.4;
          }

          50% {
            transform: translateY(5px);
            opacity: 1;
          }

          100% {
            transform: translateY(-4px);
            opacity: 0.4;
          }
        }

        @keyframes softAppear {
          from {
            opacity: 0;
            transform: scale(0.96);
          }

          to {
            opacity: 1;
            transform: scale(1);
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
          animation: rotateSlow 22s linear infinite;
        }

        .animate-scroll-down {
          animation: scrollDown 1.8s ease-in-out infinite;
        }

        .animate-soft-appear {
          animation: softAppear 1s ease-out forwards;
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
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

      {/* ====================================================
          NAVBAR
      ==================================================== */}

      <header
        className={`
          fixed top-0 left-0 right-0 z-50
          transition-all duration-500
          ${
            scrolled
              ? "bg-white/95 backdrop-blur-xl shadow-lg py-3"
              : "bg-transparent py-5"
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="flex items-center justify-between">

            <Link
              to="/"
              className="flex items-center gap-3"
              onClick={fermerMenu}
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
                    relative
                    w-11 h-11
                    sm:w-12 sm:h-12
                    object-contain
                    rounded-2xl
                  "
                />
              </div>

              <div className="hidden sm:block">
                <div
                  className={`
                    font-black tracking-tight text-sm
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

            <nav className="hidden md:flex items-center gap-8">
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
                    text-sm font-semibold
                    transition-colors
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
                  group
                  inline-flex items-center gap-2
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
              onClick={() =>
                setMenuOuvert(!menuOuvert)
              }
              className={`
                md:hidden
                p-2 rounded-xl
                ${
                  scrolled
                    ? "text-emerald-900 bg-emerald-50"
                    : "text-white bg-white/10"
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
            md:hidden overflow-hidden
            transition-all duration-500
            ${
              menuOuvert
                ? "max-h-[420px] opacity-100"
                : "max-h-0 opacity-0"
            }
          `}
        >
          <div className="mx-4 mt-4 mb-2 rounded-3xl bg-white p-5 shadow-2xl border border-slate-100">
            <nav className="flex flex-col gap-2">

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
                    hover:bg-emerald-50
                    hover:text-emerald-800
                    transition
                  "
                >
                  {label}
                </a>
              ))}

              <Link
                to="/login"
                onClick={fermerMenu}
                className="
                  mt-2
                  flex items-center justify-center gap-2
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

      {/* ====================================================
          HERO
      ==================================================== */}

      <section
        id="accueil"
        className="
          relative
          min-h-[100svh]
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
            absolute
            -top-32
            -left-32
            w-96 h-96
            rounded-full
            bg-emerald-400/15
            blur-3xl
            animate-float-slow
          "
        />

        {/* HALO DROIT */}

        <div
          className="
            absolute
            top-1/3
            -right-40
            w-[32rem] h-[32rem]
            rounded-full
            bg-[#d6ac47]/10
            blur-3xl
            animate-float-reverse
          "
        />

        {/* CERCLE EXTERIEUR */}

        <div
          className="
            absolute
            left-1/2
            top-[44%]
            -translate-x-1/2
            -translate-y-1/2
            w-[440px] h-[440px]
            sm:w-[620px] sm:h-[620px]
            rounded-full
            border border-white/5
            animate-rotate-slow
          "
        />

        {/* CERCLE INTERIEUR */}

        <div
          className="
            absolute
            left-1/2
            top-[44%]
            -translate-x-1/2
            -translate-y-1/2
            w-[330px] h-[330px]
            sm:w-[480px] sm:h-[480px]
            rounded-full
            border border-[#d6ac47]/10
            animate-rotate-slow
          "
          style={{
            animationDirection: "reverse",
          }}
        />

        {/* PARTICULES */}

        <div
          className="
            absolute
            top-[25%]
            left-[12%]
            w-2 h-2
            rounded-full
            bg-[#d6ac47]
            shadow-[0_0_20px_rgba(214,172,71,0.8)]
            animate-pulse
          "
        />

        <div
          className="
            absolute
            top-[34%]
            right-[16%]
            w-1.5 h-1.5
            rounded-full
            bg-white
            opacity-70
            animate-ping
          "
        />

        <div
          className="
            absolute
            bottom-[28%]
            left-[20%]
            w-1 h-1
            rounded-full
            bg-[#d6ac47]
            animate-pulse
          "
        />

        {/* CONTENU */}

        <div
          className="
            relative z-10
            min-h-[100svh]
            flex items-center justify-center
            px-5 pt-28 pb-20
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
                backdrop-blur-xl
                px-4 py-2
                text-[10px] sm:text-xs
                uppercase tracking-[0.3em]
                font-semibold text-white/70
                animate-soft-appear
              "
            >
              <Sparkles
                size={13}
                className="text-[#d6ac47]"
              />

              Dahira Mawahibou Naafih Castors
            </div>

            {/* LOGO */}

            <div
              className="
                relative
                mx-auto
                mt-8
                w-36 h-36
                sm:w-44 sm:h-44
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
                  relative
                  w-full h-full
                  rounded-full
                  border border-white/20
                  bg-white/10
                  backdrop-blur-xl
                  flex items-center justify-center
                  animate-pulse-glow
                "
              >
                <img
                  src="/logo.png"
                  alt="Dahira Mawahibou Naafih"
                  className="
                    w-28 h-28
                    sm:w-36 sm:h-36
                    object-contain
                    rounded-full
                  "
                />
              </div>
            </div>

            {/* TITRE */}

            <h1
              className="
                mt-8
                text-4xl
                sm:text-6xl
                lg:text-7xl
                font-black
                tracking-tight
                leading-[0.95]
                text-white
              "
            >
              Une voie.
              <br />

              <span className="text-[#d6ac47]">
                Une communauté.
              </span>
            </h1>

            <p
              className="
                mx-auto
                mt-6
                max-w-xl
                text-sm
                sm:text-base
                leading-relaxed
                text-white/65
              "
            >
              Le Dahira Mawahibou Naafih de Castors,
              au service de la fraternité,
              de la spiritualité et de la communauté.
            </p>

            {/* BOUTONS */}

            <div
              className="
                mt-8
                flex
                flex-col
                sm:flex-row
                items-center
                justify-center
                gap-3
              "
            >
              <Link
                to="/login"
                className="
                  group
                  flex items-center justify-center gap-2
                  w-full sm:w-auto
                  rounded-2xl
                  bg-[#d6ac47]
                  px-7 py-4
                  text-sm font-black
                  text-emerald-950
                  shadow-xl shadow-black/20
                  transition-all duration-300
                  hover:-translate-y-1
                  hover:shadow-2xl
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
                  flex items-center justify-center gap-2
                  w-full sm:w-auto
                  rounded-2xl
                  border border-white/15
                  bg-white/5
                  backdrop-blur
                  px-7 py-4
                  text-sm font-bold
                  text-white
                  transition-all duration-300
                  hover:bg-white/10
                  hover:-translate-y-1
                "
              >
                Découvrir le Dahira
              </a>
            </div>

            {/* SCROLL */}

            <a
              href="#prieres"
              className="
                absolute
                bottom-6
                left-1/2
                -translate-x-1/2
                flex flex-col
                items-center
                gap-2
                text-white/45
                hover:text-white
                transition
              "
            >
              <span
                className="
                  text-[9px]
                  uppercase
                  tracking-[0.3em]
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

      {/* ====================================================
          HORAIRES DE PRIERE
      ==================================================== */}

      <section
        id="prieres"
        className="
          relative
          -mt-8
          sm:-mt-14
          z-20
          px-4
        "
      >
        <div className="max-w-6xl mx-auto">

          <div
            className="
              rounded-[2rem]
              bg-white
              shadow-2xl
              shadow-emerald-950/10
              border border-slate-100
              overflow-hidden
            "
          >
            <div
              className="
                grid
                lg:grid-cols-[1.1fr_2fr]
              "
            >

              {/* PROCHAINE PRIERE */}

              <div
                className="
                  relative
                  overflow-hidden
                  bg-emerald-900
                  p-7
                  sm:p-9
                  text-white
                "
              >
                <div
                  className="
                    absolute
                    -right-16
                    -top-16
                    w-40 h-40
                    rounded-full
                    bg-[#d6ac47]/15
                    blur-2xl
                  "
                />

                <div className="relative z-10">

                  <div
                    className="
                      flex items-center gap-2
                      text-[#d6ac47]
                      text-xs
                      font-bold
                      uppercase
                      tracking-[0.2em]
                    "
                  >
                    <Clock3 size={15} />
                    À venir
                  </div>

                  <div
                    className="
                      mt-5
                      text-4xl
                      sm:text-5xl
                      font-black
                    "
                  >
                    {prochainePriere?.heure || "--:--"}
                  </div>

                  <div
                    className="
                      mt-1
                      text-xl
                      font-bold
                    "
                  >
                    {prochainePriere
                      ? PRIERE_NOMS[
                          prochainePriere.nom
                        ] || prochainePriere.nom
                      : "Prochaine prière"}
                  </div>

                  <p
                    className="
                      mt-3
                      text-sm
                      text-white/60
                    "
                  >
                    {prochainePriere?.demain
                      ? "Demain à Dakar"
                      : "Aujourd'hui à Dakar"}
                  </p>

                  <div
                    className="
                      mt-6
                      flex items-center gap-2
                      text-xs
                      text-white/50
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
                    flex
                    items-center
                    justify-between
                    mb-5
                  "
                >
                  <div>
                    <p
                      className="
                        text-xs
                        uppercase
                        tracking-[0.2em]
                        font-bold
                        text-emerald-700
                      "
                    >
                      Aujourd'hui
                    </p>

                    <h2
                      className="
                        mt-1
                        text-xl
                        font-black
                        text-slate-900
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
                      bg-red-50
                      p-4
                      text-sm
                      text-red-700
                    "
                  >
                    Impossible de charger les horaires.
                  </div>
                ) : (
                  <div
                    className="
                      grid
                      grid-cols-2
                      sm:grid-cols-5
                      gap-2
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
                          group
                          rounded-2xl
                          bg-slate-50
                          p-4
                          transition-all duration-300
                          hover:bg-emerald-50
                          hover:-translate-y-1
                        "
                      >
                        <div
                          className="
                            text-[11px]
                            font-bold
                            text-slate-400
                            uppercase
                          "
                        >
                          {PRIERE_NOMS[nom]}
                        </div>

                        <div
                          className="
                            mt-2
                            text-xl
                            font-black
                            text-emerald-950
                            group-hover:text-emerald-700
                          "
                        >
                          {horaires?.[nom] || "--:--"}
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

      {/* ====================================================
          DAHIRA
      ==================================================== */}

      <section
        id="dahira"
        className="
          py-24
          sm:py-32
          px-5
        "
      >
        <div className="max-w-6xl mx-auto">

          <Reveal>
            <div className="max-w-2xl">

              <div
                className="
                  flex items-center gap-2
                  text-emerald-700
                  text-xs
                  font-black
                  uppercase
                  tracking-[0.25em]
                "
              >
                <span
                  className="
                    w-8 h-px
                    bg-[#d6ac47]
                  "
                />

                Notre identité
              </div>

              <h2
                className="
                  mt-5
                  text-4xl
                  sm:text-5xl
                  font-black
                  tracking-tight
                  text-emerald-950
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
                  mt-5
                  text-slate-500
                  leading-relaxed
                  max-w-xl
                "
              >
                Un espace de spiritualité,
                de fraternité et de partage
                où chacun contribue à faire grandir
                la communauté.
              </p>
            </div>
          </Reveal>

          <div
            className="
              mt-14
              grid
              sm:grid-cols-2
              lg:grid-cols-4
              gap-4
            "
          >
            {[
              {
                icon: Heart,
                titre: "Spiritualité",
                texte:
                  "Cultiver la foi et la constance.",
              },
              {
                icon: Users,
                titre: "Fraternité",
                texte:
                  "Avancer ensemble dans l'unité.",
              },
              {
                icon: Star,
                titre: "Engagement",
                texte:
                  "Servir avec sincérité.",
              },
              {
                icon: Sparkles,
                titre: "Transmission",
                texte:
                  "Préserver et transmettre.",
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
                      group
                      h-full
                      rounded-[1.75rem]
                      bg-white
                      border border-slate-100
                      p-6
                      shadow-sm
                      transition-all duration-500
                      hover:-translate-y-2
                      hover:shadow-xl
                    "
                  >
                    <div
                      className="
                        w-12 h-12
                        rounded-2xl
                        bg-emerald-50
                        flex items-center justify-center
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
                        mt-5
                        font-black
                        text-lg
                        text-emerald-950
                      "
                    >
                      {item.titre}
                    </h3>

                    <p
                      className="
                        mt-2
                        text-sm
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

      {/* ====================================================
          RAPPEL
      ==================================================== */}

      <section
        className="
          px-5
          pb-24
          sm:pb-32
        "
      >
        <Reveal>
          <div
            className="
              max-w-6xl
              mx-auto
              relative
              overflow-hidden
              rounded-[2.5rem]
              bg-emerald-950
              px-7
              py-14
              sm:px-14
              sm:py-20
              text-center
            "
          >
            <div
              className="
                absolute
                -top-32
                left-1/2
                -translate-x-1/2
                w-80 h-80
                rounded-full
                bg-[#d6ac47]/10
                blur-3xl
              "
            />

            <div
              className="
                absolute
                top-10
                left-10
                w-2 h-2
                rounded-full
                bg-[#d6ac47]
                animate-pulse
              "
            />

            <div
              className="
                absolute
                bottom-10
                right-12
                w-1.5 h-1.5
                rounded-full
                bg-white
                animate-ping
              "
            />

            <div className="relative z-10">

              <Sparkles
                size={28}
                className="
                  mx-auto
                  text-[#d6ac47]
                "
              />

              <div
                key={rappelIndex}
                className="animate-soft-appear"
              >
                <p
                  className="
                    mt-7
                    text-2xl
                    sm:text-4xl
                    lg:text-5xl
                    font-black
                    leading-tight
                    text-white
                  "
                >
                  « {RAPPELS[rappelIndex]} »
                </p>
              </div>

              <div
                className="
                  mt-7
                  flex
                  justify-center
                  gap-1.5
                "
              >
                {RAPPELS.map((_, index) => (
                  <span
                    key={index}
                    className={`
                      h-1.5
                      rounded-full
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

    {/* =====================================================
    GUIDE
====================================================== */}
{/* =====================================================
    GUIDE
====================================================== */}
<section
  id="guide"
  className="bg-emerald-950 px-6 py-20 text-white lg:py-24"
>
  <div className="mx-auto max-w-6xl">
    <div className="grid gap-10 lg:grid-cols-[280px_1fr] lg:items-center lg:gap-16">

      {/* PHOTO DU GUIDE */}
      <div className="flex justify-center lg:justify-start">
        <div className="relative">
          <div className="absolute -inset-3 rounded-[2rem] border border-amber-300/20" />

          <div className="relative h-[390px] w-[280px] overflow-hidden rounded-[1.75rem] shadow-2xl">
            <img
              src={guideImage}
              alt="Serigne Moustapha Abdou Khadr Mbacké"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* TEXTE DU GUIDE */}
      <div>
        <p className="font-semibold uppercase tracking-[0.2em] text-amber-300">
          Notre guide
        </p>

        <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
          Serigne Moustapha
          <span className="block text-amber-300">
            Abdou Khadr Mbacké
          </span>
        </h2>

        <div className="mt-6 h-1 w-16 rounded-full bg-amber-400" />

        <p className="mt-7 max-w-2xl text-lg leading-8 text-white/70">
          Le Dahira bénéficie de l'accompagnement et des enseignements
          de son guide, dont l'orientation contribue à la transmission
          des valeurs spirituelles et à l'unité de ses membres.
        </p>

        <p className="mt-5 max-w-2xl leading-8 text-white/55">
          Fils de Serigne Abdou Khadr Mbacké, quatrième Khalife Général
          des Mourides, il s'inscrit dans une lignée spirituelle consacrée
          à la transmission des enseignements de Cheikh Ahmadou Bamba
          Khadimou Rassoul.
        </p>
      </div>

    </div>
  </div>
</section>

      {/* ====================================================
          PIONNIERS
      ==================================================== */}

      <section
        className="
          px-5
          py-24
          sm:py-32
        "
      >
        <div className="max-w-6xl mx-auto">

          <Reveal>
            <div
              className="
                flex
                flex-col
                sm:flex-row
                sm:items-end
                sm:justify-between
                gap-5
              "
            >
              <div>

                <div
                  className="
                    flex items-center gap-2
                    text-emerald-700
                    text-xs
                    font-black
                    uppercase
                    tracking-[0.25em]
                  "
                >
                  <Users size={14} />
                  Mémoire
                </div>

                <h2
                  className="
                    mt-4
                    text-3xl
                    sm:text-4xl
                    font-black
                    text-emerald-950
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
                  max-w-md
                  text-sm
                  text-slate-500
                "
              >
                Honorer celles et ceux qui
                ont contribué à l'histoire
                de notre communauté.
              </p>
            </div>
          </Reveal>

          <div
            className="
              mt-12
              grid
              sm:grid-cols-3
              gap-4
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
                      group
                      relative
                      overflow-hidden
                      rounded-[2rem]
                      bg-white
                      border border-slate-100
                      p-7
                      shadow-sm
                      transition-all duration-500
                      hover:-translate-y-2
                      hover:shadow-xl
                    "
                  >
                    <div
                      className="
                        absolute
                        -right-8
                        -top-8
                        w-24 h-24
                        rounded-full
                        bg-[#d6ac47]/10
                      "
                    />

                    <div
                      className="
                        relative
                        w-14 h-14
                        rounded-2xl
                        bg-emerald-900
                        flex items-center justify-center
                        text-[#d6ac47]
                        font-black
                      "
                    >
                      {index + 1}
                    </div>

                    <h3
                      className="
                        mt-6
                        text-xl
                        font-black
                        text-emerald-950
                      "
                    >
                      {pionnier.nom}
                    </h3>

                    <p
                      className="
                        mt-1
                        text-sm
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

      {/* ====================================================
          HISTORIQUE DU DAHIRA
          REMPLACE AGENDA + ACTIVITES
      ==================================================== */}

      <section
        id="histoire"
        className="
          px-5
          py-24
          sm:py-32
          bg-white
        "
      >
        <div className="max-w-6xl mx-auto">

          <Reveal>
            <div className="text-center max-w-3xl mx-auto">

              <div
                className="
                  inline-flex
                  items-center gap-2
                  text-emerald-700
                  text-xs
                  font-black
                  uppercase
                  tracking-[0.25em]
                "
              >
                <CalendarDays size={14} />
                Notre histoire
              </div>

              <h2
                className="
                  mt-4
                  text-4xl
                  sm:text-5xl
                  font-black
                  tracking-tight
                  text-emerald-950
                "
              >
                Une histoire.
                <br />

                <span className="text-[#b88b28]">
                  Une mémoire. Un avenir.
                </span>
              </h2>

              <p
                className="
                  mt-5
                  text-slate-500
                  leading-relaxed
                "
              >
                Découvrez les grandes étapes
                de l'histoire du Dahira Mawahibou
                Naafih et la construction progressive
                de notre communauté.
              </p>
            </div>
          </Reveal>

          {/* TIMELINE */}

          <div className="relative mt-16">

            {/* LIGNE CENTRALE DESKTOP */}

            <div
              className="
                hidden md:block
                absolute
                left-1/2
                top-0
                bottom-0
                w-px
                bg-gradient-to-b
                from-transparent
                via-[#d6ac47]/50
                to-transparent
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
                          relative
                          grid
                          md:grid-cols-2
                          gap-6
                          md:gap-12
                          items-center
                        "
                      >

                        {/* CONTENU GAUCHE */}

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
                            <div
                              className="
                                inline-flex
                                items-center
                                rounded-full
                                bg-emerald-50
                                px-3 py-1.5
                                text-[10px]
                                uppercase
                                tracking-[0.15em]
                                font-black
                                text-emerald-700
                              "
                            >
                              {etape.periode}
                            </div>

                            <h3
                              className="
                                mt-4
                                text-2xl
                                font-black
                                text-emerald-950
                              "
                            >
                              {etape.titre}
                            </h3>

                            <p
                              className="
                                mt-3
                                text-sm
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
                            hidden md:flex
                            absolute
                            left-1/2
                            -translate-x-1/2
                            w-11 h-11
                            rounded-full
                            bg-emerald-950
                            border-4
                            border-white
                            shadow-lg
                            items-center
                            justify-center
                            text-[#d6ac47]
                          "
                        >
                          <span
                            className="
                              text-xs
                              font-black
                            "
                          >
                            {index + 1}
                          </span>
                        </div>

                        {/* ESPACE OPPOSE */}

                        <div
                          className={
                            gauche
                              ? "hidden md:block"
                              : "hidden"
                          }
                        />
                      </div>
                    </Reveal>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================
          GALERIE
      ==================================================== */}

      <section
        id="galerie"
        className="
          px-5
          py-24
          sm:py-32
          bg-white
        "
      >
        <div className="max-w-6xl mx-auto">

          <Reveal>
            <div
              className="
                flex
                flex-col
                sm:flex-row
                sm:items-end
                sm:justify-between
                gap-5
              "
            >
              <div>

                <div
                  className="
                    flex items-center gap-2
                    text-emerald-700
                    text-xs
                    font-black
                    uppercase
                    tracking-[0.25em]
                  "
                >
                  <Star size={14} />
                  Moments
                </div>

                <h2
                  className="
                    mt-4
                    text-4xl
                    sm:text-5xl
                    font-black
                    tracking-tight
                    text-emerald-950
                  "
                >
                  Notre galerie.
                </h2>
              </div>

              <p
                className="
                  max-w-sm
                  text-sm
                  leading-relaxed
                  text-slate-500
                "
              >
                Quelques instants de vie
                partagés par notre communauté.
              </p>
            </div>
          </Reveal>

          {galerieVisible.length > 0 ? (
            <div
              className="
                mt-12
                grid
                grid-cols-2
                lg:grid-cols-3
                gap-3
                sm:gap-5
              "
            >
              {galerieVisible.map(
                (element, index) => {
                  const imageUrl =
                    element.url ||
                    element.image_url ||
                    element.media_url ||
                    element.fichier_url;

                  return (
                    <Reveal
                      key={
                        element.id ||
                        `${imageUrl}-${index}`
                      }
                      delay={index * 80}
                    >
                      <div
                        className={`
                          group
                          relative
                          overflow-hidden
                          rounded-3xl
                          bg-slate-100
                          ${
                            index === 0
                              ? "lg:row-span-2 lg:h-full"
                              : ""
                          }
                        `}
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={
                              element.titre ||
                              "Galerie du Dahira"
                            }
                            className="
                              w-full
                              aspect-square
                              lg:aspect-[4/3]
                              object-cover
                              transition-transform
                              duration-700
                              group-hover:scale-110
                            "
                          />
                        ) : (
                          <div
                            className="
                              aspect-square
                              flex items-center
                              justify-center
                              text-slate-400
                            "
                          >
                            Image indisponible
                          </div>
                        )}

                        <div
                          className="
                            absolute inset-0
                            bg-gradient-to-t
                            from-black/60
                            via-transparent
                            to-transparent
                            opacity-0
                            group-hover:opacity-100
                            transition-opacity
                            duration-500
                          "
                        />

                        <div
                          className="
                            absolute
                            left-4
                            right-4
                            bottom-4
                            translate-y-4
                            opacity-0
                            group-hover:translate-y-0
                            group-hover:opacity-100
                            transition-all duration-500
                          "
                        >
                          <div
                            className="
                              text-white
                              text-sm
                              font-bold
                            "
                          >
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
                  mt-4
                  font-bold
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

      {/* ====================================================
          CONTACT / CTA
      ==================================================== */}

      <section
        id="contact"
        className="
          px-5
          pb-24
          sm:pb-32
        "
      >
        <Reveal>
          <div
            className="
              max-w-6xl
              mx-auto
              relative
              overflow-hidden
              rounded-[2.5rem]
              bg-[#d6ac47]
              px-7
              py-14
              sm:px-14
              sm:py-16
            "
          >

            <div
              className="
                absolute
                -right-24
                -top-24
                w-72 h-72
                rounded-full
                bg-white/20
                blur-2xl
              "
            />

            <div
              className="
                absolute
                -left-20
                -bottom-20
                w-60 h-60
                rounded-full
                bg-emerald-900/10
                blur-2xl
              "
            />

            <div
              className="
                relative z-10
                grid
                lg:grid-cols-[1fr_auto]
                items-center
                gap-10
              "
            >

              <div>

                <div
                  className="
                    flex items-center gap-2
                    text-emerald-950/60
                    text-xs
                    font-black
                    uppercase
                    tracking-[0.25em]
                  "
                >
                  <MapPin size={14} />
                  Castors — Dakar
                </div>

                <h2
                  className="
                    mt-4
                    text-4xl
                    sm:text-5xl
                    font-black
                    tracking-tight
                    text-emerald-950
                  "
                >
                  Restons connectés.
                </h2>

                <p
                  className="
                    mt-4
                    max-w-lg
                    text-sm
                    sm:text-base
                    leading-relaxed
                    text-emerald-950/65
                  "
                >
                  Une question, une suggestion
                  ou simplement envie d'échanger ?
                  La communauté est là.
                </p>
              </div>

              <Link
                to="/login"
                className="
                  group
                  inline-flex
                  items-center
                  justify-center
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

      {/* ====================================================
          FOOTER
      ==================================================== */}

      <footer
        className="
          bg-emerald-950
          px-5
          py-12
          text-white
        "
      >
        <div
          className="
            max-w-6xl
            mx-auto
            flex
            flex-col
            sm:flex-row
            items-center
            justify-between
            gap-7
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
                w-12 h-12
                object-contain
                rounded-xl
              "
            />

            <div>
              <div
                className="
                  font-black
                  text-sm
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

          <div
            className="
              text-center
              sm:text-right
            "
          >
            <p
              className="
                text-xs
                text-white/40
              "
            >
              © {new Date().getFullYear()}
              {" "}
              Dahira Mawahibou Naafih
            </p>

            <p
              className="
                mt-1
                text-[10px]
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

