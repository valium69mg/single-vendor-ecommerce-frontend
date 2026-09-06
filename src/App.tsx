import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider } from "./providers/UserProvider";
import { CartProvider } from "./providers/CartProvider";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import AdminHomePage from "./pages/AdminHomePage";
import AdminProductsPage from "./pages/AdminProductsPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { ROLES } from "@/constants/roles";
import AdminCategoriesPage from "./pages/AdminCategoriesPage";
import AdminCategoryDetailPage from "./pages/AdminCategoryDetailPage";
import AdminBrandsPage from "./pages/AdminBrandsPage";
import AdminBrandDetailPage from "./pages/AdminBrandDetailPage";
import AdminMaterialsPage from "./pages/AdminMaterialsPage";
import AdminMaterialDetailPage from "./pages/AdminMaterialDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersListPage from "./pages/OrdersListPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import AccountLayout from "./pages/AccountLayout";
import ProfilePage from "./pages/ProfilePage";
import AddressesPage from "./pages/AddressesPage";
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
      <Route path="/registro" element={<RegisterPage />} />

      <Route
        path="/"
        element={
            <HomePage />
        }
      />

      <Route path="/carrito" element={<CartPage />} />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pedidos"
        element={
          <ProtectedRoute>
            <OrdersListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pedido/:orderNumber"
        element={
          <ProtectedRoute>
            <OrderDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mi-cuenta"
        element={
          <ProtectedRoute>
            <AccountLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="perfil" replace />} />
        <Route path="perfil" element={<ProfilePage />} />
        <Route path="direcciones" element={<AddressesPage />} />
      </Route>

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
        <Route path="brands" element={<AdminBrandsPage />} />
        <Route path="brands/:brandId" element={<AdminBrandDetailPage />} />
        <Route path="materials" element={<AdminMaterialsPage />} />
        <Route
          path="materials/:materialId"
          element={<AdminMaterialDetailPage />}
        />
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
