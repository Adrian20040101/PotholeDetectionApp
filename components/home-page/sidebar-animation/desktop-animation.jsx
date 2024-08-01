import React from 'react';
import { View, Text, Pressable, Animated, TouchableWithoutFeedback } from 'react-native';
import styles from './desktop-animation.style';

const DesktopSidebar = ({ sidebarAnim, overlayAnim, sidebarVisible, toggleSidebar, menuItems }) => {
  return (
    <>
      {sidebarVisible && (
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
          <TouchableWithoutFeedback onPress={toggleSidebar}>
            <View style={{ flex: 1 }} />
          </TouchableWithoutFeedback>
        </Animated.View>
      )}
      <Animated.View style={[styles.sidebar, { left: sidebarAnim }]}>
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <Pressable key={item.label} onPress={() => item.action()}>
              <Text style={styles.menuItem}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </>
  );
};

export default DesktopSidebar;
