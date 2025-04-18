import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirebaseUser } from "../firebase/firebaseUtility";
import { getUserDetails } from "../firebase/firestoreFunctions";
import { TbMoodEmpty } from "react-icons/tb";
import NavBar from "./Navbar";
import "./NavBar.css";

const PendingMatches = () => {
  const navigate = useNavigate();
  const { user } = getFirebaseUser();
  const [userDetails, setUserDetails] = useState(null);
  const [pendingMatches, setPendingMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentMatchDetails, setCurrentMatchDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetailsAndMatches = async () => {
      if (!user) return;

      try {
        const details = await getUserDetails(user.accessToken);
        setUserDetails(details);

        const res = await fetch(`http://localhost:8000/users/match_pending?user_id=${details.uid}`);
        const data = await res.json();
        setPendingMatches(data.matches || []);
      } catch (err) {
        console.error("Error loading matches or user details:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetailsAndMatches();
  }, [user]);

  useEffect(() => {
    const fetchMatchDetails = async () => {
      if (pendingMatches.length === 0 || !pendingMatches[currentIndex]) {
        setCurrentMatchDetails(null);
        return;
      }

      const matchId = pendingMatches[currentIndex];
      try {
        const res = await fetch(`http://localhost:8000/users/details?uid=${matchId}`);
        const data = await res.json();
        setCurrentMatchDetails({ uid: matchId, ...data });
      } catch (err) {
        console.error("Failed to fetch match details:", err);
        setCurrentMatchDetails(null);
      }
    };

    fetchMatchDetails();
  }, [pendingMatches, currentIndex]);

  const handleDecision = async (decision) => {
    if (!currentMatchDetails) return;

    const endpoint =
      decision === "accept"
        ? "http://localhost:8000/users/match"
        : "http://localhost:8000/users/match_pending";

    const method = decision === "accept" ? "POST" : "DELETE";

    const formData = new FormData();
    formData.append("user_id", userDetails.uid);
    formData.append("match_id", currentMatchDetails.uid);

    try {
      const res = await fetch(endpoint, {
        method: method,
        body: decision === "accept" ? formData : null,
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.detail);
        return;
      }

      setCurrentIndex((prev) => prev + 1);
    } catch (err) {
      console.error(`Error on ${decision}:`, err);
    }
  };

  const noMatchesLeft = !isLoading && (pendingMatches.length === 0 || currentIndex >= pendingMatches.length);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        position: "absolute",
        overflow: "auto",
        backgroundColor: "#ffe5b4",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "40px",
      }}
    >
      <NavBar />

      {noMatchesLeft ? (
        <div
          style={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            width: "100%",
            height: "100%",
            marginTop: "-40px",
          }}
        >
          <TbMoodEmpty size={120} />
          <p style={{ fontSize: "1.4rem", marginTop: "12px" }}>No pending matches</p>
        </div>
      ) : currentMatchDetails ? (
        <div
          style={{
            backgroundColor: "#fff7e6",
            padding: "30px",
            borderRadius: "20px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
            width: "400px",
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: "1.8rem" }}>{currentMatchDetails.name}</h2>
          <p style={{ fontSize: "1rem", marginTop: "5px", color: "#555" }}>
            Restaurant ID: {currentMatchDetails.restaurant_id || "N/A"}
          </p>

          <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between" }}>
            <button
              onClick={() => handleDecision("reject")}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: "#f56565",
                color: "white",
              }}
            >
              Reject
            </button>
            <button
              onClick={() => navigate(`/user/${currentMatchDetails.uid}`)}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: "#f6ad55",
                color: "white",
              }}
            >
              View Profile
            </button>
            <button
              onClick={() => handleDecision("accept")}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: "#48bb78",
                color: "white",
              }}
            >
              Accept
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PendingMatches;
