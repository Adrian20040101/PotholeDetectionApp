import { StyleSheet } from "react-native";

const styles = {
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: 'white',
      padding: 20,
      borderRadius: 10,
      width: '80%',
      maxWidth: 400,
      position: 'relative',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
    },
    input: {
      borderWidth: 1,
      borderColor: '#ccc',
      padding: 10,
      marginBottom: 10,
      borderRadius: 5,
      width: '100%',
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
    saveButton: {
      backgroundColor: '#1E90FF',
      padding: 15,
      borderRadius: 5,
      marginTop: 20,
      alignItems: 'center',
    },
    saveButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
  };

export default styles;