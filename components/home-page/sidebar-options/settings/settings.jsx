import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useTheme } from './theme/theme-context';
import { auth } from '../../../../config/firebase/firebase-config';
import ThemeToggle from './theme/theme-toggle';
import CitySelection from '../../city-selection/city';
import styles from './settings.style';

const SettingsModal = ({ isVisible, onClose, onCitySelect }) => {
  const [selectedCity, setSelectedCity] = useState('');
  const { theme, toggleTheme, isDarkTheme } = useTheme();
  const user = auth.currentUser;

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    onCitySelect(city);
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Settings</Text>
          <ScrollView>
            {/* favorite city selection, available for authenticated users only */}
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

            {/* additional settings sections can go here */}
            <View style={styles.settingSection}>
            <Text style={styles.settingLabel}>Dark Mode:</Text>
            <View style={styles.switchContainer}>
              <ThemeToggle />
            </View>
            </View>

            <View style={styles.settingSection}>
              <Text style={styles.settingTitle}>Language</Text>
              {/* include a dropdown or selection for language */}
              {/* laceholder: */}
              <Text style={styles.settingValue}>English / Other Languages</Text>
            </View>
          </ScrollView>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default SettingsModal;
