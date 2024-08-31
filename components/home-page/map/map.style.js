import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const isMobile = screenWidth < 800;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    minWidth: 300,
    height: '400px',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    width: '100%',
    height: isMobile ? '35%' : '100%',
    marginTop: 80,
  },
  activityIndicator: {
    marginBottom: 10,
  },
  loadingText: {
    fontSize: 18,
    color: '#FFF',
  },
  infoWindow: {
    width: 200,
    padding: 5,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  infoHeader: {
    flexDirection: 'row',
    marginBottom: 5,
    alignItems: 'center',
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userInfo: {
    marginLeft: 10,
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 10,
    color: 'gray',
  },
  uploadedImage: {
    width: '100%',
    height: 80,
    marginTop: 5,
    marginBottom: 10,
  },
  votingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  upvoteButton: {
    fontSize: 14,
    color: 'green',
  },
  downvoteButton: {
    fontSize: 14,
    color: 'red',
  },
});

export default styles;
