import React, { useEffect, useRef, useState } from "react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { firebaseapp } from "../firebase/firebaseconfig";
import {
  TextField,
  Button,
  Box,
  Typography,
  Container,
  Link,
  Modal,
} from "@mui/material";
import "./UserLoginPage.css";

const errorMessages = {
  "auth/email-already-in-use":
    "This email is already registered. Try logging in.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/weak-password": "Password should be at least 6 characters.",
  "auth/missing-email": "Email field cannot be empty.",
  "auth/internal-error": "An internal error occurred. Try again later.",
};

const RegisterPage = () => {
  const videoRef = useRef(null);
  const auth = getAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [openErrorModal, setOpenErrorModal] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, []);

  // Redirect if the user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      setOpenErrorModal(true);
      return;
    }

    try {
      await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      await signOut(auth);
      navigate("/user-login");
    } catch (error) {
      const errorMessage =
        errorMessages[error.code] || "An unknown error occurred.";
      setError(errorMessage);
      setOpenErrorModal(true);
    }
  };

  return (
    <div className="overlay-container">
      <video ref={videoRef} autoPlay loop muted className="background-video">
        <source src="src/assets/login_bg.mp4" type="video/mp4" />
      </video>
      <div className="dark-overlay"></div>

      <Container component="main" maxWidth="xs" className="login-container">
        <Box className="login-container">
          <img
            src="src/assets/chowpal_logo.png"
            alt="ChowPal Logo"
            className="logo"
          />
          <div className="title">Chowpal</div>
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ mt: 1 }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              onChange={handleChange}
              value={formData.email}
              InputLabelProps={{ style: { color: "#fff" } }}
              InputProps={{ style: { borderColor: "#fff", color: "#fff" } }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              onChange={handleChange}
              value={formData.password}
              InputLabelProps={{ style: { color: "#fff" } }}
              InputProps={{ style: { borderColor: "#fff", color: "#fff" } }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              autoComplete="current-password"
              onChange={handleChange}
              value={formData.confirmPassword}
              InputLabelProps={{ style: { color: "#fff" } }}
              InputProps={{ style: { borderColor: "#fff", color: "#fff" } }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              className="SignInButton"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign Up
            </Button>
          </Box>
          <Typography variant="h6">
            Have an account?{" "}
            <Link href="/" underline="none">
              Login here
            </Link>
          </Typography>
        </Box>
      </Container>

      {/* Error Modal */}
      <Modal open={openErrorModal} onClose={() => setOpenErrorModal(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 3,
            width: 300,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography variant="h5" color="error" sx={{ textAlign: "left" }}>
            ERROR
          </Typography>
          <Typography
            variant="h6"
            color="error"
            sx={{ textAlign: "center", gutterBottom: false }}
          >
            {error}
          </Typography>
          <Button
            variant="contained"
            onClick={() => setOpenErrorModal(false)}
            sx={{ mt: 2 }}
          >
            Close
          </Button>
        </Box>
      </Modal>
    </div>
  );
};

export default RegisterPage;
