import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Pressable, Animated, Easing, Dimensions, ScrollView } from 'react-native';
import { useUser } from '../../../context-components/user-context';
import { auth, db } from '../../../config/firebase/firebase-config';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { toast } from 'react-toastify';
import styles from './mobile-animation.style';

const AccountDetailsSidebarMobile = ({ sidebarVisible, toggleSidebar }) => {
  const { userData } = useUser();
  const screenWidth = Dimensions.get('window').width;
  const [hasPermission, setHasPermission] = useState(null);
  const mobileSidebarAnim = useRef(new Animated.Value(screenWidth)).current;
  const [isCollapsed, setIsCollapsed] = useState(true);
  const animation = useRef(new Animated.Value(0)).current;
  const [isRendered, setIsRendered] = useState(sidebarVisible);
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const auth = getAuth();
  const [currentDisplayedAccountUid, setCurrentDisplayedAccountUid] = useState(auth.currentUser.uid);
  const firebaseApiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '280319253024-a79cn7spqmoth4pktb198f7o6h7uttp7.apps.googleusercontent.com',
    redirectUri: AuthSession.makeRedirectUri({
      scheme: 'potholedetection',
    }),
    scopes: ['profile', 'email'],
  });

  
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

  const filteredLinkedAccounts = linkedAccounts.filter(account => account.uid !== currentDisplayedAccountUid);

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
            <Icon name="arrow-back" size={24} color="#fff" />
          </Pressable>
        <View style={styles.contentContainer}>
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
              <Pressable style={styles.addAccountButton} onPress={() => console.log('Add account button pressed')}>
                <Icon name="add" size={20} color="#fff" />
                <Text style={styles.addAccountText}>Add another account</Text>
              </Pressable>
          </View>
        </View>
    </Animated.View>
  );
};

export default AccountDetailsSidebarMobile;
