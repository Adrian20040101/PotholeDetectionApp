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
    zIndex: 1,
    marginBottom: 10
  },
  sidebar: {
    width: isMobile ? 150 : 250,
    backgroundColor: '#333',
    padding: 20,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 2,
  },
  menuItem: {
    color: '#fff',
    fontSize: 18,
    paddingVertical: 10,
    marginTop: 10
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 20,
    marginLeft: 0,
    transition: 'margin-left 0.5s',
  },
  contentShift: {
    marginLeft: isMobile ? 150 : 250,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
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
    zIndex: 1,
  },
});

export default styles;
