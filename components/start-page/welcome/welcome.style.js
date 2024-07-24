import { StyleSheet, Platform } from "react-native";


const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: Platform.OS === 'web' ? '50%' : '100%',
        height: '100%',
        backgroundColor: 'black',
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 30,
        borderRadius: 15,
        border: '0.5px solid white',
        alignItems: 'center',
        marginHorizontal: 10,
        width: '90%',
        maxWidth: 500,
        marginLeft: Platform.OS === 'web' ? 760 : 10
    },
    welcomeText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
        textAlign: 'center',
    },
    subtitleText: {
        fontSize: 18,
        color: '#d3d3d3',
        marginBottom: 30,
        textAlign: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: Platform.OS === 'web' ? '65%' : '100%',
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
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonHover: {
        backgroundColor: '#1C86EE',
        transform: [{ scale: 1.05 }],
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
    googleLogo: {
        width: 24,
        height: 24,
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
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 20,
    },
    
})

export default styles