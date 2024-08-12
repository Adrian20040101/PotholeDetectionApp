import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const isMobile = screenWidth < 800;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '400px',
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
});

export default styles;
