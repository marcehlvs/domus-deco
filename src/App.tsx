import { useCallback, useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import IntroScreen from "./components/intro/IntroScreen";
import { hasSeenIntro, markIntroSeen } from "./lib/intro";
import { useCategories } from "./store/categories";
import AdminGuard from "./components/admin/AdminGuard";
import RequireAuth from "./components/auth/RequireAuth";
import AdminLayout from "./components/admin/AdminLayout";
import Layout from "./components/layout/Layout";
import CategoriesAdmin from "./pages/admin/CategoriesAdmin";
import Dashboard from "./pages/admin/Dashboard";
import OrdersAdmin from "./pages/admin/OrdersAdmin";
import ProductForm from "./pages/admin/ProductForm";
import ProductsAdmin from "./pages/admin/ProductsAdmin";
import { legal } from "./data/legal";
import Account from "./pages/Account";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderPlaced from "./pages/OrderPlaced";
import Legal from "./pages/Legal";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Pending from "./pages/Pending";
import ProductDetail from "./pages/ProductDetail";
import Shop from "./pages/Shop";
import Styleguide from "./pages/Styleguide";

export default function App() {
  // La intro aparece solo al abrir la portada («/») y una vez por pestaña.
  // Los links directos (/tienda, /producto/…, /admin) entran sin intro.
  const { pathname } = useLocation();
  const [seen, setSeen] = useState(hasSeenIntro);
  // Las categorías se traen una vez al abrir la tienda.
  useEffect(() => {
    void useCategories.getState().load();
  }, []);
  const showIntro = pathname === "/" && !seen;
  const enter = useCallback(() => {
    markIntroSeen();
    setSeen(true);
  }, []);

  return (
    <>
      {/* La tienda se carga detrás de la intro (así ya está lista al entrar), pero sin foco ni lectura de pantalla. */}
      <div inert={showIntro}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="tienda" element={<Shop />} />
            <Route path="producto/:slug" element={<ProductDetail />} />
            <Route path="carrito" element={<Cart />} />
            <Route path="ingresar" element={<Login />} />
            <Route element={<RequireAuth />}>
              <Route path="cuenta" element={<Account />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="pedido/:id" element={<OrderPlaced />} />
            </Route>
            <Route path="admin" element={<AdminGuard />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="productos" element={<ProductsAdmin />} />
                <Route path="productos/nuevo" element={<ProductForm />} />
                <Route path="productos/:id" element={<ProductForm />} />
                <Route path="categorias" element={<CategoriesAdmin />} />
                <Route path="pedidos" element={<OrdersAdmin />} />
              </Route>
            </Route>
            {legal.pages.map((page) => (
              <Route key={page.slug} path={page.slug} element={<Legal page={page} />} />
            ))}
            {/* Guía de estilos: solo en desarrollo, no se publica. */}
            {import.meta.env.DEV && <Route path="estilos" element={<Styleguide />} />}
            <Route path="*" element={<Pending title="Página no encontrada" notFound />} />
          </Route>
        </Routes>
      </div>
      <AnimatePresence>{showIntro && <IntroScreen key="intro" onEnter={enter} />}</AnimatePresence>
    </>
  );
}
