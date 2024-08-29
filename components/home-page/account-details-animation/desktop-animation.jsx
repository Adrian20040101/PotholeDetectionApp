import React from 'react';
import { View, Text, Image, Pressable, Animated, TouchableWithoutFeedback } from 'react-native';
import styles from './desktop-animation.style';

const AccountDetailsSidebar = ({ sidebarAnim, overlayAnim, sidebarVisible, toggleSidebar, user }) => {
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
        <View style={styles.contentContainer}>
          <Image source={{ uri: user.photoURL }} style={styles.profilePicture} />
          <Text style={styles.username}>{user.displayName}</Text>
          <Text style={styles.email}>{user.email}</Text>
          {/* add more account details as needed */}
        </View>
      </Animated.View>
    </>
  );
};

export default AccountDetailsSidebar;
