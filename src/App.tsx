import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "./providers/UserProvider";
import { CartProvider } from "./providers/CartProvider";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import AdminHomePage from "./pages/AdminHomePage";
import AdminProductsPage from "./pages/AdminProductsPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { ROLES } from "@/constants/roles";
import AdminCategoriesPage from "./pages/AdminCategoriesPage";
import AdminCategoryDetailPage from "./pages/AdminCategoryDetailPage";
import CartPage from "./pages/CartPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import { Toaster } from "sonner"

function App() {
  return (
    <UserProvider>
      <Toaster position="bottom-right" richColors />
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/"
              element={
                  <HomePage />
              }
            />

            <Route path="/carrito" element={<CartPage />} />
            <Route path="/product/:productId" element={<ProductDetailPage />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={[ROLES.ADMIN]}>
                  <AdminHomePage />
                </ProtectedRoute>
              }
            >
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="categories" element={<AdminCategoriesPage />} />
              <Route path="categories/:categoryId" element={<AdminCategoryDetailPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </UserProvider>
  );
}

export default App;
