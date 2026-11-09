import { useRef, useState, type FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { useAuth } from "../store/auth";

const messages: Record<string, string> = {
  "auth/invalid-credential": "El correo o la contraseña no son correctos.",
  "auth/email-already-in-use": "Ya existe una cuenta con ese correo.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  "auth/invalid-email": "Ingresá un correo válido.",
  "auth/too-many-requests": "Demasiados intentos. Probá de nuevo en unos minutos.",
  "auth/network-request-failed": "Sin conexión. Revisá tu internet e intentá de nuevo.",
  "auth/popup-blocked": "Tu navegador bloqueó la ventana de Google. Permitila e intentá de nuevo.",
  "app/not-configured": "El ingreso no está disponible por ahora.",
};

export default function Login() {
  const { user, signInEmail, register, signInGoogle, resetPassword } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/";

  if (user) return <Navigate to={from} replace />;

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (e) {
      const code = (e as { code?: string }).code ?? "";
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        setError(messages[code] ?? "No pudimos completar la acción. Intentá de nuevo.");
      }
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")).trim();
    const password = String(f.get("password"));
    run(() => (mode === "login" ? signInEmail(email, password) : register(String(f.get("name")).trim(), email, password)));
  };

  const forgot = () => {
    const email = String(new FormData(form.current!).get("email") ?? "").trim();
    if (!email) return setError("Escribí tu correo y volvé a tocar «Olvidé mi contraseña».");
    run(async () => {
      await resetPassword(email);
      setNotice("Te enviamos un correo para cambiar la contraseña.");
    });
  };

  const isLogin = mode === "login";
  const link = "inline-flex min-h-11 items-center font-medium text-ink underline";
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-3xl md:text-4xl">{isLogin ? "Ingresar" : "Crear cuenta"}</h1>
      <Card className="space-y-4">
        <Button variant="secondary" className="w-full" disabled={busy} onClick={() => run(signInGoogle)}>
          Continuar con Google
        </Button>
        <p className="text-center text-sm text-muted">o con tu correo</p>
        <form ref={form} onSubmit={submit} className="space-y-4">
          {!isLogin && <Input label="Nombre" name="name" autoComplete="name" required />}
          <Input label="Correo" name="email" type="email" autoComplete="email" required />
          <Input
            label="Contraseña"
            name="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            minLength={6}
            required
            hint={isLogin ? undefined : "Al menos 6 caracteres."}
          />
          {error && (
            <p role="alert" className="text-danger">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="text-success">
              {notice}
            </p>
          )}
          <Button type="submit" className="w-full" loading={busy}>
            {isLogin ? "Ingresar" : "Crear cuenta"}
          </Button>
          {isLogin && (
            <button type="button" className={`${link} font-normal text-muted`} onClick={forgot} disabled={busy}>
              Olvidé mi contraseña
            </button>
          )}
        </form>
      </Card>
      <p className="text-center text-muted">
        {isLogin ? "¿Todavía no tenés cuenta?" : "¿Ya tenés cuenta?"}{" "}
        <button
          type="button"
          className={link}
          onClick={() => {
            setMode(isLogin ? "register" : "login");
            setError("");
            setNotice("");
          }}
        >
          {isLogin ? "Crear cuenta" : "Ingresar"}
        </button>
      </p>
    </div>
  );
}
