import React, { useState } from 'react';
import { View, TextInput, Text, FlatList, TouchableOpacity } from 'react-native';
import axios from 'axios';
import styles from './city.style';

const CitySelection = ({ onCitySelect }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const fetchSuggestions = async (input) => {
    const url = 'https://road-guard.netlify.app/.netlify/functions/places_api_function';
  
    const params = {
      input,
    };
  
    try {
      const response = await axios.get(url, { params });
      console.log('API Response:', response.data);
      
      setSuggestions(response.data.predictions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
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

  const handleSuggestionPress = (suggestion) => {
    const cityName = suggestion.structured_formatting.main_text;
    setQuery('');
    setSuggestions([]);
    onCitySelect(cityName);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Your Favorite City</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Search for a city"
        value={query}
        onChangeText={handleInputChange}
      />
      {suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.place_id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.suggestionItemContainer} onPress={() => handleSuggestionPress(item)}>
              <Text style={styles.suggestionItemText}>{item.description}</Text>
            </TouchableOpacity>
          )}
          keyboardShouldPersistTaps="handled" // ensures the keyboard hides on item press
        />
      )}
    </View>
  );
};

export default CitySelection;
