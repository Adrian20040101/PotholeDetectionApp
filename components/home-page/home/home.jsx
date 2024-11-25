import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Easing, TouchableWithoutFeedback, Dimensions, Modal, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../../config/firebase/firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import Map from '../map/map';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import DesktopSidebar from '../sidebar-animation/desktop-animation';
import MobileSidebar from '../sidebar-animation/mobile-animation';
import ImageUpload from '../upload-photo/upload-photo';
import SettingsModal from '../sidebar-options/settings/settings';
import ThemeToggle from '../sidebar-options/settings/theme/theme-toggle';
import { useTheme } from '../sidebar-options/settings/theme/theme-context';
import { lightTheme, darkTheme } from '../sidebar-options/settings/theme/theme';
import { themeStyle } from '../sidebar-options/settings/theme/theme.style';
import { useUser } from '../../../context-components/user-context';
import styles from './home.style';
import ChangePasswordModal from '../sidebar-options/change-password/change-password';
import ChangeUsernameModal from '../sidebar-options/change-username/change-username';
import DeleteAccountModal from '../sidebar-options/delete-account/delete-account';
import AccountDetailsSidebarMobile from '../account-details-animation/mobile-animation';
import AccountDetailsSidebarPC from '../account-details-animation/desktop-animation';
import BottomNavbar from '../bottom-navbar/bottom-navbar';

const HomePage = () => {
  const navigation = useNavigation();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [accountDetailsVisible, setAccountDetailsVisible] = useState(false);
  const [favoriteCity, setFavoriteCity] = useState('');
  const [favoriteCityLocation, setFavoriteCityLocation] = useState({ lat: 40.7128, lng: -74.0060 }); // default to New York City coordinates
  const [user, setUser] = useState(null);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [changeUsernameModalVisible, setChangeUsernameModalVisible] = useState(false);
  const [deleteAccountModalVisible, setDeleteAcconuntModalVisible] = useState(false);
  const { theme } = useTheme();
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  const currentStyles = themeStyle(currentTheme);
  const sidebarAnim = useRef(new Animated.Value(-250)).current;
  const accountSidebarAnim = useRef(new Animated.Value(-350)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const menuAnim = useRef(new Animated.Value(0)).current;
  const { userData } = useUser();

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

  // set up navigation options and side menu toggle
  // useEffect(() => {
  //   navigation.setOptions({
  //     headerLeft: () => (
  //       <Pressable onPress={toggleSidebar} style={{ paddingLeft: 20 }}>
  //         <Icon name="menu" size={24} color="#fff" />
  //       </Pressable>
  //     ),
  //     headerTitle: () => (
  //       <View style={{ flexDirection: 'row', alignItems: 'center' }}>
  //         <Text style={{ color: '#fff', fontSize: 20, marginLeft: 20 }}>RoadGuard</Text>
  //       </View>
  //     ),
  //     headerRight: () => (
  //       userData.profilePictureUrl && (
  //         <Pressable onPress={toggleAccountDetails} style={{ paddingRight: 20 }}>
  //           <Image
  //             source={{ uri: userData.profilePictureUrl }}
  //             style={styles.userProfilePicture}
  //           />
  //         </Pressable>
  //       )
  //     ),
  //     headerStyle: {
  //       backgroundColor: 'blue',
  //       position: 'absolute',
  //       top: 0,
  //       left: 0,
  //       right: 0,
  //       zIndex: 1000,
  //     },
  //     headerTintColor: '#fff',
  //     headerTitleStyle: {
  //       fontWeight: 'bold',
  //     },
  //   });
  // }, [navigation, sidebarVisible, userData.profilePictureUrl]);

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

  const toggleAccountDetails = () => {
    const isOpening = !accountDetailsVisible;
    const duration = isOpening ? 300 : 200;
  
    Animated.timing(accountSidebarAnim, {
      toValue: isOpening ? 0 : -350,
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

  const handleLogout = () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      Cookies.remove(`linkedAccount_${currentUser.uid}_refreshToken`);
      Cookies.remove(`linkedAccount_${currentUser.uid}_idToken`);
      auth.signOut();
    }
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
        { label: 'Change Password', action: toggleChangePasswordModalVisible },
        { label: 'Change Username', action: toggleChangeUsernameModalVisible },
        { label: 'Delete Account', action: toggleDeleteAccountModalVisible },
        { label: 'Logout', action: handleLogout },
      ];
    };
  }


  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
        <br />
        <Text>If nothing is being displayed, refresh the page</Text>
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
      
      {isMobile ? (
        <AccountDetailsSidebarMobile
          sidebarVisible={accountDetailsVisible}
          toggleSidebar={toggleAccountDetails}
        />
      ) : (
        <AccountDetailsSidebarPC
          sidebarAnim={accountSidebarAnim}
          overlayAnim={overlayAnim}
          sidebarVisible={accountDetailsVisible}
          toggleSidebar={toggleAccountDetails}
        />
      )}

      {!isMobile && sidebarVisible && (
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} />
      )}

      {/* <View style={[styles.content, sidebarVisible && !isMobile && styles.rightContentShift, accountDetailsVisible && !isMobile && styles.leftContentShift]}>
        {user.isAnonymous ? (
          <>
            <Text style={styles.welcomeText}>Welcome!</Text>
            <Text style={styles.cityText}>Sign in to experience all benefits</Text>
          </>
        ) : (
          <>
          <Text style={styles.welcomeText}>Welcome, {userData.username}!</Text>
          <Text style={styles.cityText}>Your favorite city is set to: {userData.favoriteCity}</Text>
          </>
        )} */}
        <View style={styles.mapContainer}>
          <Map city={userData.favoriteCity} toggleSidebar={toggleSidebar} />
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