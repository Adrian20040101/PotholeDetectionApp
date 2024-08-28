import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Easing, TouchableWithoutFeedback, Dimensions, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../../config/firebase/firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import Map from '../map/map';
import DesktopSidebar from '../sidebar-animation/desktop-animation';
import MobileSidebar from '../sidebar-animation/mobile-animation';
import ImageUpload from '../upload-photo/upload-photo';
import SettingsModal from '../sidebar-options/settings/settings';
import ThemeToggle from '../sidebar-options/settings/theme/theme-toggle';
import { useTheme } from '../sidebar-options/settings/theme/theme-context';
import { lightTheme, darkTheme } from '../sidebar-options/settings/theme/theme';
import { themeStyle } from '../sidebar-options/settings/theme/theme.style';
import styles from './home.style';

const HomePage = () => {
  const navigation = useNavigation();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [favoriteCity, setFavoriteCity] = useState('');
  const [favoriteCityLocation, setFavoriteCityLocation] = useState({ lat: 40.7128, lng: -74.0060 }); // default to New York City coordinates
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({});
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const { theme } = useTheme();
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  const currentStyles = themeStyle(currentTheme);
  const sidebarAnim = useRef(new Animated.Value(-250)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const menuAnim = useRef(new Animated.Value(0)).current;

  const toggleSettingsModal = () => {
    console.log('Toggling settings modal:', !settingsModalVisible);
    setSettingsModalVisible(!settingsModalVisible);
  };

  useEffect(() => {
    const updateDimensions = () => {
      const { width } = Dimensions.get('window');
      setIsMobile(width < 800);
    };

    updateDimensions();
    Dimensions.addEventListener('change', updateDimensions);
    return () => {
      Dimensions.removeEventListener('change', updateDimensions);
    };
  }, []);

  // set up navigation options and side menu toggle
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
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    });
  }, [navigation, sidebarVisible]);

  // monitor authentication state and fetch user data
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

  // fetch user data from Firestore
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

  // fetch city coordinates using serverless function
  const fetchCoordinates = async (city) => {
    try {
      const response = await fetch(`https://road-guard.netlify.app/.netlify/functions/city_coordinates?city=${encodeURIComponent(city)}`);
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

  // handle city selection
  const handleCitySelect = async (city) => {
    setFavoriteCity(city);
    // call the serverless function to fetch coordinates
    await fetchCoordinates(city);

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

  // toggle sidebar visibility
  const toggleSidebar = () => {
    const isOpening = !sidebarVisible;

    const duration = isOpening ? 300 : 200;

    if (isMobile) {
      Animated.timing(menuAnim, {
        toValue: isOpening ? 1 : 0,
        duration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(sidebarAnim, {
        toValue: isOpening ? 0 : -250,
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
    }

    setSidebarVisible(isOpening);
  };

  // handle user logout
  const handleLogout = async () => {
    await auth.signOut();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  // handle menu item selection based on authenticated user or guest
  const getMenuItems = () => {
    const user = auth.currentUser;
  
    if (user && user.isAnonymous) {
      return [
        { label: 'Settings', action: toggleSettingsModal },
        { label: 'Sign In', action: () => navigation.navigate('Welcome') },
      ];
    } else if (user) {
      return [
        { label: 'Settings', action: toggleSettingsModal },
        { label: 'Change Password', action: () => toast.success('Change Password Clicked') },
        { label: 'Change Username', action: () => toast.success('Change Username Clicked') },
        { label: 'Delete Account', action: () => toast.success('Delete Account Clicked') },
        { label: 'Logout', action: handleLogout },
      ];
    };
  }


  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isMobile ? (
        <MobileSidebar
          menuAnim={menuAnim}
          sidebarVisible={sidebarVisible}
          toggleSidebar={toggleSidebar}
          menuItems={getMenuItems}
        />
      ) : (
        <DesktopSidebar
          sidebarAnim={sidebarAnim}
          overlayAnim={overlayAnim}
          sidebarVisible={sidebarVisible}
          toggleSidebar={toggleSidebar}
          menuItems={getMenuItems}
        />
      )}
      <View style={[styles.content, sidebarVisible && !isMobile && styles.contentShift]}>
        {user.isAnonymous ? (
          <>
            <Text style={styles.welcomeText}>Welcome!</Text>
            <Text style={styles.cityText}>Sign in to experience all benefits</Text>
          </>
        ) : (
          <>
          <Text style={styles.welcomeText}>Welcome, {userData.username}!</Text>
          <Text style={styles.cityText}>Your favorite city is set to: {favoriteCity}</Text>
          </>
        )}
        <Map city={favoriteCity} />
        <ImageUpload />
      </View>
      <SettingsModal
        isVisible={settingsModalVisible}
        onClose={toggleSettingsModal}
        onCitySelect={handleCitySelect}
      />
    </View>
  );
};

export default HomePage;