import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Image } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import ImageUpload from '../upload-photo/upload-photo';
import AchievementsModal from '../achievements/achievements';
import styles from './bottom-navbar.style';
import { useUser } from '../../../context-components/user-context';

const BottomNavbar = ({ onAccountPress }) => {
  const { userData } = useUser();
  const [isImageUploadVisible, setImageUploadVisible] = useState(false);
  const [isAchievementsVisible, setAchievementsVisible] = useState(false);
  const defaultProfilePictureUrl = require('../../../assets/images/default-profile-picture.webp');

  const handleImportPress = () => {
    setImageUploadVisible(true);
  };

  const handleAchievementsPress = () => {
    setAchievementsVisible(true);
  };

  return (
    <View style={styles.navbarContainer}>
      <TouchableOpacity style={styles.navButton} onPress={() => console.log('Home button pressed')}>
        <MaterialIcons name="home" size={30} color="#fff" />
        <Text style={styles.navButtonText}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navButton} onPress={handleImportPress}>
        <MaterialIcons name="add" size={30} color="#fff" />
        <Text style={styles.navButtonText}>Import</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navButton} onPress={handleAchievementsPress}>
        <FontAwesome name="trophy" size={30} color="#fff" />
        <Text style={styles.navButtonText}>Achievements</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navButton} onPress={onAccountPress}>
        <Image
          source={
            userData && userData.profilePictureUrl
              ? { uri: userData.profilePictureUrl }
              : defaultProfilePictureUrl
          }
          style={styles.userProfilePicture}
        />
        <Text style={styles.navButtonText}>Account</Text>
      </TouchableOpacity>

      <ImageUpload
        isVisible={isImageUploadVisible}
        onClose={() => setImageUploadVisible(false)}
      />

      <AchievementsModal
        isVisible={isAchievementsVisible}
        onClose={() => setAchievementsVisible(false)}
      />
    </View>
  );
};

export default BottomNavbar;
