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

  // Set up navigation options and side menu toggle
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable onPress={toggleSidebar} style={{ paddingLeft: 20 }}>
          <Icon name="menu" size={24} color="#fff" />
        </Pressable>
      ),
      headerTitle: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 20, marginLeft: 20 }}>RoadGuard</Text>
        </View>
      ),
      headerStyle: {
        backgroundColor: 'blue',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    });
  }, [navigation, sidebarVisible]);

  // Monitor authentication state and fetch user data
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

  // Fetch user data from Firestore
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
          setFavoriteCityLocation({ lat: 40.7128, lng: -74.0060 }); // Default to New York City
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Fetch city coordinates using serverless function
  const fetchCoordinates = async (city) => {
    try {
      const response = await fetch(`https://road-guard.netlify.app/.netlify/functions/get_fav_city_coordinates?city=${encodeURIComponent(city)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Received data:', data);
      if (data.lat && data.lng) {
        setFavoriteCityLocation({ lat: data.lat, lng: data.lng });
      } else {
        throw new Error('Location data is incomplete.');
      }
    } catch (error) {
      console.error('Error fetching location:', error);
    }
  };

  // Handle city selection
  const handleCitySelect = async (city) => {
    setFavoriteCity(city);
    // Call the serverless function to fetch coordinates
    await fetchCoordinates(city);

    // Update Firestore with the new city
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

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    const isOpening = !sidebarVisible;
    const duration = isOpening ? 300 : 200;

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

  // Handle user logout
  const handleLogout = async () => {
    await auth.signOut();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  // Handle menu item selection
  const handleMenuItemPress = (item) => {
    switch (item) {
      case 'Settings':
        Alert.alert('Settings clicked');
        break;
      case 'Change Password':
        Alert.alert('Change Password clicked');
        break;
      case 'Change Username':
        Alert.alert('Change Username clicked');
        break;
      case 'Delete Account':
        Alert.alert('Delete Account clicked');
        break;
      case 'Logout':
        handleLogout();
        break;
      default:
        break;
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
        <Map city={favoriteCity} />
      </View>
    </View>
  );
};

export default HomePage;
