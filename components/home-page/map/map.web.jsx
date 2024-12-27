import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { GOOGLE_API_KEY } from '@env';
import { collection, getDocs, getDoc, doc, query, where, Timestamp } from "firebase/firestore";
import { db } from "../../../config/firebase/firebase-config";
import { FontAwesome } from '@expo/vector-icons';
import axios from 'axios';
import BottomSheet from './bottom-sheet/bottom-sheet';
import styles from './map.style';
import SearchBar from './search-bar/search-bar';
import Filters from './filters/filters';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const initialCenter = {
  lat: 40.730610,
  lng: -73.935242,
};

const Map = ({ city, toggleSidebar, status, timeframe }) => {
  const [center, setCenter] = useState(initialCenter);
  const [zoom, setZoom] = useState(12);
  const [loading, setLoading] = useState(true);
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [isBottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const mapRef = useRef(null);

  const onMapLoad = (mapInstance) => {
    mapRef.current = mapInstance;
  };

  const fetchLocation = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://road-guard.netlify.app/.netlify/functions/reverse_geocoding?lat=${latitude}&lng=${longitude}`
      );
      const data = await response.json();
  
      if (response.ok) {
        return `${data.county || 'Unknown County'}, ${data.region || 'Unknown Region'}`;
      } else {
        console.error('Error fetching location:', data.message);
        return 'Unknown Location';
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      return 'Unknown Location';
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

  const fetchMarkers = async (filters = null) => {
    try {
      const markersCollection = collection(db, 'markers');
      const markerSnapshot = await getDocs(markersCollection);
  
      let markersList = await Promise.all(
        markerSnapshot.docs.map(async (doc) => {
          const markerData = doc.data();
  
          if (filters?.city) {
            const city = await fetchLocation(markerData.lat, markerData.lon);
            markerData.city = city;
            console.log('City from autocomplete: ', city);
            console.log('City from reverse geocoding: ', filters.city);
          }
  
          return { id: doc.id, ...markerData };
        })
      );
  
      if (filters) {
        if (filters.city) {
          markersList = markersList.filter(
            (marker) => marker.city === filters.city
          );
        }
        if (filters.status) {
          markersList = markersList.filter(
            (marker) => marker.status === filters.status
          );
        }
        if (filters.timeframe) {
          const now = Timestamp.now();
          const timeframeInMs = parseInt(filters.timeframe, 10) * 60 * 60 * 1000;
          const startTime = new Timestamp(now.seconds - timeframeInMs / 1000, 0);
          markersList = markersList.filter(
            (marker) =>
              marker.timestamp && marker.timestamp.toMillis() >= startTime.toMillis()
          );
        }
      }
  
      setMarkers(markersList);
    } catch (error) {
      console.error('Error fetching markers:', error);
    }
  };
  

  useEffect(() => {
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
      <SearchBar />

      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setFiltersVisible(!filtersVisible)}
      >
        <FontAwesome name="filter" size={20} color="#000" />
      </TouchableOpacity>
  
      {filtersVisible && (
        <View style={styles.filtersContainer}>
          <Filters
            onApplyFilters={(filters) => {
              setFiltersVisible(false);
              fetchMarkers(filters);
            }}
          />
        </View>
      )}
  
      <LoadScript googleMapsApiKey={GOOGLE_API_KEY} libraries={["places"]}>
        <GoogleMap
          ref={mapRef}
          mapContainerStyle={containerStyle}
          options={{
            mapTypeControl: false,
            zoomControl: true,
            scrollwheel: true,
            disableDoubleClickZoom: false,
            gestureHandling: 'cooperative',
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
      </LoadScript>
  
      <TouchableOpacity style={styles.menuButton} onPress={toggleSidebar}>
        <FontAwesome name="bars" size={24} color="#000" />
      </TouchableOpacity>
  
      <BottomSheet
        visible={isBottomSheetVisible}
        onClose={() => setBottomSheetVisible(false)}
        marker={selectedMarker}
      />
    </View>
  );  
};

export default Map;
