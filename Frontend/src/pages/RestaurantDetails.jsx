import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GiForkKnifeSpoon } from "react-icons/gi";
import { IoPersonSharp } from "react-icons/io5";
import { IoIosChatboxes } from "react-icons/io";
import { FaHome } from "react-icons/fa";
import "./NavBar.css";
import restaurantImg1 from "../assets/chowpal_hero.png";
import { getFirebaseUser } from "../firebase/firebaseUtility";

const RestaurantDetails = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = getFirebaseUser();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [restaurantName, setRestaurantName] = useState("");
  const [address, setAddress] = useState([]);
  const [uid, setUid] = useState("");

  const images = [restaurantImg1, restaurantImg1, restaurantImg1];
  const { id } = useParams();

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const res = await fetch("http://localhost:8000/places/"+`${id}`);
        const data = await res.json();
        setRestaurantName(data.name);
        setAddress(data.address);
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };
    fetchRestaurant();
  }, []);

  useEffect(() => {
    const getUid = async () => {
      if (!user) return; // Don't proceed if user hasn't loaded
  
      try {
        const idToken = await user.accessToken; // Get the token properly
        const res = await fetch(`http://localhost:8000/users/uid?idToken=${encodeURIComponent(idToken)}`);
  
        if (!res.ok) {
          throw new Error("Failed to fetch UID");
        }
  
        const data = await res.json();
        setUid(data.uid);
      } catch (error) {
        console.error("Error fetching user UID:", error);
      }
    };
  
    getUid();
  }, [user]);
  

  const joinQueue = async () => {
    try {
      const formData = new FormData();
      formData.append("user_id", uid);
  
      const res = await fetch(`http://localhost:8000/places/${id}/queue/add`, {
        method: "POST",
        body: formData,
      });
  
      if (!res.ok) {
        const error = await res.json();
        if (res.status === 400 && error.detail === "User is already in the queue") {
          alert("You're already in the queue.");
          return;
        }
        throw new Error(error.detail || "Unknown error");
      }
  
      const data = await res.json();
      alert("Successfully joined the queue!");
  
      // Optionally refresh queue data
      window.location.reload();
    } catch (error) {
      console.error("Error joining queue:", error);
      alert(error.message || "Error joining queue. Please try again.");
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        position: "absolute",
        overflow: "hidden",
        backgroundColor: "#ffc595", // Updated background color
      }}
    >
      {/* Navbar */}
      <div className="right-navbar">
        <div className="nav-item" title="Home" onClick={() => navigate("/home")}>
          <FaHome />
        </div>
        <div className="nav-item" title="Chat">
          <IoIosChatboxes />
        </div>
        <div
          className="nav-item"
          title="Suggested Restaurants"
          onClick={() => navigate("/suggested")}
        >
          <GiForkKnifeSpoon />
        </div>
        <div className="nav-item" title="Profile">
          <IoPersonSharp />
        </div>
      </div>

      {/* Main Display */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: "30px",
          }}
        >
          <h1 style={{ fontSize: "2.5rem", fontWeight: "bold" }}>{restaurantName}</h1>
          {/* Large Active Image */}
        <img
          src={images[activeImageIndex]}
          alt={`Restaurant - ${restaurantName}`}
          style={{
            width: "80%",
            height: "600px", // Taller image
            objectFit: "cover",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          }}
        />

        {/* Thumbnail Gallery */}
        <div
          style={{
            display: "flex",
            marginTop: "15px",
            gap: "12px",
            justifyContent: "center",
          }}
        >
          {images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              onClick={() => setActiveImageIndex(idx)}
              alt={`Thumbnail ${idx + 1}`}
              style={{
                width: "100px",
                height: "70px",
                objectFit: "cover",
                borderRadius: "8px",
                border:
                  activeImageIndex === idx
                    ? "3px solid #FFD700"
                    : "2px solid #ccc",
                cursor: "pointer",
                transition: "transform 0.2s ease-in-out",
              }}
            />
          ))}
        </div>

        {/* Info + Actions */}
        <div
          style={{
            marginTop: "10px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "1.2rem",
              margin: "10px 0",
              color: "#555",
            }}
          >
            Address: {address}
          </p>
          <div style={{ marginTop: "10px" }}>
            <button
              onClick={() => navigate("/home")}
              style={{
                marginRight: "10px",
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#f0f0f0",
                cursor: "pointer",
              }}
            >
              Close
            </button>
            <button
              onClick={joinQueue}
              style={{
                marginRight: "10px",
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#ffd700",
                cursor: "pointer",
              }}
            >
              Join Queue
            </button>
            <button
              onClick={() => navigate(`/restaurant/${id}/queue`)}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#ffd700",
                cursor: "pointer",
              }}
            >
              View Queue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetails;
