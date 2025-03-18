import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, TextField, Button, CircularProgress } from "@mui/material";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import "./FirstLoginPage.css";
import { handleInsertUser } from "../firebase/firestoreFunctions";

const auth = getAuth();
const storage = getStorage();

const FirstLoginPage = () => {
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [photoURL, setPhotoURL] = useState(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, []);

  const handleFileChange = (event) => {
    if (event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handlePhotoUpload = () => {
    if (!selectedFile) return;

    setUploading(true);
    const storageRef = ref(storage, `users/${auth.currentUser.uid}/profile_photos/profile_pic.${selectedFile.name.split('.').pop()}`);
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload Error:", error);
        setUploading(false);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setPhotoURL(downloadURL);
          setUploading(false);
        });
      }
    );
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    const idToken = await auth.currentUser.getIdToken();
    const data = {
      idToken: idToken,
      name: event.target.name.value,
      favoriteCuisine: event.target.favoriteCuisine.value,
      location: event.target.location.value,
      email: auth.currentUser.email,
      accountType: "user",
      photoURL: photoURL,
    };
    try {
      const success = await handleInsertUser(data);
      if (success) {
        navigate("/");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="overlay-container">
      {/* ... video and overlay */}
      <div className="center-container">
        <Box className="first-login-container">
          <h1 className="title">Nice to meet you!</h1>
          <div className="bottom-section">
            <div className="left-section">
              <Box className="dotted-container">
                {selectedFile && (
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Selected Profile"
                    style={{ maxWidth: "150px", maxHeight: "150px" }}
                  />
                )}
              </Box>
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="raised-button-file"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="raised-button-file">
                <Button variant="outlined" component="span" sx={{ marginTop: "1rem" }}>
                  Upload Photo
                </Button>
              </label>
              {uploading && (
                <Box sx={{ display: 'flex', alignItems: 'center', marginTop: "1rem" }}>
                  <CircularProgress variant="determinate" value={uploadProgress} />
                  <Box sx={{ ml: 2, minWidth: 35 }}>
                    {`${Math.round(uploadProgress)}%`}
                  </Box>
                </Box>
              )}
              {selectedFile && !uploading && (
                <Button variant="contained" onClick={handlePhotoUpload} sx={{ marginTop: "1rem" }}>
                  Upload
                </Button>
              )}
            </div>
            {/* ... right-section form */}
          </div>
        </Box>
      </div>
    </div>
  );
};

export default FirstLoginPage;
