import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const isMobile = screenWidth < 800;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
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
    backgroundColor: '#333',
    zIndex: 3,
    padding: 10,
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
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginLeft: 0,
    marginBottom: 20,
    paddingLeft: 20,
    transition: 'margin-left 0.5s',
    zIndex: 1,
  },
  contentShift: {
    marginLeft: 250,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  cityText: {
    fontSize: 18,
    marginBottom: 20,
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
});

export default styles;