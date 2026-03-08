import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "./providers/UserProvider";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import AdminHomePage from "./pages/AdminHomePage";
import AdminProductsPage from "./pages/AdminProductsPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { ROLES } from "@/constants/roles";
import AdminCategoriesPage from "./pages/AdminCategoriesPage";

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute roles={[ROLES.USER, ROLES.ADMIN]}>
                <HomePage />
              </ProtectedRoute>
            }
          />

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
          </Route>
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
