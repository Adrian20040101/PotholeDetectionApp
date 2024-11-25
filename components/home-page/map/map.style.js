import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const isMobile = screenWidth < 800;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
  },
  infoWindow: {
    width: 220,
    padding: 10,
    backgroundColor: '#FFF',
    borderRadius: 8,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
  },
  infoHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userInfo: {
    marginLeft: 10,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  timestamp: {
    fontSize: 11,
    color: '#888',
  },
  uploadedImage: {
    width: '100%',
    height: 100,
    borderRadius: 5,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 13,
    color: '#333',
    marginBottom: 5,
  },
  votingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  voteItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#333',
  },
  menuButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
    borderRadius: 5,
  }
});

export default styles;
