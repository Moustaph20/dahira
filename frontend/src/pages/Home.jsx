import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import guideImage from "../assets/guide.jpg";

import api from "../api/client";

import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Menu,
  Moon,
  Play,
  Quote,
  Sparkles,
  Sun,
  Video,
  X,
} from "lucide-react";

function Home() {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [horaires, setHoraires] = useState(null);
  const [chargementHoraires, setChargementHoraires] = useState(true);

  const [rappelIndex, setRappelIndex] = useState(0);
  const [filtreGalerie, setFiltreGalerie] = useState("tout");

  // ==========================================================
  // GALERIE DYNAMIQUE
  // ==========================================================

  const [galerie, setGalerie] = useState([]);
  const [chargementGalerie, setChargementGalerie] = useState(true);
  const [erreurGalerie, setErreurGalerie] = useState("");

  // ==========================================================
  // RAPPELS
  // ==========================================================

  const rappels = [
    {
      texte:
        "Le cœur qui se tourne vers Allah trouve dans Son rappel une source de paix.",
      source: "Rappel spirituel",
    },
    {
      texte:
        "La connaissance, la patience et la persévérance accompagnent le cheminement du croyant.",
      source: "Rappel spirituel",
    },
    {
      texte:
        "Que nos paroles, nos actes et nos intentions soient orientés vers le bien.",
      source: "Rappel spirituel",
    },
  ];

  // ==========================================================
  // PIONNIERS
  // ==========================================================
  //
  // Les photos seront ajoutées ici lorsque tu me donneras
  // les noms exacts des fichiers des pionniers.
  //
  const pionniers = [
    {
      nom: "Nom à renseigner",
      fonction: "Membre fondateur",
      photo: null,
    },
    {
      nom: "Nom à renseigner",
      fonction: "Membre fondateur",
      photo: null,
    },
    {
      nom: "Nom à renseigner",
      fonction: "Membre pionnier",
      photo: null,
    },
  ];

  // ==========================================================
  // CHARGER LA GALERIE
  // ==========================================================

  useEffect(() => {
    let actif = true;

    async function chargerGalerie() {
      try {
        setChargementGalerie(true);
        setErreurGalerie("");

        const response = await api.get("/galerie/public");

        if (actif) {
          setGalerie(
            Array.isArray(response.data)
              ? response.data
              : []
          );
        }
      } catch (error) {
        console.error(
          "ERREUR GALERIE :",
          error
        );

        if (actif) {
          setGalerie([]);
          setErreurGalerie(
            "La galerie est momentanément indisponible."
          );
        }
      } finally {
        if (actif) {
          setChargementGalerie(false);
        }
      }
    }

    chargerGalerie();

    return () => {
      actif = false;
    };
  }, []);

  // ==========================================================
  // CONSTRUIRE L'URL D'UN MÉDIA
  // ==========================================================

  function construireUrlMedia(url) {
    if (!url) {
      return "";
    }

    // Si l'API renvoie déjà une URL complète
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
  // FILTRE GALERIE
  // ==========================================================

  const mediasFiltres = useMemo(() => {
    if (filtreGalerie === "tout") {
      return galerie;
    }

    return galerie.filter(
      (media) =>
        media.type_media === filtreGalerie
    );
  }, [galerie, filtreGalerie]);

  // ==========================================================
  // ÉVÉNEMENTS
  // ==========================================================

  const evenements = [
    {
      categorie: "Réunion",
      titre: "Réunion mensuelle",
      texte:
        "Retrouvez les membres du Dahira autour des activités et orientations de la communauté.",
    },
    {
      categorie: "Religieux",
      titre: "Programme religieux",
      texte:
        "Un moment consacré au rappel, à la récitation et à la transmission.",
    },
    {
      categorie: "Communauté",
      titre: "Activité communautaire",
      texte:
        "Un rendez-vous pour renforcer les liens fraternels et la solidarité.",
    },
  ];

  // ==========================================================
  // HORAIRES DE PRIÈRE
  // ==========================================================

  useEffect(() => {
    let actif = true;

    async function chargerHoraires() {
      try {
        setChargementHoraires(true);

        const maintenant = new Date();

        const jour = String(
          maintenant.getDate()
        ).padStart(2, "0");

        const mois = String(
          maintenant.getMonth() + 1
        ).padStart(2, "0");

        const annee = maintenant.getFullYear();

        const url =
          `https://api.aladhan.com/v1/timings/${jour}-${mois}-${annee}` +
          `?latitude=14.7167&longitude=-17.4677&method=3`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            "Erreur lors de la récupération des horaires."
          );
        }

        const data = await response.json();

        if (!data?.data?.timings) {
          throw new Error(
            "Horaires indisponibles."
          );
        }

        if (actif) {
          setHoraires(
            data.data.timings
          );
        }
      } catch (error) {
        console.error(
          "ERREUR HORAIRES :",
          error
        );
      } finally {
        if (actif) {
          setChargementHoraires(false);
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
    if (!horaires) return null;

    const prieres = [
      {
        nom: "Fajr",
        heure: horaires.Fajr,
      },
      {
        nom: "Dhuhr",
        heure: horaires.Dhuhr,
      },
      {
        nom: "Asr",
        heure: horaires.Asr,
      },
      {
        nom: "Maghrib",
        heure: horaires.Maghrib,
      },
      {
        nom: "Isha",
        heure: horaires.Isha,
      },
    ];

    const maintenant = new Date();

    for (const priere of prieres) {
      if (!priere.heure) continue;

      const [heure, minute] =
        priere.heure
          .split(":")
          .map(Number);

      const datePriere = new Date();

      datePriere.setHours(
        heure,
        minute,
        0,
        0
      );

      if (datePriere > maintenant) {
        return priere;
      }
    }

    return prieres[0];
  }, [horaires]);

  // ==========================================================
  // ROTATION DES RAPPELS
  // ==========================================================

  useEffect(() => {
    const interval = setInterval(() => {
      setRappelIndex(
        (ancienIndex) =>
          (ancienIndex + 1) %
          rappels.length
      );
    }, 12000);

    return () =>
      clearInterval(interval);
  }, [rappels.length]);

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
    <div className="min-h-screen bg-[#faf9f5] text-gray-800">
      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <header className="fixed left-0 right-0 top-0 z-50 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-6">
          <a
            href="#accueil"
            onClick={fermerMenu}
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-900 text-xl text-amber-300 shadow-md">
              ☪
            </div>

            <div>
              <h1 className="text-sm font-bold leading-tight text-emerald-950 sm:text-base">
                Dahira Mawahibou Naafih
              </h1>

              <p className="text-xs text-gray-500">
                de Castors
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-7 lg:flex">
            <a
              href="#accueil"
              className="text-sm font-medium text-gray-700 transition hover:text-emerald-700"
            >
              Accueil
            </a>

            <a
              href="#dahira"
              className="text-sm font-medium text-gray-700 transition hover:text-emerald-700"
            >
              Le Dahira
            </a>

            <a
              href="#guide"
              className="text-sm font-medium text-gray-700 transition hover:text-emerald-700"
            >
              Notre guide
            </a>

            <a
              href="#pionniers"
              className="text-sm font-medium text-gray-700 transition hover:text-emerald-700"
            >
              Pionniers
            </a>

            <a
              href="#galerie"
              className="text-sm font-medium text-gray-700 transition hover:text-emerald-700"
            >
              Galerie
            </a>

            <a
              href="#contact"
              className="text-sm font-medium text-gray-700 transition hover:text-emerald-700"
            >
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden rounded-full bg-emerald-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-950 sm:inline-flex"
            >
              Se connecter
            </Link>

            <button
              type="button"
              onClick={() =>
                setMenuOuvert(!menuOuvert)
              }
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-emerald-900 lg:hidden"
              aria-label="Menu"
            >
              {menuOuvert ? (
                <X size={21} />
              ) : (
                <Menu size={21} />
              )}
            </button>
          </div>
        </div>

        {menuOuvert && (
          <div className="border-t border-gray-100 bg-white px-5 py-4 shadow-lg lg:hidden">
            <nav className="flex flex-col gap-1">
              {[
                ["#accueil", "Accueil"],
                ["#dahira", "Le Dahira"],
                ["#guide", "Notre guide"],
                ["#pionniers", "Pionniers"],
                ["#galerie", "Galerie"],
                ["#contact", "Contact"],
              ].map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  onClick={fermerMenu}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-800"
                >
                  {label}
                </a>
              ))}

              <Link
                to="/login"
                onClick={fermerMenu}
                className="mt-2 rounded-xl bg-emerald-900 px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Espace membre
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* =====================================================
          HERO
      ====================================================== */}

      <section
        id="accueil"
        className="relative flex min-h-[88vh] items-center overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 pt-24"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 top-10 h-[500px] w-[500px] rounded-full border-[70px] border-white/5" />

          <div className="absolute -bottom-52 -right-32 h-[650px] w-[650px] rounded-full border-[90px] border-white/5" />

          <div className="absolute right-[25%] top-[25%] h-2 w-2 rounded-full bg-amber-300/70" />

          <div className="absolute left-[42%] top-[18%] h-1.5 w-1.5 rounded-full bg-white/40" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-2 lg:items-center">
          <div className="text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-300 backdrop-blur-sm">
              <Sparkles size={14} />
              Bienvenue
            </div>

            <h2 className="mt-7 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Dahira
              <span className="block text-amber-300">
                Mawahibou Naafih
              </span>

              <span className="mt-2 block text-2xl font-normal text-white/70 sm:text-3xl">
                de Castors
              </span>
            </h2>

            <div className="mt-7 h-1 w-16 rounded-full bg-amber-400" />

            <p className="mt-6 max-w-xl text-lg leading-8 text-white/70">
              Un lieu de foi, de fraternité, de transmission et
              de service, au cœur de Castors.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#dahira"
                className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-7 py-3.5 font-semibold text-emerald-950 shadow-lg transition hover:bg-amber-300"
              >
                Découvrir
                <ArrowRight size={18} />
              </a>

              <Link
                to="/login"
                className="inline-flex items-center rounded-full border border-white/30 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10"
              >
                Espace membre
              </Link>
            </div>
          </div>

          <div className="hidden justify-center lg:flex">
            <div className="relative flex h-[410px] w-[410px] items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
              <div className="absolute inset-8 rounded-full border border-amber-300/20" />

              <div className="absolute inset-16 rounded-full border border-white/10" />

              <div className="relative flex h-64 w-64 flex-col items-center justify-center rounded-full border border-amber-300/30 bg-emerald-950/60 text-center shadow-2xl">
                <div className="mb-4 text-6xl text-amber-300">
                  ☪
                </div>

                <p className="text-xl font-bold text-white">
                  Mawahibou Naafih
                </p>

                <p className="mt-2 text-sm text-white/50">
                  Dahira de Castors
                </p>

                <div className="mt-5 h-px w-16 bg-amber-300/50" />

                <p className="mt-4 text-xs uppercase tracking-[0.2em] text-white/40">
                  Foi • Fraternité • Service
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          HORAIRES DE PRIÈRE
      ====================================================== */}

      <section className="relative z-10 -mt-8 px-5 pb-8">
        <div className="mx-auto max-w-6xl rounded-3xl bg-white p-5 shadow-2xl ring-1 ring-gray-100 sm:p-7">
          <div className="grid gap-7 lg:grid-cols-[0.65fr_1.35fr] lg:items-center">
            <div className="rounded-2xl bg-emerald-950 p-6 text-white">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.15em] text-amber-300">
                <Clock3 size={17} />
                Aujourd'hui
              </div>

              <h2 className="mt-4 text-2xl font-bold">
                Horaires de prière
              </h2>

              <p className="mt-2 text-sm text-white/50">
                Dakar, Sénégal
              </p>

              {chargementHoraires ? (
                <div className="mt-6 h-16 animate-pulse rounded-xl bg-white/10" />
              ) : prochainePriere ? (
                <div className="mt-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-white/40">
                      Prochaine prière
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {prochainePriere.nom}
                    </p>
                  </div>

                  <p className="text-3xl font-bold text-amber-300">
                    {prochainePriere.heure}
                  </p>
                </div>
              ) : (
                <p className="mt-6 text-sm text-white/50">
                  Horaires indisponibles.
                </p>
              )}
            </div>

            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-emerald-950">
                  Horaires du jour
                </p>

                <p className="text-xs text-gray-400">
                  Dakar
                </p>
              </div>

              {chargementHoraires ? (
                <div className="grid gap-3 sm:grid-cols-5">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div
                      key={item}
                      className="h-24 animate-pulse rounded-2xl bg-gray-100"
                    />
                  ))}
                </div>
              ) : horaires ? (
                <div className="grid gap-3 sm:grid-cols-5">
                  <PrayerMini
                    icon={Moon}
                    nom="Fajr"
                    heure={horaires.Fajr}
                  />

                  <PrayerMini
                    icon={Sun}
                    nom="Dhuhr"
                    heure={horaires.Dhuhr}
                  />

                  <PrayerMini
                    icon={Sun}
                    nom="Asr"
                    heure={horaires.Asr}
                  />

                  <PrayerMini
                    icon={Moon}
                    nom="Maghrib"
                    heure={horaires.Maghrib}
                  />

                  <PrayerMini
                    icon={Moon}
                    nom="Isha"
                    heure={horaires.Isha}
                  />
                </div>
              ) : (
                <div className="rounded-2xl bg-gray-50 p-6 text-center text-sm text-gray-500">
                  Les horaires sont momentanément indisponibles.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          RAPPEL
      ====================================================== */}

      <section className="px-6 py-16 lg:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-950 to-emerald-900 p-8 text-center text-white shadow-xl sm:p-12">
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full border-[30px] border-white/5" />

            <div className="relative">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-emerald-950">
                <Quote size={22} />
              </div>

              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">
                Rappel du jour
              </p>

              <blockquote className="mx-auto mt-5 max-w-3xl text-2xl font-medium leading-10 sm:text-3xl">
                « {rappels[rappelIndex].texte} »
              </blockquote>

              <p className="mt-5 text-sm text-white/40">
                — {rappels[rappelIndex].source}
              </p>

              <div className="mt-7 flex justify-center gap-2">
                {rappels.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() =>
                      setRappelIndex(index)
                    }
                    className={`h-2 rounded-full transition-all ${
                      index === rappelIndex
                        ? "w-7 bg-amber-300"
                        : "w-2 bg-white/20"
                    }`}
                    aria-label={`Rappel ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          LE DAHIRA
      ====================================================== */}

      <section
        id="dahira"
        className="bg-[#f1f5f0] px-6 py-20 lg:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Le Dahira
              </p>

              <h2 className="mt-3 text-4xl font-bold leading-tight text-emerald-950 sm:text-5xl">
                Une communauté réunie autour de la foi
              </h2>

              <div className="mt-6 h-1 w-16 rounded-full bg-amber-400" />
            </div>

            <div className="space-y-5 text-gray-600">
              <p className="text-lg leading-8">
                Le Dahira Mawahibou Naafih de Castors est une
                communauté fondée sur la foi, la fraternité, la
                transmission et le service.
              </p>

              <p className="leading-8">
                À travers les rencontres, les programmes religieux,
                les Khassidas et les différentes activités
                communautaires, le Dahira rassemble ses membres
                autour d'un même esprit de solidarité et
                d'engagement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          GUIDE
      ====================================================== */}

      <section
        id="guide"
        className="bg-emerald-950 px-6 py-20 text-white lg:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-[0.65fr_1.35fr] lg:items-center">
            <div className="flex justify-center">
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

            <div>
              <p className="font-semibold uppercase tracking-[0.2em] text-amber-300">
                Notre guide
              </p>

              <h2 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
                Serigne Moustapha
                <span className="block text-amber-300">
                  Abdou Khadr Mbacké
                </span>
              </h2>

              <div className="mt-6 h-1 w-16 rounded-full bg-amber-400" />

              <p className="mt-7 text-lg leading-8 text-white/70">
                Le Dahira bénéficie de l'accompagnement et des
                enseignements de son guide, dont l'orientation
                contribue à la transmission des valeurs
                spirituelles et à l'unité de ses membres.
              </p>

              <p className="mt-5 leading-8 text-white/55">
                Fils de Serigne Abdou Khadr Mbacké, quatrième
                Khalife Général des Mourides, il s'inscrit dans
                une lignée spirituelle consacrée à la transmission
                des enseignements de Cheikh Ahmadou Bamba
                Khadimou Rassoul.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          PIONNIERS
      ====================================================== */}

      <section
        id="pionniers"
        className="bg-white px-6 py-20 lg:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Notre histoire
            </p>

            <h2 className="mt-3 text-4xl font-bold text-emerald-950 sm:text-5xl">
              Nos pionniers
            </h2>

            <p className="mt-5 leading-7 text-gray-500">
              Ceux qui ont participé aux premières étapes de la
              construction du Dahira occupent une place
              particulière dans notre mémoire.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-3">
            {pionniers.map((pionnier, index) => (
              <PionnierCard
                key={`${pionnier.nom}-${index}`}
                pionnier={pionnier}
              />
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          GALERIE MULTIMÉDIA
      ====================================================== */}

      <section
        id="galerie"
        className="bg-[#f1f5f0] px-6 py-20 lg:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Souvenirs
              </p>

              <h2 className="mt-3 text-4xl font-bold text-emerald-950 sm:text-5xl">
                Notre galerie
              </h2>

              <p className="mt-4 max-w-xl leading-7 text-gray-500">
                Retrouvez quelques moments de la vie du Dahira,
                en photos et en vidéos.
              </p>
            </div>

            {/* FILTRES */}

            <div className="flex flex-wrap gap-2">
              <GalleryFilter
                actif={filtreGalerie === "tout"}
                onClick={() =>
                  setFiltreGalerie("tout")
                }
                icon={Sparkles}
              >
                Tout
              </GalleryFilter>

              <GalleryFilter
                actif={filtreGalerie === "image"}
                onClick={() =>
                  setFiltreGalerie("image")
                }
                icon={Sun}
              >
                Photos
              </GalleryFilter>

              <GalleryFilter
                actif={filtreGalerie === "video"}
                onClick={() =>
                  setFiltreGalerie("video")
                }
                icon={Video}
              >
                Vidéos
              </GalleryFilter>
            </div>
          </div>

          {/* ==================================================
              CHARGEMENT
          ================================================== */}

          {chargementGalerie ? (
            <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[1, 2, 3, 4, 5, 6].map(
                (item) => (
                  <div
                    key={item}
                    className={`animate-pulse rounded-3xl bg-gray-200 ${
                      item === 1
                        ? "col-span-2 h-64 lg:col-span-2 lg:h-80"
                        : "h-64 lg:h-80"
                    }`}
                  />
                )
              )}
            </div>
          ) : erreurGalerie ? (
            <div className="mt-10 rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center">
              <p className="text-gray-500">
                {erreurGalerie}
              </p>
            </div>
          ) : mediasFiltres.length > 0 ? (
            /* ==================================================
                GRILLE
            ================================================== */

            <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {mediasFiltres.map(
                (media, index) => (
                  <MediaCard
                    key={media.id}
                    media={{
                      ...media,
                      src: construireUrlMedia(
                        media.url
                      ),
                      type:
                        media.type_media,
                    }}
                    grande={index === 0}
                  />
                )
              )}
            </div>
          ) : (
            <div className="mt-10 rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center">
              <p className="text-gray-500">
                Aucun média disponible dans cette catégorie.
              </p>
            </div>
          )}

          <div className="mt-8 text-center">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
            >
              Voir toute la galerie
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          À VENIR
      ====================================================== */}

      <section className="bg-white px-6 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
              <CalendarDays size={24} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Agenda
              </p>

              <h2 className="mt-1 text-3xl font-bold text-emerald-950">
                À venir
              </h2>
            </div>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {evenements.map(
              (evenement, index) => (
                <div
                  key={`${evenement.titre}-${index}`}
                  className="rounded-3xl border border-gray-100 bg-[#faf9f5] p-6 transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                    {evenement.categorie}
                  </span>

                  <h3 className="mt-5 text-xl font-bold text-emerald-950">
                    {evenement.titre}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-gray-500">
                    {evenement.texte}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          CONTACT
      ====================================================== */}

      <section
        id="contact"
        className="bg-emerald-950 px-6 py-20 text-white"
      >
        <div className="mx-auto max-w-6xl text-center">
          <p className="font-semibold uppercase tracking-[0.2em] text-amber-300">
            Nous trouver
          </p>

          <h2 className="mt-3 text-4xl font-bold">
            Dahira Mawahibou Naafih
          </h2>

          <p className="mt-2 text-xl text-white/50">
            de Castors
          </p>

          <div className="mt-8 flex justify-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-4 text-white/70">
              📍
              <span>
                Castors, Dakar, Sénégal
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CTA
      ====================================================== */}

      <section className="bg-amber-400 px-6 py-14">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-950/55">
              Membres du Dahira
            </p>

            <h2 className="mt-2 text-3xl font-bold text-emerald-950">
              Accédez à votre espace personnel
            </h2>
          </div>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-950 px-7 py-3.5 font-semibold text-white transition hover:bg-emerald-900"
          >
            Se connecter
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="bg-emerald-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h3 className="font-bold">
                Dahira Mawahibou Naafih
              </h3>

              <p className="mt-1 text-sm text-white/40">
                de Castors
              </p>
            </div>

            <div className="flex flex-wrap gap-5 text-sm text-white/45">
              <a
                href="#dahira"
                className="transition hover:text-amber-300"
              >
                Le Dahira
              </a>

              <a
                href="#guide"
                className="transition hover:text-amber-300"
              >
                Notre guide
              </a>

              <a
                href="#pionniers"
                className="transition hover:text-amber-300"
              >
                Pionniers
              </a>

              <a
                href="#galerie"
                className="transition hover:text-amber-300"
              >
                Galerie
              </a>

              <a
                href="#contact"
                className="transition hover:text-amber-300"
              >
                Contact
              </a>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/25">
            © {new Date().getFullYear()} Dahira Mawahibou Naafih de
            Castors. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// MINI CARTE PRIÈRE
// ============================================================

function PrayerMini({
  icon: Icon,
  nom,
  heure,
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-[#faf9f5] p-4 text-center">
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
        <Icon size={17} />
      </div>

      <p className="mt-3 text-xs font-semibold text-gray-500">
        {nom}
      </p>

      <p className="mt-1 text-lg font-bold text-emerald-950">
        {heure || "--:--"}
      </p>
    </div>
  );
}

// ============================================================
// CARTE PIONNIER
// ============================================================

function PionnierCard({
  pionnier,
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-[#faf9f5] shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex h-56 items-center justify-center bg-emerald-950">
        {pionnier.photo ? (
          <img
            src={pionnier.photo}
            alt={pionnier.nom}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5 text-3xl">
            👤
          </div>
        )}
      </div>

      <div className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-600">
          {pionnier.fonction}
        </p>

        <h3 className="mt-2 text-xl font-bold text-emerald-950">
          {pionnier.nom}
        </h3>
      </div>
    </div>
  );
}

// ============================================================
// CARTE MÉDIA
// ============================================================

function MediaCard({
  media,
  grande = false,
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-3xl bg-emerald-950 ${
        grande
          ? "col-span-2 h-64 lg:col-span-2 lg:h-80"
          : "h-64 lg:h-80"
      }`}
    >
      {media.type === "image" ? (
        <img
          src={media.src}
          alt={media.titre}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <video
          src={media.src}
          controls
          preload="metadata"
          playsInline
          className="h-full w-full object-cover"
        />
      )}

      {/* BADGE VIDÉO */}

      {media.type === "video" && (
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm">
          <Play
            size={13}
            fill="currentColor"
          />
          Vidéo
        </div>
      )}

      {/* TITRE */}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-5 pt-12">
        <p className="text-sm font-semibold text-white">
          {media.titre}
        </p>

        {media.description && (
          <p className="mt-1 line-clamp-2 text-xs text-white/70">
            {media.description}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// FILTRE GALERIE
// ============================================================

function GalleryFilter({
  actif,
  onClick,
  icon: Icon,
  children,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
        actif
          ? "bg-emerald-900 text-white shadow-sm"
          : "border border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:text-emerald-800"
      }`}
    >
      <Icon size={15} />
      {children}
    </button>
  );
}

export default Home;