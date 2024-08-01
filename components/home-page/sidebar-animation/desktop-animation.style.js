import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const sidebarWidth = screenWidth < 800 ? 150 : 250;

const styles = StyleSheet.create({
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: -sidebarWidth,
    width: sidebarWidth,
    backgroundColor: '#333',
    zIndex: 2,
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
    zIndex: 1,
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  menuItem: {
    color: '#fff',
    fontSize: 18,
    paddingVertical: 10,
    marginVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
});

export default styles;
