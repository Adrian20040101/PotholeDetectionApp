import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { GOOGLE_API_KEY } from '@env';
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../config/firebase/firebase-config";
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
  const [markers, setMarkers] = useState([]);

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
        const markersList = markerSnapshot.docs.map(doc => ({
          lat: doc.data().lat,
          lng: doc.data().lon
        }));
        setMarkers(markersList);
      } catch (error) {
        console.error("Error fetching markers from Firestore:", error);
      }
    };

    fetchMarkers();
  }, []);


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
            {markers && markers.map((marker, index) => (
              <Marker key={index} position={{ lat: marker.lat, lng: marker.lng }} />
            ))}
          </GoogleMap>
        </LoadScript>
      )}
    </View>
  );
};

export default Map;