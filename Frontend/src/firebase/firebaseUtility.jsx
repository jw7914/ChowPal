import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseconfig";

export const getFirebaseUser = () => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setLoggedIn(true);
        setUser(currentUser);
      } else {
        setLoggedIn(false);
        setUser(null);
      }
    });
    return () => unsub();
  }, []);

  return { user, isLoggedIn };
};
