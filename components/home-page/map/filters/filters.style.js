import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  statusContainer: {
    marginTop: 5,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  statusLabel: {
    marginLeft: 8,
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
  buttonsContainer: {
    flex: 1, 
    flexDirection: 'row',
    gap: 10
  },
  button: {
    width: '50%',
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});

export default styles;