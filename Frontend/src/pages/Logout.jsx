import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { firebaseapp } from "../firebase/firebaseconfig";

const Logout = () => {
  const navigate = useNavigate();
  const auth = getAuth(firebaseapp);

  useEffect(() => {
    const doLogout = async () => {
      try {
        await signOut(auth);
        navigate("/");
      } catch (error) {
        console.error("Logout Error:", error.message);
      }
    };

    doLogout();
  }, [auth, navigate]);

  return null; // No UI to render
};

export default Logout;
