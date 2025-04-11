import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
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
import { getAuth, signOut } from "firebase/auth";
import { firebaseapp } from "./firebase/firebaseconfig";
import RestaurantDetails from "./pages/RestaurantDetails";
import RestaurantQueue from "./pages/RestaurantQueue";
import Logout from "./pages/Logout";


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
      <Route path="/restaurant/:id" element={<RestaurantDetails />} />
      <Route path="/restaurant/:id/queue" element={<RestaurantQueue />} />
      <Route path="*" element={<NotFoundPage />} /> {/* Catch-all route */}
    </Routes>
  );
}

export default App;
