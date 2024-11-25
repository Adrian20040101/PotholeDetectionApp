import { StyleSheet, Dimensions } from "react-native";

export default StyleSheet.create({
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
        width: Dimensions.get('window').width < 800 ? '85%' : '35%',
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
    modalTitle: {
        fontSize: 22,
        marginBottom: 15,
        fontWeight: 'bold',
        color: '#d9534f',
        textAlign: 'center',
    },
    warningText: {
        fontSize: 16,
        color: '#d9534f',
        marginBottom: 20,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        width: '90%',
    },
    checkboxLabel: {
        marginLeft: 10,
        fontSize: 14,
        color: '#333',
    },
    deleteButton: {
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 30,
        backgroundColor: '#007AFF',
        borderRadius: 25,
        elevation: 6,
    },
    deleteButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
