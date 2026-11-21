import { Navigate, Outlet, useLocation } from "react-router-dom";
import { StatePanel } from "../ui/StatePanel";
import { useAuth } from "../../store/auth";

// Envuelve las rutas que piden una cuenta (quien compró como invitada/o no cuenta)  y vuelve a la página original después de ingresar.
export default function RequireAuth() {
  const { member, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <StatePanel variant="loading" title="Cargando tu cuenta" />;
  if (!member) return <Navigate to="/ingresar" state={{ from: location.pathname }} replace />;
  return <Outlet />;
}
