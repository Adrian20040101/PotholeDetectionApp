import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ImageBackground, Dimensions } from 'react-native';
import { auth } from "../../../config/firebase/firebase-config";
import { signInAnonymously } from "firebase/auth";
import Login from "../login/login";
import Signup from "../signup/signup";
import styles from "./welcome.style";

const Welcome = () => {
    const [view, setView] = useState('welcome');
    const [typedText, setTypedText] = useState('');
    const [isTyped, setIsTyped] = useState(false);
    const [isHovered, setIsHovered] = useState({ loginWelcome: false, signupWelcome: false });
    const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

    const updateLayout = () => {
        setIsMobile(window.innerWidth < 700);
        setIsLandscape(window.innerWidth > window.innerHeight);
    };

    useEffect(() => {
        updateLayout();

        const handleResize = () => {
            updateLayout();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (view === 'welcome' && !isTyped) {
            const slogan = "Making roads safer, one pothole at a time.\nLet's get started.";
            let index = 0;
            const typeCharacter = () => {
                if (index < slogan.length) {
                    setTypedText(slogan.slice(0, index + 1));
                    index++;
                    setTimeout(typeCharacter, 75);
                } else {
                    setIsTyped(true);
                }
            };
            typeCharacter();
        }
    }, [view, isTyped]);

    useEffect(() => {
        const checkIfAnonymous = () => {
            if (auth.currentUser && auth.currentUser.isAnonymous) {
                setView('login');
            }
        }
        checkIfAnonymous();
    }, [])

    const handleGuestLogin = async () => {
        try {
            const userCredential = await signInAnonymously(auth);
            console.log('Guest login successful:', userCredential.user);
            navigation.navigate('HomePage');
        } catch (error) {
            console.error('Error with guest login:', error);
            alert('Failed to log in as guest. Please try again.');
        }
    };

    const renderContent = () => {
        switch (view) {
            case 'login':
                return <Login onBackPress={() => setView('welcome')} onSignupPress={() => setView('signup')} />;
            case 'signup':
                return <Signup onBackPress={() => setView('welcome')} onLoginPress={() => setView('login')} />;
            default:
                return (
                    <>
                        <Text style={styles.welcomeText}>Welcome!</Text>
                        <Text style={styles.subtitleText}>{typedText}</Text>
                        <View style={styles.buttonContainer}>
                            <Pressable 
                                style={[styles.button, isHovered.loginWelcome && styles.buttonHover]} 
                                onPress={() => setView('login')}
                                onMouseEnter={() => setIsHovered({ ...isHovered, loginWelcome: true })}
                                onMouseLeave={() => setIsHovered({ ...isHovered, loginWelcome: false })}
                            >
                                <Text style={styles.buttonText}>Log In</Text>
                            </Pressable>
                            <Pressable 
                                style={[styles.button, isHovered.signupWelcome && styles.buttonHover]} 
                                onPress={() => setView('signup')}
                                onMouseEnter={() => setIsHovered({ ...isHovered, signupWelcome: true })}
                                onMouseLeave={() => setIsHovered({ ...isHovered, signupWelcome: false })}
                            >
                                <Text style={styles.buttonText}>Sign Up</Text>
                            </Pressable>
                        </View>
                        <Pressable onPress={handleGuestLogin}>
                            <Text style={styles.guestLoginText}>Don't need an account? <Text style={styles.guestLoginLink}>Continue as Guest</Text></Text>
                        </Pressable>
                    </>
                );
        }
    };

    return (
        <View style={styles.container}>
            <ImageBackground 
                source={{ uri: 'https://img.freepik.com/premium-photo/pothole-road-ground-view-cinematic-lighting-generative-aixa_40453-3640.jpg' }} 
                style={styles.imageBackground}
            >
                {isMobile && !isLandscape && (
                    <View style={[styles.overlay, styles.overlayMobile]}>
                        {renderContent()}
                    </View>
                )}
            </ImageBackground>
            {!isMobile || isLandscape ? (
                <View style={styles.rightSection}>
                    <View style={styles.overlay}>
                        {renderContent()}
                    </View>
                </View>
            ) : null}
        </View>
    );
};

export default Welcome;
