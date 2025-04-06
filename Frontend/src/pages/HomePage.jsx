import React, { useEffect, useState } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
} from "@vis.gl/react-google-maps";
import { getFirebaseUser } from "../firebase/firebaseUtility";
import { getUserDetails } from "../firebase/firestoreFunctions";

import { GiForkKnifeSpoon } from "react-icons/gi";
import { IoPersonSharp } from "react-icons/io5";
import { IoIosChatboxes } from "react-icons/io";
import { FaHome } from "react-icons/fa";
import "./NavBar.css";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const HomePage = () => {
  const { user, isLoggedIn } = getFirebaseUser();
  const [userDetails, setUserDetails] = useState(null);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    const fetchUserName = async () => {
      if (user) {
        try {
          const details = await getUserDetails(user.accessToken);
          setUserDetails(details);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };
    fetchUserName();
  }, [user]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch("http://localhost:8000/restaurants/locations");
        const data = await res.json();
        setLocations(data.locations);
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };
    fetchLocations();
  }, []);

  useEffect(() => {
    if (userDetails) {
      console.log("User details:", userDetails);
      console.log(userDetails.name);
      console.log(user);
    }
  }, [userDetails]);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        position: "absolute",
        overflow: "hidden",
      }}
    >
      {/* Vertical Navbar */}
      <div className="right-navbar">
        <div className="nav-item" title="Home">
          <FaHome />
        </div>
        <div className="nav-item" title="Chat">
          <IoIosChatboxes />
        </div>
        <div className="nav-item" title="Suggested Restaurants">
          <GiForkKnifeSpoon />
        </div>
        <div className="nav-item" title="Profile">
          <IoPersonSharp />
        </div>
      </div>

      {/* Main Content */}
      <div style={{ height: "110%", width: "100%" }}>
        {userDetails ? (
          <p
            style={{
              position: "absolute",
              top: 10,
              left: 100,
              background: "rgba(255, 255, 255, 0.8)",
              padding: "5px 10px",
              borderRadius: "8px",
              zIndex: 1000,
            }}
          >
            Welcome, {userDetails.name}!
          </p>
        ) : (
          <p
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              background: "rgba(255, 255, 255, 0.8)",
              padding: "5px 10px",
              borderRadius: "8px",
              zIndex: 1000,
            }}
          >
            Loading user details...
          </p>
        )}
        <APIProvider
          apiKey={GOOGLE_MAPS_API_KEY}
          onLoad={() => console.log("Maps API has loaded.")}
        >
          <Map
            style={{ maxHeight: "100vh" }}
            defaultZoom={13}
            defaultCenter={{ lat: 40.6782, lng: -73.9442 }} // Brooklyn coordinates
            options={{
              disableDefaultUI: true,
              draggable: true,
              scrollwheel: true,
            }}
            mapId="a55e2de4b4bc2090"
            onLoad={(map) => console.log("Map Loaded:", map)}
          >
            <PoiMarkers pois={locations} />
          </Map>
        </APIProvider>
      </div>
    </div>
  );
};

const PoiMarkers = ({ pois }) => {
  return (
    <>
      {pois.map((poi) => (
         <AdvancedMarker key={poi.key} position={poi.location} title={poi.name}>
          <Pin background="#FBBC04" glyphColor="#000" borderColor="#000" />
        </AdvancedMarker>
      ))}
    </>
  );
};

export default HomePage;
