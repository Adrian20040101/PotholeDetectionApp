import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const sidebarWidth = screenWidth < 800 ? 150 : 250;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 2,
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#333',
    paddingTop: 20,
    paddingBottom: 20,
    zIndex: 3,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  menuContent: {
    paddingHorizontal: 15,
  },
  menuItem: {
    paddingVertical: 10,
    marginVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    transition: 'all 0.3s ease-in-out',
  },
  menuItemHover: {
    transform: [{ scale: 1.05 }],
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  menuItemPressed: {
    backgroundColor: '#222',
  },
  menuText: {
    fontSize: 18,
    color: '#fff',
  },
  menuTextHover: {
    color: '#2563EB',
  },
  deleteAccountHover: {
    color: '#FF4D4F',
  },
});

export default styles;