import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, Alert, ActivityIndicator } from 'react-native';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { toast } from 'react-toastify';
import { storage } from '../../../config/firebase/firebase-config';
import { auth } from '../../../config/firebase/firebase-config';
import styles from './upload-photo.style';

const ImageUpload = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraType, setCameraType] = useState(ImagePicker.CameraType.back);
  const [zoom, setZoom] = useState(0);
  const cameraRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadURL, setUploadURL] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const lastPinchDistance = useRef(null);
  const user = auth.currentUser;

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        toast.error('Sorry, we need camera permissions to make this work!');
      }
    })();
  }, []);

  const triggerServerlessFunction = async (imageUrl) => {
    setAnalyzing(true);
    try {
      const response = await fetch('https://road-guard.netlify.app/.netlify/functions/image_analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        throw new Error('Serverless function failed');
      }

      const result = await response.json();
      console.log('Analysis result:', result);
      toast.success("Image analysis complete.");
    } catch (error) {
      console.error('Error triggering serverless function:', error);
      toast.error("Image analysis failed", "Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const takePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setSelectedImage(photo.uri);
      setIsCameraActive(false);
      await uploadImageToFirebase(photo.uri);
      toast.success('Photo captured and uploaded successfully!');
    }
  };

  const selectFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
  
    if (!result.canceled) {
      const uri = result.uri || (result.assets && result.assets[0] && result.assets[0].uri);
      if (uri) {
        await uploadImageToFirebase(uri);
        toast.success('Photo uplaoded successfully!')
      } else {
        console.error('Error: Image URI is undefined');
      }
    }
  };
  

  const uploadImageToFirebase = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = uri.substring(uri.lastIndexOf('/') + 1);
      let storageRef;
      if (user) {
        storageRef = ref(storage, `images/${user.uid}/${fileName}`);
      } else {
        storageRef = ref(storage, `images/anonymous-user/${fileName}`);
      }
      const snapshot = await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('File available at', downloadURL);
      await triggerServerlessFunction(downloadURL);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Upload failed", "Please try again.");
    }
  };

  const toggleCameraType = () => {
    setCameraType((prevType) =>
      prevType === ImagePicker.CameraType.back
        ? ImagePicker.CameraType.front
        : ImagePicker.CameraType.back
    );
  };

  const closeCamera = () => {
    setIsCameraActive(false);
    setZoom(0); 
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

      {uploading && <ActivityIndicator size="large" color="#0000ff" />}
      {analyzing && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#ff0000" /> 
          <Text style={styles.analyzingText}>Analyzing Image...</Text>
        </View>
      )}

      {isCameraActive && hasPermission && (
        <Modal
          animationType="slide"
          transparent={false}
          visible={isCameraActive}
          onRequestClose={closeCamera}
        >
          <View style={styles.cameraContainer}>
            <CameraView
              key={cameraType}
              style={styles.camera}
              type={cameraType}
              ref={cameraRef}
              zoom={zoom}
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
                  onPress={closeCamera}
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
