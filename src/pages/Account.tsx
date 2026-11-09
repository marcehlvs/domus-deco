import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useAuth } from "../store/auth";

export default function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl md:text-4xl">Mi cuenta</h1>
      <Card className="max-w-md space-y-4">
        <div>
          <p className="font-display text-xl">{user?.displayName || "Hola"}</p>
          <p className="text-muted">{user?.email}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={async () => {
              await logout();
              navigate("/");
            }}
          >
            Cerrar sesión
          </Button>
        </div>
      </Card>
    </div>
  );
}
