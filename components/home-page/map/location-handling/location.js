import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';

export const getUserLocation = async () => {
  try {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      let location = await Location.getCurrentPositionAsync({});
      console.log(
        'Extracted GPS location:',
        location.coords.latitude,
        location.coords.longitude
      );
      return {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
    } else {
      console.log('GPS permission denied. Falling back to IP geolocation.');
      return await getLocationByServerless();
    }
  } catch (error) {
    console.error('Error getting location:', error);
    return await getLocationByServerless();
  }
};

const getLocationByServerless = async () => {
  try {
    const response = await fetch(
      `https://road-guard.netlify.app/.netlify/functions/ip_info`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (typeof data.lat !== 'number' || typeof data.lng !== 'number') {
      throw new Error('Incomplete location data received.');
    }

    const { lat, lng } = data;

    console.log('Extracted Serverless IP-based location:', lat, lng);
    return {
      lat,
      lng,
    };
  } catch (error) {
    console.error('Error fetching location from serverless function:', error);
    Toast.show({
      type: 'error',
      text1: 'Location Error',
      text2: 'Unable to retrieve location. Please try again.',
    });
    return null;
  }
};
