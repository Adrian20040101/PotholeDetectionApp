import React, { useState, useEffect } from 'react';
import { View, Text, Animated, Pressable, Dimensions } from 'react-native';
import styles from './mobile-animation.styles';

const MobileSidebar = ({ menuAnim, sidebarVisible, toggleSidebar, menuItems }) => {
  const { height } = Dimensions.get('window');
  const [hoveredItem, setHoveredItem] = useState(null);
  const [containerZIndex, setContainerZIndex] = useState(1);

  const translateY = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-height, 0],
  });

  useEffect(() => {
    if (sidebarVisible) {
      setContainerZIndex(3);
    } else {
      const timeout = setTimeout(() => {
        setContainerZIndex(1);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [sidebarVisible]);

  return (
    <View style={[styles.container, { zIndex: containerZIndex }]}>
      {sidebarVisible && (
        <Pressable style={styles.overlay} onPress={toggleSidebar} />
      )}
      <Animated.View style={[styles.menuContainer, { transform: [{ translateY }] }]}>
        <View style={styles.menuContent}>
          {menuItems() && Array.isArray(menuItems()) && menuItems().length > 0 ? (
            menuItems().map((item, index) => (
              <Pressable
                key={index}
                onPress={item.action}
                onMouseEnter={() => setHoveredItem(index)}
                onMouseLeave={() => setHoveredItem(null)}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && styles.menuItemPressed,
                  hoveredItem === index && styles.menuItemHover,
                ]}
              >
                <Text
                  style={[
                    styles.menuText,
                    hoveredItem === index && styles.menuTextHover,
                    item.label === 'Delete Account' && hoveredItem === index && styles.deleteAccountHover,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.noMenuItemsText}>No menu items available</Text>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

export default MobileSidebar;
