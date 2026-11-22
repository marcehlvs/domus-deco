import { Suspense, useEffect, useState } from "react";
import { motion } from "motion/react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Toast from "../ui/Toast";
import { StatePanel } from "../ui/StatePanel";
import { cn } from "../../lib/cn";

// En una conexión rápida la pantalla abre en décimas de segundo: mostrar «Cargando» ahí solo parpadea.
// Se reserva el alto (para que el pie no salte) y el aviso recién aparece, con fundido, si la espera pasa de 0,3 s.
function LoadingAfterDelay() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 300);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="min-h-[50vh]">
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
          <StatePanel variant="loading" title="Cargando" />
        </motion.div>
      )}
    </div>
  );
}

export default function Layout() {
  // En la ficha de producto (mobile) hay una barra fija abajo: se deja lugar para que no tape el pie.
  const onProduct = useLocation().pathname.startsWith("/producto/");

  return (
    <div className={cn("flex min-h-dvh flex-col", onProduct && "pb-20 md:pb-0")}>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
      >
        Saltar al contenido
      </a>
      <Header />
      <main id="contenido" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6 md:py-12 xl:px-8">
        <Suspense fallback={<LoadingAfterDelay />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <Toast />
    </div>
  );
}
