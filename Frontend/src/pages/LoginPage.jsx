import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { firebaseapp } from "../firebase/firebaseconfig";
import { TextField, Button, Box, Typography, Container, Link, Divider } from "@mui/material";
import "./LoginPage.css";
import GoogleIcon from "@mui/icons-material/Google";

const auth = getAuth(firebaseapp);
const provider = new GoogleAuthProvider();

const LoginPage = ({ setUser }) => {
  const videoRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("User Info:", user);
      setUser(user);
      navigate("/home");
    } catch (error) {
      console.error("Google Sign-In Error:", error.message);
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
          <img src="src/assets/chowpal_logo.png" alt="ChowPal Logo" className="logo" />
          <div className="title">Chowpal</div>
          <Button
            fullWidth
            variant="outlined"
            className="GoogleSignInButton"
            onClick={handleGoogleLogin}
            sx={{ mt: 2, color: "black", borderColor: "black" }}
            startIcon={<GoogleIcon />}
          >
            Sign in with Google
          </Button>
          <Divider sx={{ my: 2, width: "100%", fontSize: "2rem" }}>or</Divider>
          <Box component="form" noValidate sx={{ mt: 1 }}>
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
            <Button type="submit" fullWidth variant="contained" className="SignInButton" sx={{ mt: 3, mb: 2 }}>
              Sign In
            </Button>
          </Box>
          <Typography variant="body1">
            Don't have an account?{" "}
            <Link href="/register" underline="none" className="custom-link">
              Sign up here
            </Link>
          </Typography>
        </Box>
      </Container>
    </div>
  );
};

export default LoginPage;
