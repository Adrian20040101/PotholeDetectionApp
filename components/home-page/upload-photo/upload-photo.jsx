import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, ActivityIndicator, TextInput, Button, FlatList } from 'react-native';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from 'expo-image-picker';
import { toast } from 'react-toastify';
import { storage } from '../../../config/firebase/firebase-config';
import { auth } from '../../../config/firebase/firebase-config';
import { db } from '../../../config/firebase/firebase-config';
import { collection, addDoc } from 'firebase/firestore';
import styles from './upload-photo.style';

const ImageUpload = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadURL, setUploadURL] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const user = auth.currentUser;
  const anonymousUsername = 'Anonymous User';

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        toast.error('Sorry, we need camera permissions to make this work!');
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        toast.error('Sorry, we need gallery permissions to make this work!');
      }
    })();
  }, []);

  const saveMarkerToFirestore = async (lat, lng, imageUrl) => {
    try {
      const markersCollectionRef = collection(db, 'markers');
      const user = auth.currentUser;
      await addDoc(markersCollectionRef, {
        lat: lat,
        lon: lng,
        timestamp: new Date(),
        userId: user.uid,
        username: user.isAnonymous ? anonymousUsername : user.displayName,
        userProfilePicture: user.isAnonymous ? 'https://www.shutterstock.com/image-vector/user-profile-icon-vector-avatar-600nw-2247726673.jpg' : user.photoURL,
        imageUrl: imageUrl,
        upvotes: 0,
        downvotes: 0
      });
  
      console.log('Marker saved to Firestore:', { lat, lng, imageUrl });
    } catch (error) {
      console.error("Error saving marker to Firestore:", error);
    }
  };

  const fetchSuggestions = async (input) => {
    try {
      const response = await fetch(`https://road-guard.netlify.app/.netlify/functions/address_autocomplete?input=${encodeURIComponent(input)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const geocodeAddress = async (address) => {
    try {
      const response = await fetch(`https://road-guard.netlify.app/.netlify/functions/address_coordinates?address=${encodeURIComponent(address)}`);
      if (!response.ok) {
        throw new Error('Failed to geocode address');
      }
      const location = await response.json();
      setLatitude(location.lat);
      setLongitude(location.lng);
      return location;
    } catch (error) {
      console.error('Error geocoding address:', error);
      toast.error('Failed to geocode address. Please try again.');
      return null;
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
                    saveMarkerToFirestore(lat, lng, imageUrl);
                    setLatitude(lat);
                    setLongitude(lng);
                    return { lat, lng };
                } else {
                    console.warn('Invalid GPS location detected, manual address input needed.');
                    toast.warning('Invalid GPS location detected, manual address input needed.');
                    setShowAddressModal(true);
                    return null;
                }
            } else {
                console.warn('No GPS location detected, manual address input needed.');
                toast.warning('No GPS location detected, manual address input needed.');
                setShowAddressModal(true);
                return null;
            }
        } else {
            toast.info("No pothole detected.");
            return null;
        }
    } catch (error) {
        console.error('Error triggering serverless function:', error.stack || error);
        toast.error("Image analysis failed, please try again.");
        return null;
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
  

const handleAddressSubmit = async () => {
  if (address) {
      const location = await geocodeAddress(address);
      if (location) {
          if (selectedImage) {
              const downloadURL = await uploadImageToFirebase(selectedImage);
              if (downloadURL) {
                  saveMarkerToFirestore(location.lat, location.lng, downloadURL);
                  setShowAddressModal(false);
              } else {
                  toast.error('Failed to upload image.');
              }
          } else {
              toast.error('No image selected.');
          }
      } else {
          setShowAddressModal(true);
      }
  } else {
      toast.error('Please enter an address.');
  }
};


  const handleAddressChange = (text) => {
    setAddress(text);
    if (text.length > 2) {
      fetchSuggestions(text);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    setAddress(suggestion.description);
    setSuggestions([]);
  };

  const handleImageSelection = async (uri) => {
    setSelectedImage(uri);
    const downloadURL = await uploadImageToFirebase(uri);
    const coordinates = await triggerServerlessFunction(downloadURL);
    if (coordinates === null && showAddressModal) {
        setShowAddressModal(true);
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
        await handleImageSelection(uri);
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
        const storageRef = ref(storage, `images/${user.uid}/${fileName}`);
        const snapshot = await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log('File available at', downloadURL);

        return downloadURL;
    } catch (error) {
        console.error("Error uploading image:", error);
        toast.error("Upload failed, please try again.");
        return null;
    }
  };


  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={selectFromGallery} 
        style={[styles.button, isHovered && styles.buttonHover]}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Image
          source={{ uri: 'https://img.icons8.com/material-outlined/24/000000/upload--v1.png' }}
          style={styles.icon}
        />
        <Text style={styles.text}>CLICK HERE TO SELECT A FILE</Text>
      </TouchableOpacity>

      {uploading && <ActivityIndicator size="large" color="#0000ff" />}
      {analyzing && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#ff0000" /> 
          <Text style={{ color: '#fff', marginTop: 10 }}>Analyzing Image...</Text>
        </View>
      )}

      <Modal
        transparent={true}
        visible={showAddressModal}
        onRequestClose={() => setShowAddressModal(false)}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text>Please enter the location address:</Text>
            <TextInput 
              style={styles.modalInput} 
              placeholder="Address" 
              value={address}
              onChangeText={handleAddressChange}
            />
            {suggestions.length > 0 && (
              <FlatList
                data={suggestions}
                keyExtractor={(item) => item.place_id}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => handleSuggestionSelect(item)}>
                    <Text style={styles.suggestionItem}>{item.description}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            <Button title="Submit" onPress={handleAddressSubmit} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ImageUpload;
