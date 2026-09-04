
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();

  const { connexion } = useAuth();

  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);


  async function handleSubmit(event) {
  event.preventDefault();

  setErreur("");
  setChargement(true);

  try {
    await connexion(
  identifiant,
  motDePasse
);

navigate("/mon-espace", {
  replace: true,
});

  } catch (error) {
    console.error("ERREUR CONNEXION :", error);

    if (error.response?.status === 401) {
      setErreur(
        "Identifiant ou mot de passe incorrect."
      );
    } else {
      setErreur(
        error.response?.data?.detail ||
        error.message ||
        "Une erreur est survenue. Veuillez réessayer."
      );
    }

  } finally {
    setChargement(false);
  }
}

  return (
    <div className="min-h-screen bg-[#f7f7f3]">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/" className="group">
            <h1 className="text-lg font-bold text-emerald-950">
              Dahira Mawahibou Naafih
            </h1>

            <p className="text-xs text-gray-500">
              de Castors
            </p>
          </Link>

          <Link
            to="/"
            className="text-sm font-medium text-gray-600 transition hover:text-emerald-800"
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-85px)] items-center justify-center px-6 py-12">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl md:grid-cols-2">

          <div className="relative hidden overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 p-12 text-white md:flex md:flex-col md:justify-between">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[45px] border-white/5" />

            <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full border-[55px] border-white/5" />

            <div className="relative">
              <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400 text-3xl text-emerald-950">
                ✦
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

          <div className="p-8 sm:p-12">
            <div className="mx-auto max-w-md">

              <div className="mb-10">
                <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
                  Connexion
                </p>

                <h2 className="mt-3 text-3xl font-bold text-gray-900">
                  Se connecter
                </h2>

                <p className="mt-3 text-sm leading-6 text-gray-500">
                  Connectez-vous à votre espace membre pour continuer.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">

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
                    onChange={(event) =>
                      setIdentifiant(event.target.value)
                    }
                    placeholder="Votre identifiant"
                    autoComplete="username"
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10"
                  />
                </div>

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
                    onChange={(event) =>
                      setMotDePasse(event.target.value)
                    }
                    placeholder="Votre mot de passe"
                    autoComplete="current-password"
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10"
                  />
                </div>

                {erreur && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {erreur}
                  </div>
                )}

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

