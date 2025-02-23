import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Box, TextField, Button } from "@mui/material";
import { getAuth, updateProfile } from "firebase/auth"; // Import updateProfile from Firebase Auth
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import "./FirstLoginPage.css";

const firestore = getFirestore();
const auth = getAuth();

const FirstLoginPage = () => {
  const videoRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, []);

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    const name = event.target.name.value;
    const favoriteCuisine = event.target.favoriteCuisine.value;
    const location = event.target.location.value;

    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(firestore, "users", user.uid);
      try {
        // Update Firestore
        await updateDoc(userDocRef, {
          name: name,
          favoriteCuisine: favoriteCuisine,
          location: location,
          isFirstLogin: false,
        });

        // Update Firebase Auth profile using updateProfile method from Firebase Auth
        await updateProfile(user, { displayName: name });

        console.log("User information updated successfully.");
        navigate("/home");
      } catch (error) {
        console.error("Error updating user information: ", error);
      }
    } else {
      console.error("No authenticated user found.");
    }
  };

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
              <form onSubmit={handleFormSubmit}>
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
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    position: 'absolute',
                    bottom: '2rem',
                    right: '14rem',
                    width: '200px',
                  }}
                >
                  {"That's me ->"}
                </Button>
              </form>
            </div>
          </div>
        </Box>
      </div>
    </div>
  );
};

export default FirstLoginPage;
