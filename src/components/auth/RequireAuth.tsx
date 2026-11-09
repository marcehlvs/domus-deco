import { Navigate, Outlet, useLocation } from "react-router-dom";
import { StatePanel } from "../ui/StatePanel";
import { useAuth } from "../../store/auth";

// Envuelve las rutas que piden sesión y vuelve a la página original después de ingresar.
export default function RequireAuth() {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <StatePanel variant="loading" title="Cargando tu cuenta" />;
  if (!user) return <Navigate to="/ingresar" state={{ from: location.pathname }} replace />;
  return <Outlet />;
}
