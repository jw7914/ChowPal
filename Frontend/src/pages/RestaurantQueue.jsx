import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GiForkKnifeSpoon } from "react-icons/gi";
import { IoPersonSharp } from "react-icons/io5";
import { IoIosChatboxes } from "react-icons/io";
import { FaHome } from "react-icons/fa";
import "./NavBar.css";
import { getFirebaseUser } from "../firebase/firebaseUtility";

const RestaurantQueue = () => {
  const navigate = useNavigate();
  const [restaurantName, setRestaurantName] = useState("");
  const { user, isLoggedIn } = getFirebaseUser();
  const [queue, setQueue] = useState([]);
  const [uid, setUid] = useState("");
  const [queueUsers, setQueueUsers] = useState([]);


  const { id } = useParams();

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await fetch(`http://localhost:8000/places/${id}/queue`);
        const data = await res.json();

        const uids = data.queue;
        setQueue(uids); // still keep raw queue if needed

        // Fetch user details in parallel
        const userPromises = uids.map(async (uid) => {
          const res = await fetch(`http://localhost:8000/users/details?uid=${uid}`);
          if (res.ok) {
            const userData = await res.json();
            return { uid, ...userData };
          } else {
            return { uid, name: "Unknown User", error: true };
          }
        });

        const usersData = await Promise.all(userPromises);
        setQueueUsers(usersData);
      } catch (error) {
        console.error("Error fetching queue or user details:", error);
      }
    };

    fetchQueue();
  }, [id]);


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

    const handleMatch = async (user) => {
      if (user.uid === uid) {
        alert("You can't match with yourself!");
        return;
      }
    
      try {
        const matchFormData = new FormData();
        matchFormData.append("user_id", uid);
        matchFormData.append("match_id", user.uid);
    
        const matchRes = await fetch("http://localhost:8000/users/match", {
          method: "POST",
          body: matchFormData,
        });
    
        const matchData = await matchRes.json();
    
        if (!matchRes.ok) {
          alert(matchData.detail || "Match failed");
          return;
        }
    
        alert(matchData.message); // "Match confirmed!" or "Match request sent"
    
        if (matchData.status === "pending") {
          // Only join the queue on pending request
          const queueFormData = new FormData();
          queueFormData.append("user_id", uid);
    
          const queueRes = await fetch(`http://localhost:8000/places/${id}/queue/add`, {
            method: "POST",
            body: queueFormData,
          });
    
          const queueData = await queueRes.json();
    
          if (!queueRes.ok && queueRes.status === 400 && queueData.detail === "User is already in the queue") {
            console.log("Already in queue.");
          } else if (!queueRes.ok) {
            console.error("Queue error:", queueData);
            alert("Failed to join the queue.");
          } else {
            console.log("Added to queue:", queueData.queue);
          }
        }
        else if (matchData.status === "confirmed") {
    
          const removeFromQueue = async (userToRemoveUid) => {
            const formData = new FormData();
            formData.append("user_id", userToRemoveUid);
    
            const res = await fetch(`http://localhost:8000/places/${id}/queue/remove`, {
              method: "POST",
              body: formData,
            });
    
            if (!res.ok) {
              const errData = await res.json();
              console.error(`Failed to remove ${userToRemoveUid}:`, errData);
            } else {
              console.log(`Removed ${userToRemoveUid} from queue.`);
            }
          };
    
          // Remove both users
          await removeFromQueue(uid);
          await removeFromQueue(user.uid);
        }
        window.location.reload();
      } catch (error) {
        console.error("Error during match:", error);
        alert("Something went wrong.");
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

          {/* Queue Display */}
          <div
            style={{
              marginTop: "30px",
              width: "80%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <h2 style={{ fontSize: "1.5rem", marginBottom: "10px" }}>Current Queue</h2>
            {queueUsers.length === 0 ? (
                <p>No one in queue yet.</p>
              ) : (
                queueUsers.map((user, index) => (
                  <div
                    key={index}
                    style={{
                      width: "100%",
                      padding: "16px",
                      borderRadius: "8px",
                      backgroundColor: "#fff",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                      <div>
                        <span style={{ fontWeight: "bold" }}>#{index + 1}</span>
                        <div>Name: {user.name || "Unnamed"}</div>
                        <div>Email: {user.email || "No email available"}</div>
                        <div>Favorite Cuisine: {user.favoriteCuisine || "N/A"}</div>
                      </div>
                      <button
                        onClick={() => handleMatch(user)}
                        style={{
                          padding: "8px 12px",
                          backgroundColor: "#4caf50",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        Match
                      </button>
                    </div>

                  </div>
                ))
              )}

          </div>


        {/* Info + Actions */}
        <div
          style={{
            marginTop: "10px",
            textAlign: "center",
          }}
        >
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantQueue;
