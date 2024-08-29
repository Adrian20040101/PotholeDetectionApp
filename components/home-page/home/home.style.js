import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const isMobile = screenWidth < 800;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: isMobile ? 'column' : 'row',
    padding: 20,
  },
  menuButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 4,
    marginBottom: 10,
  },
  sidebar: {
    width: 250,
    backgroundColor: '#333',
    padding: 20,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: -250, // hidden state
    zIndex: 3,
  },
  menuDropdown: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E3A8A',
    zIndex: 3,
    padding: 10,
    boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
  },
  menuContainer: {
    flexDirection: 'column',
    paddingTop: 10,
    paddingBottom: 10,
    zIndex: 3,
  },
  menuItem: {
    color: '#fff',
    fontSize: 18,
    paddingVertical: 10,
    transition: 'all 0.3s ease-in-out',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingLeft: 20,
    paddingRight: 20,
    transition: 'margin-left 0.5s, margin-right 0.5s',
    zIndex: 1,
  },
  rightContentShift: {
    marginLeft: 250,
  },
  leftContentShift: {
    marginRight: 250,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  cityText: {
    fontSize: 20,
    marginBottom: 20,
    color: '#4B5563',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 2,
  },
  userProfilePicture: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderColor: '#FFF',
  }
});

export default styles;