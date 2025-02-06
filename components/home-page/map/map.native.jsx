import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, ActivityIndicator, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { collection, onSnapshot, query, where, Timestamp } from "firebase/firestore";
import { db } from "../../../config/firebase/firebase-config";
import { FontAwesome } from '@expo/vector-icons';
import BottomSheet from './bottom-sheet/bottom-sheet';
import styles from './map.style';
import SearchBar from './search-bar/search-bar';
import Filters from './filters/filters';

const initialRegion = {
  latitude: 40.730610,
  longitude: -73.935242,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const SEARCH_BAR_HEIGHT = 60;

const Map = ({ city, toggleSidebar, placeId, status, timeframe }) => {
  const [region, setRegion] = useState(initialRegion);
  const [loading, setLoading] = useState(true);
  const [loadingMarkers, setLoadingMarkers] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [isBottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const mapRef = useRef(null);
  useEffect(() => {
    if (filtersVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SEARCH_BAR_HEIGHT + 50,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SEARCH_BAR_HEIGHT + 40,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [filtersVisible, slideAnim, fadeAnim]);

  const handleCloseFilters = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SEARCH_BAR_HEIGHT + 40,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setFiltersVisible(false);
    });
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
          setRegion({
            latitude: data.lat,
            longitude: data.lng,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
        } else {
          throw new Error('Location data is incomplete.');
        }
      } catch (error) {
        console.error('Error fetching location:', error);
        setRegion(initialRegion);
      } finally {
        setLoading(false);
      }
    };

    if (city) {
      fetchCoordinates(city);
    } else {
      setRegion(initialRegion);
      setLoading(false);
    }
  }, [city]);

  const fetchMarkers = (filters = null) => {
    setLoadingMarkers(true);
    let markersQuery = collection(db, 'markers');

    if (filters) {
      const { placeId, status, timeframe } = filters;

      if (placeId) {
        markersQuery = query(markersQuery, where('placeId', '==', placeId));
      }

      if (Array.isArray(status) && status.length > 0) {
        markersQuery = query(markersQuery, where('status', 'in', status));
      }

      if (timeframe) {
        const now = Timestamp.now();
        const timeframeInMs = parseInt(timeframe, 10) * 60 * 60 * 1000;
        const startTime = new Timestamp(now.seconds - Math.floor(timeframeInMs / 1000), 0);
        markersQuery = query(markersQuery, where('timestamp', '>=', startTime));
      }
    }

    markersQuery = query(markersQuery, where('timestamp', '!=', null));

    const unsubscribe = onSnapshot(
      markersQuery,
      (snapshot) => {
        const markersList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMarkers(markersList);
        setLoadingMarkers(false);
        console.log(filters?.placeId || 'All Places');
      },
      (error) => {
        console.error('Error fetching markers:', error);
        setLoadingMarkers(false);
      }
    );

    return unsubscribe;
  };

  useEffect(() => {
    const filters = {
      placeId: placeId,
      status: status,
      timeframe: timeframe,
    };

    const unsubscribe = fetchMarkers(filters);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [city, status, timeframe]);

  const handleMarkerClick = (marker) => {
    setSelectedMarker(marker);
    setBottomSheetVisible(true);
  };

  const handleCityFocus = (region, zoomLevel, bounds) => {
    if (mapRef.current) {
      if (bounds) {
        mapRef.current.fitToCoordinates(
          [
            { latitude: bounds.southwest.lat, longitude: bounds.southwest.lng },
            { latitude: bounds.northeast.lat, longitude: bounds.northeast.lng },
          ],
          {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          }
        );
      } else {
        mapRef.current.animateToRegion({
          ...region,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }, 500);
      }
    }

    setRegion(region);
  };

  useEffect(() => {
    if (!city) {
      setRegion(initialRegion);
    }
  }, [city]);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Loading favorite city...</Text>
        </View>
      ) : (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            region={region}
            onRegionChangeComplete={(newRegion) => setRegion(newRegion)}
            {...(Platform.OS === 'web' && {
              provider: 'google', 
            })}
          >
            {markers.map((marker) => (
              <Marker
                key={marker.id}
                coordinate={{
                  latitude: marker.lat,
                  longitude: marker.lon,
                }}
                onPress={() => handleMarkerClick(marker)}
              />
            ))}
          </MapView>

          <View style={styles.overlayContainer}>
            <View style={styles.searchContainer}>
              <SearchBar 
                onCityFocus={handleCityFocus} 
                onFilterPress={() => {
                  filtersVisible ? handleCloseFilters() : setFiltersVisible(true)
                }} 
              />
            </View>
            {filtersVisible && (
              <Animated.View
                style={[
                  styles.filtersOverlay,
                  {
                    transform: [{ translateY: slideAnim }],
                    opacity: fadeAnim,
                    backgroundColor: '#fff',
                    zIndex: 1000,
                  },
                ]}
              >
                <Filters
                  onApplyFilters={(filters) => {
                    handleCloseFilters();
                    fetchMarkers(filters);
                  }}
                  onRemoveFilters={() => {
                    handleCloseFilters();
                    fetchMarkers();
                  }}
                />
                <TouchableOpacity
                  onPress={handleCloseFilters}
                  style={styles.closeButton}
                  accessibilityLabel="Close Filters"
                  accessibilityHint="Closes the filter options"
                >
                  <FontAwesome name="close" size={24} color="#000" />
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>

          {loadingMarkers && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text style={styles.loadingText}>Loading markers...</Text>
            </View>
          )}

          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={toggleSidebar} 
            accessibilityLabel="Open Menu" 
            accessibilityHint="Opens the sidebar"
          >
            <FontAwesome name="bars" size={24} color="#000" />
          </TouchableOpacity>

          <BottomSheet
            visible={isBottomSheetVisible}
            onClose={() => setBottomSheetVisible(false)}
            marker={selectedMarker}
          />
        </>
      )}
    </View>
  );
};

export default Map;
