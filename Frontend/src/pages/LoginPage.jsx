import React, { useEffect, useRef } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Container,
  Link,
} from "@mui/material";
import "./LoginPage.css";

const LoginPage = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, []);

  return (
    <div className="overlay-container">
      <video ref={videoRef} autoPlay loop muted className="background-video">
        <source src="src/assets/login_bg.mp4" type="video/mp4" />
      </video>
      <div className="dark-overlay"></div>{" "}
      {/* Add this div for the dark overlay */}
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
            onSubmit={(e) => {
              e.preventDefault();
              // Handle login logic here
            }}
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
              InputLabelProps={{
                style: { color: "#fff" },
              }} /* White label color */
              InputProps={{
                style: { borderColor: "#fff", color: "#fff" },
              }} /* White border and input text color */
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
              InputLabelProps={{
                style: { color: "#fff" },
              }} /* White label color */
              InputProps={{
                style: { borderColor: "#fff", color: "#fff" },
              }} /* White border and input text color */
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              className="SignInButton"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign In
            </Button>
          </Box>
          <Typography variant="p1">
            Don't have an account?{" "}
            <Link href="/" underline="none" className="custom-link">
              Sign in here
            </Link>
          </Typography>
        </Box>
      </Container>
    </div>
  );
};

export default LoginPage;
