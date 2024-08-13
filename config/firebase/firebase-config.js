import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAQmYkX-XBTxGpAvMZ9yYtvMPzg86GQkxA",
  authDomain: "pothole-detection-1d63b.firebaseapp.com",
  projectId: "pothole-detection-1d63b",
  storageBucket: "pothole-detection-1d63b.appspot.com",
  messagingSenderId: "240153903599",
  appId: "1:240153903599:web:8885fe87f2a8b2f3d1b61a",
  measurementId: "G-HSLCHKK1C9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleAuth = new GoogleAuthProvider();