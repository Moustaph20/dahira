
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  Clock3,
  Heart,
  MapPin,
  Menu,
  Moon,
  Phone,
  MessageCircle,
  Play,
  Sparkles,
  Star,
  X,
} from "lucide-react";

import guideImage from "../assets/guide.jpg";
import api from "../api/client";

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
  { nom: "Massata DIALLO", fonction: "Pionnier" },
  { nom: "Diogop MBODJ", fonction: "Pionnière" },
  { nom: "Ousseynou KAMARA", fonction: "Pionnier" },
];

const HISTORIQUE = [
  {
    periode: "Les débuts",
    titre: "La naissance du Dahira",
    texte:
      "Fondé en 1987 à Dakar lors de sa visite à Castors. Le premier à diriger le dahira fut Diabel Ndaw qui malgré ces efforts avait du mal à prendre une envergure à la hauteur des attentes.",
  },
  {
    periode: "La croissance",
    titre: "Une communauté grandissante",
    texte:
      "Ce n’est qu’en 1997 que le flambeau fut repris par feu Ousseynou Kamara qui a su rassembler les plus jeunes et les femmes pour les intégrer dans le Koureul pour les déclamations des khassaïdes. C’est dans cette même année lors du Grand Magal de Touba que le dahira Mawahibou Nafi est allé en tant qu’association bien organisée pour son ziar.",
  },
  {
    periode: "La transmission",
    titre: "Préserver les valeurs",
    texte:
      "Lors de ce grand MAGAL le guide orienta le dahira vers les ustensiles de cuisine comme leurs contributions. Ce travail fut respecté et accroissait chaque année allant de 05 bols 01 Mbana en 1997, à 100 bols et 05 banas en 2015.",
  },
  {
    periode: "Aujourd'hui",
    titre: "Regarder vers l'avenir",
    texte:
      "Une communauté organisée, engagée et tournée vers demain.",
  },
];

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
      { threshold: 0.1 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [element]);

  return (
    <div
      ref={setElement}
      className={`transition-all duration-1000 ease-out ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-8 opacity-0"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  accent,
  description,
  center = false,
}) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <div
        className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-700 ${
          center ? "justify-center" : ""
        }`}
      >
        <span className="h-px w-7 bg-[#d6ac47]" />
        {eyebrow}
        <span className="h-px w-7 bg-[#d6ac47]" />
      </div>

      <h2 className="mt-4 text-3xl font-black tracking-tight text-emerald-950 sm:text-5xl">
        {title}

        {accent && (
          <>
            <br />
            <span className="text-[#b88b28]">{accent}</span>
          </>
        )}
      </h2>

      {description && (
        <p className="mt-5 text-sm leading-7 text-slate-500 sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}

export default function Home() {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [galerie, setGalerie] = useState([]);
  const [horaires, setHoraires] = useState(null);
  const [erreurHoraires, setErreurHoraires] = useState(false);
  const [rappelIndex, setRappelIndex] = useState(0);
  const [heureActuelle, setHeureActuelle] = useState(new Date());

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 35);

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(
      () => setHeureActuelle(new Date()),
      1000
    );

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(
      () =>
        setRappelIndex(
          (ancien) => (ancien + 1) % RAPPELS.length
        ),
      5000
    );

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let actif = true;

    async function chargerGalerie() {
      try {
        const response = await api.get("/galerie/public");

        if (!actif) return;

        const donnees = Array.isArray(response.data)
          ? response.data
          : response.data?.items || [];

        setGalerie(donnees);
      } catch (error) {
        console.error("Erreur chargement galerie :", error);

        if (actif) setGalerie([]);
      }
    }

    chargerGalerie();

    return () => {
      actif = false;
    };
  }, []);

  useEffect(() => {
    let actif = true;

    async function chargerHoraires() {
      try {
        const aujourdHui = new Date();

        const jour = String(aujourdHui.getDate()).padStart(2, "0");
        const mois = String(aujourdHui.getMonth() + 1).padStart(2, "0");
        const annee = aujourdHui.getFullYear();

        const url =
          `https://api.aladhan.com/v1/timings/${jour}-${mois}-${annee}` +
          `?latitude=${DAKAR_LAT}&longitude=${DAKAR_LON}&method=3`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            "Impossible de récupérer les horaires."
          );
        }

        const data = await response.json();

        if (!actif) return;

        setHoraires(data?.data?.timings || null);
        setErreurHoraires(false);
      } catch (error) {
        console.error("Erreur horaires de prière :", error);

        if (actif) setErreurHoraires(true);
      }
    }

    chargerHoraires();

    return () => {
      actif = false;
    };
  }, []);

  const prochainePriere = useMemo(() => {
    if (!horaires) return null;

    const maintenant =
      heureActuelle.getHours() * 60 +
      heureActuelle.getMinutes();

    for (const nom of [
      "Fajr",
      "Dhuhr",
      "Asr",
      "Maghrib",
      "Isha",
    ]) {
      const valeur = horaires[nom];

      if (!valeur) continue;

      const [heures, minutes] = valeur
        .split(":")
        .map(Number);

      if (heures * 60 + minutes > maintenant) {
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

  const galerieVisible = useMemo(
    () => galerie.slice(0, 6),
    [galerie]
  );

  function construireUrlMedia(url) {
    if (!url) return "";

    if (
      url.startsWith("http://") ||
      url.startsWith("https://")
    ) {
      return url;
    }

    const baseUrl = (api.defaults.baseURL || "").replace(
      /\/$/,
      ""
    );

    const chemin = url.startsWith("/") ? url : `/${url}`;

    return `${baseUrl}${chemin}`;
  }

  function fermerMenu() {
    setMenuOuvert(false);
  }

  const navItems = [
    ["Accueil", "#accueil"],
    ["Le Dahira", "#dahira"],
    ["Galerie", "#galerie"],
    ["Histoire", "#histoire"],
    ["Contact", "#contact"],
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fbfaf6] text-slate-900">
      <style>{`
        html {
          scroll-behavior: smooth;
        }

        @keyframes floatSlow {
          0%,100% {
            transform: translate3d(0,0,0);
          }

          50% {
            transform: translate3d(12px,-18px,0);
          }
        }

        @keyframes floatReverse {
          0%,100% {
            transform: translate3d(0,0,0);
          }

          50% {
            transform: translate3d(-12px,16px,0);
          }
        }

        @keyframes pulseGlow {
          0%,100% {
            box-shadow:
              0 0 0 0 rgba(214,172,71,.12),
              0 0 35px rgba(214,172,71,.10);
          }

          50% {
            box-shadow:
              0 0 0 18px rgba(214,172,71,0),
              0 0 70px rgba(214,172,71,.20);
          }
        }

        @keyframes rotateSlow {
          from {
            transform:translate(-50%,-50%) rotate(0deg);
          }

          to {
            transform:translate(-50%,-50%) rotate(360deg);
          }
        }

        @keyframes rotateReverse {
          from {
            transform:translate(-50%,-50%) rotate(360deg);
          }

          to {
            transform:translate(-50%,-50%) rotate(0deg);
          }
        }

        @keyframes softAppear {
          from {
            opacity:0;
            transform:translateY(8px) scale(.98);
          }

          to {
            opacity:1;
            transform:translateY(0) scale(1);
          }
        }

        @keyframes scrollDown {
          0%,100% {
            transform:translateY(-3px);
            opacity:.4;
          }

          50% {
            transform:translateY(5px);
            opacity:1;
          }
        }

        .animate-float-slow {
          animation:floatSlow 8s ease-in-out infinite;
        }

        .animate-float-reverse {
          animation:floatReverse 9s ease-in-out infinite;
        }

        .animate-pulse-glow {
          animation:pulseGlow 3.8s ease-in-out infinite;
        }

        .animate-rotate-slow {
          animation:rotateSlow 28s linear infinite;
        }

        .animate-rotate-reverse {
          animation:rotateReverse 36s linear infinite;
        }

        .animate-soft-appear {
          animation:softAppear .65s ease-out forwards;
        }

        .animate-scroll-down {
          animation:scrollDown 1.8s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration:.01ms !important;
            animation-iteration-count:1 !important;
            scroll-behavior:auto !important;
            transition-duration:.01ms !important;
          }
        }
      `}</style>

      {/* NAVBAR */}
      <header
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "border-b border-slate-100 bg-white/90 py-3 shadow-sm backdrop-blur-2xl"
            : "bg-transparent py-5"
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              onClick={fermerMenu}
              className="flex items-center gap-3"
            >
              <div className="relative">
                <div
                  className={`absolute inset-0 rounded-2xl blur-xl ${
                    scrolled
                      ? "bg-emerald-400/20"
                      : "bg-white/20"
                  }`}
                />

                <img
                  src="/logo.png"
                  alt="Dahira Mawahibou Naafih"
                  className="relative h-11 w-11 rounded-2xl object-contain sm:h-12 sm:w-12"
                />
              </div>

              <div className="hidden sm:block">
                <div
                  className={`text-sm font-black tracking-tight ${
                    scrolled
                      ? "text-emerald-950"
                      : "text-white"
                  }`}
                >
                  MAWAHIBOU NAAFIH
                </div>

                <div
                  className={`text-[9px] uppercase tracking-[0.28em] ${
                    scrolled
                      ? "text-emerald-700"
                      : "text-white/60"
                  }`}
                >
                  Castors
                </div>
              </div>
            </Link>

            <nav className="hidden items-center gap-7 md:flex">
              {navItems.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className={`relative text-sm font-semibold transition-colors after:absolute after:-bottom-2 after:left-1/2 after:h-px after:w-0 after:-translate-x-1/2 after:bg-[#d6ac47] after:transition-all hover:after:w-full ${
                    scrolled
                      ? "text-slate-600 hover:text-emerald-800"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  {label}
                </a>
              ))}

              <Link
                to="/login"
                className="group inline-flex items-center gap-2 rounded-full bg-[#d6ac47] px-5 py-2.5 text-sm font-black text-emerald-950 shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              >
                Mon espace

                <ArrowRight
                  size={15}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </nav>

            <button
              type="button"
              onClick={() =>
                setMenuOuvert((ancien) => !ancien)
              }
              className={`rounded-xl p-2 md:hidden ${
                scrolled
                  ? "bg-emerald-50 text-emerald-900"
                  : "bg-white/10 text-white backdrop-blur"
              }`}
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

        <div
          className={`overflow-hidden transition-all duration-500 md:hidden ${
            menuOuvert
              ? "max-h-[430px] opacity-100"
              : "max-h-0 opacity-0"
          }`}
        >
          <div className="mx-4 mb-2 mt-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-2xl">
            <nav className="flex flex-col gap-1">
              {navItems.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={fermerMenu}
                  className="rounded-2xl px-4 py-3 font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                >
                  {label}
                </a>
              ))}

              <Link
                to="/login"
                onClick={fermerMenu}
                className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-emerald-950 px-4 py-3 font-black text-white"
              >
                Mon espace
                <ArrowRight size={17} />
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section
        id="accueil"
        className="relative min-h-[100svh] overflow-hidden bg-[#032d23]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(25,122,85,.72),transparent_42%),radial-gradient(circle_at_80%_80%,rgba(214,172,71,.12),transparent_30%),linear-gradient(135deg,#021f18,#064e3b_52%,#021f18)]" />

        <div className="absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-emerald-400/15 blur-3xl animate-float-slow" />

        <div className="absolute -right-48 top-1/3 h-[34rem] w-[34rem] rounded-full bg-[#d6ac47]/10 blur-3xl animate-float-reverse" />

        <div className="absolute left-1/2 top-[47%] h-[430px] w-[430px] rounded-full border border-white/5 sm:h-[650px] sm:w-[650px] animate-rotate-slow" />

        <div className="absolute left-1/2 top-[47%] h-[330px] w-[330px] rounded-full border border-[#d6ac47]/10 sm:h-[490px] sm:w-[490px] animate-rotate-reverse" />

        <div className="absolute left-[12%] top-[28%] h-2 w-2 rounded-full bg-[#d6ac47] shadow-[0_0_20px_rgba(214,172,71,.8)] animate-pulse" />

        <div className="absolute right-[15%] top-[33%] h-1.5 w-1.5 rounded-full bg-white/80 animate-ping" />

        <div className="absolute bottom-[25%] left-[20%] h-1 w-1 rounded-full bg-[#d6ac47] animate-pulse" />

        <div className="relative z-10 flex min-h-[100svh] items-center justify-center px-5 pb-20 pt-28">
          <div className="w-full max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-4 py-2 text-[9px] font-bold uppercase tracking-[.32em] text-white/70 backdrop-blur-xl">
              <Sparkles size={13} className="text-[#d6ac47]" />
              Dahira Mawahibou Naafih
            </div>

            <div className="relative mx-auto mt-8 h-36 w-36 sm:h-44 sm:w-44">
              <div className="absolute inset-0 rounded-full bg-[#d6ac47]/20 blur-2xl" />

              <div className="relative flex h-full w-full items-center justify-center rounded-full border border-white/20 bg-white/10 p-3 backdrop-blur-xl animate-pulse-glow">
                <div className="flex h-full w-full items-center justify-center rounded-full border border-white/10 bg-[#faf8f1]/10">
                  <img
                    src="/logo.png"
                    alt="Dahira Mawahibou Naafih"
                    className="h-28 w-28 rounded-full object-contain sm:h-36 sm:w-36"
                  />
                </div>
              </div>
            </div>

            <p className="mt-8 text-[10px] font-bold uppercase tracking-[.35em] text-[#d6ac47]">
              Castors • Dakar
            </p>

            <h1 className="mt-4 text-4xl font-black leading-[.94] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Une voie.
              <br />
              <span className="text-[#d6ac47]">
                Une communauté.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-white/60 sm:text-base">
              Foi. Fraternité. Engagement.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/login"
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d6ac47] px-7 py-4 text-sm font-black text-emerald-950 shadow-xl shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl sm:w-auto"
              >
                Accéder à mon espace

                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <a
                href="#dahira"
                className="flex w-full items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-7 py-4 text-sm font-bold text-white backdrop-blur transition-all hover:-translate-y-1 hover:bg-white/10 sm:w-auto"
              >
                Découvrir le Dahira
              </a>
            </div>

            <a
              href="#prieres"
              className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-white/40 transition hover:text-white"
            >
              <span className="text-[9px] uppercase tracking-[.3em]">
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

      {/* PRIERES */}
      <section
        id="prieres"
        className="relative z-20 -mt-7 px-4 sm:-mt-12"
      >
        <div className="mx-auto max-w-6xl">
          <div className="overflow-hidden rounded-[2rem] border border-white bg-white shadow-[0_25px_80px_rgba(2,44,34,.12)]">
            <div className="grid lg:grid-cols-[1fr_1.8fr]">
              <div className="relative overflow-hidden bg-emerald-950 p-7 text-white sm:p-9">
                <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#d6ac47]/15 blur-2xl" />

                <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-[#d6ac47]">
                    <Clock3 size={14} />
                    Prochaine prière
                  </div>

                  <div className="mt-5 text-5xl font-black tracking-tight sm:text-6xl">
                    {prochainePriere?.heure || "--:--"}
                  </div>

                  <div className="mt-2 text-xl font-bold">
                    {prochainePriere
                      ? PRIERE_NOMS[prochainePriere.nom] ||
                        prochainePriere.nom
                      : "Prochaine prière"}
                  </div>

                  <p className="mt-2 text-sm text-white/50">
                    {prochainePriere?.demain
                      ? "Demain à Dakar"
                      : "Aujourd'hui à Dakar"}
                  </p>

                  <div className="mt-8 flex items-center gap-2 text-xs text-white/45">
                    <MapPin size={13} />
                    Dakar, Sénégal
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-8">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[.22em] text-emerald-700">
                      Aujourd'hui
                    </p>

                    <h2 className="mt-1 text-xl font-black text-emerald-950">
                      Horaires de prière
                    </h2>
                  </div>

                  <div className="rounded-2xl bg-[#d6ac47]/10 p-3">
                    <Moon
                      size={21}
                      className="text-[#b88b28]"
                    />
                  </div>
                </div>

                {erreurHoraires ? (
                  <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                    Impossible de charger les horaires.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {[
                      "Fajr",
                      "Dhuhr",
                      "Asr",
                      "Maghrib",
                      "Isha",
                    ].map((nom) => (
                      <div
                        key={nom}
                        className={`group rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1 ${
                          prochainePriere?.nom === nom
                            ? "border-[#d6ac47]/40 bg-[#d6ac47]/10 shadow-sm"
                            : "border-slate-100 bg-[#fafaf8] hover:border-emerald-100 hover:bg-emerald-50"
                        }`}
                      >
                        <div className="text-[10px] font-black uppercase text-slate-400">
                          {PRIERE_NOMS[nom]}
                        </div>

                        <div className="mt-2 text-xl font-black text-emerald-950">
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

      {/* LE DAHIRA — VERSION COMPACTE */}
      <section
        id="dahira"
        className="px-5 py-16 sm:py-20"
      >
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-[0_20px_60px_rgba(2,44,34,.07)]">
              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#d6ac47]/10 blur-3xl" />

              <div className="relative grid items-center gap-8 p-7 sm:p-10 lg:grid-cols-[1.15fr_.85fr] lg:p-12">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.28em] text-emerald-700">
                    <span className="h-px w-7 bg-[#d6ac47]" />
                    Le Dahira
                    <span className="h-px w-7 bg-[#d6ac47]" />
                  </div>

                  <h2 className="mt-4 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
                    Une identité,
                    <span className="text-[#b88b28]">
                      {" "}
                      des valeurs.
                    </span>
                  </h2>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">
                    Mawahibou Naafih est une communauté attachée à la foi,
                    à la fraternité et à l'engagement.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    {
                      titre: "Foi",
                      texte: "Spiritualité",
                    },
                    {
                      titre: "Fraternité",
                      texte: "Unité",
                    },
                    {
                      titre: "Engagement",
                      texte: "Service",
                    },
                  ].map((valeur) => (
                    <div
                      key={valeur.titre}
                      className="rounded-2xl border border-slate-100 bg-[#fbfaf6] p-4 text-center transition duration-300 hover:-translate-y-1 hover:border-emerald-100 hover:shadow-md sm:p-5"
                    >
                      <div className="mx-auto h-1 w-7 rounded-full bg-[#d6ac47]" />

                      <h3 className="mt-3 text-sm font-black text-emerald-950 sm:text-base">
                        {valeur.titre}
                      </h3>

                      <p className="mt-1 text-[10px] text-slate-400 sm:text-xs">
                        {valeur.texte}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* RAPPEL */}
      <section className="px-5 pb-24 sm:pb-32">
        <Reveal>
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-emerald-950 px-7 py-14 text-center sm:px-14 sm:py-20">
            <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-[#d6ac47]/10 blur-3xl" />

            <div className="absolute left-10 top-10 h-2 w-2 rounded-full bg-[#d6ac47] animate-pulse" />

            <div className="absolute bottom-10 right-12 h-1.5 w-1.5 rounded-full bg-white/70 animate-ping" />

            <div className="relative z-10">
              <Sparkles
                size={26}
                className="mx-auto text-[#d6ac47]"
              />

              <div
                key={rappelIndex}
                className="animate-soft-appear"
              >
                <p className="mx-auto mt-7 max-w-4xl text-2xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
                  « {RAPPELS[rappelIndex]} »
                </p>
              </div>

              <div className="mt-7 flex justify-center gap-1.5">
                {RAPPELS.map((_, index) => (
                  <span
                    key={index}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      index === rappelIndex
                        ? "w-7 bg-[#d6ac47]"
                        : "w-1.5 bg-white/20"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* GUIDE */}
      <section className="relative overflow-hidden bg-emerald-950 px-6 py-24 text-white sm:py-32">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#d6ac47]/5 blur-3xl" />

        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="grid items-center gap-12 lg:grid-cols-[300px_1fr] lg:gap-20">
              <div className="flex justify-center lg:justify-start">
                <div className="relative">
                  <div className="absolute -inset-4 rounded-[2.5rem] border border-[#d6ac47]/25" />

                  <div className="absolute -inset-7 rounded-[2.8rem] border border-white/5" />

                  <div className="relative h-[400px] w-[290px] overflow-hidden rounded-[2rem] bg-white/5 shadow-2xl">
                    <img
                      src={guideImage}
                      alt="Serigne Moustapha Abdou Khadr Mbacké"
                      className="h-full w-full object-cover transition duration-700 hover:scale-105"
                    />

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                      <p className="text-[9px] font-bold uppercase tracking-[.25em] text-[#d6ac47]">
                        Notre guide
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[.25em] text-[#d6ac47]">
                  Notre guide
                </p>

                <h2 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">
                  Serigne Moustapha
                  <span className="block text-[#d6ac47]">
                    Abdou Khadr Mbacké
                  </span>
                </h2>

                <div className="mt-6 h-1 w-16 rounded-full bg-[#d6ac47]" />

                <p className="mt-7 max-w-2xl text-base leading-8 text-white/65 sm:text-lg">
                  Troisième fils de Serigne Abdou Khadre MBACKE qui fut le
                  4e Khalif Général des Mourides, est l’actuel Imam de
                  Massalikoul Djinan pour toutes les prières des EID.

                  <br />
                  <br />

                  Grand cultivateur, il a de nombreux “talibés” apprenants
                  du saint Coran sous sa responsabilité.

                  <br />
                  <br />

                  Le nom de MAWAHIBOU NAFIH FI MADA IHI CHAFIH (LES DONS DU
                  PROFITABLE DANS LES PANEGYRIQUES DE L’INTERCESSEUR) a été
                  choisi pour ces dahiras organisés en fédération.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PIONNIERS */}
      <section
        id="pionniers"
        className="px-5 py-24 sm:py-32"
      >
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionHeading
              eyebrow="Mémoire"
              title="Ceux qui ont ouvert"
              accent="la voie."
              description="Honorer celles et ceux qui ont participé aux premiers pas du Dahira."
            />
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {PIONNIERS.map((pionnier, index) => (
              <Reveal
                key={`${pionnier.nom}-${index}`}
                delay={index * 100}
              >
                <div className="group relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-7 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(2,44,34,.10)]">
                  <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#d6ac47]/10 transition-transform duration-500 group-hover:scale-150" />

                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-950 text-lg font-black text-[#d6ac47]">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <h3 className="mt-7 text-xl font-black text-emerald-950">
                    {pionnier.nom}
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    {pionnier.fonction}
                  </p>

                  <div className="mt-7 h-px bg-slate-100" />

                  <p className="mt-4 text-xs font-semibold uppercase tracking-[.18em] text-emerald-700">
                    Mémoire du Dahira
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* HISTOIRE */}
      <section
        id="histoire"
        className="bg-white px-5 py-24 sm:py-32"
      >
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionHeading
              center
              eyebrow="Notre histoire"
              title="Une histoire."
              accent="Une mémoire. Un avenir."
            />
          </Reveal>

          <div className="relative mt-16">
            <div className="absolute bottom-0 left-1/2 top-0 hidden w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#d6ac47]/50 to-transparent md:block" />

            <div className="space-y-8 md:space-y-12">
              {HISTORIQUE.map((etape, index) => {
                const gauche = index % 2 === 0;

                return (
                  <Reveal
                    key={etape.titre}
                    delay={index * 100}
                  >
                    <div className="relative grid gap-6 md:grid-cols-2 md:gap-12">
                      <div
                        className={
                          gauche
                            ? "md:text-right"
                            : "md:col-start-2"
                        }
                      >
                        <div className="group rounded-[2rem] border border-slate-100 bg-[#fbfaf6] p-7 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl">
                          <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.18em] text-emerald-700">
                            {etape.periode}
                          </span>

                          <h3 className="mt-4 text-2xl font-black text-emerald-950">
                            {etape.titre}
                          </h3>

                          <p className="mt-3 text-sm leading-7 text-slate-500">
                            {etape.texte}
                          </p>
                        </div>
                      </div>

                      <div className="absolute left-1/2 top-1/2 hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-emerald-950 text-xs font-black text-[#d6ac47] shadow-lg md:flex">
                        {index + 1}
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* GALERIE */}
      <section
        id="galerie"
        className="px-5 py-24 sm:py-32"
      >
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading
                eyebrow="Moments"
                title="Notre galerie."
                description="Les souvenirs et moments de vie du Dahira."
              />

              <div className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400 sm:block">
                Vie du Dahira
              </div>
            </div>
          </Reveal>

          {galerieVisible.length > 0 ? (
            <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
              {galerieVisible.map((element, index) => {
                const mediaUrl =
                  element.url ||
                  element.image_url ||
                  element.media_url ||
                  element.fichier_url;

                const url = construireUrlMedia(mediaUrl);

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
                    delay={index * 70}
                    className={
                      index === 0
                        ? "lg:row-span-2"
                        : ""
                    }
                  >
                    <div
                      className={`group relative overflow-hidden rounded-[1.7rem] bg-slate-100 shadow-sm ${
                        index === 0
                          ? "lg:h-full"
                          : ""
                      }`}
                    >
                      {url ? (
                        estVideo ? (
                          <video
                            src={url}
                            controls
                            preload="metadata"
                            playsInline
                            className={`w-full object-cover ${
                              index === 0
                                ? "aspect-[4/3] h-full lg:aspect-auto"
                                : "aspect-square lg:aspect-[4/3]"
                            }`}
                          />
                        ) : (
                          <img
                            src={url}
                            alt={
                              element.titre ||
                              "Galerie du Dahira"
                            }
                            loading="lazy"
                            className={`w-full object-cover transition duration-700 group-hover:scale-105 ${
                              index === 0
                                ? "aspect-[4/3] h-full lg:aspect-auto"
                                : "aspect-square lg:aspect-[4/3]"
                            }`}
                          />
                        )
                      ) : (
                        <div className="flex aspect-square items-center justify-center text-sm text-slate-400">
                          Média indisponible
                        </div>
                      )}

                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                      <div className="pointer-events-none absolute bottom-4 left-4 right-4 translate-y-3 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                        <div className="flex items-center gap-2 text-sm font-bold text-white">
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
              })}
            </div>
          ) : (
            <div className="mt-12 rounded-[2rem] border border-dashed border-slate-200 bg-white p-14 text-center">
              <Star
                size={30}
                className="mx-auto text-[#d6ac47]"
              />

              <p className="mt-4 font-bold text-slate-600">
                Les prochains moments apparaîtront ici.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="px-5 pb-24 sm:pb-32">
  <Reveal>
    <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-[#d6ac47] px-7 py-12 sm:px-14 sm:py-16">
      <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-white/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-emerald-900/10 blur-3xl" />

      <div className="relative z-10 grid gap-10 lg:grid-cols-[1fr_360px] lg:items-center">
        {/* Texte */}
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.25em] text-emerald-950/55">
            <MapPin size={14} />
            Castors — Dakar
          </div>

          <h2 className="mt-4 text-4xl font-black tracking-tight text-emerald-950 sm:text-5xl">
            Restons connectés.
          </h2>

          <p className="mt-4 max-w-lg text-sm leading-7 text-emerald-950/65">
            Une question, une information ou simplement besoin d'échanger
            avec le Dahira ? Vous pouvez contacter directement le Dieuwrigne.
          </p>

          <div className="mt-7">
            <Link
              to="/login"
              className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-emerald-950 px-7 py-4 font-black text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              Rejoindre mon espace
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>

        {/* Contact Dieuwrigne */}
        <div className="rounded-[2rem] bg-white/95 p-6 shadow-xl backdrop-blur-sm">
          <div className="text-[10px] font-black uppercase tracking-[.22em] text-emerald-950/45">
            Contact
          </div>

          <div className="mt-3">
            <h3 className="text-2xl font-black text-emerald-950">
              Babacar Pierre Diallo
            </h3>

            <p className="mt-1 text-sm font-semibold text-emerald-950/55">
              Dieuwrigne
            </p>
          </div>

          <div className="mt-5 rounded-2xl bg-[#f8f5ec] px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-950/40">
              Téléphone
            </p>

            <p className="mt-1 text-lg font-black tracking-wide text-emerald-950">
              78 923 27 51
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <a
              href="tel:+221789232751"
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-950 px-4 py-3 text-sm font-black text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Phone size={17} />
              Appeler
            </a>

            <a
              href="https://wa.me/221789232751"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#f1e3bd] px-4 py-3 text-sm font-black text-emerald-950 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <MessageCircle size={17} />
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  </Reveal>
</section>

      {/* FOOTER */}
      <footer className="bg-emerald-950 px-5 py-12 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-7 sm:flex-row">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Dahira Mawahibou Naafih"
              className="h-12 w-12 rounded-xl object-contain"
            />

            <div>
              <div className="text-sm font-black">
                MAWAHIBOU NAAFIH
              </div>

              <div className="text-[9px] uppercase tracking-[.28em] text-white/35">
                Castors
              </div>
            </div>
          </div>

          <div className="text-center sm:text-right">
            <p className="text-xs text-white/40">
              © {new Date().getFullYear()} Dahira Mawahibou Naafih
            </p>

            <p className="mt-1 text-[10px] text-white/25">
              Fraternité • Spiritualité • Engagement
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}