import React, { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import Filters from '../filters/filters';
import Map from '../map.web';
import styles from './filter-screen.style';

const FilteredMapScreen = () => {
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [filters, setFilters] = useState({ placeId: '', status: [], timeframe: '' });

  const toggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setFiltersVisible(false);
  };

  const handleRemoveFilters = () => {
    setFilters({ placeId: '', status: [], timeframe: '' });
    setFiltersVisible(false);
  }

  return (
    <View style={{ flex: 1 }}>
      <Map
        placeId={filters.placeId}
        status={filters.status}
        timeframe={filters.timeframe}
      />

      <TouchableOpacity style={styles.filterButton} onPress={toggleFilters}>
        <FontAwesome name="filter" size={20} color="#fff" />
        <Text style={styles.filterButtonText}>Filters</Text>
      </TouchableOpacity>

      {filtersVisible && (
        <View style={styles.filtersContainer}>
          <Filters onApplyFilters={handleApplyFilters} onRemoveFilters={handleRemoveFilters} />
        </View>
      )}
    </View>
  );
};

export default FilteredMapScreen;