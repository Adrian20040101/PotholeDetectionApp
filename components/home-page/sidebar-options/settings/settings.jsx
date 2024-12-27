import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useTheme } from './theme/theme-context';
import { auth } from '../../../../config/firebase/firebase-config';
import ThemeToggle from './theme/theme-toggle';
import CitySelection from '../../city-selection/city';
import styles from './settings.style';

const SettingsModal = ({ isVisible, onClose, onCitySelect }) => {
  const [selectedCity, setSelectedCity] = useState('');
  const { theme, toggleTheme, isDarkTheme } = useTheme();
  const user = auth.currentUser;

  const [modalWidth, setModalWidth] = useState(Dimensions.get('window').width < 800 ? '85%' : '50%');

  const overlayAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const updateModalWidth = () => {
      const screenWidth = Dimensions.get('window').width;
      setModalWidth(screenWidth < 800 ? '85%' : '50%');
    };

    Dimensions.addEventListener('change', updateModalWidth);

    return () => {
      Dimensions.removeEventListener('change', updateModalWidth);
    };
  }, []);

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        overlayAnim.setValue(0);
        scaleAnim.setValue(0.8);
      });
    }
  }, [isVisible]);

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    onCitySelect(city);
  };

  return (
    isVisible && (
      <Animated.View style={[styles.modalOverlay, { opacity: overlayAnim }]}>
        <Animated.View
          style={[
            styles.modalContent,
            { width: modalWidth, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <TouchableOpacity style={styles.closeButton}
              onPress={() => {
              Animated.parallel([
                  Animated.timing(overlayAnim, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                  }),
                  Animated.timing(scaleAnim, {
                  toValue: 0.8,
                  duration: 200,
                  useNativeDriver: true,
                  }),
              ]).start(() => {
                  onClose();
              });
              }}>
              <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Settings</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.settingSection}>
              {user.isAnonymous ? (
                <>
                  <Text style={styles.settingTitle}>Favorite City</Text>
                  <Text style={styles.settingValue}>Sign in to set a favorite city</Text>
                </>
              ) : (
                <>
                  <Text style={styles.settingTitle}>Favorite City</Text>
                  <CitySelection onCitySelect={handleCitySelect} />
                  <Text style={styles.settingValue}>Selected City: {selectedCity}</Text>
                </>
              )}
            </View>

            <View style={styles.settingSection}>
              <Text style={styles.settingTitle}>Dark Mode</Text>
              <View style={styles.switchContainer}>
                <ThemeToggle />
              </View>
            </View>

            <View style={styles.settingSection}>
              <Text style={styles.settingTitle}>Language</Text>
              <Text style={styles.settingValue}>English / Other Languages</Text>
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    )
  );
};

export default SettingsModal;
