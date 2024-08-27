import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ImageBackground, Dimensions } from 'react-native';
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
            const slogan = "Making roads safer, one pothole at a time.";
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

    const renderContent = () => {
        switch (view) {
            case 'login':
                return <Login onBackPress={() => setView('welcome')} />;
            case 'signup':
                return <Signup onBackPress={() => setView('welcome')} />;
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
