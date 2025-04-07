import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GiForkKnifeSpoon } from "react-icons/gi";
import { IoPersonSharp } from "react-icons/io5";
import { IoIosChatboxes } from "react-icons/io";
import { FaHome } from "react-icons/fa";
import "./NavBar.css";
import restaurantImg1 from "../assets/chowpal_hero.png";

// Restaurant data with image arrays
const restaurantQueue = [
  {
    name: "Burger King",
    images: [restaurantImg1, restaurantImg1, restaurantImg1],
    location: { lat: 40.6505596, lng: -73.9498141 },
  },
  {
    name: "Dunkin",
    images: [restaurantImg1, restaurantImg1, restaurantImg1],
    location: { lat: 40.6504014, lng: -73.9492629 },
  },
];

const SuggestedRestaurantsPage = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const currentRestaurant = restaurantQueue[currentIndex];
  const images = currentRestaurant.images;

  const handleNext = () => {
    if (currentIndex < restaurantQueue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setActiveImageIndex(0); // reset to first image
    } else {
      alert("You've reached the end of the list!");
    }
  };

  const handleDetails = () => {
    alert(`Details:\n\nName: ${currentRestaurant.name}`);
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
        {/* Large Active Image */}
        <img
          src={images[activeImageIndex]}
          alt={`Restaurant - ${currentRestaurant.name}`}
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
            marginTop: "20px",
            textAlign: "center",
          }}
        >
          <h2>{currentRestaurant.name}</h2>
          <div style={{ marginTop: "10px" }}>
            <button
              onClick={handleNext}
              style={{
                marginRight: "10px",
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#f0f0f0",
                cursor: "pointer",
              }}
            >
              Next
            </button>
            <button
              onClick={handleDetails}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#ffd700",
                cursor: "pointer",
              }}
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuggestedRestaurantsPage;
