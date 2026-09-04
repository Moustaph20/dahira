import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function RequirePermission({ permission, children }) {
  const { utilisateur } = useAuth();

  const permissions = utilisateur?.permissions || [];

  const autorise = permissions.includes(permission);

  if (!autorise) {
    return <Navigate to="/mon-espace" replace />;
  }

  return children;
}

export default RequirePermission;