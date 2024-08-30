import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase/firebase-config';
import { doc, onSnapshot } from 'firebase/firestore';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState({
    profilePictureUrl: '',
    username: '',
    email: '',
    favoriteCity: '',
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);

      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserData({
            profilePictureUrl: docSnap.data().profilePictureUrl || 'https://t3.ftcdn.net/jpg/05/87/76/66/360_F_587766653_PkBNyGx7mQh9l1XXPtCAq1lBgOsLl6xH.jpg',
            username: docSnap.data().username || '',
            email: docSnap.data().email || '',
            favoriteCity: docSnap.data().favoriteCity || '',
          });
        } else {
          console.log('No such document!');
          setUserData({
            profilePictureUrl: 'https://t3.ftcdn.net/jpg/05/87/76/66/360_F_587766653_PkBNyGx7mQh9l1XXPtCAq1lBgOsLl6xH.jpg',
            username: '',
            email: '',
            favoriteCity: '',
          });
        }
      });

      return () => unsubscribe();
    } else {
      setUserData({
        profilePictureUrl: 'https://t3.ftcdn.net/jpg/05/87/76/66/360_F_587766653_PkBNyGx7mQh9l1XXPtCAq1lBgOsLl6xH.jpg',
        username: '',
        email: '',
        favoriteCity: '',
      });
    }
  }, []);

  return (
    <UserContext.Provider value={{ userData, setUserData }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
