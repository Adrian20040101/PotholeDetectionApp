import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const sidebarWidth = 250;

const styles = StyleSheet.create({
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: -sidebarWidth,
    width: sidebarWidth,
    backgroundColor: '#333',
    zIndex: 3,
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 2,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 20,
    borderColor: '#fff',
    borderWidth: 2,
  },
  username: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  email: {
    color: '#bbb',
    fontSize: 16,
    marginBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  additionalInfo: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
});

export default styles;
