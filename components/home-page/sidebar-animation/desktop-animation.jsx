import React, { useState } from 'react';
import { View, Text, Pressable, Animated, TouchableWithoutFeedback } from 'react-native';
import styles from './desktop-animation.style';

const DesktopSidebar = ({ sidebarAnim, overlayAnim, sidebarVisible, toggleSidebar, menuItems }) => {

  const [hoveredItem, setHoveredItem] = useState(null);

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
          {menuItems().map((item, index) => (
            <Pressable 
              key={item.label} 
              onPress={() => item.action()}
              onMouseEnter={() => setHoveredItem(index)}
              onMouseLeave={() => setHoveredItem(null)}
              style={[
                hoveredItem === index && styles.menuItemHover,
                item.label === 'Delete Account' && hoveredItem === index && styles.deleteAccountHover, // make the delete item red to indicate potential destructive action
              ]}
            >
              <Text 
                style={[
                  styles.menuItem,
                  hoveredItem === index && styles.menuItemHover,
                  item.label === 'Delete Account' && hoveredItem === index && styles.deleteAccountHover,
                ]}
              >{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </>
  );
};

export default DesktopSidebar;
