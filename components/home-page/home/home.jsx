import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Easing, TouchableWithoutFeedback } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../../config/firebase/firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import CitySelection from '../city-selection/city';
import Map from '../map/map';
import styles from './home.style';

const HomePage = () => {
  const navigation = useNavigation();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [favoriteCity, setFavoriteCity] = useState('');
  const [favoriteCityLocation, setFavoriteCityLocation] = useState({ lat: 40.7128, lng: -74.0060 }); // default to New York City coordinates
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({});
  const sidebarAnim = useRef(new Animated.Value(-250)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // function to fetch user data from Firestore
  const fetchUserData = async (uid) => {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserData(userData);
        setFavoriteCity(userData.favoriteCity || 'New York');
        if (userData.favoriteCity) {
          fetchCoordinates(userData.favoriteCity);
        } else {
          setFavoriteCityLocation({ lat: 40.7128, lng: -74.0060 });
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // function to fetch coordinates using serverless function
  const fetchCoordinates = async (city) => {
    try {
      const response = await fetch(`https://road-guard.netlify.app/.netlify/functions/get_fav_city_coordinates`);
      const data = await response.json();
      if (response.ok) {
        setFavoriteCityLocation({ lat: data.lat, lng: data.lng });
      } else {
        console.error('Error fetching location:', data.message);
      }
    } catch (error) {
      console.error('Error fetching location:', error);
    }
  };

  // useEffect to check authentication state and fetch user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchUserData(currentUser.uid);
      } else {
        setUser(null);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        });
      }
    });

    return () => unsubscribe();
  }, [navigation]);

  // sidebar toggle function
  const toggleSidebar = () => {
    const isOpening = !sidebarVisible;
    const duration = 300;

    Animated.timing(sidebarAnim, {
      toValue: sidebarVisible ? -250 : 0,
      duration,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();

    Animated.timing(overlayAnim, {
      toValue: isOpening ? 1 : 0,
      duration,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();

    setSidebarVisible(isOpening);
  };

  // handle city selection
  const handleCitySelect = async (city) => {
    setFavoriteCity(city);
    // call the serverless function to fetch coordinates
    fetchCoordinates(city);

    // update Firestore with the new city
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      try {
        await setDoc(userDocRef, { favoriteCity: city }, { merge: true });
      } catch (error) {
        console.error("Error updating favorite city:", error);
      }
    } else {
      console.error("User is undefined. Cannot update favorite city.");
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {sidebarVisible && (
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
          <TouchableWithoutFeedback onPress={toggleSidebar}>
            <View style={{ flex: 1 }} />
          </TouchableWithoutFeedback>
        </Animated.View>
      )}
      <Animated.View style={[styles.sidebar, { left: sidebarAnim }]}>
        {['Settings', 'Change Password', 'Change Username', 'Delete Account', 'Logout'].map((item) => (
          <Pressable key={item} onPress={() => handleMenuItemPress(item)}>
            <Text style={styles.menuItem}>{item}</Text>
          </Pressable>
        ))}
      </Animated.View>
      <View style={[styles.content, sidebarVisible && styles.contentShift]}>
        <Text style={styles.welcomeText}>Welcome, {userData.username}!</Text>
        <Text style={styles.cityText}>Your favorite city is: {favoriteCity}</Text>
        <CitySelection onCitySelect={handleCitySelect} />
        <Map favoriteCityLocation={favoriteCityLocation} />
      </View>
    </View>
  );
};

export default HomePage;
