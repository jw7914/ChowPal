import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import FirstLoginPage from "./pages/FirstLoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/firebaseconfig";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
      <Routes>
        <Route path="/" element={<LoginPage setUser={setUser} />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/firstlogin" element={<FirstLoginPage />} />
        <Route path="/home" element={<HomePage user={user} />} />
      </Routes>
  );
}

export default App;

