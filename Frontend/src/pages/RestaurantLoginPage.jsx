import React from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { firebaseapp } from "../firebase/firebaseconfig";
import {
  TextField,
  Button,
  Box,
  Typography,
  Container,
  Link,
  Divider,
} from "@mui/material";
import "./RestaurantLoginPage.css";
import {
  handleFirstLogin,
  handleInsertUser,
} from "../firebase/firestoreFunctions";

const auth = getAuth(firebaseapp);

const RestaurantLoginPage = () => {
  const navigate = useNavigate();
  const handleEmailLogin = async (event) => {
    event.preventDefault();
    const email = event.target.email.value;
    const password = event.target.password.value;

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const idToken = await auth.currentUser.getIdToken();
      const data = {
        idToken: idToken,
        email: email,
        accountType: "restaurant",
      };
      await handleFirstLogin(idToken);
      await handleInsertUser(data);
      navigate("/");
    } catch (error) {
      console.error("Email Sign-In Error:", error.message);
    }
  };

  return (
    <Container component="main" maxWidth="xs" className="login-container">
      <Box className="login-container">
        <img
          src="src/assets/chowpal_logo.png"
          alt="ChowPal Logo"
          className="logo"
        />
        <div className="title">Restaurant Login</div>
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
        <Typography variant="body1">
          Don't have an account?{" "}
          <Link
            href="/restaurant-register"
            underline="none"
            className="custom-link"
          >
            Register your restaurant
          </Link>
        </Typography>
      </Box>
    </Container>
  );
};

export default RestaurantLoginPage;
