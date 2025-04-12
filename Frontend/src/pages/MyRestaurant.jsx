import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GiForkKnifeSpoon } from "react-icons/gi";
import { IoPersonSharp } from "react-icons/io5";
import { IoIosChatboxes } from "react-icons/io";
import { MdExitToApp, MdTableBar } from "react-icons/md";
import { FaHome } from "react-icons/fa";
import "./NavBar.css";
import { getFirebaseUser } from "../firebase/firebaseUtility";
import { getUserDetails } from "../firebase/firestoreFunctions";
import { auth } from "../firebase/firebaseconfig";

const MyRestaurant = () => {
  const navigate = useNavigate();
  const { user } = getFirebaseUser();
  const [userDetails, setUserDetails] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [uid, setUid] = useState("");
  const [images, setImages] = useState([null, null, null]);

  useEffect(() => {
    const fetchUID = async () => {
      if (!user) return;
      try {
        const idToken = await user.accessToken;
        const res = await fetch(`http://localhost:8000/users/uid?idToken=${encodeURIComponent(idToken)}`);
        const data = await res.json();
        setUid(data.uid);
      } catch (error) {
        console.error("Failed to fetch UID:", error);
      }
    };
    fetchUID();
  }, [user]);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!user || !uid) return;
      try {
        const details = await getUserDetails(user.accessToken);
        setUserDetails(details);

        const res = await fetch(`http://localhost:8000/users/${uid}/restaurant`);
        const data = await res.json();
        setRestaurant(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchDetails();
  }, [uid, user]);

  const handleImageChange = (index, file) => {
    const newImages = [...images];
    newImages[index] = file;
    setImages(newImages);
  };

  const handleSubmit = async () => {
    if (images.some((img) => !img)) {
      alert("Please upload exactly 3 photos.");
      return;
    }

    try {
      const formData = new FormData();
      images.forEach((img) => formData.append("photos", img));

      const res = await fetch(`http://localhost:8000/places/${restaurant.restaurant_id}/upload-photos`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Upload failed");
      }

      alert("Photos uploaded successfully!");
    } catch (err) {
      console.error("Upload error:", err);
      alert("Something went wrong while uploading.");
    }
  };

  return (
    <div style={{ height: "100vh", width: "100vw", position: "absolute", overflow: "hidden", backgroundColor: "#fff2dc" }}>
      {/* NavBar - HomePage Style */}
      <div className="right-navbar">
        <div className="nav-item" title="Home" onClick={() => navigate("/home")}>
          <FaHome />
        </div>

        {userDetails?.accountType === "user" && (
          <>
            <div className="nav-item" title="Chat">
              <IoIosChatboxes />
            </div>
            <div className="nav-item" title="Suggested Restaurants" onClick={() => navigate("/suggested")}>
              <GiForkKnifeSpoon />
            </div>
            <div className="nav-item" title="Profile">
              <IoPersonSharp />
            </div>
          </>
        )}

        {userDetails?.accountType === "restaurant" && userDetails?.claimed === true && (
          <div className="nav-item" title="restaurant_profile" onClick={() => navigate("/restaurant-edit")}>
            <MdTableBar />
          </div>
        )}

        <div style={{ position: "absolute", left: "8px", bottom: "10px", width: "100%", textAlign: "center" }}>
          <div className="nav-item" title="Logout" onClick={() => navigate("/logout")}>
            <MdExitToApp size={24} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "30px" }}>
        <h1 style={{ fontSize: "2.2rem", fontWeight: "bold" }}>My Restaurant</h1>
        <p style={{ fontStyle: "italic", color: "#888", marginBottom: "20px" }}>
          Click the images to make changes
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "20px",
            marginBottom: "30px",
            width: "80%",
            justifyItems: "center",
          }}
        >
          {images.map((img, idx) => (
            <div
              key={idx}
              style={{
                width: "100%",
                maxWidth: "300px",
                height: "200px",
                border: "2px dashed #ccc",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f9f9f9",
                position: "relative",
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(idx, e.target.files[0])}
                style={{
                  opacity: 0,
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  cursor: "pointer",
                }}
              />
              {img ? (
                <img
                  src={URL.createObjectURL(img)}
                  alt={`Upload ${idx + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "10px",
                  }}
                />
              ) : (
                <span style={{ color: "#aaa", fontSize: "1rem" }}>Upload Image {idx + 1}</span>
              )}
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          style={{
            padding: "10px 20px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "#ffcc00",
            color: "white",
            fontWeight: "bold",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default MyRestaurant;
