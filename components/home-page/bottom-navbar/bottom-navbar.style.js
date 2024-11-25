import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  navbarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#007bff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  navButton: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 5,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
    fontWeight: 'bold',
  },
  userProfilePicture: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderColor: '#FFF',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  analyzingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  addressInputContainer: {
    width: '80%',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
  },
  input: {
    width: '100%',
    padding: 8,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 4,
    marginTop: 10,
    color: '#333',
  },
  suggestionItem: {
    padding: 8,
    fontSize: 14,
    color: '#333',
  },
  previewImage: {
    width: 100,
    height: 100,
    marginTop: 10,
    borderRadius: 8,
  },
});

export default styles;
