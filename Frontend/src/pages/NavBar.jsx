import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirebaseUser } from "../firebase/firebaseUtility";
import { getUserDetails } from "../firebase/firestoreFunctions";
import { GiForkKnifeSpoon } from "react-icons/gi";
import { IoPersonSharp } from "react-icons/io5";
import { IoIosChatboxes } from "react-icons/io";
import { MdExitToApp, MdTableBar } from "react-icons/md";
import { FaHome } from "react-icons/fa";
import "./NavBar.css";

const NavBar = () => {
  const navigate = useNavigate();
  const { user } = getFirebaseUser();
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (user) {
        try {
          const details = await getUserDetails(user.accessToken);
          setUserDetails(details);
        } catch (error) {
          console.error("Error fetching user details:", error);
        }
      }
    };
    fetchUserDetails();
  }, [user]);

  return (
    <div className="right-navbar">
      <div className="nav-item" title="Home" onClick={() => navigate("/home")}>
        <FaHome />
      </div>

      {userDetails?.accountType === "user" && (
        <>
          <div className="nav-item" title="Chat" onClick={() => navigate("/chats")}>
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

      {userDetails?.accountType === "restaurant" && userDetails?.claimed && (
        <div className="nav-item" title="Restaurant Profile" onClick={() => navigate("/restaurant-edit")}>
          <MdTableBar />
        </div>
      )}

      <div style={{ position: "absolute", left: "8px", bottom: "10px", width: "100%", textAlign: "center" }}>
        <div className="nav-item" title="Logout" onClick={() => navigate("/logout")}>
          <MdExitToApp size={24} />
        </div>
      </div>
    </div>
  );
};

export default NavBar;
