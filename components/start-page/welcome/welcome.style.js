import { StyleSheet } from "react-native";

const createStyles = (isMobile, isLandscape, isWeb) => StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: isMobile ? 'column' : 'row',
        width: '100%',
        height: '100%',
    },
    imageBackground: {
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    leftSection: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    rightSection: {
        flex: 1, 
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        padding: isMobile ? 20 : 30,
        borderRadius: 15,
        borderWidth: 0.5,
        borderColor: 'white',
        alignItems: 'center',
        width: isMobile ? '90%' : '80%',
        maxWidth: 500,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    welcomeText: {
        fontSize: isMobile ? 24 : 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
        textAlign: 'center',
    },
    subtitleText: {
        fontSize: isMobile ? 16 : 18,
        color: '#d3d3d3',
        marginBottom: 30,
        textAlign: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        gap: 15,
        maxWidth: 400,
    },
    button: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#1E90FF',
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 30,
        marginHorizontal: isMobile ? 0 : 10,
        marginVertical: isMobile ? 10 : 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        elevation: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: isMobile ? 14 : 16,
        fontWeight: 'bold',
    },
    buttonHover: {
        transform: [{ scale: 1.05 }],
    },
    guestLoginText: {
        marginVertical: 10,
        textAlign: 'center',
        color: '#fff',
        fontSize: isMobile ? 12 : 14,
    },
    guestLoginLink: {
        color: '#1E90FF',
        fontWeight: 'bold',
    },
});

export default createStyles;
