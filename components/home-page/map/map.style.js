import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const isMobile = screenWidth < 800;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 1,
    marginBottom: 80
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
    borderRadius: 5,
  },
  filterButton: {
    position: 'absolute',
    top: 10,
    left: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
    borderRadius: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  searchContainer: {
    width: '100%',
    alignItems: 'center',
  },
  overlayContainer: {
    position: 'absolute',
    width: '90%',
    alignItems: 'center',
    marginLeft: 75
  },
  filtersOverlay: {
    width: '90%',
    maxWidth: 500,
    top: 50,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    position: 'relative',
  },
});

export default styles;
