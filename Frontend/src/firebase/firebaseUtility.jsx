import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseconfig";

export const getFirebaseUser = () => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true); // <-- add loading

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoggedIn(true);
      } else {
        setUser(null);
        setLoggedIn(false);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { user, isLoggedIn, loading };
};
