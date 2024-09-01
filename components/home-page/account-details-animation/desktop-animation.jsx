import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, Pressable, Animated, Easing, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { auth, db } from '../../../config/firebase/firebase-config';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
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
  const [linkedAccounts, setLinkedAccounts] = useState([
    {
      profilePictureUrl: 'https://example.com/profile1.jpg',
      username: 'User1',
      email: 'user1@example.com',
    },
    {
      profilePictureUrl: 'https://example.com/profile2.jpg',
      username: 'User2',
      email: 'user2@example.com',
    },
    {
      profilePictureUrl: 'https://example.com/profile3.jpg',
      username: 'User3',
      email: 'user3@example.com',
    },
    {
      profilePictureUrl: 'https://example.com/profile4.jpg',
      username: 'User4',
      email: 'user4@example.com',
    },
    {
      profilePictureUrl: 'https://example.com/profile4.jpg',
      username: 'User5',
      email: 'user5@example.com',
    },
  ]);

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
    outputRange: [0, linkedAccounts.length * 60], // 60 for each account box being 60px high
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
            <Pressable style={styles.editButton} onPress={() => console.log('Edit profile picture')}>
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
            <Animated.View style={{ height: animatedHeight, opacity: animatedOpacity, overflow: 'hidden' }}>
              <ScrollView 
                contentContainerStyle={styles.scrollViewContent}
                style={styles.accountBoxesScrollView}
                showsVerticalScrollIndicator={false}
                indicatorStyle="white"
              >
                {linkedAccounts.map((account, index) => (
                  <View key={index} style={styles.accountBox}>
                    <Image source={{ uri: account.profilePictureUrl }} style={styles.accountProfilePicture} />
                    <View style={styles.accountInfo}>
                      <Text style={styles.accountUsername}>{account.username}</Text>
                      <Text style={styles.accountEmail}>{account.email}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </Animated.View>
            {isCollapsed && (
              <View style={styles.collapsedAccountsContainer}>
                {linkedAccounts.slice(0, 3).map((account, index) => (
                  <Image
                    key={index}
                    source={{ uri: account.profilePictureUrl }}
                    style={styles.collapsedAccountProfilePicture}
                  />
                ))}
                {linkedAccounts.length > 3 && (
                  <Text style={styles.collapsedAccountText}>
                    +{linkedAccounts.length - 3}
                  </Text>
                )}
              </View>
            )}
            <Pressable style={isCollapsed ? styles.addAccountButtonCollapsed : styles.addAccountButton} onPress={() => toast.success('Add account button pressed')}>
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
