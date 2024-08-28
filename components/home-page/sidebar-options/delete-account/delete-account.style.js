import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        maxWidth: 400,
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        position: 'relative',
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
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
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
    },
    checkboxLabel: {
        marginLeft: 10,
        fontSize: 14,
        color: '#333',
    },
    deleteButton: {
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 5,
        alignItems: 'center',
        width: '100%',
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default styles;