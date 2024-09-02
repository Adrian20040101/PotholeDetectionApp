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

  const [linkedAccounts, setLinkedAccounts] = useState([
    {
      profilePictureUrl: 'https://www.shutterstock.com/image-vector/user-profile-icon-vector-avatar-600nw-2247726673.jpg',
      username: 'User1',
      email: 'user1@example.com',
    },
    {
      profilePictureUrl: 'https://www.shutterstock.com/image-vector/user-profile-icon-vector-avatar-600nw-2247726673.jpg',
      username: 'User2',
      email: 'user2@example.com',
    },
    {
      profilePictureUrl: 'https://www.shutterstock.com/image-vector/user-profile-icon-vector-avatar-600nw-2247726673.jpg',
      username: 'User3',
      email: 'user3@example.com',
    },
  ]);

  useEffect(() => {
    Animated.timing(mobileSidebarAnim, {
      toValue: sidebarVisible ? 0 : screenWidth,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
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

  const animatedHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, linkedAccounts.length > 3 ? 180 : linkedAccounts.length * 70],
  });

  const animatedOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  if (!sidebarVisible && mobileSidebarAnim.__getValue() === screenWidth) {
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
            <Animated.View style={{ height: animatedHeight, opacity: animatedOpacity, overflow: 'hidden' }}>
              {linkedAccounts.length <= 3 ? (
                <View style={styles.nonScrollableAccountsContainer}>
                  {linkedAccounts.map((account, index) => (
                    <View key={index} style={styles.accountBox}>
                      <Image source={{ uri: account.profilePictureUrl }} style={styles.accountProfilePicture} />
                      <View style={styles.accountInfo}>
                        <Text style={styles.accountUsername}>{account.username}</Text>
                        <Text style={styles.accountEmail}>{account.email}</Text>
                      </View>
                    </View>
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
                    <View key={index} style={styles.accountBox}>
                      <Image source={{ uri: account.profilePictureUrl }} style={styles.accountProfilePicture} />
                      <View style={styles.accountInfo}>
                        <Text style={styles.accountUsername}>{account.username}</Text>
                        <Text style={styles.accountEmail}>{account.email}</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
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
