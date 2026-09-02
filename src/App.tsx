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
import CategoryDetailPage from "./pages/CategoryDetailPage";
import BrandDetailPage from "./pages/BrandDetailPage";
import CategoriesListPage from "./pages/CategoriesListPage";
import BrandsListPage from "./pages/BrandsListPage";
import NotFoundPage from "./pages/NotFoundPage";
import { Toaster } from "sonner"

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
            <HomePage />
        }
      />

      <Route path="/carrito" element={<CartPage />} />
      <Route path="/product/:slug" element={<ProductDetailPage />} />
      <Route path="/category/:slug" element={<CategoryDetailPage />} />
      <Route path="/brand/:slug" element={<BrandDetailPage />} />
      <Route path="/categories" element={<CategoriesListPage />} />
      <Route path="/brands" element={<BrandsListPage />} />

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

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  return (
    <UserProvider>
      <Toaster position="bottom-right" richColors />
      <CartProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </CartProvider>
    </UserProvider>
  );
}

export default App;
