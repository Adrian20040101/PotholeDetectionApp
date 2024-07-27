import React, { useRef, useEffect } from "react";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useState } from "react";
import { View, Text, Pressable, ImageBackground, Dimensions, TextInput, Image } from 'react-native'
import Login from "../login/login";
import Signup from "../signup/signup";
import styles from "./welcome.style";

const backgroundImage = require('../../../assets/images/pothole-cinematic-2.jpg');

const Welcome = () => {
    const [view, setView] = useState('welcome'); // possible states are 'welcome', 'login', 'signup'
    const [typedText, setTypedText] = useState('');
    const [isTyped, setIsTyped] = useState(false);
    const [isHovered, setIsHovered] = 
        useState({ loginWelcome: false, signupWelcome: false, login: false, signup: false, googleButton: false });
    const googleLogo = require('../../../assets/logos/google-logo-2.png')

    // typewriter effect for app slogan
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
        <ImageBackground 
        source={{uri: 'https://img.freepik.com/premium-photo/pothole-road-ground-view-cinematic-lighting-generative-aixa_40453-3640.jpg'}} 
            style={styles.background}
            imageStyle={styles.imageBackground}
        >
            <View style={[styles.overlay, view === 'welcome' ? styles.welcomeOverlay : styles.formOverlay]}>
                {renderContent()}
            </View>
        </ImageBackground>
    );
};

export default Welcome