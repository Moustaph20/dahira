import { useEffect, useState } from "react";

import {
  Users,
  Wallet,
  RefreshCw,
  ArrowUpCircle,
  ArrowDownCircle,
  Banknote,
  Landmark,
} from "lucide-react";

import api from "../api/client";


function Dashboard() {

  const [donnees, setDonnees] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");


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
  // CHARGEMENT DU DASHBOARD
  // ============================================================

  async function chargerDashboard() {

    try {

      setChargement(true);
      setErreur("");

      const response = await api.get("/dashboard");

      console.log(
        "DASHBOARD API :",
        response.status
      );

      console.log(
        "DASHBOARD DATA :",
        response.data
      );

      setDonnees(response.data);

    } catch (error) {

      console.error(
        "ERREUR DASHBOARD :",
        error
      );

      if (error.response?.status === 401) {

        setErreur(
          "Votre session a expiré. Veuillez vous reconnecter."
        );

      } else if (error.response?.status === 403) {

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
  // CHARGEMENT INITIAL
  // ============================================================

  useEffect(() => {

    chargerDashboard();

  }, []);


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

  if (erreur) {

    return (

      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">

        <p className="font-semibold">
          Impossible de charger le tableau de bord
        </p>

        <p className="mt-1 text-sm">
          {erreur}
        </p>

        <button
          type="button"
          onClick={chargerDashboard}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800"
        >

          <RefreshCw size={16} />

          Réessayer

        </button>

      </div>

    );
  }


  // ============================================================
  // DONNÉES
  // ============================================================

  const membresActifs = Number(
    donnees?.membres_actifs ?? 0
  );


  // ============================================================
  // PERMISSION FINANCIÈRE
  // ============================================================

  const peutConsulterFinances =
    donnees?.finance_consulter === true;


  // ============================================================
  // DONNÉES FINANCIÈRES
  // ============================================================

  const cotisationsEncaissees = Number(
    donnees?.cotisations_encaissees ?? 0
  );

  const aidesExterieures = Number(
    donnees?.aides_exterieures ?? 0
  );

  const totalRecettes = Number(
    donnees?.total_recettes ??
    (
      cotisationsEncaissees
      + aidesExterieures
    )
  );

  const totalDepenses = Number(
    donnees?.total_depenses ??
    donnees?.depenses ??
    0
  );

  const soldeDisponible = Number(
    donnees?.solde_disponible ??
    (
      totalRecettes
      - totalDepenses
    )
  );


  // ============================================================
  // RAPPORT RECETTES
  // ============================================================

  const totalSourcesRecettes =
    cotisationsEncaissees
    + aidesExterieures;

  let pourcentageCotisations = 0;
  let pourcentageAides = 0;

  if (totalSourcesRecettes > 0) {

    pourcentageCotisations =
      (
        cotisationsEncaissees
        / totalSourcesRecettes
      ) * 100;

    pourcentageAides =
      (
        aidesExterieures
        / totalSourcesRecettes
      ) * 100;
  }


  // ============================================================
  // STATISTIQUES
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
    },

  ];


  // ============================================================
  // AJOUT DES STATISTIQUES FINANCIÈRES
  // ============================================================

  if (peutConsulterFinances) {

    statistiques.push(

      {
        titre: "Cotisations encaissées",
        valeur: `${formaterMontant(
          cotisationsEncaissees
        )} FCFA`,
        description:
          "Paiements réellement reçus",
        icone: Wallet,
      },

      {
        titre: "Aides extérieures",
        valeur: `${formaterMontant(
          aidesExterieures
        )} FCFA`,
        description:
          "Participations provenant de l'extérieur",
        icone: Banknote,
      },

      {
        titre: "Dépenses",
        valeur: `${formaterMontant(
          totalDepenses
        )} FCFA`,
        description:
          "Total des sorties de caisse",
        icone: ArrowDownCircle,
      }

    );
  }


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
          onClick={chargerDashboard}
          disabled={chargement}
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
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
          CARTES STATISTIQUES
      ====================================================== */}

      <div
        className={`grid gap-5 sm:grid-cols-2 ${
          statistiques.length >= 4
            ? "xl:grid-cols-4"
            : "xl:grid-cols-3"
        }`}
      >

        {statistiques.map((statistique) => {

          const Icon = statistique.icone;

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
                    className="text-slate-700 group-hover:text-emerald-700"
                  />

                </div>

              </div>


              <p className="mt-4 text-xs text-slate-400">
                {statistique.description}
              </p>

            </div>

          );

        })}

      </div>


      {/* ======================================================
          MESSAGE SI PAS DE PERMISSION FINANCIÈRE
      ====================================================== */}

      {!peutConsulterFinances && (

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-start gap-4">

            <div className="rounded-xl bg-slate-100 p-3">

              <Landmark
                size={22}
                className="text-slate-600"
              />

            </div>

            <div>

              <h2 className="font-semibold text-slate-900">
                Informations financières protégées
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Vous pouvez consulter le tableau de bord,
                mais vous ne disposez pas de la permission
                nécessaire pour consulter les informations
                financières du Dahira.
              </p>

            </div>

          </div>

        </div>

      )}


      {/* ======================================================
          PARTIE FINANCIÈRE
      ====================================================== */}

      {peutConsulterFinances && (

        <>

          {/* ==================================================
              SOLDE PRINCIPAL
          ================================================== */}

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

                  <p className="text-4xl font-bold tracking-tight text-white">

                    {formaterMontant(
                      soldeDisponible
                    )}{" "}

                    <span className="text-xl text-slate-400">
                      FCFA
                    </span>

                  </p>

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

                </div>

              </div>

            </div>

          </div>


          {/* ==================================================
              DÉTAIL DES RECETTES
          ================================================== */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-6">

              <h2 className="text-lg font-bold text-slate-900">
                Composition des recettes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Origine des recettes encaissées par le Dahira.
              </p>

            </div>


            <div className="space-y-6">


              {/* COTISATIONS */}

              <div>

                <div className="mb-2 flex items-center justify-between">

                  <span className="flex items-center gap-2 text-sm font-medium text-slate-600">

                    <Wallet
                      size={17}
                      className="text-emerald-600"
                    />

                    Cotisations

                  </span>

                  <span className="font-semibold text-emerald-700">

                    {formaterMontant(
                      cotisationsEncaissees
                    )}{" "}
                    FCFA

                  </span>

                </div>


                <div className="h-3 overflow-hidden rounded-full bg-slate-100">

                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                    style={{
                      width: `${Math.min(
                        100,
                        pourcentageCotisations
                      )}%`,
                    }}
                  />

                </div>

              </div>


              {/* AIDES */}

              <div>

                <div className="mb-2 flex items-center justify-between">

                  <span className="flex items-center gap-2 text-sm font-medium text-slate-600">

                    <Banknote
                      size={17}
                      className="text-amber-600"
                    />

                    Aides extérieures

                  </span>

                  <span className="font-semibold text-amber-700">

                    {formaterMontant(
                      aidesExterieures
                    )}{" "}
                    FCFA

                  </span>

                </div>


                <div className="h-3 overflow-hidden rounded-full bg-slate-100">

                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-700"
                    style={{
                      width: `${Math.min(
                        100,
                        pourcentageAides
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


          {/* ==================================================
              RÉSUMÉ
          ================================================== */}

          <div className="grid gap-5 md:grid-cols-3">


            {/* COTISATIONS */}

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6">

              <p className="text-sm font-medium text-emerald-700">
                Cotisations encaissées
              </p>

              <p className="mt-2 text-2xl font-bold text-emerald-900">

                {formaterMontant(
                  cotisationsEncaissees
                )}{" "}
                FCFA

              </p>

            </div>


            {/* AIDES */}

            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6">

              <p className="text-sm font-medium text-amber-700">
                Aides extérieures
              </p>

              <p className="mt-2 text-2xl font-bold text-amber-900">

                {formaterMontant(
                  aidesExterieures
                )}{" "}
                FCFA

              </p>

            </div>


            {/* DÉPENSES */}

            <div className="rounded-2xl border border-red-100 bg-red-50 p-6">

              <p className="text-sm font-medium text-red-700">
                Dépenses
              </p>

              <p className="mt-2 text-2xl font-bold text-red-900">

                {formaterMontant(
                  totalDepenses
                )}{" "}
                FCFA

              </p>

            </div>

          </div>

        </>

      )}

    </div>
  );
}


export default Dashboard;