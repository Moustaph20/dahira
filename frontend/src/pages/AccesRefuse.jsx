import { useNavigate } from "react-router-dom";

function AccesRefuse() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="max-w-md text-center">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl">
          🔒
        </div>

        <h1 className="mt-6 text-2xl font-bold text-slate-900">
          Accès refusé
        </h1>

        <p className="mt-3 text-slate-500">
          Vous n'avez pas les permissions nécessaires
          pour accéder à cette rubrique.
        </p>

        <button
          onClick={() => navigate("/dashboard")}
          className="mt-6 rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white hover:bg-emerald-950"
        >
          Retour au tableau de bord
        </button>

      </div>
    </div>
  );
}

export default AccesRefuse;