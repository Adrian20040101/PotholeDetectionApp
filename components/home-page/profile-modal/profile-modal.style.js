import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '50%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  profileSectionCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  profileDetails: {
    flex: 1,
    flexDirection: 'column'
  },
  nameAndBadgeContainer: {
    flex: 1,
    flexDirection: 'row'
  },
  username: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  badge: {
    width: 25,
    height: 25,
    marginTop: 5
  },
  joinDate: {
    fontSize: 14,
    color: '#666',
  },
  contributionsSection: {
    alignItems: 'flex-end',
  },
  contributionsSectionCompact: {
    alignItems: 'flex-start',
    marginTop: 15,
  },
  contributionsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#444',
  },
  contributionsCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 10,
  },
  potholeScroll: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  potholeCard: {
    width: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  potholeImage: {
    width: '100%',
    height: 80,
    borderRadius: 5,
    marginBottom: 10,
  },
  potholeTimestamp: {
    fontSize: 12,
    color: '#555',
  },
  potholeStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  potholeLocation: {
    fontSize: 14,
    color: '#333',
    marginTop: 5,
  },  
  noPotholesText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    flexDirection: 'row'
  },
  loadingText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginLeft: 10
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  closeButtonText: {
    color: '#000',
    fontSize: 24,
  },
});

export default styles;
