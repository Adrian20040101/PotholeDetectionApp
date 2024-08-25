import React from 'react';
import MapView, { Marker } from 'react-native-maps';
import { View, Text, ActivityIndicator } from 'react-native';
import styles from './map.style';

const Map = ({ city }) => {
  const [center, setCenter] = useState(initialCenter);
  const [zoom, setZoom] = useState(12);
  const [loading, setLoading] = useState(true);
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);

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
          id: doc.id,
          ...doc.data(),
        }));
        setMarkers(markersList);
      } catch (error) {
        console.error("Error fetching markers from Firestore:", error);
      }
    };

    fetchMarkers();
  }, []);

  const handleVote = async (markerId, type) => {
    const markerRef = doc(db, 'markers', markerId);
    const markerDoc = await getDoc(markerRef);

    if (markerDoc.exists()) {
      const markerData = markerDoc.data();
      const updatedVotes = {
        upvotes: type === 'upvote' ? markerData.upvotes + 1 : markerData.upvotes,
        downvotes: type === 'downvote' ? markerData.downvotes + 1 : markerData.downvotes,
      };
      await updateDoc(markerRef, updatedVotes);
      setMarkers(markers.map(marker => marker.id === markerId ? { ...marker, ...updatedVotes } : marker));
    }
  };

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
            {markers.map((marker, index) => (
              <Marker
                key={index}
                position={{ lat: marker.lat, lng: marker.lon }}
                onClick={() => setSelectedMarker(marker)}
              />
            ))}

            {selectedMarker && (
              <InfoWindow
                position={{ lat: selectedMarker.lat, lng: selectedMarker.lon }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <View style={styles.infoWindow}>
                  <View style={styles.header}>
                    <Image source={{ uri: selectedMarker.userProfilePic }} style={styles.profilePicture} />
                    <View style={styles.headerText}>
                      <Text style={styles.userName}>{selectedMarker.userName}</Text>
                      <Text style={styles.timestamp}>{new Date(selectedMarker.timestamp.seconds * 1000).toLocaleString()}</Text>
                    </View>
                  </View>
                  <Image source={{ uri: selectedMarker.imageUrl }} style={styles.uploadedImage} />
                  <View style={styles.votingContainer}>
                    <TouchableOpacity onPress={() => handleVote(selectedMarker.id, 'upvote')}>
                      <Text style={styles.upvoteButton}>👍 {selectedMarker.upvotes}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleVote(selectedMarker.id, 'downvote')}>
                      <Text style={styles.downvoteButton}>👎 {selectedMarker.downvotes}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </InfoWindow>
            )}
          </GoogleMap>
        </LoadScript>
      )}
    </View>
  );
};

export default Map;