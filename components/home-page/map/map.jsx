import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { GOOGLE_API_KEY } from '@env';

const containerStyle = {
  width: '100%',
  height: '400px'
};

const initialCenter = {
  lat: 40.730610,
  lng: -73.935242
};

const Map = ({ city }) => {
  const [markers, setMarkers] = useState([]);
  const [center, setCenter] = useState(initialCenter);

  useEffect(() => {
    const fetchCoordinates = async (cityName) => {
      try {
        const response = await fetch(`https://road-guard.netlify.app/.netlify/functions/get_fav_city_coordinates?city=${encodeURIComponent(cityName)}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.lat && data.lng) {
          const location = { lat: data.lat, lng: data.lng };
          setCenter(location);
          setMarkers([{ id: 1, position: location }]);
        } else {
          throw new Error('Location data is incomplete.');
        }
      } catch (error) {
        console.error('Error fetching location:', error);
        setCenter(initialCenter);
      }
    };

    if (city) {
      fetchCoordinates(city);
    }
  }, [city]);

  return (
    <LoadScript googleMapsApiKey={GOOGLE_API_KEY}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={10}
      >
        {markers.map(marker => (
          <Marker key={marker.id} position={marker.position} />
        ))}
      </GoogleMap>
    </LoadScript>
  );
};

export default Map;
