import { useAuth } from "../context/AuthContext";

function Permission({
  permission,
  children,
  fallback = null,
}) {
  const { utilisateur } = useAuth();

  const permissions = utilisateur?.permissions || [];

  const autorise = permissions.some(
    (item) => item.code === permission
  );

  if (!autorise) {
    return fallback;
  }

  return children;
}

export default Permission;