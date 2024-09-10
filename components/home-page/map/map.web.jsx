import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { GoogleMap, LoadScript, Marker, InfoWindow, InfoBox } from '@react-google-maps/api';
import { GOOGLE_API_KEY } from '@env';
import { collection, getDocs, getDoc, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../../config/firebase/firebase-config";
import { FontAwesome } from '@expo/vector-icons';
import styles from './map.style';
import { useUser } from '../../../context-components/user-context';
import Voting from './voting/votes';

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


  const getMarkerIcon = (status) => {
    switch (status) {
      case 'pending':
        return 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
      case 'validated':
        return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
      case 'rejected':
        return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
      default:
        return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
    }
  };

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
  

  const handleMarkerClick = (marker) => {
    setSelectedMarker(marker);
  };

  const handleInfoBoxClose = () => {
    setSelectedMarker(null);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading map...</Text>
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
              <InfoBox
              position={{ lat: selectedMarker.lat, lng: selectedMarker.lon }}
              options={{
                closeBoxURL: '',
                pixelOffset: new window.google.maps.Size(-140, -275),
              }}
            >
              <div style={{
                width: '250px',
                padding: '10px',
                backgroundColor: 'white',
                boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                fontSize: '14px',
                position: 'relative',
              }}>
                <div onClick={handleInfoBoxClose} style={{
                  position: 'absolute',
                  top: '5px',
                  right: '10px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#888'
                }}>
                  X
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <img src={selectedMarker.userProfilePicture} style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '10px' }} alt="profile" />
                  <div>
                    <strong>{selectedMarker.username}</strong>
                    <div style={{ color: '#888', fontSize: '12px' }}>{new Date(selectedMarker.timestamp.seconds * 1000).toLocaleString()}</div>
                  </div>
                </div>
                <img src={selectedMarker.imageUrl} style={{ width: '100%', height: '100px', borderRadius: '5px', objectFit: 'cover', marginBottom: '10px' }} alt="pothole" />
                <div>Status: <strong>{selectedMarker.status}</strong></div>

                <Voting markerId={selectedMarker.id} />
              </div>
            </InfoBox>
            )}
          </GoogleMap>
        </LoadScript>
      )}
    </View>
  );
};

export default Map;