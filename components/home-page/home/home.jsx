import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Easing, TouchableWithoutFeedback, Dimensions, Modal, Image, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../../config/firebase/firebase-config';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import Cookies from 'js-cookie';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Map from '../map/map';
import Sidebar from '../sidebar-animation/sidebar';
import SettingsModal from '../sidebar-options/settings/settings';
import { useUser } from '../../../context-components/user-context';
import styles from './home.style';
import ChangePasswordModal from '../sidebar-options/change-password/change-password';
import ChangeUsernameModal from '../sidebar-options/change-username/change-username';
import DeleteAccountModal from '../sidebar-options/delete-account/delete-account';
import AccountDetailsSidebar from '../account-details-animation/account-details';
import BottomNavbar from '../bottom-navbar/bottom-navbar';

const HomePage = () => {
  const navigation = useNavigation();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [accountDetailsVisible, setAccountDetailsVisible] = useState(false);
  const [favoriteCity, setFavoriteCity] = useState('');
  const [favoriteCityLocation, setFavoriteCityLocation] = useState({ lat: 40.7128, lng: -74.0060 }); // default to New York City coordinates
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [changeUsernameModalVisible, setChangeUsernameModalVisible] = useState(false);
  const [deleteAccountModalVisible, setDeleteAcconuntModalVisible] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-250)).current;
  const accountSidebarAnim = useRef(new Animated.Value(-350)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const menuAnim = useRef(new Animated.Value(0)).current;
  const { userData, setUserData } = useUser();

  const toggleSettingsModal = () => {
    if (!settingsModalVisible) {
      animateModalOpen();
    } else {
      animateModalClose(() => setSettingsModalVisible(false));
    }
    setSettingsModalVisible(!settingsModalVisible);
  };

  const toggleChangePasswordModalVisible = () => {
    if (!changePasswordModalVisible) {
      animateModalOpen();
    } else {
      animateModalClose(() => setChangePasswordModalVisible(false));
    }
    setChangePasswordModalVisible(!changePasswordModalVisible);
  };

  const toggleChangeUsernameModalVisible = () => {
    if (!changeUsernameModalVisible) {
      animateModalOpen();
    } else {
      animateModalClose(() => setChangeUsernameModalVisible(false));
    }
    setChangeUsernameModalVisible(!changeUsernameModalVisible);
  };

  const toggleDeleteAccountModalVisible = () => {
    if (!deleteAccountModalVisible) {
      animateModalOpen();
    } else {
      animateModalClose(() => setDeleteAcconuntModalVisible(false));
    }
    setDeleteAcconuntModalVisible(!deleteAccountModalVisible);
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
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(sidebarAnim, {
        toValue: isOpening ? 0 : -250,
        duration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();

      Animated.timing(overlayAnim, {
        toValue: isOpening ? 1 : 0,
        duration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    }

    setSidebarVisible(isOpening);
  };

  const toggleAccountDetails = () => {
    const isOpening = !accountDetailsVisible;
    const duration = isOpening ? 300 : 200;
  
    Animated.timing(accountSidebarAnim, {
      toValue: isOpening ? 0 : -350,
      duration,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  
    Animated.timing(overlayAnim, {
      toValue: isOpening ? 1 : 0,
      duration,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  
    setAccountDetailsVisible(isOpening);
  };

  // animation for menu options modals

  const animateModalOpen = () => {
    Animated.parallel([
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const animateModalClose = (onClose) => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleLogout = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      if (Platform.OS === 'web') {
        Cookies.remove(`linkedAccount_${currentUser.uid}_refreshToken`);
        Cookies.remove(`linkedAccount_${currentUser.uid}_idToken`);
      } else {
        await AsyncStorage.removeItem(`linkedAccount_${currentUser.uid}_refreshToken`);
        await AsyncStorage.removeItem(`linkedAccount_${currentUser.uid}_idToken`);
      }
      auth.signOut();
    }
  };
  

  // handle menu item selection based on authenticated user or guest
  const getMenuItems = () => {
    const user = auth.currentUser;
  
    if (user && user.isAnonymous) {
      return [
        { label: 'Settings', action: toggleSettingsModal },
        { label: 'Sign In', action: handleLogout },
      ];
    } else if (user) {
      return [
        { label: 'Settings', action: toggleSettingsModal },
        { label: 'Change Password', action: toggleChangePasswordModalVisible },
        { label: 'Change Username', action: toggleChangeUsernameModalVisible },
        { label: 'Delete Account', action: toggleDeleteAccountModalVisible },
        { label: 'Logout', action: handleLogout },
      ];
    };
  }

  return (
    <View style={styles.container}>
      <Sidebar
        sidebarAnim={sidebarAnim}
        menuAnim={menuAnim}
        overlayAnim={overlayAnim}
        sidebarVisible={sidebarVisible}
        toggleSidebar={toggleSidebar}
        menuItems={getMenuItems}
      />

      <AccountDetailsSidebar
        sidebarAnim={accountSidebarAnim}
        overlayAnim={overlayAnim}
        sidebarVisible={accountDetailsVisible}
        toggleSidebar={toggleAccountDetails}
      />

      {!isMobile && sidebarVisible && (
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} />
      )}

        <View style={styles.mapContainer}>
          <Map city={userData ? userData.favoriteCity : 'New York'} toggleSidebar={toggleSidebar} />
        </View>

        <BottomNavbar onAccountPress={toggleAccountDetails}/>
      
      <SettingsModal
        isVisible={settingsModalVisible}
        onClose={toggleSettingsModal}
        onCitySelect={handleCitySelect}
      />
      <ChangePasswordModal
        isVisible={changePasswordModalVisible}
        onClose={toggleChangePasswordModalVisible}
      />
      <ChangeUsernameModal 
        isVisible={changeUsernameModalVisible}
        onClose={toggleChangeUsernameModalVisible}
      />
      <DeleteAccountModal 
        isVisible={deleteAccountModalVisible}
        onClose={toggleDeleteAccountModalVisible}
      />
    </View>
  );
};

export default HomePage;