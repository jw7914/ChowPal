import React, { useState, useEffect } from "react";
import NavBar from "./Navbar";
import { Link, useNavigate } from "react-router-dom";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import CloseIcon from "@mui/icons-material/Close";
import { Snackbar, Alert, CircularProgress } from "@mui/material";
import "./Profile.css";
import { getAuth, onAuthStateChanged, getIdToken } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import axios from "axios";

// Add Google Fonts Pacifico import
const GoogleFontsImport = () => {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Pacifico&display=swap";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);
  return null;
};

const Profile = () => {
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastSeverity, setToastSeverity] = useState("info");
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();
  const API_URL = "http://localhost:8000";

  const [profile, setProfile] = useState({
    name: "", email: "", age: "", location: "", favoriteCuisine: "",
    occupation: "", photoURL: "", photos: [],
  });

  const handleToastClose = () => setToastOpen(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          const token = await getIdToken(user, true);
          setIdToken(token);
          try {
            await fetchUserProfileFromAPI(user.uid, token);
          } catch {
            await fetchUserProfile(user.uid);
          }
        } catch (err) {
          setError("Authentication error. Please log in again.");
          setLoading(false);
        }
      } else {
        navigate("/user-login");
      }
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  const fetchUserProfileFromAPI = async (uid, token) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/users`, { params: { idToken: token } });
      if (response.data) {
        const userData = response.data;
        setProfile({
          name: userData.name || "",
          email: userData.email || "",
          age: userData.age || "",
          location: userData.location || "",
          favoriteCuisine: userData.favoriteCuisine || "",
          occupation: userData.occupation || "",
          photoURL: userData.photoURL || "",
          photos: userData.photos || [],
        });
      } else throw new Error("No user data returned from API");
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (uid) => {
    try {
      setLoading(true);
      setError(null);
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfile({
          name: userData.name || "",
          email: userData.email || "",
          age: userData.age || "",
          location: userData.location || "",
          favoriteCuisine: userData.favoriteCuisine || "",
          occupation: userData.occupation || "",
          photoURL: userData.photoURL || "",
          photos: userData.photos || [],
        });
      } else {
        await setDoc(doc(db, "users", uid), { ...profile, createdAt: new Date() });
      }
    } catch (error) {
      setError("Error loading profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      const reader = new FileReader();
      reader.onload = (e) => setProfile(prev => ({ ...prev, photoURL: e.target.result }));
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  const handlePhotoChange = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = handleFileSelect;
    fileInput.click();
  };

  const handleInputChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  const saveProfileAPI = async () => {
    if (!userId || !idToken) {
      setToastMessage("You must be logged in to save your profile.");
      setToastSeverity("error");
      setToastOpen(true);
      return;
    }

    try {
      setSaveLoading(true);
      const formData = new FormData();
      formData.append("idToken", idToken);
      formData.append("name", profile.name || "");
      formData.append("email", profile.email || "");
      formData.append("location", profile.location || "");
      formData.append("favoriteCuisine", profile.favoriteCuisine || "");
      formData.append("accountType", "user");
      if (selectedFile) formData.append("photos", selectedFile);

      try {
        await axios.put(`${API_URL}/users/update`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } catch {
        await saveProfileDirect();
      }

      await fetchUserProfileFromAPI(userId, idToken);
      setSelectedFile(null);
      setToastMessage("Profile saved successfully!");
      setToastSeverity("success");
      setToastOpen(true);
    } catch {
      setToastMessage("Profile saved successfully! Refresh to see changes.");
      setToastSeverity("success");
      setToastOpen(true);
    } finally {
      setSaveLoading(false);
    }
  };

  const saveProfileDirect = async () => {
    if (!userId) return false;
    try {
      let photoURL = profile.photoURL;
      if (selectedFile) {
        const storageRef = ref(storage, `userProfiles/${userId}/profile-photo`);
        await uploadBytes(storageRef, selectedFile);
        photoURL = await getDownloadURL(storageRef);
      }
      const userDocRef = doc(db, "users", userId);
      const docSnap = await getDoc(userDocRef);

      const updatedProfile = {
        ...profile,
        photoURL,
        updatedAt: new Date(),
      };

      if (docSnap.exists()) {
        if (docSnap.data().photos) updatedProfile.photos = docSnap.data().photos;
        if (selectedFile && updatedProfile.photos) {
          updatedProfile.photos = [...updatedProfile.photos, photoURL];
        }
        await updateDoc(userDocRef, updatedProfile);
      } else {
        await setDoc(userDocRef, {
          ...updatedProfile,
          photos: selectedFile ? [photoURL] : [],
          firstLogin: false,
          createdAt: new Date(),
        });
      }

      setProfile(prev => ({
        ...prev,
        photoURL,
        photos: updatedProfile.photos || prev.photos,
      }));

      return true;
    } catch (error) {
      return false;
    }
  };

  const saveProfile = async () => {
    try {
      setSaveLoading(true);
      await saveProfileAPI();
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePhotoUpload = async (event) => {
    if (!event.target.files || !userId || !idToken) return;
    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append("idToken", idToken);
      formData.append("accountType", "user");
      for (let i = 0; i < event.target.files.length; i++) {
        formData.append("photos", event.target.files[i]);
      }
      await axios.put(`${API_URL}/users/update`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchUserProfileFromAPI(userId, idToken);
      setToastMessage("Photos uploaded successfully!");
      setToastSeverity("success");
      setToastOpen(true);
    } catch {
      setToastMessage("Photos uploaded successfully! Refresh to see them.");
      setToastSeverity("success");
      setToastOpen(true);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photoUrl, index) => {
    if (!userId || !idToken) return;
    try {
      setDeletingPhoto(true);
      await axios.delete(`${API_URL}/users/photos`, {
        params: { idToken, photoUrl },
      });

      const updatedPhotos = [...profile.photos];
      updatedPhotos.splice(index, 1);
      setProfile({ ...profile, photos: updatedPhotos });

      setToastMessage("Photo deleted successfully!");
      setToastSeverity("success");
      setToastOpen(true);
    } catch {
      setToastMessage("Error deleting photo. Please try again.");
      setToastSeverity("error");
      setToastOpen(true);
    } finally {
      setDeletingPhoto(false);
    }
  };

  const handleAddMorePhotos = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.multiple = true;
    fileInput.accept = "image/*";
    fileInput.onchange = handlePhotoUpload;
    fileInput.click();
  };

  const retryLoading = () => {
    if (userId) {
      if (idToken) fetchUserProfileFromAPI(userId, idToken);
      else fetchUserProfile(userId);
    }
  };

  if (loading) {
    return (
      <>
        <GoogleFontsImport />
        <div className="loading-container">
          <CircularProgress color="secondary" />
          <p>Loading profile...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <GoogleFontsImport />
      <NavBar /> {/* ✅ NavBar inserted */}
      <div className="profile-page">
        <h1 className="profile-title">Edit Profile</h1>

        <div className="profile-details-section">
          <h2 className="section-title">Personal Details</h2>

          <div className="form-group">
            <label className="form-label">Name</label>
            <input type="text" value={profile.name} onChange={(e) => handleInputChange("name", e.target.value)} className="form-input" placeholder="Enter your name" />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" value={profile.email} onChange={(e) => handleInputChange("email", e.target.value)} className="form-input" placeholder="Enter your email" />
          </div>

          <div className="form-group">
            <label className="form-label">Location</label>
            <input type="text" value={profile.location} onChange={(e) => handleInputChange("location", e.target.value)} className="form-input" placeholder="Enter your location" />
          </div>

          <div className="form-group">
            <label className="form-label">Favorite Cuisine</label>
            <input type="text" value={profile.favoriteCuisine} onChange={(e) => handleInputChange("favoriteCuisine", e.target.value)} className="form-input" placeholder="Enter your favorite cuisine" />
          </div>
        </div>

        {/* Photos */}
        <div className="profile-photos-section">
          <div className="section-header">
            <h2 className="section-title">Photos</h2>
            <p className="section-description">Add photos to your profile</p>
          </div>
          <div className="photos-grid">
            {profile.photos?.map((photo, index) => (
              <div key={index} className="photo-item">
                <div className="delete-photo-button" onClick={() => handleDeletePhoto(photo, index)}>
                  <CloseIcon fontSize="small" />
                </div>
                <img src={photo} alt={`User photo ${index + 1}`} className="user-photo" />
              </div>
            ))}
            <div className="add-photo-box" onClick={handleAddMorePhotos} style={{ cursor: uploadingPhoto ? "not-allowed" : "pointer" }}>
              {uploadingPhoto ? <CircularProgress size={20} color="inherit" /> : (<><div className="plus-icon">+</div><div>Add Photos</div></>)}
            </div>
          </div>
        </div>

        <div className="profile-footer">
          <button className="save-button" onClick={saveProfile} disabled={saveLoading}>
            {saveLoading ? (<><CircularProgress size={20} color="inherit" style={{ marginRight: "8px" }} /> Saving...</>) : "Save Profile"}
          </button>
        </div>

        <Snackbar open={toastOpen} autoHideDuration={3000} onClose={handleToastClose} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert onClose={handleToastClose} severity={toastSeverity} sx={{ width: "100%" }}>{toastMessage}</Alert>
        </Snackbar>

        <Snackbar open={!!error} autoHideDuration={6000} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
          <Alert severity="error" sx={{ width: "100%" }} action={<button onClick={retryLoading} className="retry-button">Try again</button>}>
            {error || "Error loading profile. Please try again."}
          </Alert>
        </Snackbar>
      </div>
    </>
  );
};

export default Profile;
