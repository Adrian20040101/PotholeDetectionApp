import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 25,
    backgroundColor: '#FFF',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    maxHeight: '80%',
    width: '90%'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  isAnonymousText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#000',
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 15,
  },
  badgeItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 20,
  },
  badgeWrapper: {
    position: 'relative',
    width: 60,
    height: 60,
  },
  badgeImage: {
    width: 60,
    height: 60,
  },
  checkmarkImage: {
    position: 'absolute',
    width: 30,
    height: 30,
    top: 0,
    right: 0,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
    textAlign: 'center',
  },
  progressBar: {
    height: 10,
    width: '80%',
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 5,
  },
  contributionText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
});

export default styles;
