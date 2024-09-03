import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, Pressable, Animated, Easing, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { auth, db } from '../../../config/firebase/firebase-config';
import { getAuth, GoogleAuthProvider, linkWithCredential, signInWithCredential, fetchSignInMethodsForEmail } from "firebase/auth";
import { getDoc, doc, setDoc, getDocs, collection } from 'firebase/firestore';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
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
  const provider = new GoogleAuthProvider();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '280319253024-a79cn7spqmoth4pktb198f7o6h7uttp7.apps.googleusercontent.com',
    redirectUri: AuthSession.makeRedirectUri({
      scheme: 'potholedetection',
    }),
    scopes: ['profile', 'email'],
  });

  const handleAddAccount = () => {
    promptAsync();
  };

  const handleSwitchAccount = async (account) => {
    try {
        const userDocRef = doc(db, `users/${auth.currentUser.uid}/linkedAccounts/${account.id}`);
        const linkedAccountDoc = await getDoc(userDocRef);

        if (linkedAccountDoc.exists()) {
            const { refreshToken } = linkedAccountDoc.data();

            // Get a new idToken using the refreshToken
            const response = await fetch(`https://road-guard.netlify.app/.netlify/function/refresh-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
            });

            const data = await response.json();
            const newIdToken = data.id_token;

            if (!newIdToken) {
                throw new Error("Failed to refresh idToken.");
            }

            const credential = GoogleAuthProvider.credential(newIdToken);
            await signInWithCredential(auth, credential);

            toast.success(`Switched to account ${account.email}`);
        } else {
            throw new Error("No linked account data found.");
        }
    } catch (error) {
        console.error("Error switching account: ", error);
        toast.error("Failed to switch account. Please try again.");
    }
};


  useEffect(() => {
    const linkAccount = async () => {
      if (response?.type === 'success') {
          const { id_token } = response.params;
          const credential = GoogleAuthProvider.credential(id_token);
  
          try {
              const currentUser = auth.currentUser;
  
              if (!currentUser) {
                  throw new Error('No current user is logged in.');
              }
  
              // Sign in with the selected account using a separate instance of auth
              const secondaryAuth = getAuth(); // Create a secondary auth instance
              secondaryAuth.languageCode = 'en';
              const signInResult = await signInWithCredential(secondaryAuth, credential);
              const linkedUserInfo = signInResult.user;
              const linkedUserRefreshToken = linkedUserInfo.stsTokenManager.refreshToken;
  
              // References for Firestore documents
              const linkedUserDocRef = doc(db, `users/${linkedUserInfo.uid}`);
              const currentUserDocRef = doc(db, `users/${currentUser.uid}`);
  
              // Fetch or create the linked user's document
              let linkedUserDoc = await getDoc(linkedUserDocRef);
              if (!linkedUserDoc.exists()) {
                  // Create the linked user's document if it doesn't exist
                  await setDoc(linkedUserDocRef, {
                      username: linkedUserInfo.displayName,
                      email: linkedUserInfo.email,
                      profilePictureUrl: linkedUserInfo.photoURL,
                      idToken: id_token,
                      refreshToken: linkedUserRefreshToken,
                      favoriteCity: "", // Placeholder, can be updated later
                  });
                  linkedUserDoc = await getDoc(linkedUserDocRef); // Re-fetch the newly created document
              }
  
              // Fetch the current user's document
              const currentUserDoc = await getDoc(currentUserDocRef);
              if (!currentUserDoc.exists()) {
                  throw new Error('Current user does not have a document in Firestore.');
              }
  
              // Retain existing data and add the idToken
              const originalUserIdToken = currentUser.stsTokenManager.accessToken;
              const currentUserData = {
                  ...currentUserDoc.data(), // Retain existing data
                  idToken: originalUserIdToken // Add the idToken
              };
  
              // Use the existing data from Firestore for linking
              const linkedAccountData = linkedUserDoc.data();
  
              // Add linked account info to the authenticated user's linkedAccounts collection
              const currentUserLinkedAccountRef = doc(db, `users/${currentUser.uid}/linkedAccounts/${linkedUserInfo.uid}`);
              await setDoc(currentUserLinkedAccountRef, linkedAccountData);
  
              // Add the updated original user's info to the newly linked user's linkedAccounts collection
              const linkedUserLinkedAccountRef = doc(db, `users/${linkedUserInfo.uid}/linkedAccounts/${currentUser.uid}`);
              await setDoc(linkedUserLinkedAccountRef, currentUserData);
  
              // Update the state to reflect the newly linked account
              setLinkedAccounts((prev) => [...prev, linkedAccountData]);
  
              toast.success('Account linked successfully!');
          } catch (error) {
              console.error('Error linking account: ', error);
              toast.error('Failed to link account. Please try again.');
          }
      }
  };
  
  
  
    linkAccount();
  }, [response]);
  
  
  const fetchLinkedAccounts = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('No current user is logged in.');
        return;
      }

      const linkedAccountsCollectionRef = collection(db, `users/${currentUser.uid}/linkedAccounts`);
      const linkedAccountsSnapshot = await getDocs(linkedAccountsCollectionRef);

      const accounts = linkedAccountsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setLinkedAccounts(accounts);
    } catch (error) {
      console.error('Error fetching linked accounts: ', error);
    }
  };

  useEffect(() => {
    fetchLinkedAccounts();
  }, []);

  const signInWithLinkedAccount = async (account) => {
    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, account.email);
      if (signInMethods.includes('google.com')) {
        const credential = GoogleAuthProvider.credential(null, account.email);
        await signInWithCredential(auth, credential);
        toast.success(`Signed in as ${account.username}`);
      } else {
        toast.error('Cannot sign in with this account.');
      }
    } catch (error) {
      console.error('Error signing in with linked account: ', error);
      toast.error('Failed to sign in with linked account.');
    }
  };

  useEffect(() => {
    if (sidebarVisible) {
      setShouldRender(true);
    } else {
      const timeout = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [sidebarVisible]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

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
                      <Pressable key={index} onPress={() => handleSwitchAccount(account)} style={styles.accountBox}>
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
                      <Pressable key={index} onPress={() => handleSwitchAccount(account)} style={styles.accountBox}>
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
                    onPress={() => handleSwitchAccount(account)}
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
