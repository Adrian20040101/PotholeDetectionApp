import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, Pressable, Animated, Easing, TouchableWithoutFeedback, ScrollView, ActivityIndicator } from 'react-native';
import { auth, db } from '../../../config/firebase/firebase-config';
import { getAuth, GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { getDoc, doc, setDoc, getDocs, collection, updateDoc, query, where, limit, orderBy, onSnapshot } from 'firebase/firestore';
import * as Google from 'expo-auth-session/providers/google';
import { getStorage, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import * as AuthSession from 'expo-auth-session';
import Cookies from 'js-cookie';
import { useUser } from '../../../context-components/user-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { toast } from 'react-toastify';
import styles from './desktop-animation.style';

const AccountDetailsSidebar = ({ sidebarAnim, overlayAnim, sidebarVisible, toggleSidebar }) => {
  const [shouldRender, setShouldRender] = useState(sidebarVisible);
  const { userData, setUserData } = useUser();
  const [latestPotholes, setLatestPotholes] = useState([]);
  const [loadingPotholes, setLoadingPotholes] = useState(false); 
  const [hasPermission, setHasPermission] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const animation = useRef(new Animated.Value(0)).current;
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const auth = getAuth();
  const [currentDisplayedAccountUid, setCurrentDisplayedAccountUid] = useState(auth.currentUser.uid);
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
    clientId: '280319253024-a79cn7spqmoth4pktb198f7o6h7uttp7.apps.googleusercontent.com',
    redirectUri: AuthSession.makeRedirectUri({
      scheme: 'potholedetection',
    }),
    scopes: ['profile', 'email'],
    prompt: 'select_account',
  });

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
        const potholesData = await Promise.all(snapshot.docs.map(async (doc) => {
          const data = doc.data();
          const location = await fetchLocation(data.lat, data.lon);
          return {
            id: doc.id,
            ...data,
            location,
          };
        }));
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
  const currentUser = auth.currentUser;

  const allCookies = Cookies.get();
  console.log('All cookies:', allCookies);

  const linkedAccountsUIDs = Object.keys(allCookies)
    .filter(key => key.startsWith('linkedAccount_') && !key.includes(currentUser.uid))
    .map(key => {
      const uidMatch = key.match(/linkedAccount_(.*?)_idToken/);
      return uidMatch ? uidMatch[1] : null;
    })
    .filter(uid => uid !== null);

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

  const validLinkedAccounts = linkedAccountsData.filter(account => account !== null);

  setLinkedAccounts(validLinkedAccounts);
};


useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('auth.currentUser updated:', user);
      fetchUserData(user.uid).then((data) => {
        setUserData(data);
        setCurrentDisplayedAccountUid(user.uid);
      });
    } else {
      console.log('No user is signed in');
    }
  });

  return () => unsubscribe();
}, []);

