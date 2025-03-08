import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin
} from '@vis.gl/react-google-maps';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const locations = [
  { key: 'burgerking', location: { lat: 40.6505596, lng: -73.9498141 } },
  { key: 'dunkin', location: { lat: 40.6504014, lng: -73.9492629 } },
];

const HomePage = () => {
  const [userName, setUserName] = useState("Guest");
  const auth = getAuth();
  const firestore = getFirestore();

  useEffect(() => {
    const fetchUserName = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserName(userData.name || "Guest");
        } else {
          console.error("No such document!");
        }
      }
    };

    fetchUserName();
  }, [auth, firestore]);

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY} onLoad={() => console.log('Maps API has loaded.')}>
        <Map
          defaultZoom={13}
          defaultCenter={{ lat: 40.6782, lng: -73.9442 }} // Brooklyn coordinates
          mapId='a55e2de4b4bc2090'
          onLoad={(map) => console.log('Map Loaded:', map)}
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
