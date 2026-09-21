import { useEffect, useState } from "react";

import {
  Users,
  Wallet,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowUpCircle,
  ArrowDownCircle,
  Banknote,
  Landmark,
  CircleCheck,
  AlertCircle,
  CalendarDays,
} from "lucide-react";

import api from "../api/client";

function Dashboard() {
  const [donnees, setDonnees] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  // ============================================================
  // FILTRE DE PÉRIODE
  // ============================================================

  const [periode, setPeriode] = useState("tout");

  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  const [periodeAppliquee, setPeriodeAppliquee] = useState({
    dateDebut: null,
    dateFin: null,
  });

  // ============================================================
  // FORMATAGE DES MONTANTS
  // ============================================================

  function formaterMontant(montant) {
    const valeur = Number(montant ?? 0);

    return new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(valeur);
  }

  // ============================================================
  // FORMATAGE DES DATES
  // ============================================================

  function formaterDate(date) {
    if (!date) {
      return "";
    }

    const [annee, mois, jour] = date.split("-");

    return `${jour}/${mois}/${annee}`;
  }

  // ============================================================
  // DATE LOCALE AU FORMAT YYYY-MM-DD
  // ============================================================

  function dateLocaleISO(date = new Date()) {
    const annee = date.getFullYear();
    const mois = String(
      date.getMonth() + 1
    ).padStart(2, "0");
    const jour = String(
      date.getDate()
    ).padStart(2, "0");

    return `${annee}-${mois}-${jour}`;
  }

  // ============================================================
  // PREMIER JOUR DU MOIS
  // ============================================================

  function premierJourMois(date = new Date()) {
    return dateLocaleISO(
      new Date(
        date.getFullYear(),
        date.getMonth(),
        1
      )
    );
  }

  // ============================================================
  // DERNIER JOUR DU MOIS
  // ============================================================

  function dernierJourMois(date = new Date()) {
    return dateLocaleISO(
      new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0
      )
    );
  }

  // ============================================================
  // PREMIER JOUR DU TRIMESTRE
  // ============================================================

  function premierJourTrimestre(date = new Date()) {
    const moisActuel = date.getMonth();

    const premierMoisTrimestre =
      Math.floor(moisActuel / 3) * 3;

    return dateLocaleISO(
      new Date(
        date.getFullYear(),
        premierMoisTrimestre,
        1
      )
    );
  }

  // ============================================================
  // DERNIER JOUR DU TRIMESTRE
  // ============================================================

  function dernierJourTrimestre(date = new Date()) {
    const moisActuel = date.getMonth();

    const dernierMoisTrimestre =
      Math.floor(moisActuel / 3) * 3 + 2;

    return dateLocaleISO(
      new Date(
        date.getFullYear(),
        dernierMoisTrimestre + 1,
        0
      )
    );
  }

  // ============================================================
  // PREMIER JOUR DE L'ANNÉE
  // ============================================================

  function premierJourAnnee(date = new Date()) {
    return dateLocaleISO(
      new Date(
        date.getFullYear(),
        0,
        1
      )
    );
  }

  // ============================================================
  // DERNIER JOUR DE L'ANNÉE
  // ============================================================

  function dernierJourAnnee(date = new Date()) {
    return dateLocaleISO(
      new Date(
        date.getFullYear(),
        11,
        31
      )
    );
  }

  // ============================================================
  // CHARGEMENT DU DASHBOARD
  // ============================================================

  async function chargerDashboard(
    dates = null
  ) {
    try {
      setChargement(true);
      setErreur("");

      const params = {};

      if (
        dates?.dateDebut &&
        dates?.dateFin
      ) {
        params.date_debut = dates.dateDebut;
        params.date_fin = dates.dateFin;
      }

      const response = await api.get(
        "/dashboard",
        {
          params,
        }
      );

      console.log(
        "DASHBOARD API :",
        response.status
      );

      console.log(
        "DASHBOARD DATA :",
        response.data
      );

      setDonnees(response.data);

      setPeriodeAppliquee({
        dateDebut:
          response.data?.date_debut ??
          null,
        dateFin:
          response.data?.date_fin ??
          null,
      });
    } catch (error) {
      console.error(
        "ERREUR DASHBOARD :",
        error
      );

      if (
        error.response?.status === 401
      ) {
        setErreur(
          "Votre session a expiré. Veuillez vous reconnecter."
        );
      } else if (
        error.response?.status === 403
      ) {
        setErreur(
          "Vous n'avez pas la permission d'accéder au tableau de bord."
        );
      } else {
        setErreur(
          error.response?.data?.detail ||
            "Impossible de charger le tableau de bord."
        );
      }
    } finally {
      setChargement(false);
    }
  }

  // ============================================================
  // APPLICATION D'UNE PÉRIODE PRÉDÉFINIE
  // ============================================================

  function appliquerPeriode(type) {
    const aujourdHui = new Date();

    let debut = null;
    let fin = null;

    switch (type) {
      case "tout":
        break;

      case "aujourd_hui":
        debut = dateLocaleISO(
          aujourdHui
        );
        fin = dateLocaleISO(
          aujourdHui
        );
        break;

      case "mois":
        debut = premierJourMois(
          aujourdHui
        );
        fin = dernierJourMois(
          aujourdHui
        );
        break;

      case "trimestre":
        debut =
          premierJourTrimestre(
            aujourdHui
          );
        fin =
          dernierJourTrimestre(
            aujourdHui
          );
        break;

      case "annee":
        debut =
          premierJourAnnee(
            aujourdHui
          );
        fin =
          dernierJourAnnee(
            aujourdHui
          );
        break;

      default:
        return;
    }

    setPeriode(type);

    if (type === "tout") {
      setDateDebut("");
      setDateFin("");

      chargerDashboard(null);
      return;
    }

    setDateDebut(debut);
    setDateFin(fin);

    chargerDashboard({
      dateDebut: debut,
      dateFin: fin,
    });
  }

  // ============================================================
  // APPLICATION DE LA PÉRIODE PERSONNALISÉE
  // ============================================================

  function appliquerPeriodePersonnalisee() {
    if (!dateDebut || !dateFin) {
      setErreur(
        "Veuillez sélectionner une date de début et une date de fin."
      );
      return;
    }

    if (dateDebut > dateFin) {
      setErreur(
        "La date de début doit être antérieure ou égale à la date de fin."
      );
      return;
    }

    setErreur("");
    setPeriode("personnalisee");

    chargerDashboard({
      dateDebut,
      dateFin,
    });
  }

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================

  useEffect(() => {
    chargerDashboard();
  }, []);

  // ============================================================
  // LIBELLÉ DE LA PÉRIODE
  // ============================================================

  function obtenirLibellePeriode() {
    if (
      !periodeAppliquee.dateDebut ||
      !periodeAppliquee.dateFin
    ) {
      return "Toutes les opérations";
    }

    if (
      periodeAppliquee.dateDebut ===
      periodeAppliquee.dateFin
    ) {
      return `Le ${formaterDate(
        periodeAppliquee.dateDebut
      )}`;
    }

    return `${formaterDate(
      periodeAppliquee.dateDebut
    )} → ${formaterDate(
      periodeAppliquee.dateFin
    )}`;
  }

  // ============================================================
  // CHARGEMENT
  // ============================================================

  if (chargement) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw
            size={32}
            className="mx-auto mb-3 animate-spin text-emerald-700"
          />

          <p className="text-slate-500">
            Chargement du tableau de bord...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // ERREUR
  // ============================================================

  if (erreur && !donnees) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <div className="flex items-start gap-3">
          <AlertCircle
            size={22}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-semibold">
              Impossible de charger le tableau de bord
            </p>

            <p className="mt-1 text-sm">
              {erreur}
            </p>

            <button
              type="button"
              onClick={() =>
                chargerDashboard()
              }
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800"
            >
              <RefreshCw size={16} />
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // DONNÉES FINANCIÈRES
  // ============================================================

  const membresActifs = Number(
    donnees?.membres_actifs ?? 0
  );

  /*
   * Montant théorique attendu pour les cotisations.
   *
   * Sur une période de plusieurs mois, le backend tient compte
   * du nombre de mois couverts.
   */
  const cotisationsEstimees = Number(
    donnees?.cotisations_estimees ?? 0
  );

  /*
   * Argent réellement reçu des membres.
   *
   * Cela comprend :
   * - les cotisations normales ;
   * - les paiements partiels ;
   * - les versements volontaires des membres non cotisants.
   */
  const cotisationsEncaissees = Number(
    donnees?.cotisations_encaissees ?? 0
  );

  /*
   * Argent reçu de personnes/organismes extérieurs.
   */
  const aidesExterieures = Number(
    donnees?.aides_exterieures ?? 0
  );

  /*
   * TOTAL DES RECETTES RÉELLES
   */
  const totalRecettes =
    cotisationsEncaissees +
    aidesExterieures;

  /*
   * TOTAL DES SORTIES D'ARGENT.
   */
  const totalDepenses = Number(
    donnees?.total_depenses ??
      donnees?.depenses ??
      0
  );

  /*
   * SOLDE RÉEL DISPONIBLE.
   */
  const soldeDisponible =
    totalRecettes - totalDepenses;

  // ============================================================
  // RESTE À ENCAISSER
  // ============================================================

  const resteAEncaisser = Math.max(
    0,
    cotisationsEstimees -
      cotisationsEncaissees
  );

  // ============================================================
  // COMPOSITION DES RECETTES
  // ============================================================

  const totalSourcesRecettes =
    totalRecettes;

  let pourcentageCotisations = 0;
  let pourcentageAides = 0;

  if (totalSourcesRecettes > 0) {
    pourcentageCotisations =
      (cotisationsEncaissees /
        totalSourcesRecettes) *
      100;

    pourcentageAides =
      (aidesExterieures /
        totalSourcesRecettes) *
      100;
  }

  const soldePositif =
    soldeDisponible >= 0;

  // ============================================================
  // STATISTIQUES PRINCIPALES
  // ============================================================

  const statistiques = [
    {
      titre: "Membres actifs",
      valeur: formaterMontant(
        membresActifs
      ),
      description:
        "Membres actuellement actifs",
      icone: Users,
      couleur: "blue",
    },

    {
      titre: "Cotisations estimées",
      valeur: `${formaterMontant(
        cotisationsEstimees
      )} FCFA`,
      description:
        "Montant théorique attendu des cotisations",
      icone: Wallet,
      couleur: "blue",
    },

    {
      titre: "Recettes encaissées",
      valeur: `${formaterMontant(
        totalRecettes
      )} FCFA`,
      description:
        "Argent réellement reçu par le Dahira",
      icone: TrendingUp,
      couleur: "emerald",
    },

    {
      titre: "Dépenses",
      valeur: `${formaterMontant(
        totalDepenses
      )} FCFA`,
      description:
        "Total des sorties de caisse",
      icone: TrendingDown,
      couleur: "red",
    },
  ];

  // ============================================================
  // RENDU
  // ============================================================

  return (
    <div className="space-y-8">

      {/* ======================================================
          EN-TÊTE
      ====================================================== */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>
          <p className="text-sm font-semibold text-emerald-700">
            Administration
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Tableau de bord
          </h1>

          <p className="mt-2 text-slate-500">
            Vue d'ensemble de la situation du Dahira.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            chargerDashboard(
              periodeAppliquee.dateDebut &&
                periodeAppliquee.dateFin
                ? {
                    dateDebut:
                      periodeAppliquee.dateDebut,
                    dateFin:
                      periodeAppliquee.dateFin,
                  }
                : null
            )
          }
          disabled={chargement}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={18}
            className={
              chargement
                ? "animate-spin"
                : ""
            }
          />

          Actualiser
        </button>

      </div>

      {/* ======================================================
          FILTRE DE PÉRIODE
      ====================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-5">

          {/* TITRE */}

          <div className="flex items-start gap-3">

            <div className="rounded-xl bg-emerald-50 p-3">
              <CalendarDays
                size={21}
                className="text-emerald-700"
              />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Période financière
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Affichez l'état financier du Dahira
                sur la période de votre choix.
              </p>
            </div>

          </div>

          {/* BOUTONS DE PÉRIODE */}

          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              onClick={() =>
                appliquerPeriode("tout")
              }
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                periode === "tout"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Tout
            </button>

            <button
              type="button"
              onClick={() =>
                appliquerPeriode(
                  "aujourd_hui"
                )
              }
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                periode === "aujourd_hui"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Aujourd'hui
            </button>

            <button
              type="button"
              onClick={() =>
                appliquerPeriode("mois")
              }
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                periode === "mois"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Ce mois
            </button>

            <button
              type="button"
              onClick={() =>
                appliquerPeriode(
                  "trimestre"
                )
              }
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                periode === "trimestre"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Ce trimestre
            </button>

            <button
              type="button"
              onClick={() =>
                appliquerPeriode("annee")
              }
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                periode === "annee"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Cette année
            </button>

            <button
              type="button"
              onClick={() =>
                setPeriode(
                  "personnalisee"
                )
              }
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                periode === "personnalisee"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Période personnalisée
            </button>

          </div>

          {/* PÉRIODE PERSONNALISÉE */}

          {periode ===
            "personnalisee" && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

              <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">

                <div>
                  <label
                    htmlFor="date-debut-dashboard"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Date de début
                  </label>

                  <input
                    id="date-debut-dashboard"
                    type="date"
                    value={dateDebut}
                    onChange={(event) =>
                      setDateDebut(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="date-fin-dashboard"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Date de fin
                  </label>

                  <input
                    id="date-fin-dashboard"
                    type="date"
                    value={dateFin}
                    onChange={(event) =>
                      setDateFin(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <button
                  type="button"
                  onClick={
                    appliquerPeriodePersonnalisee
                  }
                  disabled={
                    !dateDebut ||
                    !dateFin ||
                    chargement
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CalendarDays
                    size={17}
                  />
                  Appliquer
                </button>

              </div>

              {erreur && (
                <p className="mt-3 text-sm font-medium text-red-600">
                  {erreur}
                </p>
              )}

            </div>
          )}

          {/* PÉRIODE ACTIVE */}

          <div className="flex flex-col gap-1 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">

            <span className="text-sm text-slate-500">
              Période affichée
            </span>

            <span className="text-sm font-semibold text-slate-800">
              {obtenirLibellePeriode()}
            </span>

          </div>

        </div>

      </div>

      {/* ======================================================
          CARTES STATISTIQUES
      ====================================================== */}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

        {statistiques.map(
          (statistique) => {
            const Icon =
              statistique.icone;

            return (
              <div
                key={statistique.titre}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >

                <div className="flex items-start justify-between">

                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {statistique.titre}
                    </p>

                    <p className="mt-3 text-2xl font-bold text-slate-900">
                      {statistique.valeur}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-100 p-3 transition group-hover:bg-emerald-50">
                    <Icon
                      size={22}
                      className="text-slate-700 transition group-hover:text-emerald-700"
                    />
                  </div>

                </div>

                <p className="mt-4 text-xs text-slate-400">
                  {statistique.description}
                </p>

              </div>
            );
          }
        )}

      </div>

      {/* ======================================================
          RÉSUMÉ FINANCIER
      ====================================================== */}

      <div className="grid gap-5 lg:grid-cols-3">

        {/* TOTAL RECETTES */}

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-emerald-700">
                Total recettes
              </p>

              <p className="mt-2 text-3xl font-bold text-emerald-900">
                {formaterMontant(
                  totalRecettes
                )}
              </p>

              <p className="mt-1 text-sm text-emerald-700">
                FCFA
              </p>
            </div>

            <div className="rounded-xl bg-white p-3 shadow-sm">
              <TrendingUp
                size={25}
                className="text-emerald-600"
              />
            </div>

          </div>

        </div>

        {/* TOTAL DÉPENSES */}

        <div className="rounded-2xl border border-red-100 bg-red-50 p-6">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-red-700">
                Total dépenses
              </p>

              <p className="mt-2 text-3xl font-bold text-red-900">
                {formaterMontant(
                  totalDepenses
                )}
              </p>

              <p className="mt-1 text-sm text-red-700">
                FCFA
              </p>
            </div>

            <div className="rounded-xl bg-white p-3 shadow-sm">
              <TrendingDown
                size={25}
                className="text-red-600"
              />
            </div>

          </div>

        </div>

        {/* RESTE À ENCAISSER */}

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-blue-700">
                Reste à encaisser
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-900">
                {formaterMontant(
                  resteAEncaisser
                )}
              </p>

              <p className="mt-1 text-sm text-blue-700">
                FCFA
              </p>
            </div>

            <div className="rounded-xl bg-white p-3 shadow-sm">
              <Wallet
                size={25}
                className="text-blue-600"
              />
            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          SOLDE PRINCIPAL
      ====================================================== */}

      <div className="overflow-hidden rounded-3xl bg-slate-950 shadow-xl">

        <div className="grid lg:grid-cols-2">

          {/* GAUCHE */}

          <div className="p-8 lg:p-10">

            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-emerald-500/10 p-3">
                <Landmark
                  size={24}
                  className="text-emerald-400"
                />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-400">
                  Situation financière
                </p>

                <h2 className="text-xl font-bold text-white">
                  Solde disponible
                </h2>
              </div>

            </div>

            <div className="mt-8">

              <p
                className={`text-4xl font-bold tracking-tight ${
                  soldePositif
                    ? "text-white"
                    : "text-red-400"
                }`}
              >
                {formaterMontant(
                  soldeDisponible
                )}

                <span className="ml-2 text-xl text-slate-400">
                  FCFA
                </span>
              </p>

              <div className="mt-4 flex items-center gap-2">

                {soldePositif ? (
                  <>
                    <CircleCheck
                      size={17}
                      className="text-emerald-400"
                    />

                    <p className="text-sm text-emerald-400">
                      Situation financière positive
                    </p>
                  </>
                ) : (
                  <>
                    <AlertCircle
                      size={17}
                      className="text-red-400"
                    />

                    <p className="text-sm text-red-400">
                      Attention : solde négatif
                    </p>
                  </>
                )}

              </div>

              <p className="mt-3 text-sm text-slate-400">
                Total recettes − total dépenses
              </p>

            </div>

          </div>

          {/* DROITE */}

          <div className="border-t border-white/10 p-8 lg:border-l lg:border-t-0 lg:p-10">

            <div className="space-y-6">

              {/* RECETTES */}

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="rounded-lg bg-emerald-500/10 p-2">
                    <ArrowUpCircle
                      size={19}
                      className="text-emerald-400"
                    />
                  </div>

                  <span className="text-sm text-slate-300">
                    Total recettes
                  </span>

                </div>

                <span className="font-bold text-emerald-400">
                  {formaterMontant(
                    totalRecettes
                  )}{" "}
                  FCFA
                </span>

              </div>

              {/* DÉPENSES */}

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="rounded-lg bg-red-500/10 p-2">
                    <ArrowDownCircle
                      size={19}
                      className="text-red-400"
                    />
                  </div>

                  <span className="text-sm text-slate-300">
                    Total dépenses
                  </span>

                </div>

                <span className="font-bold text-red-400">
                  {formaterMontant(
                    totalDepenses
                  )}{" "}
                  FCFA
                </span>

              </div>

              {/* SOLDE */}

              <div className="border-t border-white/10 pt-5">

                <div className="flex items-center justify-between">

                  <span className="font-semibold text-white">
                    Solde disponible
                  </span>

                  <span
                    className={`text-lg font-bold ${
                      soldePositif
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {formaterMontant(
                      soldeDisponible
                    )}{" "}
                    FCFA
                  </span>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          COMPOSITION DES RECETTES
      ====================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="mb-6">

          <h2 className="text-lg font-bold text-slate-900">
            Composition des recettes
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Origine des recettes réellement encaissées par le Dahira.
          </p>

        </div>

        <div className="space-y-7">

          {/* COTISATIONS ET VERSEMENTS DES MEMBRES */}

          <div>

            <div className="mb-2 flex items-center justify-between">

              <span className="flex items-center gap-2 text-sm font-medium text-slate-600">

                <Wallet
                  size={17}
                  className="text-emerald-600"
                />

                Cotisations et versements des membres

              </span>

              <div className="text-right">

                <span className="font-semibold text-emerald-700">
                  {formaterMontant(
                    cotisationsEncaissees
                  )}{" "}
                  FCFA
                </span>

                <span className="ml-2 text-xs text-slate-400">
                  ({pourcentageCotisations.toFixed(1)} %)
                </span>

              </div>

            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-100">

              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      pourcentageCotisations
                    )
                  )}%`,
                }}
              />

            </div>

          </div>

          {/* AIDES EXTÉRIEURES */}

          <div>

            <div className="mb-2 flex items-center justify-between">

              <span className="flex items-center gap-2 text-sm font-medium text-slate-600">

                <Banknote
                  size={17}
                  className="text-amber-600"
                />

                Aides extérieures

              </span>

              <div className="text-right">

                <span className="font-semibold text-amber-700">
                  {formaterMontant(
                    aidesExterieures
                  )}{" "}
                  FCFA
                </span>

                <span className="ml-2 text-xs text-slate-400">
                  ({pourcentageAides.toFixed(1)} %)
                </span>

              </div>

            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-100">

              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-700"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      pourcentageAides
                    )
                  )}%`,
                }}
              />

            </div>

          </div>

          {/* TOTAL */}

          <div className="flex items-center justify-between border-t border-slate-100 pt-5">

            <span className="font-semibold text-slate-700">
              Total recettes
            </span>

            <span className="text-xl font-bold text-slate-900">
              {formaterMontant(
                totalRecettes
              )}{" "}
              FCFA
            </span>

          </div>

        </div>

      </div>

      {/* ======================================================
          RÉSUMÉ FINAL
      ====================================================== */}

      <div className="grid gap-5 md:grid-cols-3">

        {/* COTISATIONS ESTIMÉES */}

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">

          <div className="flex items-center gap-3">

            <div className="rounded-lg bg-white p-2 shadow-sm">

              <Wallet
                size={20}
                className="text-blue-600"
              />

            </div>

            <p className="text-sm font-medium text-blue-700">
              Cotisations estimées
            </p>

          </div>

          <p className="mt-4 text-2xl font-bold text-blue-900">
            {formaterMontant(
              cotisationsEstimees
            )}{" "}
            FCFA
          </p>

        </div>

        {/* RECETTES ENCAISSÉES */}

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6">

          <div className="flex items-center gap-3">

            <div className="rounded-lg bg-white p-2 shadow-sm">

              <TrendingUp
                size={20}
                className="text-emerald-600"
              />

            </div>

            <p className="text-sm font-medium text-emerald-700">
              Recettes encaissées
            </p>

          </div>

          <p className="mt-4 text-2xl font-bold text-emerald-900">
            {formaterMontant(
              totalRecettes
            )}{" "}
            FCFA
          </p>

        </div>

        {/* AIDES EXTÉRIEURES */}

        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6">

          <div className="flex items-center gap-3">

            <div className="rounded-lg bg-white p-2 shadow-sm">

              <Banknote
                size={20}
                className="text-amber-600"
              />

            </div>

            <p className="text-sm font-medium text-amber-700">
              Aides extérieures
            </p>

          </div>

          <p className="mt-4 text-2xl font-bold text-amber-900">
            {formaterMontant(
              aidesExterieures
            )}{" "}
            FCFA
          </p>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;