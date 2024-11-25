import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Image } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import ImageUpload from '../upload-photo/upload-photo';
import styles from './bottom-navbar.style';
import { useUser } from '../../../context-components/user-context';

const BottomNavbar = ({ onAccountPress }) => {
  const { userData } = useUser();
  const [isImageUploadVisible, setImageUploadVisible] = useState(false);

  const handleImportPress = () => {
    setImageUploadVisible(true);
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

      <TouchableOpacity style={styles.navButton} onPress={() => console.log('Achievements button pressed')}>
        <FontAwesome name="trophy" size={30} color="#fff" />
        <Text style={styles.navButtonText}>Achievements</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navButton} onPress={onAccountPress}>
        <Image source={{ uri: userData.profilePictureUrl }} style={styles.userProfilePicture} />
        <Text style={styles.navButtonText}>Account</Text>
      </TouchableOpacity>

      <ImageUpload
        isVisible={isImageUploadVisible}
        onClose={() => setImageUploadVisible(false)}
      />
    </View>
  );
};

export default BottomNavbar;
