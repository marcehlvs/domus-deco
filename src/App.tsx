import { Route, Routes } from "react-router-dom";
import AdminGuard from "./components/admin/AdminGuard";
import RequireAuth from "./components/auth/RequireAuth";
import AdminLayout from "./components/admin/AdminLayout";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/admin/Dashboard";
import OrdersAdmin from "./pages/admin/OrdersAdmin";
import ProductForm from "./pages/admin/ProductForm";
import ProductsAdmin from "./pages/admin/ProductsAdmin";
import { legal } from "./data/legal";
import Account from "./pages/Account";
import Cart from "./pages/Cart";
import Legal from "./pages/Legal";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Pending from "./pages/Pending";
import ProductDetail from "./pages/ProductDetail";
import Shop from "./pages/Shop";
import Styleguide from "./pages/Styleguide";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="tienda" element={<Shop />} />
        <Route path="producto/:slug" element={<ProductDetail />} />
        <Route path="carrito" element={<Cart />} />
        <Route path="ingresar" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route path="cuenta" element={<Account />} />
          <Route path="checkout" element={<Pending title="Finalizar compra" />} />
        </Route>
        <Route path="admin" element={<AdminGuard />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="productos" element={<ProductsAdmin />} />
            <Route path="productos/nuevo" element={<ProductForm />} />
            <Route path="productos/:id" element={<ProductForm />} />
            <Route path="pedidos" element={<OrdersAdmin />} />
          </Route>
        </Route>
        {legal.pages.map((page) => (
          <Route key={page.slug} path={page.slug} element={<Legal page={page} />} />
        ))}
        <Route path="estilos" element={<Styleguide />} />
        <Route path="*" element={<Pending title="Página no encontrada" notFound />} />
      </Route>
    </Routes>
  );
}
