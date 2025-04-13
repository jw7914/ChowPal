import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GiForkKnifeSpoon } from "react-icons/gi";
import { IoPersonSharp } from "react-icons/io5";
import { IoIosChatboxes } from "react-icons/io";
import { MdExitToApp, MdTableBar } from "react-icons/md";
import { FaHome } from "react-icons/fa";
import { getFirebaseUser } from "../firebase/firebaseUtility";
import { getUserDetails } from "../firebase/firestoreFunctions";
import { getDatabase, ref, onChildAdded, off } from "firebase/database";
import NavBar from "./Navbar";
import "./NavBar.css";

const Chats = () => {
  const navigate = useNavigate();
  const { chatId: urlChatId } = useParams();
  const { user } = getFirebaseUser();

  const [userDetails, setUserDetails] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

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
    if (userDetails?.chats && urlChatId && user?.uid) {
      const chatData = userDetails.chats[urlChatId];
      if (chatData) {
        setSelectedChat({ ...chatData, chatId: urlChatId });
        setMessages([]);
      }
    }
  }, [urlChatId, userDetails, user?.uid]);

  useEffect(() => {
    if (!selectedChat?.chatId || !user?.uid) return;

    const db = getDatabase();
    const messagesRef = ref(db, `chat/${selectedChat.chatId}/messages`);

    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    };

    const handleNewMessage = (snapshot) => {
      const msg = { id: snapshot.key, ...snapshot.val() };
      setMessages((prev) => {
        const updated = [...prev, msg];
        setTimeout(scrollToBottom, 50);
        return updated;
      });
    };

    onChildAdded(messagesRef, handleNewMessage);

    return () => {
      off(messagesRef, "child_added", handleNewMessage);
    };
  }, [selectedChat?.chatId, user?.uid]);

  const handleChatClick = (chatId, chatData) => {
    navigate(`/chats/${chatId}`);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat?.chatId) return;

    try {
      const res = await fetch(
        `http://localhost:8000/chat/send-message?chatID=${selectedChat.chatId}&senderUID=${user.uid}&text=${encodeURIComponent(
          newMessage
        )}`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Failed to send");

      setNewMessage("");
    } catch (err) {
      console.error("Send failed:", err);
    }
  };

  return (
    <div style={{ height: "100vh", width: "100vw", display: "flex", position: "absolute", overflow: "hidden" }}>
      <NavBar />

      {/* Chat Interface */}
      <div style={{ display: "flex", flex: 1, height: "100%", marginLeft: "60px" }}>
        {/* Left Panel: Chat List */}
        <div style={{ width: "30%", borderRight: "1px solid #ddd", padding: "20px", background: "#fafafa", overflowY: "auto" }}>
          <h3>Chats</h3>
          {userDetails?.chats ? (
            Object.entries(userDetails.chats).map(([chatId, chatData]) => (
              <div
                key={chatId}
                onClick={() => handleChatClick(chatId, chatData)}
                style={{
                  padding: "12px",
                  marginBottom: "10px",
                  borderRadius: "8px",
                  backgroundColor: selectedChat?.chatId === chatId ? "#e0e0e0" : "#fff",
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

        {/* Right Panel: Chat Messages */}
        <div style={{ flex: 1, padding: "20px", background: "#fff", overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {selectedChat ? (
            <>
              <div style={{ marginBottom: "16px" }}>
                <h3>Chat with {selectedChat.with}</h3>
                <p style={{ color: "#888" }}>Location: {selectedChat.at}</p>
              </div>

              <div style={{ flexGrow: 1, overflowY: "auto" }}>
                {messages.length > 0 ? (
                  <>
                    {messages.map((msg) => {
                      const isMine = msg.sender === user.uid;
                      return (
                        <div
                          key={msg.id}
                          style={{
                            display: "flex",
                            justifyContent: isMine ? "flex-end" : "flex-start",
                            marginBottom: "10px",
                          }}
                        >
                          <div
                            style={{
                              maxWidth: "60%",
                              padding: "10px 14px",
                              backgroundColor: isMine ? "#dcf8c6" : "#f1f0f0",
                              borderRadius: "16px",
                              textAlign: "left",
                            }}
                          >
                            <p style={{ margin: 0 }}>{msg.text}</p>
                            <div
                              style={{
                                fontSize: "0.7rem",
                                color: "#888",
                                textAlign: "right",
                                marginTop: "4px",
                              }}
                            >
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef}></div>
                  </>
                ) : (
                  <p>No messages yet.</p>
                )}
              </div>

              <div style={{ display: "flex", marginTop: "16px" }}>
                <input
                  type="text"
                  placeholder="Type a message"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    marginRight: "8px"
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "#4caf50",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer"
                  }}
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <p>Select a chat to start messaging</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chats;
