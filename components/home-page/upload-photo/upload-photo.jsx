import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, Alert, ActivityIndicator, TextInput, Button } from 'react-native';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { toast } from 'react-toastify';
import { storage } from '../../../config/firebase/firebase-config';
import { auth } from '../../../config/firebase/firebase-config';
import { db } from '../../../config/firebase/firebase-config';
import { collection, addDoc } from 'firebase/firestore';
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
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [manualInputNeeded, setManualInputNeeded] = useState(false);
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

  const saveMarkerToFirestore = async (lat, lng) => {
    try {
      const markersCollectionRef = collection(db, 'markers');
      await addDoc(markersCollectionRef, {
        lat: lat,
        lon: lng,
        timestamp: new Date(),
        setUserId: auth.currentUser.uid
      });
  
      console.log('Marker saved to Firestore:', { lat, lng });
    } catch (error) {
      console.error("Error saving marker to Firestore:", error);
    }
  };

  const triggerServerlessFunction = async (imageUrl) => {
    setAnalyzing(true);

    try {
        const response = await fetch('https://europe-central2-pothole-detection-430514.cloudfunctions.net/image-analysis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ imageUrl }),
            mode: 'cors'
        });

        console.log('Serverless function response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Serverless function failed with response text:', errorText);
            throw new Error(`Serverless function failed: ${errorText}`);
        }

        const result = await response.json();
        console.log('Analysis result:', result);

        if (result.pothole_detected) {
            toast.success(result.message);

            if (result.coordinates) {
                const [lat, lng] = result.coordinates;

                if (isValidCoordinates(lat, lng)) {
                    console.log('Valid coordinates received:', result.coordinates);
                    saveMarkerToFirestore(lat, lng);
                } else {
                    console.warn('Invalid GPS location detected, manual input needed.');
                    toast.warning('Invalid GPS location detected, manual input needed.');
                    setManualInputNeeded(true);
                }
            } else {
                console.warn('No GPS location detected, manual input needed.');
                toast.warning('No GPS location detected, manual input needed.');
                setManualInputNeeded(true);
            }
        } else {
            toast.info(result.message);
        }
    } catch (error) {
        console.error('Error triggering serverless function:', error.stack || error);
        toast.error("Image analysis failed, please try again.");
    } finally {
        setAnalyzing(false);
    }
};

const isValidCoordinates = (lat, lng) => {
    if (typeof lat !== 'number' || typeof lng !== 'number') {
        return false;
    }
    if (isNaN(lat) || isNaN(lng)) {
        return false;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return false;
    }
    return true;
};
  
  
  const handleManualLocationSubmit = async () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (!isNaN(lat) && !isNaN(lng)) {
        saveMarkerToFirestore(lat, lng);
        setManualInputNeeded(false);
        setLatitude('');
        setLongitude('');

        if (selectedImage) {
            await uploadImageToFirebase(selectedImage);
        }
    } else {
        toast.error('Please enter valid latitude and longitude.');
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
  
    if (!result.canceled) {compont
      const uri = result.uri || (result.assets && result.assets[0] && result.assets[0].uri);
      if (uri) {
        setSelectedImage(uri);
        await uploadImageToFirebase(uri);
        toast.success('Photo uploaded successfully!')
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
          <Text style={{ color: '#fff', marginTop: 10 }}>Analyzing Image...</Text>
        </View>
      )}

      {manualInputNeeded && (
        <Modal
          transparent={true}
          visible={manualInputNeeded}
          onRequestClose={() => setManualInputNeeded(false)}
          animationType="fade"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text>Please enter the location manually:</Text>
              <TextInput 
                style={styles.modalInput} 
                placeholder="Latitude" 
                onChangeText={setLatitude}
                keyboardType='numeric'
              />
              <TextInput 
                style={styles.modalInput} 
                placeholder="Longitude" 
                onChangeText={setLongitude}
                keyboardType='numeric'
              />
              <Button title="Submit" onPress={handleManualLocationSubmit} />
            </View>
          </View>
        </Modal>
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
