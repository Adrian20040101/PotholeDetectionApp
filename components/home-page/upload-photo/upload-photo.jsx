import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, Image, Alert, Modal } from 'react-native';
import styles from './upload-photo.style';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';

const ImageUpload = () => {
  const [imageUri, setImageUri] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [cameraVisible, setCameraVisible] = useState(false);
  const cameraRef = useRef(null);

  const selectImageFromGallery = () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
    };
    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else {
        const uri = response.assets[0].uri;
        setImageUri(uri);
      }
    });
  };

  const takePhoto = async () => {
    if (cameraPermission === null) {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setCameraPermission(status === 'granted');
      if (status !== 'granted') {
        Alert.alert('Camera permission not granted');
        return;
      }
    }
    setCameraVisible(true);
  };

  const capturePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setImageUri(photo.uri);
      setCameraVisible(false);
    }
  };

  const closeCamera = () => {
    setCameraVisible(false);
  };

  return (
    <View style={styles.container}>
      <Button title="Select from Gallery" onPress={selectImageFromGallery} />
      <Button title="Take a Photo" onPress={takePhoto} />
      {cameraVisible && (
        <Modal visible={cameraVisible} animationType="slide">
          <View style={styles.cameraContainer}>
            <Camera style={styles.camera} ref={cameraRef}>
              <View style={styles.cameraControls}>
                <Button title="Capture" onPress={capturePhoto} />
                <Button title="Close" onPress={closeCamera} />
              </View>
            </Camera>
          </View>
        </Modal>
      )}
      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
    </View>
  );
};

export default ImageUpload;
