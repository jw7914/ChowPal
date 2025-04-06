import React, { useState, useEffect } from "react";
import { getFirebaseUser } from "../firebase/firebaseUtility";
import { getUserDetails } from "../firebase/firestoreFunctions";

function TestImage() {
  const { user, isLoggedIn } = getFirebaseUser();
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    const fetchUserName = async () => {
      if (user) {
        try {
          const details = await getUserDetails(user.accessToken);
          setUserDetails(details);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };
    fetchUserName();
  }, [user]);

  // Render the photo URLs if available
  return (
    <div>
      {userDetails ? (
        <div>
          <h3>User Details</h3>
          {userDetails.photos && userDetails.photos.length > 0 ? (
            <div>
              {userDetails.photos.map((photoUrl, index) => (
                <img
                  key={index}
                  src={photoUrl}
                  alt={`User Photo ${index + 1}`}
                  style={{ width: "200px", margin: "10px" }}
                />
              ))}
            </div>
          ) : (
            <p>No photos available.</p>
          )}
        </div>
      ) : (
        <p>Loading user details...</p>
      )}
    </div>
  );
}

export default TestImage;
