import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    filterButton: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      backgroundColor: '#007BFF',
      padding: 10,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 10,
    },
    filterButtonText: {
      color: '#fff',
      marginLeft: 8,
      fontSize: 16,
    },
    filtersContainer: {
      position: 'absolute',
      top: 50,
      left: 0,
      right: 0,
      backgroundColor: '#fff',
      padding: 16,
      zIndex: 15,
      elevation: 5,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
});

export default styles;