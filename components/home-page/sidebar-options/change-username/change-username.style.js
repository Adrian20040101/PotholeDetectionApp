import { StyleSheet } from 'react-native';

const styles =  StyleSheet.create({
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
    input: {
        width: '100%',
        borderColor: '#ccc',
        borderWidth: 1,
        padding: 10,
        marginBottom: 15,
        borderRadius: 5,
        fontSize: 16,
    },
    saveButton: {
      marginTop: 20,
      paddingVertical: 10,
      paddingHorizontal: 30,
      backgroundColor: '#007AFF',
      borderRadius: 25,
      shadowColor: '#007AFF',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.6,
      shadowRadius: 5,
      elevation: 6,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
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