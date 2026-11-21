import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LinkButton } from "../ui/Button";
import { StatePanel } from "../ui/StatePanel";
import { db } from "../../lib/firebase";
import { useAuth } from "../../store/auth";

// Quién entra al panel:
// - Con Firebase configurado: solo una cuenta con documento en admins/{UID}. Esto es comodidad de pantalla;
//   la seguridad real son las reglas de Firestore, que rechazan cualquier escritura de quien no sea admin.
// - Sin Firebase (primer día en tu computadora): abre solo en desarrollo, en modo demostración. Publicado, nunca.
export default function AdminGuard() {
  const { user, member, ready, isAdmin, adminChecked } = useAuth();
  const location = useLocation();

  const closed = (
    <StatePanel
      variant="error"
      title="Acceso restringido"
      description={member ? "Tu cuenta no es de administración." : "El panel de administración no está disponible."}
      action={<LinkButton to="/" variant="secondary">Volver al inicio</LinkButton>}
    />
  );

  if (!db) return import.meta.env.DEV ? <Outlet /> : closed;
  if (!ready || (user && !adminChecked)) return <StatePanel variant="loading" title="Verificando tu acceso" />;
  if (!member) return <Navigate to="/ingresar" state={{ from: location.pathname }} replace />;
  return isAdmin ? <Outlet /> : closed;
}
