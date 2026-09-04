import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ permission }) {
  const { utilisateur, chargement, aPermission } = useAuth();

  if (chargement) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-900/20 border-t-emerald-900" />

          <p className="mt-4 text-sm text-slate-500">
            Chargement de votre espace...
          </p>
        </div>
      </div>
    );
  }

  if (!utilisateur) {
    return <Navigate to="/login" replace />;
  }

  if (permission && !aPermission(permission)) {
    return <Navigate to="/espace" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;