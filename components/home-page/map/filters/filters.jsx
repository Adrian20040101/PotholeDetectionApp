import React, { useState } from 'react';
import { View, Text, TextInput, Picker, Button, FlatList, TouchableOpacity } from 'react-native';
import axios from 'axios';
import styles from './filters.style';

const Filters = ({ onApplyFilters }) => {
  const [city, setCity] = useState('');
  const [status, setStatus] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [suggestions, setSuggestions] = useState([]);

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

  const handleCityInput = (text) => {
    setCity(text);
    if (text.length > 2) {
      fetchSuggestions(text);
    } else {
      setSuggestions([]);
    }
  };

  const handleCitySelect = (selectedCity) => {
    setCity(selectedCity);
    setSuggestions([]);
  };

  const handleApplyFilters = () => {
    onApplyFilters({ city, status, timeframe });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Filter by City/Town</Text>
      <TextInput
        placeholder="Enter city or town"
        value={city}
        onChangeText={handleCityInput}
        style={styles.input}
      />

      {suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.place_id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleCitySelect(item.description)}>
              <Text style={styles.suggestion}>{item.description}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <Text style={styles.label}>Filter by Status</Text>
      <Picker
        selectedValue={status}
        onValueChange={(value) => setStatus(value)}
        style={styles.input}
      >
        <Picker.Item label="Select Status" value="" />
        <Picker.Item label="Likely a Pothole" value="likely a pothole" />
        <Picker.Item label="Unlikely a Pothole" value="unlikely a pothole" />
        <Picker.Item label="Too Low Info" value="too low info" />
        <Picker.Item label="Pending" value="pending" />
      </Picker>

      <Text style={styles.label}>Filter by Timeframe (Hours/Days)</Text>
      <TextInput
        placeholder="Enter timeframe (e.g., 12 for 12 hours)"
        value={timeframe}
        onChangeText={setTimeframe}
        keyboardType="numeric"
        style={styles.input}
      />

      <Button title="Apply Filters" onPress={handleApplyFilters} />
    </View>
  );
};

export default Filters;