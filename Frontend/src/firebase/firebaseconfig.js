import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API,
  authDomain: import.meta.env.VITE_AUTH,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID,
};

// Initialize Firebase
const firebaseapp = initializeApp(firebaseConfig);

// Initialize authentication
const auth = getAuth(firebaseapp);

// If you're using analytics, initialize it like this:
// const analytics = getAnalytics(firebaseapp);

// Export as named exports
export { firebaseapp, auth };
