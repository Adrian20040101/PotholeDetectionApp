import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalContent: {
    width: '85%',
    padding: 25,
    backgroundColor: '#FFF',
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    marginBottom: 15,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  settingSection: {
    marginVertical: 12,
    paddingVertical: 8,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
  },
  settingValue: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
    zIndex: 1,
},
closeButtonText: {
    color: '#000',
    fontSize: 24,
},
});

export default styles;