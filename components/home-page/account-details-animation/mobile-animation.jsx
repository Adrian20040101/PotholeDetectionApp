import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Pressable, Animated, Easing, Dimensions, ScrollView, ActivityIndicator, Platform, Alert } from 'react-native';
import { useUser } from '../../../context-components/user-context';
import { getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth, db } from '../../../config/firebase/firebase-config';
import * as Google from 'expo-auth-session/providers/google';
import { getDoc, doc, setDoc, getDocs, collection, updateDoc, query, where, limit, orderBy, onSnapshot } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import Cookies from 'js-cookie';
import { MaterialIcons } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import styles from './mobile-animation.style';

const AccountDetailsSidebarMobile = ({ sidebarVisible, toggleSidebar }) => {
  const { userData, setUserData, isAnonymous } = useUser();
  const [latestPotholes, setLatestPotholes] = useState([]);
  const [loadingPotholes, setLoadingPotholes] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const [hasPermission, setHasPermission] = useState(null);
  const mobileSidebarAnim = useRef(new Animated.Value(screenWidth)).current;
  const [isCollapsed, setIsCollapsed] = useState(true);
  const animation = useRef(new Animated.Value(0)).current;
  const [isRendered, setIsRendered] = useState(sidebarVisible);
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const firebaseAuth = getAuth();
  const [currentDisplayedAccountUid, setCurrentDisplayedAccountUid] = useState(firebaseAuth.currentUser?.uid || null);
  const firebaseApiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;

  const badgeImages = {
    bronze: require('../../../assets/images/bronze.png'),
    silver: require('../../../assets/images/silver.png'),
    gold: require('../../../assets/images/gold.png'),
    diamond: require('../../../assets/images/diamond.png'),
    emerald: require('../../../assets/images/emerald.png'),
    platinum: require('../../../assets/images/platinum.png'),
  };

  const calculateBadge = (contributions) => {
    const thresholds = {
      Bronze: 5,
      Silver: 10,
      Gold: 20,
      Diamond: 50,
      Emerald: 100,
      Platinum: 250,
    };
    let badge = null;
    for (const [key, threshold] of Object.entries(thresholds)) {
      if (contributions >= threshold) {
        badge = key.toLowerCase();
      }
    }
    return badge;
  };

  const badgeImage = userData ? badgeImages[calculateBadge(userData.contributions)] : null;

  const fetchLocation = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://road-guard.netlify.app/.netlify/functions/reverse_geocoding?lat=${latitude}&lng=${longitude}`
      );
      const data = await response.json();

      if (response.ok) {
        return `${data.county || 'Unknown County'}, ${data.region || 'Unknown Region'}`;
      } else {
        console.error('Error fetching location:', data.message);
        return 'Unknown Location';
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      return 'Unknown Location';
    }
  };

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    redirectUri: AuthSession.makeRedirectUri({
      scheme: 'potholedetection',
    }),
    scopes: ['profile', 'email'],
    prompt: 'select_account',
  });

  function showSuccessToast(message) {
    Toast.show({
      type: 'success',
      text1: message,
    });
  }
  function showErrorToast(message) {
    Toast.show({
      type: 'error',
      text1: message,
    });
  }

  async function setIdToken(accountUid, idTokenValue) {
    if (Platform.OS === 'web') {
      Cookies.set(`linkedAccount_${accountUid}_idToken`, idTokenValue, { expires: 7, secure: true });
    } else {
      await AsyncStorage.setItem(`linkedAccount_${accountUid}_idToken`, idTokenValue);
    }
  }
  async function setRefreshToken(accountUid, refreshTokenValue) {
    if (Platform.OS === 'web') {
      Cookies.set(`linkedAccount_${accountUid}_refreshToken`, refreshTokenValue, { expires: 7, secure: true });
    } else {
      await AsyncStorage.setItem(`linkedAccount_${accountUid}_refreshToken`, refreshTokenValue);
    }
  }
  async function getIdToken(accountUid) {
    if (Platform.OS === 'web') {
      return Cookies.get(`linkedAccount_${accountUid}_idToken`);
    } else {
      return await AsyncStorage.getItem(`linkedAccount_${accountUid}_idToken`);
    }
  }
  async function getRefreshToken(accountUid) {
    if (Platform.OS === 'web') {
      return Cookies.get(`linkedAccount_${accountUid}_refreshToken`);
    } else {
      return await AsyncStorage.getItem(`linkedAccount_${accountUid}_refreshToken`);
    }
  }
  async function removeIdAndRefreshTokens(accountUid) {
    if (Platform.OS === 'web') {
      Cookies.remove(`linkedAccount_${accountUid}_idToken`);
      Cookies.remove(`linkedAccount_${accountUid}_refreshToken`);
    } else {
      await AsyncStorage.removeItem(`linkedAccount_${accountUid}_idToken`);
      await AsyncStorage.removeItem(`linkedAccount_${accountUid}_refreshToken`);
    }
  }

  useEffect(() => {
    if (!currentDisplayedAccountUid) return;

    setLoadingPotholes(true);

    const potholesRef = collection(db, 'markers');
    const potholesQuery = query(
      potholesRef,
      where('userId', '==', currentDisplayedAccountUid),
      orderBy('timestamp', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(
      potholesQuery,
      async (snapshot) => {
        const potholesData = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const location = await fetchLocation(data.lat, data.lon);
            return {
              id: docSnap.id,
              ...data,
              location,
            };
          })
        );
        setLatestPotholes(potholesData);
        setLoadingPotholes(false);
      },
      (error) => {
        console.error('Error fetching potholes:', error);
        setLoadingPotholes(false);
      }
    );

    return () => unsubscribe();
  }, [currentDisplayedAccountUid]);

  const fetchUserData = async (uid) => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists() ? userDoc.data() : null;
  };

  const fetchLinkedAccounts = async () => {
    if (!userData.uid) return;
    const currentUser = firebaseAuth.currentUser;

    let allKeys = [];
    if (Platform.OS === 'web') {
      allKeys = Object.keys(Cookies.get());
    } else {
      allKeys = await AsyncStorage.getAllKeys();
    }

    const linkedAccountsUIDs = allKeys
      .filter((key) => key.startsWith('linkedAccount_') && !key.includes(currentUser.uid))
      .map((key) => {
        const match = key.match(/linkedAccount_(.*?)_idToken/);
        return match ? match[1] : null;
      })
      .filter((uid) => uid !== null);

    console.log('Linked Accounts UIDs:', linkedAccountsUIDs);

    const linkedAccountsData = await Promise.all(
      linkedAccountsUIDs.map(async (uid) => {
        const userData = await fetchUserData(uid);
        if (userData) {
          return { uid, ...userData };
        }
        return null;
      })
    );

    const validLinkedAccounts = linkedAccountsData.filter((account) => account !== null);
    setLinkedAccounts(validLinkedAccounts);
  };

  const handleSwitchAccount = async (accountUid) => {
    try {
      let idToken = await getIdToken(accountUid);
      let refreshToken = await getRefreshToken(accountUid);

      if (!idToken || !refreshToken) {
        return await reauthenticateUser(accountUid);
      }

      try {
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);

        const newUserData = await fetchUserData(accountUid);
        setUserData(newUserData);
        setCurrentDisplayedAccountUid(accountUid);

        await fetchLinkedAccounts();

        showSuccessToast('Switched account successfully!');
      } catch (error) {
        if (
          error.code === 'auth/invalid-credential' ||
          error.message.includes('Invalid id_token')
        ) {
          console.log('ID token is invalid or expired, refreshing token...');
          await refreshAuthToken(accountUid);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error switching account:', error.message);
      showErrorToast('Failed to switch account.');
    }
  };

  const refreshAuthToken = async (accountUid) => {
    const storedRefreshToken = await getRefreshToken(accountUid);
    if (!storedRefreshToken) {
      console.error('No refresh token available, reauthentication needed.');
      return await reauthenticateUser(accountUid);
    }

    try {
      const response = await fetch(
        `https://securetoken.googleapis.com/v1/token?key=${firebaseApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grant_type: 'refresh_token',
            refresh_token: storedRefreshToken,
          }),
        }
      );

      const data = await response.json();
      if (!data.id_token) {
        throw new Error('Failed to refresh token');
      }

      await setIdToken(accountUid, data.id_token);
      await setRefreshToken(accountUid, data.refresh_token);

      const credential = GoogleAuthProvider.credential(data.id_token);
      await signInWithCredential(auth, credential);

      console.log('Token refreshed and account switch successful.');
      showSuccessToast('Switched account after token refresh!');
    } catch (error) {
      console.error('Error refreshing auth token:', error);
      return await reauthenticateUser(accountUid);
    }
  };

  const reauthenticateUser = async (accountUid) => {
    console.log('Reauthenticating user...');
    const result = await promptAsync();
    if (result?.type === 'success') {
      const { id_token } = result.params;
      const credential = GoogleAuthProvider.credential(id_token);

      await signInWithCredential(auth, credential);

      const refreshedIdToken = id_token;
      const newRefreshToken = auth.currentUser.stsTokenManager.refreshToken;

      await setIdToken(accountUid, refreshedIdToken);
      await setRefreshToken(accountUid, newRefreshToken);

      console.log('Reauthentication successful');
    } else {
      throw new Error('Reauthentication failed');
    }
  };

  useEffect(() => {
    const updateLinkedAccounts = async () => {
      try {
        await fetchLinkedAccounts();
      } catch (error) {
        console.error('Error fetching linked accounts:', error);
      }
    };

    if (userData.uid) {
      updateLinkedAccounts();
    }

    updateLinkedAccounts();
  }, [userData.uid]);

  const handleAddAccount = async () => {
    try {
      const result = await promptAsync();
      if (result?.type === 'success') {
        const { id_token } = result.params;
        const credential = GoogleAuthProvider.credential(id_token);

        const userCredential = await signInWithCredential(auth, credential);
        const linkedUser = userCredential.user;

        await setIdToken(linkedUser.uid, id_token);
        await setRefreshToken(linkedUser.uid, linkedUser.stsTokenManager.refreshToken);

        showSuccessToast('Account added successfully!');
        await fetchLinkedAccounts();
      }
    } catch (error) {
      console.error('Error adding account:', error);
      showErrorToast('Failed to add account.');
    }
  };

  useEffect(() => {
    fetchLinkedAccounts();
  }, []);

  useEffect(() => {
    if (sidebarVisible) {
      setIsRendered(true);
      Animated.timing(mobileSidebarAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(mobileSidebarAnim, {
        toValue: screenWidth,
        duration: 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start(() => setIsRendered(false));
    }
  }, [sidebarVisible, screenWidth]);

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        showErrorToast(
          'We need access to your gallery to update your profile picture. Please enable it.'
        );
      }
    };
    requestPermissions();
  }, []);

  const selectFromGallery = async () => {
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'We do not have permission to access your gallery.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.uri || (result.assets && result.assets[0]?.uri);
      if (uri) {
        await uploadImageToFirebase(uri);
      } else {
        console.error('Error: Image URI is undefined');
      }
    }
  };

  const uploadImageToFirebase = async (uri) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        showErrorToast('No authenticated user found.');
        return;
      }

      const blob = await (await fetch(uri)).blob();
      const storage = getStorage();
      const storageRef = ref(storage, `profile_pictures/${user.uid}.jpg`);

      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      await updateDoc(doc(db, 'users', user.uid), {
        profilePictureUrl: downloadURL,
      });

      setUserData((prevData) => ({ ...prevData, profilePictureUrl: downloadURL }));
      showSuccessToast('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      showErrorToast('Error updating your profile picture. Please try again.');
    }
  };

  const toggleCollapse = () => {
    Animated.timing(animation, {
      toValue: isCollapsed ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setIsCollapsed(!isCollapsed);
    });
  };

  const handleLogout = async (accountUid) => {
    try {
      await removeIdAndRefreshTokens(accountUid);
      showSuccessToast('Account unlinked successfully.');
      await fetchLinkedAccounts();
    } catch (error) {
      console.error('Error unlinking account:', error);
      showErrorToast('Account could not be unlinked. Please try again.');
    }
  };

  const filteredLinkedAccounts = linkedAccounts.filter(
    (account) => account.uid !== currentDisplayedAccountUid
  );

  const animatedHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, filteredLinkedAccounts.length > 3 ? 180 : filteredLinkedAccounts.length * 70],
  });

  const animatedOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  if (!isRendered) {
    return null;
  }

  return (
    <Animated.View style={[styles.mobileSidebar, { left: mobileSidebarAnim }]}>
      <Pressable onPress={toggleSidebar} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={24} color="#fff" />
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        indicatorStyle="white"
      >
        <Text style={styles.manageAccountText}>Manage Account</Text>
        <View style={styles.profilePictureContainer}>
          <Image
            source={{ uri: userData?.profilePictureUrl }}
            style={styles.profilePicture}
          />
          {!isAnonymous && (
            <Pressable style={styles.editButton} onPress={selectFromGallery}>
        <MaterialIcons name="edit" size={20} color="#fff" />
        </Pressable>
          )}
        </View>

        <View style={styles.nameAndBadgeContainer}>
          <Text style={styles.username}>
            {userData && userData.username ? userData.username : 'Anonymous User'}
          </Text>
          {badgeImage && (
            <Image source={badgeImage} style={styles.badge} resizeMode="contain" />
          )}
        </View>

        <Text style={styles.email}>
          {userData && userData.email ? userData.email : 'Sign in for full functionality'}
        </Text>

        <View style={styles.linkedAccountsContainer}>
          <View style={styles.linkedAccountsHeader}>
            <Text style={styles.linkedAccountsText}>Linked Accounts</Text>
            <Pressable onPress={toggleCollapse}>
              <MaterialIcons
                name={isCollapsed ? 'expand-more' : 'expand-less'}
                size={24}
                color="#fff"
              />
            </Pressable>
          </View>

          {linkedAccounts.length === 0 ? (
            <View style={styles.noLinkedAccountsContainer}>
              <Text style={styles.noLinkedAccountsText}>
                No linked accounts found. Click below to add one.
              </Text>
            </View>
          ) : (
            <Animated.View
              style={{
                height: animatedHeight,
                opacity: animatedOpacity,
                overflow: 'hidden',
              }}
            >
              {linkedAccounts.length <= 3 ? (
                <View style={styles.nonScrollableAccountsContainer}>
                  {filteredLinkedAccounts.map((account, index) => (
                    <Pressable
                      key={index}
                      onPress={() => handleSwitchAccount(account.uid)}
                      style={styles.accountBox}
                    >
                      <Image
                        source={{ uri: account.profilePictureUrl }}
                        style={styles.accountProfilePicture}
                      />
                      <View style={styles.accountInfo}>
                        <Text style={styles.accountUsername}>{account.username}</Text>
                        <Text style={styles.accountEmail}>{account.email}</Text>
                      </View>
                      <Pressable onPress={() => handleLogout(account.uid)}>
                        <MaterialIcons name="logout" size={24} color="#fff" />
                      </Pressable>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <ScrollView
                  contentContainerStyle={styles.scrollViewContent}
                  style={styles.accountBoxesScrollView}
                  showsVerticalScrollIndicator={false}
                  indicatorStyle="white"
                >
                  {filteredLinkedAccounts.map((account, index) => (
                    <Pressable
                      key={index}
                      onPress={() => handleSwitchAccount(account.uid)}
                      style={styles.accountBox}
                    >
                      <Image
                        source={{ uri: account.profilePictureUrl }}
                        style={styles.accountProfilePicture}
                      />
                      <View style={styles.accountInfo}>
                        <Text style={styles.accountUsername}>{account.username}</Text>
                        <Text style={styles.accountEmail}>{account.email}</Text>
                      </View>
                      <Pressable onPress={() => handleLogout(account.uid)}>
                        <MaterialIcons name="logout" size={24} color="#fff" />
                      </Pressable>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </Animated.View>
          )}

          {isCollapsed && (
            <View style={styles.collapsedAccountsContainer}>
              {filteredLinkedAccounts.slice(0, 3).map((account, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleSwitchAccount(account.uid)}
                >
                  <Image
                    source={{ uri: account.profilePictureUrl }}
                    style={styles.collapsedAccountProfilePicture}
                  />
                </Pressable>
              ))}
              {linkedAccounts.length > 3 && (
                <Text style={styles.collapsedAccountText}>
                  +{linkedAccounts.length - 3}
                </Text>
              )}
            </View>
          )}

          <Pressable style={styles.addAccountButton} onPress={handleAddAccount}>
            <MaterialIcons name="add" size={20} color="#fff" />
            <Text style={styles.addAccountText}>Add another account</Text>
          </Pressable>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Statistics</Text>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Joined:</Text>
            <Text style={styles.statValue}>
              {!isAnonymous
                ? userData?.joinDate?.toDate()?.toLocaleDateString()
                : 'N/A'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Contributions:</Text>
            <Text style={styles.statValue}>
              {!isAnonymous ? userData?.contributions : 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.reportedPotholesContainer}>
          <Text style={styles.reportedPotholesTitle}>Latest Reported Potholes</Text>
          {loadingPotholes ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.potholeScroll}
            >
              {latestPotholes.length > 0 ? (
                latestPotholes.map((pothole) => (
                  <View key={pothole.id} style={styles.potholeCard}>
                    <Image
                      source={{ uri: pothole.imageUrl }}
                      style={styles.potholeImage}
                    />
                    <Text style={styles.potholeStatus}>Status: {pothole.status}</Text>
                    <Text style={styles.potholeTimestamp}>
                      Reported on:{' '}
                      {new Date(pothole.timestamp.toDate()).toLocaleDateString()}
                    </Text>
                    <Text style={styles.potholeLocation}>
                      Located in: {pothole.location}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noPotholesText}>
                  {isAnonymous
                    ? 'Sign in to record latest pothole reports.'
                    : 'You have not reported any potholes yet.'}
                </Text>
              )}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </Animated.View>
  );
};

export default AccountDetailsSidebarMobile;
