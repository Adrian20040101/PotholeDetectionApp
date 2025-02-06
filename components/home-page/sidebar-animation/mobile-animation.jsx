import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Dimensions, Platform, TouchableWithoutFeedback } from 'react-native';
import styles from './mobile-animation.styles';

const MobileSidebar = ({ menuAnim, overlayAnim, sidebarVisible, toggleSidebar, menuItems }) => {
    const { height } = Dimensions.get('window');
    const [hoveredItem, setHoveredItem] = useState(null);
    const [containerZIndex, setContainerZIndex] = useState(1);

    useEffect(() => {
        if (sidebarVisible) {
            setContainerZIndex(3);
        } else {
            setContainerZIndex(0);
        }
    }, [sidebarVisible, overlayAnim, menuAnim]);

    const translateY = menuAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-height, 0],
    });

    return (
      <View style={[styles.container, { zIndex: containerZIndex }]}>
        {sidebarVisible && (
          <Animated.View style={styles.overlay}>
              <TouchableWithoutFeedback onPress={toggleSidebar}>
                  <View style={{ flex: 1 }} />
              </TouchableWithoutFeedback>
          </Animated.View>
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
