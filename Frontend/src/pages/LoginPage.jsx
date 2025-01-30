import React from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Container,
  Avatar,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

const LoginPage = () => {
  return (
    <Container component="main" maxWidth="xs" style={{ marginTop: "8vh" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxShadow: 3,
          p: 4,
          borderRadius: 2,
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5" gutterBottom>
          Sign In
        </Typography>
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
            sx={{ mt: 3, mb: 2 }}
          >
            Sign In
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;
