import React, { useState, useRef } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text } from 'react-native';
import axios from 'axios';
import styles from './search-bar.style';

const SearchBar = ({ onCityFocus }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const searchBoxRef = useRef(null);

  const fetchSuggestions = async (input) => {
    const url = 'https://road-guard.netlify.app/.netlify/functions/places_api_function';
    const params = { input };

    try {
      const response = await axios.get(url, { params });
      setSuggestions(response.data.predictions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const fetchCoordinates = async (cityName) => {
    try {
      const response = await fetch(
        `https://road-guard.netlify.app/.netlify/functions/city_coordinates?city=${encodeURIComponent(cityName)}`
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
        if (data.result.geometry) {
            const { location, viewport } = data.result.geometry;
            return {
                center: { lat: location.lat, lng: location.lng },
                bounds: viewport ? {
                northeast: viewport.northeast,
                southwest: viewport.southwest,
                } : null,
            };
        } else {
            throw new Error('Location data is incomplete.');
        }
    } catch (error) {
      console.error('Error fetching location:', error);
    }
  };

  const handleInputChange = (text) => {
    setQuery(text);
    if (text.length > 2) {
      fetchSuggestions(text);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionPress = async (suggestion) => {
    const cityName = suggestion.structured_formatting.main_text;
    setQuery(cityName);
    setSuggestions([]);

    await fetchCoordinates(cityName);
  };

  const calculateZoomLevel = (bounds) => {
    if (!bounds) return 10;
  
    const latDiff = Math.abs(bounds.northeast.lat - bounds.southwest.lat);
    const lngDiff = Math.abs(bounds.northeast.lng - bounds.southwest.lng);
  
    if (latDiff > 1 || lngDiff > 1) {
      return 8;
    } else if (latDiff > 0.5 || lngDiff > 0.5) {
      return 10;
    } else {
      return 12;
    }
  };
  

  return (
    <View style={styles.container}>
      <TextInput
        ref={searchBoxRef}
        style={styles.textInput}
        placeholder="Search for places"
        value={query}
        onChangeText={handleInputChange}
      />
      {suggestions.length > 0 && (
        <FlatList
          style={styles.suggestionsContainer}
          data={suggestions}
          keyExtractor={(item) => item.place_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.suggestionItemContainer}
              onPress={() => handleSuggestionPress(item)}
            >
              <Text style={styles.suggestionItemText}>{item.description}</Text>
            </TouchableOpacity>
          )}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
};

export default SearchBar;
