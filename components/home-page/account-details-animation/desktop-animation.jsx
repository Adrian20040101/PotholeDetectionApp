import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, Pressable, Animated, Easing, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { auth, db } from '../../../config/firebase/firebase-config';
import { getAuth, GoogleAuthProvider, linkWithCredential, signInWithCredential, fetchSignInMethodsForEmail } from "firebase/auth";
import { getDoc, doc, setDoc, getDocs, collection } from 'firebase/firestore';
import * as Google from 'expo-auth-session/providers/google';
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
  const [hasPermission, setHasPermission] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const animation = useRef(new Animated.Value(0)).current;
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const auth = getAuth();

  // Google Auth setup for linking a new account
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '280319253024-a79cn7spqmoth4pktb198f7o6h7uttp7.apps.googleusercontent.com',
    redirectUri: AuthSession.makeRedirectUri({
      scheme: 'potholedetection',
    }),
    scopes: ['profile', 'email'],
  });

  // Helper function to fetch user data from Firestore
  const fetchUserData = async (uid) => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists() ? userDoc.data() : null;
  };

  const refreshAuthToken = async (refreshToken) => {
    try {
      const response = await fetch('https://road-guard.netlify.app/.netlify/functions/refresh_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshToken })
      });
  
      const data = await response.json();
  
      if (!response.ok || !data.idToken) {
        throw new Error(`Failed to refresh token: ${data.error || 'Unknown error'}`);
      }
  
      // Returns the new idToken and also the new refreshToken if needed
      return { idToken: data.idToken, refreshToken };
    } catch (error) {
      console.error('Error refreshing auth token:', error);
      throw error;
    }
  };
  
  const isIdTokenExpired = (idToken) => {
    try {
      const base64Url = idToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const decodedPayload = JSON.parse(atob(base64));
  
      const currentTime = Math.floor(Date.now() / 1000);
      return decodedPayload.exp < currentTime;
    } catch (error) {
      console.error('Error decoding idToken:', error);
      return true;
    }
  };
  

  const handleSwitchAccount = async (accountUid) => {
    try {
      // Fetch tokens from cookies
      let idToken = Cookies.get(`${accountUid}_idToken`);
      let refreshToken = Cookies.get(`${accountUid}_refreshToken`);
  
      if (!idToken || !refreshToken) {
        throw new Error('No session data found for the linked account.');
      }
  
      // Check if the idToken is expired
      const isTokenExpired = isIdTokenExpired(idToken);
      if (isTokenExpired) {
        console.log('ID Token expired, refreshing...');
        const tokenData = await refreshAuthToken(refreshToken);
  
        // Update idToken with the new value
        idToken = tokenData.idToken;
  
        // Store the new tokens in the cookies
        Cookies.set(`${accountUid}_idToken`, idToken, { expires: 7 });
      }
  
      // Use valid idToken to sign in
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
  
      // Fetch the new user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', accountUid));
      setUserData(userDoc.data());
  
      toast.success(`Switched to account ${userDoc.data().email}`);
    } catch (error) {
      console.error('Error switching account:', error);
      toast.error('Failed to switch account. Please try again.');
    }
  };
  

  // Fetch linked accounts from Firestore and cookies
  const fetchLinkedAccounts = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error('No current user is logged in.');
      return;
    }

    // Retrieve all cookies and filter for accounts other than the current user
    const allCookies = Cookies.get();
    const filteredAccounts = Object.keys(allCookies)
      .filter((key) => key.endsWith('_idToken') && !key.startsWith(currentUser.uid))
      .map((key) => key.split('_')[0]); // Extract UID from cookie key

    // Fetch linked accounts data from Firestore using the filtered UIDs
    const accountsData = await Promise.all(filteredAccounts.map(async (uid) => {
      const userData = await fetchUserData(uid);
      return { uid, ...userData };
    }));

    setLinkedAccounts(accountsData);
  };

  // Link the newly added account
  const handleAddAccount = () => {
    promptAsync();
  };

  // Save the original account's idToken and refreshToken in cookies
  const saveOriginalAccountTokens = async (currentUser) => {
    const currentIdToken = await currentUser.getIdToken(true);
    const currentRefreshToken = currentUser.stsTokenManager.refreshToken;
    Cookies.set(`${currentUser.uid}_idToken`, currentIdToken, { expires: 7 });
    Cookies.set(`${currentUser.uid}_refreshToken`, currentRefreshToken, { expires: 7 });

    console.log(`Saved idToken and refreshToken for ${currentUser.uid} in cookies`);
  };

  // After linking an account, save both the current and linked account's tokens
  const linkAccount = async () => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
  
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('No current user is logged in.');
  
        // Sign in with the new linked account
        const signInResult = await signInWithCredential(auth, credential);
        const linkedUser = signInResult.user;
  
        // Save the current user's tokens in cookies (original account)
        const originalIdToken = currentUser.stsTokenManager.accessToken;
        const originalRefreshToken = currentUser.stsTokenManager.refreshToken;
        Cookies.set(`${currentUser.uid}_idToken`, originalIdToken, { expires: 7 });
        Cookies.set(`${currentUser.uid}_refreshToken`, originalRefreshToken, { expires: 7 });
  
        // Check if the linked user already exists in Firestore
        const linkedUserDocRef = doc(db, 'users', linkedUser.uid);
        const linkedUserDoc = await getDoc(linkedUserDocRef);
  
        if (!linkedUserDoc.exists()) {
          await setDoc(linkedUserDocRef, {
            username: linkedUser.displayName,
            email: linkedUser.email,
            profilePictureUrl: linkedUser.photoURL,
          });
        }
  
        // Store the linked user's tokens in cookies
        Cookies.set(`${linkedUser.uid}_idToken`, id_token, { expires: 7 });
        Cookies.set(`${linkedUser.uid}_refreshToken`, linkedUser.stsTokenManager.refreshToken, { expires: 7 });
  
        fetchLinkedAccounts(); // Refresh the linked accounts list
  
        toast.success('Account linked successfully!');
      } catch (error) {
        console.error('Error linking account:', error);
        toast.error('Failed to link account. Please try again.');
      }
    }
  };
  
  // Check for response when linking an account
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);

      signInWithCredential(auth, credential)
        .then(async (signInResult) => {
          const linkedUser = signInResult.user;
          await linkAccount(linkedUser);
        })
        .catch((error) => {
          console.error('Error linking account:', error);
          toast.error('Failed to link account. Please try again.');
        });
    }
  }, [response]);

  // Initial fetch of linked accounts
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

  const animatedHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, linkedAccounts.length > 3 ? 180 : linkedAccounts.length * 70], // 60 for account box height and 10 for the margin between each account box
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
          <Text style={styles.username}>{userData?.username}</Text>
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
                    {linkedAccounts.map((account, index) => (
                      <Pressable key={index} onPress={() => handleSwitchAccount(account.uid)} style={styles.accountBox}>
                        <Image source={{ uri: account.profilePictureUrl }} style={styles.accountProfilePicture} />
                        <View style={styles.accountInfo}>
                          <Text style={styles.accountUsername}>{account.username}</Text>
                          <Text style={styles.accountEmail}>{account.email}</Text>
                        </View>
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
                    {linkedAccounts.map((account, index) => (
                      <Pressable key={index} onPress={() => handleSwitchAccount(account.uid)} style={styles.accountBox}>
                        <Image source={{ uri: account.profilePictureUrl }} style={styles.accountProfilePicture} />
                        <View style={styles.accountInfo}>
                          <Text style={styles.accountUsername}>{account.username}</Text>
                          <Text style={styles.accountEmail}>{account.email}</Text>
                        </View>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              </Animated.View>
            )}
            {isCollapsed && (
              <View style={styles.collapsedAccountsContainer}>
                {linkedAccounts.slice(0, 3).map((account, index) => (
                  <Pressable
                    key={index}
                    onPress={() => () => handleSwitchAccount(account.uid)}
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
        </ScrollView>
      </Animated.View>
    </>
  );
};

export default AccountDetailsSidebar;