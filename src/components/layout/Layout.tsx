import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
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
    </div>
  );
}
