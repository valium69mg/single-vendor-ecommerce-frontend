import LoginPage from "./pages/LoginPage";
import { UserProvider } from "./providers/UserProvider";
function App() {
  return (
    <>
      <UserProvider>
        <LoginPage />
      </UserProvider>
    </>
  );
}

export default App;
