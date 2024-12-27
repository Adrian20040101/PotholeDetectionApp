import React, { useState, useRef } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import axios from 'axios';
import styles from './search-bar.style';

const SearchBar = ({ onCityFocus, onFilterPress }) => {
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

        if (data.lat && data.lng) {
            return {
                center: { lat: data.lat, lng: data.lng },
                bounds: data.bounds || null,
            };
        } else {
            throw new Error('Location data is incomplete.');
        }
    } catch (error) {
        console.error('Error fetching location:', error);
        return null;
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
    setQuery('');
    setSuggestions([]);
  
    const locationData = await fetchCoordinates(cityName);
  
    if (locationData) {
      const { center, bounds } = locationData;
      const zoomLevel = calculateZoomLevel(bounds);
  
      onCityFocus(center, zoomLevel, bounds);
    } else {
      console.error('Could not fetch location data.');
    }
  };
  


const calculateZoomLevel = (bounds) => {
    if (!bounds || !bounds.northeast || !bounds.southwest) return 10;

    const latDiff = Math.abs(bounds.northeast.lat - bounds.southwest.lat);
    const lngDiff = Math.abs(bounds.northeast.lng - bounds.southwest.lng);

    const maxDiff = Math.max(latDiff, lngDiff);

    if (maxDiff > 2.0) {
        return 5;
    } else if (maxDiff > 1.0) {
        return 7;
    } else if (maxDiff > 0.5) {
        return 9;
    } else if (maxDiff > 0.1) {
        return 12;
    } else {
        return 15;
    }
};

  

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          ref={searchBoxRef}
          style={styles.textInput}
          placeholder="Search for places"
          value={query}
          onChangeText={handleInputChange}
        />
        <TouchableOpacity style={styles.filterButton} onPress={onFilterPress}>
          <FontAwesome name="filter" size={20} color="#000" />
        </TouchableOpacity>
      </View>
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
