import { Outlet, useLocation } from "react-router-dom";
import { MotionConfig } from "motion/react";
import Header from "./Header";
import Footer from "./Footer";
import Toast from "../ui/Toast";
import { cn } from "../../lib/cn";

export default function Layout() {
  // En la ficha de producto (mobile) hay una barra fija abajo: se deja lugar para que no tape el pie.
  const onProduct = useLocation().pathname.startsWith("/producto/");

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn("flex min-h-dvh flex-col", onProduct && "pb-20 md:pb-0")}>
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
        >
          Saltar al contenido
        </a>
        <Header />
        <main id="contenido" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6 md:py-12 xl:px-8">
          <Outlet />
        </main>
        <Footer />
        <Toast />
      </div>
    </MotionConfig>
  );
}
