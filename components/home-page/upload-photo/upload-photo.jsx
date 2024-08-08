import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, Modal } from 'react-native';
import Slider from '@react-native-community/slider';
import styles from './upload-photo.style';
import * as ImagePicker from 'expo-image-picker';
import { CameraView } from 'expo-camera';

const ImageUpload = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraType, setCameraType] = useState(ImagePicker.CameraType.back);
  const [zoom, setZoom] = useState(0);
  const cameraRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
    if (status !== 'granted') {
      Alert.alert('Sorry, we need camera permissions to make this work!');
    } else {
      setIsCameraActive(true);
    }
  };

  const takePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setSelectedImage(photo.uri);
      setIsCameraActive(false);
    }
  };

  const selectFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.cancelled) {
      setSelectedImage(result.uri);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={selectFromGallery} style={styles.button}>
        <Image
          source={{ uri: 'https://img.icons8.com/material-outlined/24/000000/upload--v1.png' }}
          style={styles.icon}
        />
        <Text style={styles.text}>CLICK HERE TO SELECT A FILE</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={requestCameraPermission} style={styles.button}>
        <Image
          source={{ uri: 'https://img.icons8.com/material-outlined/24/000000/camera--v1.png' }}
          style={styles.icon}
        />
        <Text style={styles.text}>CLICK HERE TO TAKE A PHOTO</Text>
      </TouchableOpacity>

      {selectedImage && (
        <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
      )}

      {isCameraActive && (
        <Modal
          animationType="slide"
          transparent={false}
          visible={isCameraActive}
          onRequestClose={() => {
            Alert.alert("Camera has been closed.");
            setIsCameraActive(false);
          }}
        >
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              type={cameraType}
              zoom={zoom}
              ref={cameraRef}
            >
              <View style={styles.cameraControls}>
                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={takePhoto}
                >
                  <Text style={styles.cameraButtonText}>Capture</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={() => setIsCameraActive(false)}
                >
                  <Text style={styles.cameraButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.zoomControls}>
                <Text style={styles.zoomText}>Zoom</Text>
                <Slider
                  style={{ width: 200, height: 40 }}
                  minimumValue={0}
                  maximumValue={100}
                  value={zoom}
                  onValueChange={(value) => setZoom(value || 1)}
                  step={1}
                />
              </View>
            </CameraView>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default ImageUpload;
