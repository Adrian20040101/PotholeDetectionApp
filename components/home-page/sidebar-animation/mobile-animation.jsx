import React from 'react';
import { View, Text, Animated, Pressable, Dimensions } from 'react-native';
import styles from './mobile-animation.styles';

const MobileSidebar = ({ menuAnim, sidebarVisible, toggleSidebar, menuItems }) => {
  const { height } = Dimensions.get('window');

  const translateY = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-height, 0],
  });

  return (
    <View
      style={[
        styles.container,
        sidebarVisible ? { zIndex: 3 } : { zIndex: 1 },
      ]}
    >
      {sidebarVisible && (
        <Pressable style={styles.overlay} onPress={toggleSidebar} />
      )}
      <Animated.View style={[styles.menuContainer, { transform: [{ translateY }] }]}>
        <View style={styles.menuContent}>
          {menuItems.map((item, index) => (
            <Pressable key={index} onPress={item.action} style={styles.menuItem}>
              <Text style={styles.menuText}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

export default MobileSidebar;
