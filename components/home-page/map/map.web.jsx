import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { GOOGLE_API_KEY } from '@env';
import { collection, getDocs, getDoc, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../../config/firebase/firebase-config";
import styles from './map.style';
import { useUser } from '../../../context-components/user-context';

const containerStyle = {
  width: '100%',
  height: '400px',
};

const initialCenter = {
  lat: 40.730610,
  lng: -73.935242,
};

const Map = ({ city }) => {
  const [center, setCenter] = useState(initialCenter);
  const [zoom, setZoom] = useState(12);
  const [loading, setLoading] = useState(true);
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const { userData } = useUser();
  const anonymousUserProfilePicture = '../../../assets/images/default-profile-picture.webp';
  const anonymousUsername = 'Anonymous User';

  useEffect(() => {
    const fetchCoordinates = async (cityName) => {
      try {
        setLoading(true);
        const response = await fetch(`https://road-guard.netlify.app/.netlify/functions/city_coordinates?city=${encodeURIComponent(cityName)}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.lat && data.lng) {
          setCenter({ lat: data.lat, lng: data.lng });
        } else {
          throw new Error('Location data is incomplete.');
        }
      } catch (error) {
        console.error('Error fetching location:', error);
        setCenter(initialCenter);
      } finally {
        setLoading(false);
      }
    };

    if (city) {
      fetchCoordinates(city);
    } else {
      setCenter(initialCenter);
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    const fetchMarkers = async () => {
      try {
        const markersCollection = collection(db, 'markers');
        const markerSnapshot = await getDocs(markersCollection);
  
        const markersList = await Promise.all(
          markerSnapshot.docs.map(async (markerDoc) => {
            const markerData = markerDoc.data();
  
            if (!markerData.userId) {
              console.warn(`Marker ${markerDoc.id} is missing user UID.`);
              return null;
            }
  
            try {
              const userDocRef = doc(db, 'users', markerData.userId);
              const userDoc = await getDoc(userDocRef);
              const userData = userDoc.exists() ? userDoc.data() : {};
  
              return {
                id: markerDoc.id,
                ...markerData,
                username: userData.username || anonymousUsername,
                userProfilePicture: userData.profilePictureUrl || anonymousUserProfilePicture,
              };
            } catch (error) {
              console.error(`Error fetching user data for UID ${markerData.userId}:`, error);
              return null;
            }
          })
        );
  
        const validMarkers = markersList.filter(marker => marker !== null);
        setMarkers(validMarkers);
      } catch (error) {
        console.error("Error fetching markers from Firestore:", error);
      }
    };
  
    fetchMarkers();
  }, []);
  

  const handleVote = async (markerId, type) => {
    const markerRef = doc(db, 'markers', markerId);
    const markerDoc = await getDoc(markerRef);

    if (markerDoc.exists()) {
      const markerData = markerDoc.data();
      const updatedVotes = {
        upvotes: type === 'upvote' ? markerData.upvotes + 1 : markerData.upvotes,
        downvotes: type === 'downvote' ? markerData.downvotes + 1 : markerData.downvotes,
      };
      await updateDoc(markerRef, updatedVotes);
      setMarkers(markers.map(marker => marker.id === markerId ? { ...marker, ...updatedVotes } : marker));
    }
  };

  const handleMarkerClick = (marker) => {
    setSelectedMarker(marker);
  };

  const handleInfoWindowClose = () => {
    setSelectedMarker(null);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Loading map...</Text>
        </View>
      ) : (
        <LoadScript googleMapsApiKey={GOOGLE_API_KEY}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={zoom}
          >
            {markers.map((marker) => (
              <Marker
                key={marker.id}
                position={{ lat: marker.lat, lng: marker.lon }}
                onClick={() => handleMarkerClick(marker)}
              />
            ))}

            {selectedMarker && (
              <InfoWindow
                position={{ lat: selectedMarker.lat, lng: selectedMarker.lon }}
                onCloseClick={handleInfoWindowClose}
                headerContent={ // Adding the header content here
                  <View style={styles.infoHeader}>
                    <Text style={styles.headerTitle}>{selectedMarker.title || "Marker Title"}</Text>
                  </View>
                }
              >
                <View style={styles.infoWindow}>
                  <View style={styles.infoHeader}>
                    <Image 
                      source={{ uri: selectedMarker.userProfilePicture || anonymousUserProfilePicture }}
                      style={styles.profilePicture} 
                    />
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{selectedMarker.username || anonymousUsername}</Text>
                      <Text style={styles.timestamp}>{new Date(selectedMarker.timestamp.seconds * 1000).toLocaleString()}</Text>
                    </View>
                  </View>
                  <Image source={{ uri: selectedMarker.imageUrl }} style={styles.uploadedImage} />
                  <View style={styles.votingContainer}>
                    <TouchableOpacity onPress={() => handleVote(selectedMarker.id, 'upvote')}>
                      <Text style={styles.upvoteButton}>👍 {selectedMarker.upvotes}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleVote(selectedMarker.id, 'downvote')}>
                      <Text style={styles.downvoteButton}>👎 {selectedMarker.downvotes}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </InfoWindow>
            )}
          </GoogleMap>
        </LoadScript>
      )}
    </View>
  );
};

export default Map;
