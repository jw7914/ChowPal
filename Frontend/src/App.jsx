import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/UserLoginPage";
import FirstLoginPage from "./pages/FirstLoginPage";
import RegisterPage from "./pages/UserRegisterPage";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import RestaurantRegisterPage from "./pages/RestaurantRegisterPage";
import RestaurantLoginPage from "./pages/RestaurantLoginPage";
import LandingPage from "./pages/LandingPage";

const Logout = () => {
  const navigate = useNavigate();
  const auth = getAuth();

  signOut(auth)
    .then(() => {
      navigate("/"); // Redirect to home page after logout
    })
    .catch((error) => {
      console.error("Logout Error:", error.message);
    });

  return null; // This ensures the page doesn’t render anything
};
function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/landing-page" element={<LandingPage />} />
      <Route path="/restaurant-login" element={<RestaurantLoginPage />} />
      <Route path="/restaurant-register" element={<RestaurantRegisterPage />} />
      <Route path="/firstlogin" element={<FirstLoginPage />} />
      <Route path="/user-login" element={<LoginPage />} />
      <Route path="/user-register" element={<RegisterPage />} />
      {/* Temp logout route for functionality */}
      <Route path="/logout" element={<Logout />} />
      <Route path="*" element={<NotFoundPage />} /> {/* Catch-all route */}
    </Routes>
  );
}

export default App;
