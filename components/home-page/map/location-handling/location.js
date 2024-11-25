import * as Location from 'expo-location';

const apiKey = process.env.EXPO_PUBLIC_IP_API_KEY;

export const getUserLocation = async () => {
  try {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      let location = await Location.getCurrentPositionAsync({});
      console.log('Extracted location information: ', location.coords.latitude + ' ' + location.coords.longitude);
      return {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
    } else {
      console.log('GPS permission denied. Falling back to IP geolocation.');
      return await getLocationByIP();
    }
  } catch (error) {
    console.error('Error getting location:', error);
    return await getLocationByIP();
  }
};

const getLocationByIP = async () => {
  try {
    const response = await fetch('https://road-guard.netlify.app/.netlify/functions/ip_info');
    const data = await response.json();
    const [lat, lng] = data.loc.split(','); // loc contains "lat,lng"
    console.log('Extracted location information from IP address: ', lat + ' ' + lng);
    return {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
    };
  } catch (error) {
    console.error('Error fetching location by IP:', error);
    return null;
  }
};