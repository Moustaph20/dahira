import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();

  const { connexion } = useAuth();

  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");

  const [erreur, setErreur] = useState("");
  const [erreurIdentifiant, setErreurIdentifiant] =
    useState("");

  const [chargement, setChargement] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setErreur("");
    setErreurIdentifiant("");

    const identifiantNettoye = String(
      identifiant || ""
    ).trim();

    // ============================================================
    // IDENTIFIANT OBLIGATOIRE
    // ============================================================

    if (!identifiantNettoye) {
      setErreurIdentifiant(
        "Veuillez saisir votre identifiant."
      );
      return;
    }

    // ============================================================
    // MOT DE PASSE OBLIGATOIRE
    // ============================================================

    if (!motDePasse) {
      setErreur(
        "Veuillez saisir votre mot de passe."
      );
      return;
    }

    setChargement(true);

    try {
      // ============================================================
      // IMPORTANT
      //
      // On envoie exactement l'identifiant saisi.
      //
      // Il peut s'agir de :
      //
      // ttaphaaa
      // 789232751
      // +221789232751
      //
      // Aucun identifiant existant n'est transformé.
      // ============================================================

      await connexion(
        identifiantNettoye,
        motDePasse
      );

      // ============================================================
      // CONNEXION RÉUSSIE
      // ============================================================

      navigate("/mon-espace", {
        replace: true,
      });

    } catch (error) {
      console.error(
        "ERREUR CONNEXION :",
        error
      );

      const statut = error?.response?.status;
      const detail = error?.response?.data?.detail;

      // ============================================================
      // 401
      //
      // Identifiant OU mot de passe incorrect.
      //
      // On ne précise volontairement pas lequel est incorrect.
      // ============================================================

      if (statut === 401) {
        setErreur(
          "Identifiant ou mot de passe incorrect."
        );
        return;
      }

      // ============================================================
      // 403
      //
      // Compte désactivé / accès interdit.
      // ============================================================

      if (statut === 403) {
        setErreur(
          typeof detail === "string" &&
            detail.trim()
            ? detail
            : "Votre compte est désactivé. Veuillez contacter un responsable."
        );
        return;
      }

      // ============================================================
      // 422
      //
      // Erreur de validation FastAPI.
      // ============================================================

      if (statut === 422) {
        setErreur(
          "Les informations saisies sont invalides. Veuillez vérifier votre saisie."
        );
        return;
      }

      // ============================================================
      // 500+
      //
      // Erreur serveur.
      // ============================================================

      if (
        typeof statut === "number" &&
        statut >= 500
      ) {
        setErreur(
          "Une erreur est survenue sur le serveur. Veuillez réessayer."
        );
        return;
      }

      // ============================================================
      // PAS DE RÉPONSE DU SERVEUR
      //
      // Backend arrêté ou problème réseau.
      // ============================================================

      if (!error?.response) {
        setErreur(
          "Impossible de contacter le serveur. Vérifiez votre connexion."
        );
        return;
      }

      // ============================================================
      // AUTRE MESSAGE RETOURNÉ PAR L'API
      // ============================================================

      if (
        typeof detail === "string" &&
        detail.trim()
      ) {
        setErreur(detail);
        return;
      }

      // ============================================================
      // ERREUR PAR DÉFAUT
      // ============================================================

      setErreur(
        "Impossible de vous connecter. Veuillez réessayer."
      );
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f7f3]">

      {/* ==========================================================
          HEADER
      ========================================================== */}

      <header className="border-b border-gray-200 bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <Link
            to="/"
            className="group flex items-center gap-3"
          >

            <img
              src="/logo.png"
              alt="Logo Dahira Mawahibou Naafih de Castors"
              className="h-12 w-12 object-contain"
            />

            <div>

              <h1 className="text-lg font-bold text-emerald-950">
                Dahira Mawahibou Naafih
              </h1>

              <p className="text-xs text-gray-500">
                de Castors
              </p>

            </div>

          </Link>

          <Link
            to="/"
            className="text-sm font-medium text-gray-600 transition hover:text-emerald-800"
          >
            ← Retour à l'accueil
          </Link>

        </div>

      </header>

      {/* ==========================================================
          CONTENU
      ========================================================== */}

      <main className="flex min-h-[calc(100vh-85px)] items-center justify-center px-6 py-12">

        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl md:grid-cols-2">

          {/* ======================================================
              PANNEAU GAUCHE
          ====================================================== */}

          <div className="relative hidden overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 p-12 text-white md:flex md:flex-col md:justify-between">

            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[45px] border-white/5" />

            <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full border-[55px] border-white/5" />

            <div className="relative">

              <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-2 shadow-lg">

                <img
                  src="/logo.png"
                  alt="Logo Dahira"
                  className="h-full w-full object-contain"
                />

              </div>

              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-300">
                Espace membre
              </p>

              <h2 className="mt-5 text-4xl font-bold leading-tight">

                Bienvenue dans

                <span className="mt-2 block text-amber-300">
                  votre espace
                </span>

              </h2>

              <p className="mt-6 max-w-md leading-7 text-white/70">
                Retrouvez les informations et les outils de gestion du
                Dahira Mawahibou Naafih de Castors.
              </p>

            </div>

            <div className="relative">

              <div className="h-px w-full bg-white/10" />

              <p className="mt-5 text-sm text-white/50">
                Foi • Fraternité • Transmission • Solidarité
              </p>

            </div>

          </div>

          {/* ======================================================
              FORMULAIRE
          ====================================================== */}

          <div className="p-8 sm:p-12">

            <div className="mx-auto max-w-md">

              <div className="mb-10">

                <div className="mb-6 flex justify-center md:hidden">

                  <img
                    src="/logo.png"
                    alt="Logo Dahira Mawahibou Naafih"
                    className="h-24 w-24 object-contain"
                  />

                </div>

                <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
                  Connexion
                </p>

                <h2 className="mt-3 text-3xl font-bold text-gray-900">
                  Se connecter
                </h2>

                <p className="mt-3 text-sm leading-6 text-gray-500">
                  Utilisez votre identifiant et votre mot de passe
                  pour accéder à votre espace membre.
                </p>

              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-6"
                noValidate
              >

                {/* ==================================================
                    IDENTIFIANT
                ================================================== */}

                <div>

                  <label
                    htmlFor="identifiant"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Identifiant
                  </label>

                  <input
                    id="identifiant"
                    type="text"
                    value={identifiant}
                    onChange={(event) => {
                      setIdentifiant(
                        event.target.value
                      );

                      setErreurIdentifiant("");
                      setErreur("");
                    }}
                    placeholder="Votre identifiant"
                    autoComplete="username"
                    disabled={chargement}
                    className={`w-full rounded-xl bg-gray-50 px-4 py-3.5 text-gray-900 outline-none transition placeholder:text-gray-400 focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
                      erreurIdentifiant
                        ? "border border-red-300 focus:border-red-500 focus:ring-red-500/10"
                        : "border border-gray-200 focus:border-emerald-700 focus:ring-emerald-700/10"
                    }`}
                  />

                  <p className="mt-1.5 text-xs text-gray-400">
                    Utilisez l'identifiant qui vous a été communiqué.
                  </p>

                  {erreurIdentifiant && (
                    <p
                      className="mt-1.5 text-xs text-red-600"
                      role="alert"
                    >
                      {erreurIdentifiant}
                    </p>
                  )}

                </div>

                {/* ==================================================
                    MOT DE PASSE
                ================================================== */}

                <div>

                  <label
                    htmlFor="motDePasse"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Mot de passe
                  </label>

                  <input
                    id="motDePasse"
                    type="password"
                    value={motDePasse}
                    onChange={(event) => {
                      setMotDePasse(
                        event.target.value
                      );

                      setErreur("");
                    }}
                    placeholder="Votre mot de passe"
                    autoComplete="current-password"
                    disabled={chargement}
                    className={`w-full rounded-xl bg-gray-50 px-4 py-3.5 text-gray-900 outline-none transition placeholder:text-gray-400 focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
                      erreur
                        ? "border border-red-300 focus:border-red-500 focus:ring-red-500/10"
                        : "border border-gray-200 focus:border-emerald-700 focus:ring-emerald-700/10"
                    }`}
                  />

                </div>

                {/* ==================================================
                    ERREUR
                ================================================== */}

                {erreur && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                  >
                    {erreur}
                  </div>
                )}

                {/* ==================================================
                    BOUTON
                ================================================== */}

                <button
                  type="submit"
                  disabled={chargement}
                  className="w-full rounded-xl bg-emerald-900 px-5 py-3.5 font-semibold text-white shadow-sm transition hover:bg-emerald-950 focus:outline-none focus:ring-4 focus:ring-emerald-900/20 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {chargement ? (

                    <span className="flex items-center justify-center gap-3">

                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                      Connexion...

                    </span>

                  ) : (
                    "Se connecter"
                  )}

                </button>

              </form>

              <div className="mt-8 text-center">

                <Link
                  to="/"
                  className="text-sm font-medium text-gray-500 transition hover:text-emerald-800"
                >
                  ← Retour à la page d'accueil
                </Link>

              </div>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

export default Login;