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

    const totalPhotos = [...photos, ...selectedFiles];

    if (totalPhotos.length > 3) {
      alert("You can only upload up to 3 photos.");
    } else {
      setPhotos(totalPhotos);
    }
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    if (photos.length !== 3) {
      alert("Please upload exactly 3 photos.");
      return;
    }

    try {
      const idToken = await auth.currentUser.getIdToken();
      const formData = new FormData();
      formData.append("idToken", idToken);
      formData.append("name", event.target.name.value);
      formData.append("favoriteCuisine", event.target.favoriteCuisine.value);
      formData.append("location", event.target.location.value);
      formData.append("email", auth.currentUser.email);
      formData.append("accountType", "user");

      photos.forEach((photo) => {
        formData.append("photos", photo);
      });

      const result = await handleInsertUser(formData);

      navigate("/home");
    } catch (err) {
      console.error("Unexpected error during submission:", err);
      alert("Something went wrong.");
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

              {/* Enhanced Upload Button */}
              <Button
                variant="contained"
                component="label"
                sx={{
                  mt: 4,
                  display: "inline-block",
                  cursor: "pointer",
                  backgroundColor: "#2563eb", // Tailwind blue-600
                  color: "#ffffff",
                  fontWeight: "600",
                  py: "0.5rem",
                  px: "1rem",
                  borderRadius: "0.5rem",
                  boxShadow: 2,
                  textTransform: "none", // optional, removes ALL CAPS
                  transition: "background-color 0.3s ease",
                  "&:hover": {
                    backgroundColor: "#1d4ed8", // Tailwind blue-700
                  },
                }}
              >
                Upload Photo
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  onChange={handleFileChange}
                  hidden
                />
              </Button>
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
