import { StyleSheet, Dimensions } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isMobile = screenWidth < 700;

const styles = StyleSheet.create({
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
        resizeMode: 'cover', 
    },
    rightSection: {
        flex: 1, 
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
        display: isMobile ? 'none' : 'flex',
    },
    overlay: {
        padding: 30,
        borderRadius: 15,
        borderWidth: 0.5,
        borderColor: 'white',
        alignItems: 'center',
        width: '90%',
        maxWidth: 500,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    overlayMobile: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
        width: '100%',
        maxWidth: 400,
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
        whiteSpace: 'nowrap',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
    },
});

export default styles;
