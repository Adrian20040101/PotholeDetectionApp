import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../../config/firebase/firebase-config';
import { FontAwesome } from '@expo/vector-icons';
import SearchBar from './search-bar/search-bar';
import Filters from './filters/filters';
import CustomBottomSheet from './bottom-sheet/bottom-sheet.native';

const initialRegion = {
  latitude: 40.73061,
  longitude: -73.935242,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const containerStyle = {
  width: '100%',
  height: '100%',
  marginTop: -40, // adjust for status bar if needed
};

const Map = ({ city, toggleSidebar, placeId, status, timeframe }) => {
  const [region, setRegion] = useState(initialRegion);
  const [loading, setLoading] = useState(true);
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [loadingMarkers, setLoadingMarkers] = useState(false);
  
  const mapRef = useRef(null);
  const bottomSheetRef = useRef(null);

  const slideAnim = useRef(new Animated.Value(60 + 40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (filtersVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 60 + 50,
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
          toValue: 60 + 40,
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
        toValue: 60 + 40,
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
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
      },
      (error) => {
        console.error('Error fetching markers:', error);
        setLoadingMarkers(false);
      }
    );
    return unsubscribe;
  };

  useEffect(() => {
    const filters = { placeId, status, timeframe };
    const unsubscribe = fetchMarkers(filters);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [city, status, timeframe]);

  const handleMarkerClick = (marker) => {
    console.log('Marker pressed:', marker);
    setSelectedMarker(marker);
    bottomSheetRef.current?.expand();
  };

  useEffect(() => {
    if (!city) {
      setRegion(initialRegion);
    }
  }, [city]);

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
        mapRef.current.animateToRegion(
          { ...region, latitudeDelta: 0.0922, longitudeDelta: 0.0421 },
          500
        );
      }
    }
    setRegion(region);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
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
              style={containerStyle}
              region={region}
              onRegionChangeComplete={(newRegion) => setRegion(newRegion)}
              provider={PROVIDER_GOOGLE}
              androidLayerType="software"
              {...(Platform.OS === 'web' && { provider: 'google' })}
            >
              {markers.map((marker) => (
                <Marker
                  key={marker.id}
                  coordinate={{ latitude: marker.lat, longitude: marker.lon }}
                  onPress={() => handleMarkerClick(marker)}
                />
              ))}
            </MapView>

            <View style={styles.overlayContainer}>
              <View style={styles.searchContainer}>
                <SearchBar
                  onCityFocus={handleCityFocus}
                  onFilterPress={() =>
                    filtersVisible ? handleCloseFilters() : setFiltersVisible(true)
                  }
                />
              </View>
              {filtersVisible && (
                <Animated.View
                  style={[
                    styles.filtersOverlay,
                    { transform: [{ translateY: slideAnim }], opacity: fadeAnim, backgroundColor: '#fff' },
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

            <TouchableOpacity
              style={styles.menuButton}
              onPress={toggleSidebar}
              accessibilityLabel="Open Menu"
              accessibilityHint="Opens the sidebar"
            >
              <FontAwesome name="bars" size={24} color="#000" />
            </TouchableOpacity>

            {selectedMarker && (
              <CustomBottomSheet ref={bottomSheetRef} marker={selectedMarker} />
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

export default Map;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 40
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 10,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 0,
  },
  filtersOverlay: {
    position: 'absolute',
    top: -30,
    width: '90%',
    alignSelf: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },  
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  menuButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 0,
  },
});
