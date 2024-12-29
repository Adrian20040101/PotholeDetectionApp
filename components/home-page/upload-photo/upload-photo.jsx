import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, ActivityIndicator, TextInput, TouchableWithoutFeedback, FlatList, Animated, Easing, Pressable } from 'react-native';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from 'expo-image-picker';
import { toast } from 'react-toastify';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { storage } from '../../../config/firebase/firebase-config';
import { auth } from '../../../config/firebase/firebase-config';
import { db } from '../../../config/firebase/firebase-config';
import { collection, addDoc } from 'firebase/firestore';
import styles from './upload-photo.style';

const ImageUpload = ({ isVisible, onClose }) => {
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
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
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
    if (isVisible) {
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
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
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, overlayAnim, scaleAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.inOut(Easing.ease),
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
  };

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        toast.error('Sorry, we need gallery permissions to make this work!');
      }
    })();
  }, []);

  const saveMarkerToFirestore = async (lat, lng, imageUrl, placeId) => {
    try {
      const markersCollectionRef = collection(db, 'markers');
      const user = auth.currentUser;
      
      await addDoc(markersCollectionRef, {
        lat: lat,
        lon: lng,
        timestamp: new Date(),
        userId: user.uid,
        imageUrl: imageUrl,
        upvotes: 0,
        downvotes: 0,
        status: 'pending',
        placeId: placeId || null,
      });
  
      console.log('Marker saved to Firestore:', { lat, lng, imageUrl, placeId });
      toast.success('Pothole report submitted successfully!');
      setSelectedImage(null);
      handleClose();
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

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://road-guard.netlify.app/.netlify/functions/reverse_geocoding?lat=${latitude}&lng=${longitude}`
      );
  
      if (!response.ok) {
        console.error('Error fetching location:', data.message);
        return null;
      }

      const data = await response.json();
      return data.placeId;
      
    } catch (error) {
      console.error('Error fetching location:', error);
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
                const placeId = await reverseGeocode(lat, lng);

                if (isValidCoordinates(lat, lng)) {
                    console.log('Valid coordinates received:', result.coordinates);
                    saveMarkerToFirestore(lat, lng, imageUrl, placeId);
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
            handleClose();
            setSelectedImage(null);
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
                  saveMarkerToFirestore(location.lat, location.lng, downloadURL, location.placeId);
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
    <Modal transparent visible={isVisible}>
      <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
        <Animated.View style={[styles.modalContainer, { transform: [{ scale: scaleAnim }] }]}>
          <Pressable style={styles.closeIcon} onPress={handleClose} accessibilityLabel="Close Modal">
            <Icon name="close" size={24} color="#333" />
          </Pressable>
          
          <Text style={styles.modalTitle}>Upload an Image</Text>
          
          {!analyzing && !showAddressModal && !uploading && (
            <>
              <Text style={styles.infoText}>
                Share a photo of the pothole, and our system will evaluate its severity and accurately pinpoint its location. To ensure precise mapping, please enable location tags on your photos.
              </Text>
              
              <TouchableOpacity style={styles.uploadButton} onPress={selectFromGallery} accessibilityLabel="Select Image from Gallery">
                <Icon name="photo-library" size={20} color="#fff" style={styles.uploadIcon} />
                <Text style={styles.uploadButtonText}>Select Image from Gallery</Text>
              </TouchableOpacity>
            </>
          )}
          
          {uploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.uploadingText}>Uploading Image...</Text>
            </View>
          )}
          
          {analyzing && (
            <View style={styles.analyzingContainer}>
              <ActivityIndicator size="large" color="#ff0000" />
              <Text style={styles.analyzingText}>Analyzing Image...</Text>
            </View>
          )}
          
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
          )}
          
          {showAddressModal && (
            <View style={styles.addressInputContainer}>
              <Text style={styles.addressLabel}>Enter Location Address:</Text>
              <TextInput
                style={styles.input}
                placeholder="Address"
                value={address}
                onChangeText={handleAddressChange}
                accessibilityLabel="Address Input"
              />
              {suggestions.length > 0 && (
                <FlatList
                  data={suggestions}
                  keyExtractor={(item) => item.place_id}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handleSuggestionSelect(item)} style={styles.suggestionItemContainer}>
                      <Icon name="location-on" size={20} color="#555" />
                      <Text style={styles.suggestionItem}>{item.description}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
              <Pressable style={styles.submitButton} onPress={handleAddressSubmit} accessibilityLabel="Submit Address">
                <Text style={styles.submitButtonText}>Submit</Text>
              </Pressable>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default ImageUpload;
