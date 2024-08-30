import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const sidebarWidth = 350;

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
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  manageAccountText: {
    color: '#fff',
    padding: 20,
    fontSize: 'xx-large',
    fontWeight: 'bold',
  },
  profilePictureContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    marginTop: 30,
    marginBottom: 20,
  },
  profilePicture: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    borderColor: '#fff',
    borderWidth: 2,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    backgroundColor: 'rgba(0, 0, 0, 1)',
    borderRadius: 15,
    padding: 5,
    zIndex: 5,
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
