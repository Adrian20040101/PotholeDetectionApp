import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { GOOGLE_API_KEY } from '@env';
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { db } from "../../../config/firebase/firebase-config";
import { FontAwesome } from '@expo/vector-icons';
import BottomSheet from './bottom-sheet/bottom-sheet';
import styles from './map.style';
import SearchBar from './search-bar/search-bar';

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

  const onMapLoad = (mapInstance) => {
    mapRef.current = mapInstance;
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
    setBottomSheetVisible(true);
  };
  

  const handleCityFocus = (center, zoomLevel, bounds) => {
    const googleMaps = window.google.maps;
  
    if (mapRef.current) {
      if (bounds) {
        const mapBounds = new googleMaps.LatLngBounds(
          bounds.southwest,
          bounds.northeast
        );
  
        mapRef.current.fitBounds(mapBounds, {
          padding: 50,
        });
      } else {
        mapRef.current.panTo(center);
        setTimeout(() => {
          mapRef.current.setZoom(zoomLevel);
        }, 500);
      }
    }
  
    setCenter(center);
    setZoom(zoomLevel);
  };
  
  
  

  useEffect(() => {
    if (!city) {
      setCenter(initialCenter);
      setZoom(12);
    }
  }, [city]);  
  

  return (
    <View style={styles.container}>
      <LoadScript googleMapsApiKey={GOOGLE_API_KEY} libraries={["places"]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        ) : (
          <>
            <SearchBar onCityFocus={handleCityFocus} />
            <GoogleMap
              ref={mapRef}
              mapContainerStyle={containerStyle}
              options={{
                mapTypeControl: false,
                zoomControl: true,
                scrollwheel: true,
                disableDoubleClickZoom: false,
                gestureHandling: 'cooperative',
                animation: google.maps.Animation.DROP,
              }}
              center={center}
              zoom={zoom}
              onLoad={onMapLoad}
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
