import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import FirstLoginPage from "./pages/FirstLoginPage";
import RegisterBack from "./pages/RegisterBack";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/firstlogin" element={<FirstLoginPage />} />
      <Route path="/test" element={<RegisterBack />} />
    </Routes>
  );
}

export default App;
