import React, { useEffect, useState } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import { getFirebaseUser } from "../firebase/firebaseUtility";
import { getUserDetails } from "../firebase/firestoreFunctions";
import { GiForkKnifeSpoon } from "react-icons/gi";
import { IoPersonSharp } from "react-icons/io5";
import { IoIosChatboxes } from "react-icons/io";
import { MdExitToApp, MdTableBar } from "react-icons/md";
import { FaHome } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebaseconfig";
import NavBar from "./Navbar";
import "./NavBar.css";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = getFirebaseUser();
  const [userDetails, setUserDetails] = useState(null);
  const [locations, setLocations] = useState([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (user) {
        try {
          const details = await getUserDetails(user.accessToken);
          setUserDetails(details);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };
    fetchUser();
  }, [user]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch("http://localhost:8000/restaurants/locations");
        const data = await res.json();
        setLocations(data.locations);
        setIsLoadingLocations(false);
      } catch (error) {
        console.error("Error fetching locations:", error);
        setIsLoadingLocations(false);
      }
    };
    fetchLocations();
  }, []);

  return (
    <div style={{ height: "100vh", width: "100vw", position: "absolute", overflow: "hidden" }}>
      <NavBar />

      {/* Main Content */}
      <div style={{ height: "110%", width: "100%" }}>
        {isLoadingLocations ? (
          <p style={{
            position: "absolute", top: 40, left: 10,
            background: "rgba(255, 255, 255, 0.8)", padding: "5px 10px",
            borderRadius: "8px", zIndex: 1000
          }}>
            Loading locations...
          </p>
        ) : (
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <Map
              style={{ maxHeight: "100vh" }}
              defaultZoom={13}
              defaultCenter={{ lat: 40.6782, lng: -73.9442 }}
              options={{ disableDefaultUI: true, draggable: true, scrollwheel: true }}
              mapId="a55e2de4b4bc2090"
            >
              <PoiMarkers pois={locations} userDetails={userDetails} />
            </Map>
          </APIProvider>
        )}
      </div>
    </div>
  );
};

const PoiMarkers = ({ pois, userDetails }) => {
  const [selected, setSelected] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPhoto = async () => {
      if (selected) {
        try {
          const res = await fetch(`http://localhost:8000/places/${selected.key}`);
          const data = await res.json();
          if (data.photo_urls && data.photo_urls.length > 0) {
            setPhotoUrl(data.photo_urls[0]);
          } else {
            setPhotoUrl(null);
          }
        } catch (error) {
          console.error("Error fetching Firestore photo:", error);
          setPhotoUrl(null);
        }
      }
    };
    fetchPhoto();
  }, [selected]);

  const handleClaimRestaurant = async (placeId) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return alert("Not authenticated.");
    const formData = new FormData();
    formData.append("user_id", userId);

    try {
      const res = await fetch(`http://localhost:8000/places/${placeId}/add-owner`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) return alert(`Error: ${data.detail || "Could not claim restaurant"}`);
      alert("Restaurant successfully claimed!");
    } catch (error) {
      console.error("Error claiming restaurant:", error);
      alert("Something went wrong.");
    }
  };

  return (
    <>
      {pois.map((poi) => (
        <AdvancedMarker
          key={poi.key}
          position={poi.location}
          title={poi.name}
          onClick={() => setSelected(poi)}
        >
          <Pin background="#FBBC04" glyphColor="#000" borderColor="#000" />
        </AdvancedMarker>
      ))}

      {selected && (
        <InfoWindow
          position={selected.location}
          onCloseClick={() => {
            setSelected(null);
            setPhotoUrl(null);
          }}
        >
          <div style={{ maxWidth: "200px" }}>
            <h4><strong>{selected.name}</strong></h4>
            {photoUrl && (
              <img
                src={photoUrl}
                alt={selected.name}
                style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "8px" }}
              />
            )}
            <p style={{ fontSize: "0.8rem", color: "#555" }}>{selected.address || "No address available."}</p>
            <button
              onClick={() => navigate(`/restaurant/${selected.key}`)}
              style={{ backgroundColor: "#4285F4", color: "white", border: "none", padding: "6px 10px", borderRadius: "4px", cursor: "pointer" }}
            >
              View Details
            </button>
            {userDetails?.accountType === "restaurant" && !userDetails?.claimed && (
              <button onClick={() => handleClaimRestaurant(selected.key)} style={{ marginTop: "6px" }}>
                Claim Restaurant
              </button>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
};

export default HomePage;
