import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase/firebase-config';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { View, Text } from 'react-native';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const defaultProfilePicture = 'https://t3.ftcdn.net/jpg/05/87/76/66/360_F_587766653_PkBNyGx7mQh9l1XXPtCAq1lBgOsLl6xH.jpg';
  const [userData, setUserData] = useState({
    uid: null,
    profilePictureUrl: defaultProfilePicture,
    username: '',
    email: '',
    favoriteCity: 'New York',
    contributions: 0,
    joinDate: 'N/A'
  });
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user && !user.isAnonymous) {
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            console.log('User document exists:', docSnap.data());
            setUserData({
              uid: user.uid,
              profilePictureUrl: docSnap.data().profilePictureUrl || defaultProfilePicture,
              username: docSnap.data().username || '',
              email: docSnap.data().email || '',
              favoriteCity: docSnap.data().favoriteCity || 'New York',
              contributions: docSnap.data().contributions || 0,
              joinDate: docSnap.data().joinDate || 'N/A'
            });
          } else {
            console.log('No such document!');
            setUserData({
              uid: user.uid,
              profilePictureUrl: defaultProfilePicture,
              username: '',
              email: '',
              favoriteCity: 'New York',
              contributions: 0,
              joinDate: 'N/A'
            });
          }
          setIsAnonymous(false);
          setLoading(false);
        });

        return () => unsubscribeUser();
      } else if (user && user.isAnonymous) {
        console.log('User is anonymous:', user);
        setUserData({
          uid: user.uid,
          profilePictureUrl: defaultProfilePicture,
          username: '',
          email: '',
          favoriteCity: 'New York',
          contributions: 0,
          joinDate: 'N/A'
        });
        setIsAnonymous(true);
        setLoading(false);
      } else {
        console.log('No user is logged in');
        setUserData({
          uid: null,
          profilePictureUrl: defaultProfilePicture,
          username: '',
          email: '',
          favoriteCity: 'New York',
          contributions: 0,
          joinDate: 'N/A'
        });
        setIsAnonymous(false);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <UserContext.Provider value={{ userData, setUserData, isAnonymous }}>
      {children}
    </UserContext.Provider>
  );
};

const styles = {
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
};

export const useUser = () => useContext(UserContext);
