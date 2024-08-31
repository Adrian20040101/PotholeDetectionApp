import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  mobileSidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: screenWidth,
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    zIndex: 4,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 10,
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 5,
    backgroundColor: '#444',
    borderRadius: 20,
    padding: 8,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
  },
  manageAccountText: {
    color: '#fff',
    padding: 10,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  profilePictureContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderColor: '#fff',
    borderWidth: 2,
  },
  editButton: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    backgroundColor: 'rgba(0, 0, 0, 1)',
    borderRadius: 12,
    padding: 5,
  },
  username: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  email: {
    color: '#bbb',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default styles;
