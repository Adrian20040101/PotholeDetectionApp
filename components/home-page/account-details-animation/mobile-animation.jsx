import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Pressable, Animated, Easing, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { useUser } from '../../../context-components/user-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from './mobile-animation.style';

const AccountDetailsSidebarMobile = ({ sidebarVisible, toggleSidebar }) => {
  const { userData } = useUser();
  const screenWidth = Dimensions.get('window').width;
  const mobileSidebarAnim = useRef(new Animated.Value(screenWidth)).current;

  useEffect(() => {
    Animated.timing(mobileSidebarAnim, {
      toValue: sidebarVisible ? 0 : screenWidth,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [sidebarVisible, screenWidth]);

  if (!sidebarVisible && mobileSidebarAnim.__getValue() === screenWidth) {
    return null;
  }

  return (
      <Animated.View style={[styles.mobileSidebar, { left: mobileSidebarAnim }]}>
        <View style={styles.contentContainer}>
          <Pressable onPress={toggleSidebar} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.manageAccountText}>Manage Account</Text>
          <View style={styles.profilePictureContainer}>
            <Image source={{ uri: userData?.profilePictureUrl }} style={styles.profilePicture} />
            <Pressable style={styles.editButton}>
              <Icon name="edit" size={20} color="#fff" />
            </Pressable>
          </View>
          <Text style={styles.username}>{userData?.username}</Text>
          <Text style={styles.email}>{userData?.email}</Text>
        </View>
      </Animated.View>
  );
};

export default AccountDetailsSidebarMobile;
