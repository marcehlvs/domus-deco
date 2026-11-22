import { Suspense, useCallback, useEffect, useState } from "react";
import { Outlet, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import IntroScreen from "./components/intro/IntroScreen";
import { hasSeenIntro, markIntroSeen } from "./lib/intro";
import { useCategories } from "./store/categories";
import RequireAuth from "./components/auth/RequireAuth";
import Layout from "./components/layout/Layout";
import { StatePanel } from "./components/ui/StatePanel";
import { lazyRoute } from "./lib/lazyRoute";
import { legal } from "./data/legal";
import { store } from "./data/store";
import Home from "./pages/Home";
import Pending from "./pages/Pending";

// Solo el Inicio viaja en el primer archivo. Cada pantalla se descarga al entrar (el panel de administración, solo para quien entra a /admin).
// Con la intro todavía visible, la tienda y la ficha se pueden ir bajando detrás.
const Account = lazyRoute(() => import("./pages/Account"));
const Cart = lazyRoute(() => import("./pages/Cart"));
const Checkout = lazyRoute(() => import("./pages/Checkout"));
const OrderPlaced = lazyRoute(() => import("./pages/OrderPlaced"));
const Legal = lazyRoute(() => import("./pages/Legal"));
const Login = lazyRoute(() => import("./pages/Login"));
const ProductDetail = lazyRoute(() => import("./pages/ProductDetail"));
const Shop = lazyRoute(() => import("./pages/Shop"));
const Styleguide = lazyRoute(() => import("./pages/Styleguide"));
const AdminGuard = lazyRoute(() => import("./components/admin/AdminGuard"));
const AdminLayout = lazyRoute(() => import("./components/admin/AdminLayout"));
const Dashboard = lazyRoute(() => import("./pages/admin/Dashboard"));
const ProductsAdmin = lazyRoute(() => import("./pages/admin/ProductsAdmin"));
const ProductForm = lazyRoute(() => import("./pages/admin/ProductForm"));
const CategoriesAdmin = lazyRoute(() => import("./pages/admin/CategoriesAdmin"));
const OrdersAdmin = lazyRoute(() => import("./pages/admin/OrdersAdmin"));

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
            {/* Con «guestCheckout» (src/data/store.ts) se compra sin cuenta; apagado, checkout y pedidos piden ingresar. */}
            <Route element={store.guestCheckout ? <Outlet /> : <RequireAuth />}>
              <Route path="checkout" element={<Checkout />} />
              <Route path="pedido/:id" element={<OrderPlaced />} />
            </Route>
            <Route element={<RequireAuth />}>
              <Route path="cuenta" element={<Account />} />
            </Route>
            <Route
              path="admin"
              element={
                <Suspense fallback={<StatePanel variant="loading" title="Cargando el panel" />}>
                  <AdminGuard />
                </Suspense>
              }
            >
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
