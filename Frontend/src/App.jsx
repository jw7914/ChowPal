import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import FirstLoginPage from "./pages/FirstLoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/firstlogin" element={<FirstLoginPage />} />
      <Route path="/home" element={<HomePage />} />
    </Routes>
  );
}

export default App;
