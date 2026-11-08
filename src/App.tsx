import { Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Cart from "./pages/Cart";
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
        <Route path="checkout" element={<Pending title="Finalizar compra" />} />
        <Route path="ingresar" element={<Pending title="Ingresar" />} />
        <Route path="estilos" element={<Styleguide />} />
        <Route path="*" element={<Pending title="Página no encontrada" notFound />} />
      </Route>
    </Routes>
  );
}
