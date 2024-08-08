import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { GoogleMap, LoadScript } from '@react-google-maps/api';
import { GOOGLE_API_KEY } from '@env';
import styles from './map.style';

const containerStyle = {
  width: '100%',
  height: '400px'
};

const initialCenter = {
  lat: 40.730610,
  lng: -73.935242
};

const Map = ({ city }) => {
  const [center, setCenter] = useState(initialCenter);
  const [zoom, setZoom] = useState(12);  // can be changed if needed (i.e. dynamically based on city size)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoordinates = async (cityName) => {
      setLoading(true);
      try {
        const response = await fetch(`https://road-guard.netlify.app/.netlify/functions/city_coordinates?city=${encodeURIComponent(cityName)}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.lat && data.lng) {
          const location = { lat: data.lat, lng: data.lng };
          setCenter(location);
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
    }
  }, [city]);

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
          </GoogleMap>
        </LoadScript>
      )}
    </View>
  );
};

export default Map;