import React, { useEffect, useState } from "react";
import { GiForkKnifeSpoon } from "react-icons/gi";
import { IoPersonSharp } from "react-icons/io5";
import { IoIosChatboxes } from "react-icons/io";
import { MdExitToApp, MdTableBar } from "react-icons/md";
import { FaHome } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getFirebaseUser } from "../firebase/firebaseUtility";
import { getUserDetails } from "../firebase/firestoreFunctions";
import "./NavBar.css";

const Chats = () => {
  const navigate = useNavigate();
  const { user } = getFirebaseUser();
  const [userDetails, setUserDetails] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);

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
    if (user) {
      fetchUser();
    }
  }, [user]);

  return (
    <div style={{ height: "100vh", width: "100vw", display: "flex", position: "absolute", overflow: "hidden" }}>
      
      {/* Navbar */}
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
            <div className="nav-item" title="Profile" onClick={() => navigate("/profile")}>
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

      {/* Chat Interface */}
      <div style={{ display: "flex", flex: 1, height: "100%", marginLeft: "60px" }}>
        {/* Left Panel: Chat List */}
        <div style={{ width: "30%", borderRight: "1px solid #ddd", padding: "20px", background: "#fafafa", overflowY: "auto" }}>
          <h3>Chats</h3>
          {userDetails?.chats ? (
            Object.entries(userDetails.chats).map(([chatId, chatData]) => (
              <div
                key={chatId}
                onClick={() => setSelectedChat(chatData)}
                style={{
                  padding: "12px",
                  marginBottom: "10px",
                  borderRadius: "8px",
                  backgroundColor: selectedChat?.with === chatData.with ? "#e0e0e0" : "#fff",
                  cursor: "pointer",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <p style={{ margin: 0 }}><strong>With:</strong> {chatData.with}</p>
                <p style={{ margin: 0 }}><strong>At:</strong> {chatData.at}</p>
              </div>
            ))
          ) : (
            <p style={{ marginTop: "20px" }}>No chats found.</p>
          )}
        </div>

        {/* Right Panel: Placeholder for Selected Chat */}
        <div style={{ flex: 1, padding: "20px", background: "#fff" }}>
          {selectedChat ? (
            <div>
              <h3>Chat with {selectedChat.with}</h3>
              <p>Location: {selectedChat.at}</p>
              {/* Messages will go here */}
            </div>
          ) : (
            <p>Select a chat to start messaging</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chats;
