import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "./providers/UserProvider";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import AdminHomePage from "./pages/AdminHomePage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { ROLES } from "@/constants/roles";

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
          />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
