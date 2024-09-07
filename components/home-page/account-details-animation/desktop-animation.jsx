import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, Pressable, Animated, Easing, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { auth, db } from '../../../config/firebase/firebase-config';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithCredential, fetchSignInMethodsForEmail, reauthenticateWithCredential, linkWithCredential } from "firebase/auth";
import { getDoc, doc, setDoc, getDocs, collection, updateDoc } from 'firebase/firestore';
import * as Google from 'expo-auth-session/providers/google';
import { getStorage, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
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
  const [currentDisplayedAccountUid, setCurrentDisplayedAccountUid] = useState(auth.currentUser.uid);

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



  // Switch account
  const handleSwitchAccount = async (accountUid) => {
    try {
      const idToken = Cookies.get(`linkedAccount_${accountUid}_idToken`);
      const refreshToken = Cookies.get(`linkedAccount_${accountUid}_refreshToken`);

      if (!idToken || !refreshToken) {
        throw new Error('No valid ID token or refresh token found. You may need to log in again.');
      }

      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      
      toast.success('Switched account successfully!');
    } catch (error) {
      console.error('Error switching account:', error.message);
      toast.error('Failed to switch account.');
    }
  };

  // Handle adding a new account
  const handleAddAccount = async () => {
    try {
      const result = await promptAsync();
      if (result?.type === 'success') {
        const { id_token } = result.params;
        const credential = GoogleAuthProvider.credential(id_token);
        const userCredential = await signInWithCredential(auth, credential);
        const linkedUser = userCredential.user;

        // Save the ID token and refresh token in cookies
        const idToken = await linkedUser.getIdToken(true);
        const refreshToken = linkedUser.stsTokenManager.refreshToken;
        Cookies.set(`linkedAccount_${linkedUser.uid}_idToken`, idToken, { expires: 7, secure: true });
        Cookies.set(`linkedAccount_${linkedUser.uid}_refreshToken`, refreshToken, { expires: 7, secure: true });

        await fetchLinkedAccounts();
        toast.success('Account added successfully!');
      }
    } catch (error) {
      console.error('Error adding account:', error);
      toast.error('Failed to add account.');
    }
  };

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
                    {filteredLinkedAccounts.map((account, index) => (
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
                    {filteredLinkedAccounts.map((account, index) => (
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
        </ScrollView>
      </Animated.View>
    </>
  );
};

export default AccountDetailsSidebar;