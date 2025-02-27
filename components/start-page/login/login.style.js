import { StyleSheet } from 'react-native';

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
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        padding: 12,
        marginVertical: 10,
        borderRadius: 5,
        backgroundColor: '#333',
        color: '#fff',
        fontSize: 16,
    },
    button: {
        width: '100%',
        alignItems: 'center',
        backgroundColor: '#1E90FF',
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 30,
        marginTop: 25,
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
    googleButton: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        marginVertical: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        elevation: 5,
        transition: 'transform 0.3s',
    },
    googleButtonHover: {
        transform: [{ scale: 1.05 }],
    },
    googleLogo: {
        width: 24,
        height: 24,
        marginLeft: 10,
    },
    signUpText: {
        marginVertical: 15,
        color: '#fff',
        fontSize: 14,
    },
    signUpLink: {
        color: '#1E90FF',
        fontWeight: 'bold',
    },
    forgotPasswordText: {
        marginVertical: 15,
        color: '#1E90FF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    errorText: {
        color: 'red',
        marginBottom: 10,
        textAlign: 'center',
    },
});

export default styles;
