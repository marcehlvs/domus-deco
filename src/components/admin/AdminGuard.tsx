import { Outlet } from "react-router-dom";
import { LinkButton } from "../ui/Button";
import { StatePanel } from "../ui/StatePanel";

// Paso 5: acá se valida que la persona sea administradora (Firebase Auth + reglas de Firestore).
// Hasta entonces el panel solo se abre en desarrollo, así no queda expuesto cuando se publique.
export const adminEnabled = import.meta.env.DEV;

export default function AdminGuard() {
  if (adminEnabled) return <Outlet />;
  return (
    <StatePanel
      variant="error"
      title="Acceso restringido"
      description="El panel de administración se habilita junto con el ingreso de administradores."
      action={<LinkButton to="/" variant="secondary">Volver al inicio</LinkButton>}
    />
  );
}
