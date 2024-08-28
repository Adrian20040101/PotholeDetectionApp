import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const sidebarWidth = 250;

const styles = StyleSheet.create({
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: -sidebarWidth,
    width: sidebarWidth,
    backgroundColor: '#333',
    zIndex: 3,
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
    zIndex: 2,
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
    transition: 'all 0.3s ease-in-out',
  },
  menuItemHover: {
    color: '#2563EB',
    transform: 'scale(1.05)',
    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
  },
  deleteAccountHover: {
    color: '#FF4D4F',
  },
});

export default styles;