const handleSwitchAccount = async (accountUid) => {
  try {
    let idToken = Cookies.get(`linkedAccount_${accountUid}_idToken`);
    const refreshToken = Cookies.get(`linkedAccount_${accountUid}_refreshToken`);

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

      toast.success('Switched account successfully!');
    } catch (error) {
      if (error.code === 'auth/invalid-credential' || error.message.includes('Invalid id_token')) {
        console.log('ID token is invalid or expired, refreshing token...');
        await refreshAuthToken(accountUid);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error switching account:', error.message);
    toast.error('Failed to switch account.');
  }
};

const refreshAuthToken = async (accountUid) => {
  const refreshToken = Cookies.get(`linkedAccount_${accountUid}_refreshToken`);
  if (!refreshToken) {
    console.error('No refresh token available, reauthentication needed.');
    return await reauthenticateUser(accountUid);
  }

  try {
    const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${firebaseApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();
    if (!data.id_token) {
      throw new Error('Failed to refresh token');
    }

    Cookies.set(`linkedAccount_${accountUid}_idToken`, data.id_token, { expires: 7, secure: true });
    Cookies.set(`linkedAccount_${accountUid}_refreshToken`, data.refresh_token, { expires: 7, secure: true });

    const credential = GoogleAuthProvider.credential(data.id_token);
    await signInWithCredential(auth, credential);

    console.log('Token refreshed and account switch successful.');
    toast.success('Switched account after token refresh!');
  } catch (error) {
    console.error('Error refreshing auth token:', error);
    return await reauthenticateUser(accountUid);
  }
};

// reauthenticate user (only if refresh fails)
const reauthenticateUser = async (accountUid) => {
  console.log('Reauthenticating user...');
  const result = await promptAsync();
  if (result?.type === 'success') {
    const { id_token } = result.params;
    const credential = GoogleAuthProvider.credential(id_token);

    await signInWithCredential(auth, credential);

    const refreshedIdToken = id_token;
    const refreshToken = auth.currentUser.stsTokenManager.refreshToken;

    Cookies.set(`linkedAccount_${accountUid}_idToken`, refreshedIdToken, { expires: 7, secure: true });
    Cookies.set(`linkedAccount_${accountUid}_refreshToken`, refreshToken, { expires: 7, secure: true });

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

  if (auth.currentUser) {
    updateLinkedAccounts();
  }

  updateLinkedAccounts();
}, [auth.currentUser]);

const handleAddAccount = async () => {
  try {
    const result = await promptAsync();
    if (result?.type === 'success') {
      const { id_token } = result.params;
      const credential = GoogleAuthProvider.credential(id_token);
      
      const userCredential = await signInWithCredential(auth, credential);
      const linkedUser = userCredential.user;

      Cookies.set(`linkedAccount_${linkedUser.uid}_idToken`, id_token, { expires: 7, secure: true });
      Cookies.set(`linkedAccount_${linkedUser.uid}_refreshToken`, linkedUser.stsTokenManager.refreshToken, { expires: 7, secure: true });

      toast.success('Account added successfully!');
      await fetchLinkedAccounts();
    }
  } catch (error) {
    console.error('Error adding account:', error);
    toast.error('Failed to add account.');
  }
};


  useEffect(() => {
    fetchLinkedAccounts();
  }, []);

  useEffect(() => {
    if (sidebarVisible) {
      setShouldRender(true);
    } else {
      const timeout = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [sidebarVisible]);

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        toast.error('We need access to your gallery to update your profile picture. Please enable it in your device settings.');
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
      const uri = result.uri || (result.assets && result.assets[0] && result.assets[0].uri);
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
        toast.error('No authenticated user found.');
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
      toast.success('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('There was an error updating your profile picture. Please try again.');
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
      Cookies.remove(`linkedAccount_${accountUid}_idToken`);
      Cookies.remove(`linkedAccount_${accountUid}_refreshToken`);
      toast.success('Account unlinked successfully.');
      await fetchLinkedAccounts();
    } catch (error) {
      console.error('Error', 'An error occured during unlink process');
      toast.error('Account could not be unlinked. Please try again.');
    }
  }

  // dont display the currently displayed account to avoid redundancy
  const filteredLinkedAccounts = linkedAccounts.filter(account => account.uid !== currentDisplayedAccountUid);

  const animatedHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, filteredLinkedAccounts.length > 3 ? 180 : filteredLinkedAccounts.length * 70], // 60 for account box height and 10 for the margin between each account box
  });

  const animatedOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  if (!shouldRender) {
    return null;
  }

  return (
    <>
      {sidebarVisible && (
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
          <TouchableWithoutFeedback onPress={toggleSidebar}>
            <View style={{ flex: 1 }} />
          </TouchableWithoutFeedback>
        </Animated.View>
      )}
      <Animated.View style={[styles.sidebar, { right: sidebarAnim }]}>
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          indicatorStyle="white"
        >
          <Text style={styles.manageAccountText}>Manage Account</Text>
          <View style={styles.profilePictureContainer}>
            <Image source={{ uri: userData?.profilePictureUrl }} style={styles.profilePicture} />
            <Pressable style={styles.editButton} onPress={selectFromGallery}>
              <Icon name="edit" size={20} color="#fff" />
            </Pressable>
          </View>
          <View style={styles.nameAndBadgeContainer}>
              <Text style={styles.username}>{userData.username}</Text>
              <Image
                  source={badgeImage}
                  style={styles.badge}
              />
          </View>
          <Text style={styles.email}>{userData?.email}</Text>
          <View style={styles.linkedAccountsContainer}>
            <View style={styles.linkedAccountsHeader}>
              <Text style={styles.linkedAccountsText}>Linked Accounts</Text>
              <Pressable onPress={toggleCollapse}>
                <Icon name={isCollapsed ? 'expand-more' : 'expand-less'} size={24} color="#fff" />
              </Pressable>
            </View>
            {linkedAccounts.length === 0 ? (
              <View style={styles.noLinkedAccountsContainer}>
                <Text style={styles.noLinkedAccountsText}>
                  No linked accounts found. Click the button below to add one.
                </Text>
              </View>
            ) : (
              <Animated.View style={{ height: animatedHeight, opacity: animatedOpacity, overflow: 'hidden' }}>
                {linkedAccounts.length <= 3 ? (
                  <View style={styles.nonScrollableAccountsContainer}>
                    {filteredLinkedAccounts.map((account, index) => (
                      <Pressable key={index} onPress={() => handleSwitchAccount(account.uid)} style={styles.accountBox}>
                        <Image source={{ uri: account.profilePictureUrl }} style={styles.accountProfilePicture} />
                        <View style={styles.accountInfo}>
                          <Text style={styles.accountUsername}>{account.username}</Text>
                          <Text style={styles.accountEmail}>{account.email}</Text>
                        </View>
                        <Pressable onPress={() => handleLogout(account.uid)}>
                          <Icon name='logout' size={24} color="#eee" />
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
                      <Pressable key={index} onPress={() => handleSwitchAccount(account.uid)} style={styles.accountBox}>
                        <Image source={{ uri: account.profilePictureUrl }} style={styles.accountProfilePicture} />
                        <View style={styles.accountInfo}>
                          <Text style={styles.accountUsername}>{account.username}</Text>
                          <Text style={styles.accountEmail}>{account.email}</Text>
                        </View>
                        <Pressable onPress={() => handleLogout(account.uid)}>
                          <Icon name='logout' size={24} color="#eee" />
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
              <Icon name="add" size={20} color="#fff" />
              <Text style={styles.addAccountText}>Add another account</Text>
            </Pressable>
          </View>
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Statistics</Text>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Joined:</Text>
              <Text style={styles.statValue}>
                {userData?.joinDate?.toDate().toLocaleDateString() || 'N/A'}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Contributions:</Text>
              <Text style={styles.statValue}>{userData?.contributions || 0}</Text>
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
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.potholeScroll}>
                {latestPotholes.length > 0 ? (
                    latestPotholes.map((pothole) => (
                    <View key={pothole.id} style={styles.potholeCard}>
                        <Image source={{ uri: pothole.imageUrl }} style={styles.potholeImage} />
                        <Text style={styles.potholeStatus}>Status: {pothole.status}</Text>
                        <Text style={styles.potholeTimestamp}>
                        Reported on: {new Date(pothole.timestamp.toDate()).toLocaleDateString()}
                        </Text>
                        <Text style={styles.potholeLocation}>Located in: {pothole.location}</Text>
                    </View>
                    ))
                ) : (
                    <Text style={styles.noPotholesText}>You have not reported any potholes yet.</Text>
                )}
                </ScrollView>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </>
  );
};

export default AccountDetailsSidebar;