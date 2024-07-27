import { StyleSheet, Platform } from "react-native";


const styles = StyleSheet.create({
    formContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderRadius: 15,
        alignItems: 'center',
        width: '90%',
        maxWidth: 600,
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 20,
        transition: 'transform 0.3s',
    },
    backArrow: {
        width: 24,
        height: 24,
        tintColor: '#fff',
    },
    backButtonHovered: {
        transform: [{ scale: 1.2 }],
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        backgroundColor: '#fff',
        padding: 10,
        marginVertical: 10,
        borderRadius: 5,
    },
    googleButton: {
        marginTop: 20,
        marginBottom: 20,
        padding: 10,
        borderRadius: 30,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        width: 50,
        height: 50,
    },
    googleButtonHover: {
        transform: [{ scale: 1.05 }],
        transition: 'transform 0.3s'
    },
    googleLogo: {
        width: 24,
        height: 24,
    },
    button: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#1E90FF',
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 30,
        marginHorizontal: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        elevation: 5,
        transition: 'background-color 0.3s, transform 0.3s',
    },
    buttonHover: {
        transform: [{ scale: 1.05 }],
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorText: {
        color: 'red',
        marginBottom: 10,
        textAlign: 'center',
    }
    
})

export default styles