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
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [center, setCenter] = useState(initialCenter);

  useEffect(() => {
    const fetchCoordinates = async () => {
      if (city) {
        try {
          const response = await fetch(`https://road-guard.netlify.app/.netlify/functions/get_fav_city_coordinates`);
          const data = await response.json();
          if (response.ok) {
            const location = { lat: data.lat, lng: data.lng };
            setCenter(location);
            setMarkers([{ id: 1, position: location }]);
          } else {
            console.error('Error fetching location:', data.message);
          }
        } catch (error) {
          console.error('Error fetching location:', error);
        }
      }
    };

    fetchCoordinates();
  }, [city]);

  const onLoad = (mapInstance) => {
    setMap(mapInstance);
  };

  const onUnmount = () => {
    setMap(null);
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_API_KEY}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={10}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {markers.map(marker => (
          <Marker key={marker.id} position={marker.position} />
        ))}
      </GoogleMap>
    </LoadScript>
  );
};

export default Map;
