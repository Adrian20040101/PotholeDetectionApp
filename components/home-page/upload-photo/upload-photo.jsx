import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, Alert, PanResponder } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import styles from './upload-photo.style';

const ImageUpload = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
  const [zoom, setZoom] = useState(0);
  const cameraRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const lastPinchDistance = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        Alert.alert('Sorry, we need camera permissions to make this work!');
      }
    })();
  }, []);

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

    if (!result.canceled) {
      setSelectedImage(result.uri);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) =>
        gestureState.numberActiveTouches === 2, // only respond to touches when two fingers are active
      onMoveShouldSetPanResponder: (evt, gestureState) =>
        gestureState.numberActiveTouches === 2,
      onPanResponderGrant: () => {
        lastPinchDistance.current = null;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.numberActiveTouches === 2) {
          const touches = evt.nativeEvent.touches;
          const pinchDistance = Math.sqrt(
            Math.pow(touches[0].pageX - touches[1].pageX, 2) +
              Math.pow(touches[0].pageY - touches[1].pageY, 2)
          );

          if (lastPinchDistance.current !== null) {
            const zoomChange = (pinchDistance - lastPinchDistance.current) / 400;
            let newZoom = zoom + zoomChange;
            if (newZoom < 0) newZoom = 0;
            if (newZoom > 1) newZoom = 1;
            setZoom(newZoom);
          }

          lastPinchDistance.current = pinchDistance;
        }
      },
      onPanResponderRelease: () => {
        lastPinchDistance.current = null;
      },
    })
  ).current;

  const toggleCameraType = () => {
    setCameraType(
      cameraType === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
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

      <TouchableOpacity onPress={() => setIsCameraActive(true)} style={styles.button}>
        <Image
          source={{ uri: 'https://img.icons8.com/material-outlined/24/000000/camera--v1.png' }}
          style={styles.icon}
        />
        <Text style={styles.text}>CLICK HERE TO TAKE A PHOTO</Text>
      </TouchableOpacity>

      {selectedImage && (
        <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
      )}

      {isCameraActive && hasPermission && (
        <Modal
          animationType="slide"
          transparent={false}
          visible={isCameraActive}
          onRequestClose={() => setIsCameraActive(false)}
        >
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              type={cameraType}
              ref={cameraRef}
              zoom={zoom}
              {...panResponder.panHandlers}
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
                  onPress={toggleCameraType}
                >
                  <Text style={styles.cameraButtonText}>Flip</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={() => setIsCameraActive(false)}
                >
                  <Text style={styles.cameraButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </CameraView>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default ImageUpload;
