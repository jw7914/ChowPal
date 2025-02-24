import React, { useEffect, useState } from "react";
import { Container, Typography, Box } from "@mui/material";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

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
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome, {userName}
        </Typography>
      </Box>
    </Container>
  );
};

export default HomePage;
