import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    position: 'absolute',
    top: 10,
    zIndex: 3,
  },
  textInput: {
    width: screenWidth * 0.5,
    maxWidth: 500,
    minWidth: 100,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    fontSize: 16,
    elevation: 3,
  },
  suggestionsContainer: {
    width: screenWidth * 0.5,
    maxWidth: 500,
    minWidth: 200,
    marginTop: 5,
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    maxHeight: 250,
    elevation: 3,
  },
  suggestionItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  suggestionItem: {
    fontSize: 16,
    color: '#555',
  },
  filterButton: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -15 }],
    padding: 5,
  },
});

export default styles;
