import React, { useEffect, useRef } from "react";
import { Box, TextField, Button } from "@mui/material";
import "./FirstLoginPage.css";

const FirstLoginPage = () => {
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
      <div className="dark-overlay"></div>
      <div className="center-container">
        <Box className="first-login-container">
          <h1 className="title">Nice to meet you!</h1>
          <div className="bottom-section">
            <div className="left-section">
              <Box className="dotted-container"></Box>
              <Button variant="outlined" sx={{ marginTop: '1rem' }}>Upload Photo</Button>
            </div>
            <div className="right-section">
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="My name is"
                name="name"
                autoComplete="name"
                autoFocus
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="favoriteCuisine"
                label="My favorite cuisine is"
                name="favoriteCuisine"
                autoComplete="favoriteCuisine"
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="location"
                label="I am from"
                name="location"
                autoComplete="location"
              />
            </div>
          </div>
          <Button
            variant="contained"
            sx={{
              position: 'absolute',
              bottom: '2rem',
              right: '14rem',
              width: '200px'
            }}
          >
            {"That's me ->"}
          </Button>
        </Box>
      </div>
    </div>
  );
};

export default FirstLoginPage;
