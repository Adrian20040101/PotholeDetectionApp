import * as Location from 'expo-location';
import { toast } from 'react-toastify';

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

export const fetchPublicIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    if (!response.ok) {
      throw new Error(`Failed to fetch IP: ${response.status}`);
    }
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error fetching public IP:', error);
    return null;
  }
};


const getLocationByIP = async () => {
  try {
    const publicIP = await fetchPublicIP();

    if (!publicIP) {
      throw new Error('Unable to retrieve public IP.');
    }

    console.log(`User's Public IP: ${publicIP}`);

    const response = await fetch(
      `https://road-guard.netlify.app/.netlify/functions/ip_info?ip=${publicIP}`,
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

    if (!data.loc) {
      throw new Error('Location data not available');
    }

    const [lat, lng] = data.loc.split(','); // loc contains "lat,lng"
    console.log('Extracted IP-based location:', lat, lng);
    return {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      city: data.city || null,
      region: data.region || null,
      country: data.country || null,
    };
  } catch (error) {
    console.error('Error fetching location by IP:', error);
    toast.error('Unable to retrieve location. Please try again.');
    return null;
  }
};