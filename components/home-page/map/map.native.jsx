import React from 'react';
import MapView, { Marker } from 'react-native-maps';
import { View, Text, ActivityIndicator } from 'react-native';
import styles from './map.style';

const Map = ({ location }) => {
  if (!location || !location.lat || !location.lng) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        provider={MapView.PROVIDER_GOOGLE}
      >
      </MapView>
    </View>
  );
};

export default Map;