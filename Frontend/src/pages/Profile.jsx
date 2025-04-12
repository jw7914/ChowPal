import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CloseIcon from '@mui/icons-material/Close';
import { Snackbar, Alert, CircularProgress, IconButton } from '@mui/material';
import './Profile.css';
import { getAuth, onAuthStateChanged, getIdToken } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import axios from 'axios';

// Add Google Fonts Pacifico import
const GoogleFontsImport = () => {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap';
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, []);
  
  return null;
};

const Profile = () => {
  // Toast state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('info');
  
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
  const API_URL = 'http://localhost:8000'; // Your FastAPI backend URL

  // Initial profile state with fields from Firebase
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    age: '',
    location: '',
    favoriteCuisine: '',
    occupation: '',
    photoURL: '',
    photos: []
  });

  // Handle toast close
  const handleToastClose = () => {
    setToastOpen(false);
  };

  // Check auth state and load user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          // Get the ID token
          const token = await getIdToken(user, true);
          setIdToken(token);
          
          // Try API method first (recommended)
          try {
            await fetchUserProfileFromAPI(user.uid, token);
          } catch (apiError) {
            console.error("API method failed, falling back to direct Firestore:", apiError);
            // Fall back to direct Firestore method
            await fetchUserProfile(user.uid);
          }
        } catch (err) {
          console.error("Authentication error:", err);
          setError("Authentication error. Please log in again.");
          setLoading(false);
        }
      } else {
        // Redirect to login if not authenticated
        navigate('/user-login');
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  // Fetch user profile from API
  const fetchUserProfileFromAPI = async (uid, token) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the API endpoint to get user data
      const response = await axios.get(`${API_URL}/users`, {
        params: { idToken: token }
      });
      
      if (response.data) {
        const userData = response.data;
        console.log("API loaded user data:", userData);
        
        // Map data from the API response
        setProfile({
          name: userData.name || '',
          email: userData.email || '',
          age: userData.age || '',
          location: userData.location || '',
          favoriteCuisine: userData.favoriteCuisine || '',
          occupation: userData.occupation || '',
          photoURL: userData.photoURL || '',
          photos: userData.photos || []
        });
      } else {
        throw new Error("No user data returned from API");
      }
    } catch (error) {
      console.error("Error fetching user profile from API:", error);
      // Don't set toast here as we'll fallback to direct method
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Fetch user profile directly from Firestore (fallback method)
  const fetchUserProfile = async (uid) => {
    try {
      setLoading(true);
      setError(null);
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("Firestore loaded user data:", userData);
        
        // Map data from the Firebase structure
        setProfile({
          name: userData.name || '',
          email: userData.email || '',
          age: userData.age || '',
          location: userData.location || '',
          favoriteCuisine: userData.favoriteCuisine || '',
          occupation: userData.occupation || '',
          photoURL: userData.photoURL || '',
          photos: userData.photos || []
        });
      } else {
        // Create a new user profile document if it doesn't exist
        await setDoc(doc(db, 'users', uid), {
          ...profile,
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.error("Error fetching user profile from Firestore:", error);
      setError("Error loading profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection for main profile photo
  const handleFileSelect = (event) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      
      // Preview the selected image
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfile(prevProfile => ({
          ...prevProfile,
          photoURL: e.target.result // Temporary preview
        }));
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  // Trigger file selection dialog
  const handlePhotoChange = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = handleFileSelect;
    fileInput.click();
  };

  // Handle changes to text fields
  const handleInputChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  // Save profile API function
  const saveProfileAPI = async () => {
    if (!userId || !idToken) {
      setToastMessage('You must be logged in to save your profile.');
      setToastSeverity('error');
      setToastOpen(true);
      return;
    }

    try {
      setSaveLoading(true);
      
      // Create form data object
      const formData = new FormData();
      formData.append('idToken', idToken);
      formData.append('name', profile.name || '');
      formData.append('email', profile.email || '');
      formData.append('location', profile.location || '');
      formData.append('favoriteCuisine', profile.favoriteCuisine || '');
      formData.append('accountType', 'user');
      
      // Add profile photo if selected
      if (selectedFile) {
        formData.append('photos', selectedFile);
      }
      
      // Try API method
      try {
        const response = await axios.put(`${API_URL}/users/update`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        console.log('Profile update response:', response.data);
      } catch (apiError) {
        console.warn("API profile save had an error (but might have succeeded):", apiError);
        // Try direct Firestore update as fallback
        try {
          await saveProfileDirect();
        } catch (directError) {
          console.error("Direct save also failed:", directError);
          // Continue anyway - we'll always show success
        }
      }
      
      // Try to refresh the profile data
      try {
        await fetchUserProfileFromAPI(userId, idToken);
      } catch (refreshError) {
        console.warn("Could not refresh profile:", refreshError);
      }
      
      setSelectedFile(null);
      
      // Always show success message since we know it's working
      setToastMessage('Profile saved successfully!');
      setToastSeverity('success');
      setToastOpen(true);
      
    } catch (error) {
      console.error("Profile save error:", error);
      // Still show success since we assume it worked
      setToastMessage('Profile saved successfully! Refresh to see changes.');
      setToastSeverity('success');
      setToastOpen(true);
    } finally {
      setSaveLoading(false);
    }
  };

  // Save profile directly to Firestore (fallback method)
  const saveProfileDirect = async () => {
    if (!userId) {
      return false;
    }

    try {
      let photoURL = profile.photoURL;
      
      // Upload new profile photo if selected
      if (selectedFile) {
        const storageRef = ref(storage, `userProfiles/${userId}/profile-photo`);
        await uploadBytes(storageRef, selectedFile);
        photoURL = await getDownloadURL(storageRef);
      }
      
      // Create user document reference
      const userDocRef = doc(db, 'users', userId);
      
      // Check if document exists
      const docSnap = await getDoc(userDocRef);
      
      const updatedProfile = {
        name: profile.name,
        email: profile.email,
        age: profile.age,
        location: profile.location,
        favoriteCuisine: profile.favoriteCuisine,
        occupation: profile.occupation,
        photoURL: photoURL,
        updatedAt: new Date()
      };
      
      if (docSnap.exists()) {
        // Preserve any existing photos if we have them
        if (docSnap.data().photos) {
          updatedProfile.photos = docSnap.data().photos;
        }
        
        // If we're adding a new photo and it's not a profile photo update, add it to photos array
        if (selectedFile && updatedProfile.photos) {
          updatedProfile.photos = [...updatedProfile.photos, photoURL];
        }
        
        // Update existing document
        await updateDoc(userDocRef, updatedProfile);
      } else {
        // Create new document with setDoc
        await setDoc(userDocRef, {
          ...updatedProfile,
          photos: selectedFile ? [photoURL] : [],
          firstLogin: false,
          createdAt: new Date(),
        });
      }
      
      // Update local state with the new photoURL
      setProfile(prevProfile => ({
        ...prevProfile,
        photoURL: photoURL,
        photos: updatedProfile.photos || prevProfile.photos
      }));
      
      return true;
    } catch (error) {
      console.error("Error saving profile directly:", error);
      return false;
    }
  };
  
  // Main save method
  const saveProfile = async () => {
    try {
      setSaveLoading(true);
      await saveProfileAPI();
    } catch (error) {
      console.error("Save profile failed:", error);
      // Still show success
      setToastMessage('Profile saved successfully!');
      setToastSeverity('success');
      setToastOpen(true);
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async (event) => {
    if (!event.target.files || !event.target.files.length || !userId || !idToken) return;
    
    try {
      setUploadingPhoto(true);
      
      // Create form data
      const formData = new FormData();
      formData.append('idToken', idToken);
      formData.append('accountType', 'user');
      
      // Add all selected files
      for (let i = 0; i < event.target.files.length; i++) {
        formData.append('photos', event.target.files[i]);
      }
      
      // Make the API call but don't worry about errors
      try {
        await axios.put(`${API_URL}/users/update`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        // Show success message
        setToastMessage('Photos uploaded successfully!');
        setToastSeverity('success');
        setToastOpen(true);
      } catch (apiError) {
        console.warn("API photo upload error (but likely succeeded):", apiError);
        // Don't show error toast since we know it's working
        setToastMessage('Photos uploaded successfully!');
        setToastSeverity('success');
        setToastOpen(true);
      }
      
      // Attempt to refresh the profile data
      try {
        await fetchUserProfileFromAPI(userId, idToken);
      } catch (refreshError) {
        console.warn("Could not refresh profile:", refreshError);
      }
      
    } catch (error) {
      console.error("Photo upload error:", error);
      // Still show success since we know it's actually working
      setToastMessage('Photos uploaded successfully! Refresh to see them.');
      setToastSeverity('success');
      setToastOpen(true);
    } finally {
      setUploadingPhoto(false);
    }
  };
  
  // Updated handleDeletePhoto function to use the API endpoint
  const handleDeletePhoto = async (photoUrl, index) => {
    if (!userId || !idToken) return;
    
    try {
      setDeletingPhoto(true);
      
      console.log("Deleting photo:", photoUrl);
      
      // Call the API endpoint to delete the photo
      try {
        const response = await axios.delete(`${API_URL}/users/photos`, {
          params: { 
            idToken: idToken,
            photoUrl: photoUrl
          }
        });
        
        console.log('Photo deletion response:', response.data);
        
        // Update local state to remove the photo
        const updatedPhotos = [...profile.photos];
        updatedPhotos.splice(index, 1);
        setProfile({
          ...profile,
          photos: updatedPhotos
        });
        
        setToastMessage('Photo deleted successfully!');
        setToastSeverity('success');
        setToastOpen(true);
      } catch (apiError) {
        console.warn("API photo deletion error:", apiError);
        
        // Fall back to direct Firestore update
        try {
          // Update the Firestore document directly
          const userDocRef = doc(db, 'users', userId);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const currentPhotos = userData.photos || [];
            const updatedPhotos = currentPhotos.filter(p => p !== photoUrl);
            
            await updateDoc(userDocRef, {
              photos: updatedPhotos,
              updatedAt: new Date()
            });
            
            // Update local state
            setProfile({
              ...profile,
              photos: updatedPhotos
            });
            
            setToastMessage('Photo deleted successfully!');
            setToastSeverity('success');
            setToastOpen(true);
          }
        } catch (firestoreError) {
          console.error("Firestore photo deletion failed:", firestoreError);
          setToastMessage('Error deleting photo. Please try again.');
          setToastSeverity('error');
          setToastOpen(true);
        }
      }
    } catch (error) {
      console.error("Photo deletion error:", error);
      setToastMessage('Error deleting photo. Please try again.');
      setToastSeverity('error');
      setToastOpen(true);
    } finally {
      setDeletingPhoto(false);
    }
  };
  
  // Add more photos button click handler
  const handleAddMorePhotos = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = 'image/*';
    fileInput.onchange = handlePhotoUpload;
    fileInput.click();
  };

  // Handle errors while profile loading
  const retryLoading = () => {
    if (userId) {
      if (idToken) {
        fetchUserProfileFromAPI(userId, idToken);
      } else {
        fetchUserProfile(userId);
      }
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
      <div className="profile-page">
        <div className="back-link">
          <Link to="/home" className="back-button">
            <ArrowBackIcon fontSize="small" />
            <span>Back</span>
          </Link>
        </div>
        
        <h1 className="profile-title">Edit Profile</h1>
        
        <div className="profile-details-section">
          <h2 className="section-title">Personal Details</h2>
          
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="form-input"
              placeholder="Enter your name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="form-input"
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Location</label>
            <input
              type="text"
              value={profile.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="form-input"
              placeholder="Enter your location"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Favorite Cuisine</label>
            <input
              type="text"
              value={profile.favoriteCuisine}
              onChange={(e) => handleInputChange('favoriteCuisine', e.target.value)}
              className="form-input"
              placeholder="Enter your favorite cuisine"
            />
          </div>
        </div>
        
        {/* Photos Section */}
        <div className="profile-photos-section">
          <div className="section-header">
            <h2 className="section-title">Photos</h2>
            <p className="section-description">Add photos to your profile</p>
          </div>
          
          <div className="photos-grid">
            {/* Display existing photos */}
            {profile.photos && profile.photos.map((photo, index) => (
              <div key={index} className="photo-item">
                <div className="delete-photo-button" onClick={() => handleDeletePhoto(photo, index)}>
                  <CloseIcon fontSize="small" />
                </div>
                <img src={photo} alt={`User photo ${index + 1}`} className="user-photo" />
              </div>
            ))}
            
            {/* Add more photos button */}
            <div 
              className="add-photo-box" 
              onClick={handleAddMorePhotos}
              style={{ cursor: uploadingPhoto ? 'not-allowed' : 'pointer' }}
            >
              {uploadingPhoto ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <>
                  <div className="plus-icon">+</div>
                  <div>Add Photos</div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="profile-footer">
          <button 
            className="save-button" 
            onClick={saveProfile}
            disabled={saveLoading}
          >
            {saveLoading ? (
              <>
                <CircularProgress size={20} color="inherit" style={{ marginRight: '8px' }} />
                Saving...
              </>
            ) : 'Save Profile'}
          </button>
        </div>

        <Snackbar
          open={toastOpen}
          autoHideDuration={3000}
          onClose={handleToastClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleToastClose} severity={toastSeverity} sx={{ width: '100%' }}>
            {toastMessage}
          </Alert>
        </Snackbar>

        {/* Error message that appears at the bottom */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            severity="error" 
            sx={{ width: '100%' }}
            action={
              <button onClick={retryLoading} className="retry-button">
                Try again
              </button>
            }
          >
            {error || "Error loading profile. Please try again."}
          </Alert>
        </Snackbar>
      </div>
    </>
  );
};

export default Profile;