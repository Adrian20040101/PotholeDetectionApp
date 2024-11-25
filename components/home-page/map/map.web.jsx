import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { GOOGLE_API_KEY } from '@env';
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { db } from "../../../config/firebase/firebase-config";
import { FontAwesome } from '@expo/vector-icons';
import BottomSheet from './bottom-sheet/bottom-sheet';
import styles from './map.style';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const initialCenter = {
  lat: 40.730610,
  lng: -73.935242,
};

const Map = ({ city, toggleSidebar, sidebarAnim, overlayAnim }) => {
  const [center, setCenter] = useState(initialCenter);
  const [zoom, setZoom] = useState(12);
  const [loading, setLoading] = useState(true);
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [isBottomSheetVisible, setBottomSheetVisible] = useState(false);
  const mapRef = useRef(null);
  const searchBoxRef = useRef(null);

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
    setBottomSheetVisible(true);
  };

  return (
    <View style={styles.container}>
      <LoadScript googleMapsApiKey={GOOGLE_API_KEY} libraries={["places"]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        ) : (
          <>
            {/* plain html text box (should be avoided but for now it'll do) */}
            <input
              type="text"
              ref={searchBoxRef}
              placeholder="Search for places"
              onKeyPress={(e) => e.key === 'Enter' && handlePlaceSelect()}
              style={{
                position: 'absolute',
                top: 10,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 3,
                padding: 8,
                borderRadius: 5,
                width: '60%',
                height: 20
              }}
            />
            <GoogleMap
              ref={mapRef}
              mapContainerStyle={containerStyle}
              options={{ mapTypeControl: false }}
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
            </GoogleMap>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={toggleSidebar}
            >
              <FontAwesome name="bars" size={24} color="#000" />
            </TouchableOpacity>
          </>
        )}
      </LoadScript>
      <BottomSheet
        visible={isBottomSheetVisible}
        onClose={() => setBottomSheetVisible(false)}
        marker={selectedMarker}
      />
    </View>
  );
};

export default Map;
