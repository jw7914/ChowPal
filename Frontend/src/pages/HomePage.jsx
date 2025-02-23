import React from "react";
import { Container, Typography, Box } from "@mui/material";

const HomePage = ({ user }) => {
  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome, {user?.displayName || "Guest"}
        </Typography>
      </Box>
    </Container>
  );
};

export default HomePage;
