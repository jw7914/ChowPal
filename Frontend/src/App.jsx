import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import UserLoginPage from "./pages/UserLoginPage";
import FirstLoginPage from "./pages/FirstLoginPage";
import UserRegisterPage from "./pages/UserRegisterPage";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import RestaurantRegisterPage from "./pages/RestaurantRegisterPage";
import RestaurantLoginPage from "./pages/RestaurantLoginPage";
import LandingPage from "./pages/LandingPage";
import TestImage from "./pages/testImage";
import SuggestedRestaurantsPage from "./pages/SuggestedRestaurantsPage";

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
      <Route path="/" element={<LandingPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/restaurant-login" element={<RestaurantLoginPage />} />
      <Route path="/restaurant-register" element={<RestaurantRegisterPage />} />
      <Route path="/firstlogin" element={<FirstLoginPage />} />
      <Route path="/user-login" element={<UserLoginPage />} />
      <Route path="/user-register" element={<UserRegisterPage />} />
      <Route path="/suggested" element={<SuggestedRestaurantsPage />} />
      {/* Temp route for functionality */}
      <Route path="/logout" element={<Logout />} />
      <Route path="/test-image" element={<TestImage />} />
      <Route path="*" element={<NotFoundPage />} /> {/* Catch-all route */}
    </Routes>
  );
}

export default App;
