import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, ActivityIndicator, TextInput, FlatList, Animated, Easing, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { storage, db } from '../../../config/firebase/firebase-config';
import { collection, addDoc } from 'firebase/firestore';
import { useUser } from '../../../context-components/user-context';
import { debounce } from 'lodash';
import styles from './upload-photo.style';

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

const API_ENDPOINTS = {
  ADDRESS_AUTOCOMPLETE:
    'https://road-guard.netlify.app/.netlify/functions/address_autocomplete',
  ADDRESS_COORDINATES:
    'https://road-guard.netlify.app/.netlify/functions/address_coordinates',
  REVERSE_GEOCODING:
    'https://road-guard.netlify.app/.netlify/functions/reverse_geocoding',
  IMAGE_ANALYSIS:
    'https://europe-central2-pothole-detection-1d63b.cloudfunctions.net/image-analysis',
};

const ImageUpload = ({ isVisible, onClose }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showAddressInput, setShowAddressInput] = useState(false);

  const overlayAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const { userData, isAnonymous } = useUser();

  useEffect(() => {
    (async () => {
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      const mediaStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const allGranted =
        cameraStatus.status === 'granted' && mediaStatus.status === 'granted';
      setHasPermission(allGranted);
      if (!allGranted) {
        Toast.show({
          type: 'error',
          text1: 'Permission Denied',
          text2:
            'Sorry, we need camera and gallery permissions to make this work!',
        });
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

  const handleClose = useCallback(() => {
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
      setSelectedImage(null);
      setAddress('');
      setSuggestions([]);
      setShowAddressInput(false);
    });
  }, [onClose, overlayAnim, scaleAnim]);

  const saveMarkerToFirestore = async (lat, lng, imageUrl, placeId) => {
    try {
      const markersCollectionRef = collection(db, 'markers');

      await addDoc(markersCollectionRef, {
        lat: lat,
        lon: lng,
        timestamp: new Date(),
        userId: isAnonymous ? 'anonymous' : userData.uid,
        imageUrl: imageUrl,
        upvotes: 0,
        downvotes: 0,
        status: 'pending',
        placeId: placeId || null,
      });

      console.log('Marker saved to Firestore:', { lat, lng, imageUrl, placeId });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Pothole report submitted successfully!',
      });
      setSelectedImage(null);
      handleClose();
    } catch (error) {
      console.error('Error saving marker to Firestore:', error);
      Toast.show({
        type: 'error',
        text1: 'Firestore Error',
        text2: 'Failed to save marker. Please try again.',
      });
    }
  };

  const fetchSuggestions = async (input) => {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.ADDRESS_AUTOCOMPLETE}?input=${encodeURIComponent(
          input
        )}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      Toast.show({
        type: 'error',
        text1: 'Fetch Error',
        text2: 'Failed to fetch address suggestions.',
      });
    }
  };

  const debouncedFetchSuggestions = useCallback(
    debounce(fetchSuggestions, 300),
    []
  );

  const geocodeAddress = async (address) => {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.ADDRESS_COORDINATES}?address=${encodeURIComponent(
          address
        )}`
      );
      if (!response.ok) {
        throw new Error('Failed to geocode address');
      }
      const location = await response.json();
      return location;
    } catch (error) {
      console.error('Error geocoding address:', error);
      Toast.show({
        type: 'error',
        text1: 'Geocoding Error',
        text2: 'Failed to geocode address. Please try again.',
      });
      return null;
    }
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.REVERSE_GEOCODING}?lat=${latitude}&lng=${longitude}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error fetching location:', errorText);
        return null;
      }

      const data = await response.json();
      return data.placeId;
    } catch (error) {
      console.error('Error fetching location:', error);
      Toast.show({
        type: 'error',
        text1: 'Reverse Geocoding Error',
        text2: 'Failed to retrieve location data.',
      });
      return null;
    }
  };

  const triggerServerlessFunction = async (imageUrl) => {
    setAnalyzing(true);

    try {
      const response = await fetch(API_ENDPOINTS.IMAGE_ANALYSIS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });

      console.log('Serverless function response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          'Serverless function failed with response text:',
          errorText
        );
        throw new Error(`Serverless function failed: ${errorText}`);
      }

      const result = await response.json();
      console.log('Analysis result:', result);

      if (result.pothole_detected) {
        Toast.show({
          type: 'success',
          text1: 'Pothole Detected',
          text2: result.message,
        });

        if (result.coordinates) {
          const [lat, lng] = result.coordinates;
          const placeId = await reverseGeocode(lat, lng);

          if (isValidCoordinates(lat, lng)) {
            console.log('Valid coordinates received:', result.coordinates);
            saveMarkerToFirestore(lat, lng, imageUrl, placeId);
            return { lat, lng };
          } else {
            console.warn(
              'Invalid GPS location detected, manual address input needed.'
            );
            Toast.show({
              type: 'info',
              text1: 'Invalid Location',
              text2: 'Manual address input is required.',
            });
            setShowAddressInput(true);
            return null;
          }
        } else {
          console.warn('No GPS location detected, manual address input needed.');
          Toast.show({
            type: 'info',
            text1: 'No GPS Data',
            text2: 'Please enter the address manually.',
          });
          setShowAddressInput(true);
          return null;
        }
      } else {
        Toast.show({
          type: 'info',
          text1: 'No Pothole Detected',
          text2: 'No pothole detected in the uploaded image.',
        });
        handleClose();
        setSelectedImage(null);
        return null;
      }
    } catch (error) {
      console.error('Error triggering serverless function:', error.stack || error);
      Toast.show({
        type: 'error',
        text1: 'Analysis Error',
        text2: 'Image analysis failed. Please try again.',
      });
      return null;
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAddressSubmit = async () => {
    if (address) {
      const location = await geocodeAddress(address);
      if (location) {
        if (selectedImage) {
          const downloadURL = await uploadImageToFirebase(selectedImage);
          if (downloadURL) {
            saveMarkerToFirestore(
              location.lat,
              location.lng,
              downloadURL,
              location.placeId
            );
            setShowAddressInput(false);
          } else {
            Toast.show({
              type: 'error',
              text1: 'Upload Failed',
              text2: 'Failed to upload image.',
            });
          }
        } else {
          Toast.show({
            type: 'error',
            text1: 'No Image Selected',
            text2: 'Please select an image to upload.',
          });
        }
      } else {
        setShowAddressInput(true);
      }
    } else {
      Toast.show({
        type: 'error',
        text1: 'Address Required',
        text2: 'Please enter an address.',
      });
    }
  };

  const handleAddressChange = (text) => {
    setAddress(text);
    if (text.length > 2) {
      debouncedFetchSuggestions(text);
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
    if (downloadURL) {
      await triggerServerlessFunction(downloadURL);
    }
  };

  const selectFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled) {
        const uri =
          result.uri ||
          (result.assets && result.assets[0] && result.assets[0].uri);
        if (uri) {
          await handleImageSelection(uri);
        } else {
          console.error('Error: Image URI is undefined');
          Toast.show({
            type: 'error',
            text1: 'Selection Error',
            text2: 'Failed to retrieve image URI.',
          });
        }
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Toast.show({
        type: 'error',
        text1: 'Selection Error',
        text2: 'An error occurred while selecting the image.',
      });
    }
  };

  const uploadImageToFirebase = async (uri) => {
    if (!userData) {
      Toast.show({
        type: 'error',
        text1: 'User Not Authenticated',
        text2: 'Please log in to upload images.',
      });
      return null;
    }

    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = uri.substring(uri.lastIndexOf('/') + 1);
      const storageRef = ref(storage, `images/${userData.uid}/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, blob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload is ${progress}% done`);
            setUploading(true);
          },
          (error) => {
            console.error('Upload failed:', error);
            Toast.show({
              type: 'error',
              text1: 'Upload Failed',
              text2: 'Failed to upload image. Please try again.',
            });
            setUploading(false);
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('File available at', downloadURL);
            setUploading(false);
            resolve(downloadURL);
          }
        );
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      Toast.show({
        type: 'error',
        text1: 'Upload Error',
        text2: 'An error occurred while uploading the image.',
      });
      setUploading(false);
      return null;
    }
  };

  return (
    <Modal transparent visible={isVisible} animationType="none">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Animated.View
          style={[styles.modalContainer, { transform: [{ scale: scaleAnim }] }]}
        >
          <Pressable
            style={styles.closeIcon}
            onPress={handleClose}
            accessibilityLabel="Close Modal"
          >
            <Icon name="close" size={24} color="#333" />
          </Pressable>

          <Text style={styles.modalTitle}>Upload an Image</Text>

          {!analyzing && !showAddressInput && !uploading && (
            <>
              <Text style={styles.infoText}>
                Share a photo of the pothole, and our system will evaluate its
                severity and accurately pinpoint its location. To ensure precise
                mapping, please enable location tags on your photos.
              </Text>

              <TouchableOpacity
                style={styles.uploadButton}
                onPress={selectFromGallery}
                accessibilityLabel="Select Image from Gallery"
              >
                <Icon
                  name="photo-library"
                  size={20}
                  color="#fff"
                  style={styles.uploadIcon}
                />
                <Text style={styles.uploadButtonText}>
                  Select Image from Gallery
                </Text>
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

          {selectedImage && !uploading && !analyzing && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.previewImage}
              resizeMode="contain"
              accessibilityLabel="Selected Image Preview"
            />
          )}

          {showAddressInput && (
            <View style={styles.addressInputContainer}>
              <Text style={styles.addressLabel}>Enter Location Address:</Text>
              <TextInput
                style={styles.input}
                placeholder="Address"
                value={address}
                onChangeText={handleAddressChange}
                accessibilityLabel="Address Input"
                returnKeyType="done"
                onSubmitEditing={handleAddressSubmit}
              />
              {suggestions.length > 0 && (
                <FlatList
                  data={suggestions}
                  keyExtractor={(item) => item.place_id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => handleSuggestionSelect(item)}
                      style={styles.suggestionItemContainer}
                      accessibilityLabel={`Suggestion: ${item.description}`}
                    >
                      <Icon name="location-on" size={20} color="#555" />
                      <Text style={styles.suggestionItem}>
                        {item.description}
                      </Text>
                    </TouchableOpacity>
                  )}
                  keyboardShouldPersistTaps="handled"
                  style={styles.suggestionsList}
                />
              )}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddressSubmit}
                accessibilityLabel="Submit Address"
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
      <Toast ref={(ref) => Toast.setRef(ref)} />
    </Modal>
  );
};

export default ImageUpload;