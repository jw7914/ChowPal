import React, { useEffect, useState } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
} from "@vis.gl/react-google-maps";
import { getFirebaseUser } from "../firebase/firebaseUtility";
import { getUserDetails } from "../firebase/firestoreFunctions";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const locations = [
  { key: "burgerking", location: { lat: 40.6505596, lng: -73.9498141 } },
  { key: "dunkin", location: { lat: 40.6504014, lng: -73.9492629 } },
];

const HomePage = () => {
  const { user, isLoggedIn } = getFirebaseUser();
  const [userDetails, setUserDetails] = useState(null);

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
    if (userDetails) {
      console.log("User details:", userDetails);
      console.log(userDetails.name);
      console.log(user);
    }
  }, [userDetails]);

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      {userDetails ? (
        <p>Welcome, {userDetails.name}!</p>
      ) : (
        <p>Loading user details...</p>
      )}

      <APIProvider
        apiKey={GOOGLE_MAPS_API_KEY}
        onLoad={() => console.log("Maps API has loaded.")}
      >
        <Map
          defaultZoom={13}
          defaultCenter={{ lat: 40.6782, lng: -73.9442 }} // Brooklyn coordinates
          mapId="a55e2de4b4bc2090"
          onLoad={(map) => console.log("Map Loaded:", map)}
        >
          <PoiMarkers pois={locations} />
        </Map>
      </APIProvider>
    </div>
  );
};

const PoiMarkers = ({ pois }) => {
  return (
    <>
      {pois.map((poi) => (
        <AdvancedMarker key={poi.key} position={poi.location}>
          <Pin background="#FBBC04" glyphColor="#000" borderColor="#000" />
        </AdvancedMarker>
      ))}
    </>
  );
};

export default HomePage;
