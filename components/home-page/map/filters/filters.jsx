import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Checkbox from 'expo-checkbox';
import axios from 'axios';
import styles from './filters.style';

const STATUS_OPTIONS = [
  { label: 'Likely a Pothole', value: 'likely a pothole' },
  { label: 'Unlikely a Pothole', value: 'unlikely a pothole' },
  { label: 'Too Low Info', value: 'too low info' },
  { label: 'Pending', value: 'pending' },
];

const Filters = ({ onApplyFilters, onRemoveFilters }) => {
  const [city, setCity] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [status, setStatus] = useState([]);
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
    setPlaceId('');
    if (text.length > 2) {
      fetchSuggestions(text);
    } else {
      setSuggestions([]);
    }
  };

  const handleCitySelect = (selectedCity) => {
    setCity(selectedCity.description);
    setPlaceId(selectedCity.place_id);
    setSuggestions([]);
  };

  const toggleStatus = (statusValue) => {
    if (status.includes(statusValue)) {
      setStatus(status.filter((item) => item !== statusValue));
    } else {
      setStatus([...status, statusValue]);
    }
  };

  const handleApplyFilters = () => {
    onApplyFilters({ placeId, status, timeframe });
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
            <TouchableOpacity onPress={() => handleCitySelect(item)} style={styles.suggestionItemContainer}>
              <Icon name="location-on" size={20} color="#555" />
              <Text style={styles.suggestionItem}>{item.description}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <Text style={styles.label}>Filter by Status</Text>
      <View style={styles.statusContainer}>
        {STATUS_OPTIONS.map((option) => (
          <View key={option.value} style={styles.statusOption}>
            <Checkbox
              value={status.includes(option.value)}
              onValueChange={() => toggleStatus(option.value)}
              tintColors={{ true: '#007AFF', false: '#ccc' }}
              accessibilityLabel={`Filter status: ${option.label}`}
            />
            <Text style={styles.statusLabel}>{option.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.label}>Filter by Timeframe (Hours/Days)</Text>
      <TextInput
        placeholder="Enter timeframe (e.g., 12 for 12 hours)"
        value={timeframe}
        onChangeText={setTimeframe}
        keyboardType="numeric"
        style={styles.input}
      />

      <View style={styles.buttonsContainer}>
        <TouchableOpacity onPress={handleApplyFilters} style={styles.button}>
          <Text style={styles.buttonText}>Apply Filters</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onRemoveFilters} style={styles.button}>
          <Text style={styles.buttonText}>Remove Filters</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Filters;