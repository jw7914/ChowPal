import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, TextField, Button } from "@mui/material";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "./FirstLoginPage.css";
import { handleInsertUser } from "../firebase/firestoreFunctions";

const auth = getAuth();
const storage = getStorage();

const FirstLoginPage = () => {
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, []);

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);

    // Combine existing photos with newly selected ones
    const totalPhotos = [...photos, ...selectedFiles];

    // Ensure the total doesn't exceed 3
    if (totalPhotos.length > 3) {
      alert("You can only upload up to 3 photos.");
    } else {
      setPhotos(totalPhotos);
    }
  };

  // FIREBASE SOTRAGE
  const uploadPhotos = async (files) => {
    const photoURLs = [];
    for (let i = 0; i < files.length; i++) {
      const photoRef = ref(
        storage,
        `users/${auth.currentUser.uid}/photo-${i + 1}`
      );
      await uploadBytes(photoRef, files[i]);
      const downloadURL = await getDownloadURL(photoRef);
      photoURLs.push(downloadURL);
    }
    return photoURLs;
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    if (photos.length !== 3) {
      alert("Number of photos invalid");
      return;
    }

    try {
      const photoURLs = await uploadPhotos(photos);
      const idToken = await auth.currentUser.getIdToken();
      const data = {
        idToken,
        name: event.target.name.value,
        favoriteCuisine: event.target.favoriteCuisine.value,
        location: event.target.location.value,
        email: auth.currentUser.email,
        accountType: "user",
        photos: photoURLs,
      };
      const success = await handleInsertUser(data);
      if (success) navigate("/");
    } catch (err) {
      console.error("Error during submission:", err);
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
              <Box className="photo-preview-container">
                {photos.map((photo, index) => (
                  <div key={index} className="photo-wrapper">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Preview ${index + 1}`}
                      className="photo-preview"
                    />
                    <button
                      className="remove-photo-button"
                      onClick={() => {
                        const updatedPhotos = photos.filter(
                          (_, i) => i !== index
                        );
                        setPhotos(updatedPhotos);
                      }}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </Box>
              <input
                type="file"
                id="photo-upload"
                accept="image/*"
                onChange={handleFileChange}
                style={{ marginTop: "1rem" }}
              />
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
                    position: "absolute",
                    bottom: "2rem",
                    right: "14rem",
                    width: "200px",
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
