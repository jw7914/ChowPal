import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { firebaseapp } from "../firebase/firebaseconfig";
import {
  TextField,
  Button,
  Box,
  Typography,
  Container,
  Link,
  Divider,
  Alert,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { handleFirstLogin } from "../firebase/firestoreFunctions";
import styles from "./UserLoginPage.module.css"; 

const auth = getAuth(firebaseapp);
const provider = new GoogleAuthProvider();

const UserLoginPage = () => {
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setErrorMessage(""); // Clear previous errors
      await signInWithPopup(auth, provider);
      const idToken = await auth.currentUser.getIdToken();
      const redirect = await handleFirstLogin(idToken);
      navigate(redirect["redirect"]);
    } catch (error) {
      setErrorMessage("Google Sign-In failed. Please try again.");
      console.error("Google Sign-In Error:", error.message);
    }
  };

  const handleEmailLogin = async (event) => {
    event.preventDefault();
    const email = event.target.email.value;
    const password = event.target.password.value;

    try {
      setErrorMessage(""); // Clear previous errors
      await signInWithEmailAndPassword(auth, email, password);
      const idToken = await auth.currentUser.getIdToken();
      const redirect = await handleFirstLogin(idToken);
      navigate(redirect["redirect"]);
    } catch (error) {
      setErrorMessage("Invalid email or password. Please try again.");
      console.error("Email Sign-In Error:", error.message);
    }
  };

  return (
    <div className={styles.overlayContainer}>
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        className={styles.backgroundVideo}
      >
        <source src="src/assets/login_bg.mp4" type="video/mp4" />
      </video>
      <div className={styles.darkOverlay}></div>
      <Container
        component="main"
        maxWidth="xs"
        className={styles.loginContainer}
      >
        <Box className={styles.loginContainer}>
          <img
            src="src/assets/chowpal_logo.png"
            alt="ChowPal Logo"
            className={styles.logo}
          />
          <div className={styles.title}>Chowpal</div>
          <Button
            fullWidth
            variant="outlined"
            className={styles.googleSignInButton}
            onClick={handleGoogleLogin}
            sx={{ mt: 2, color: "black", borderColor: "black" }}
            startIcon={<GoogleIcon />}
          >
            Sign in with Google
          </Button>
          <Divider sx={{ my: 2, width: "100%", fontSize: "2rem" }}>or</Divider>
          <Box
            component="form"
            noValidate
            sx={{ mt: 1 }}
            onSubmit={handleEmailLogin}
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
              InputLabelProps={{ style: { color: "#fff" } }}
              InputProps={{ style: { borderColor: "#fff", color: "#fff" } }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              className={styles.signInButton}
              sx={{ mt: 3, mb: 2 }}
            >
              Sign In
            </Button>
          </Box>
          <Typography variant="body1">
            Don't have an account?{" "}
            <Link
              href="/user-register"
              underline="none"
              className={styles.customLink}
            >
              Sign up here
            </Link>
          </Typography>
          {errorMessage && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errorMessage}
            </Alert>
          )}
        </Box>
      </Container>
    </div>
  );
};

export default UserLoginPage;
