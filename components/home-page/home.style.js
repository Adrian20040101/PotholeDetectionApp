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
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 0,
    transition: 'margin-left 0.3s',
  },
  contentShift: {
    marginLeft: 250,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default styles;
