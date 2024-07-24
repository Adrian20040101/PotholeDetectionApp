import React, { useRef, useEffect } from "react";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useState } from "react";
import { View, Text, Pressable, ImageBackground, Dimensions, TextInput, Image } from 'react-native'
import styles from "./welcome.style";

const backgroundImage = require('../../../assets/images/pothole-cinematic-2.jpg');

const Welcome = () => {
    const [view, setView] = useState('welcome'); // possible states are 'welcome', 'login', 'signup'
    const [typedText, setTypedText] = useState('');
    const [isTyped, setIsTyped] = useState(false);
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
                return (
                    <>
                        <Pressable style={styles.backButton} onPress={() => setView('welcome')}>
                            <Icon name="arrow-back" size={24} color="#fff" />
                        </Pressable>
                        <Text style={styles.title}>Login</Text>
                        <TextInput placeholder="Email" style={styles.input} />
                        <TextInput placeholder="Password" secureTextEntry style={styles.input} />
                        <Text style={{ color: 'white' }}> - or - </Text>
                        <Pressable style={styles.googleButton} onPress={() => {/* handle Google login */}}>
                            <Image source={googleLogo} style={styles.googleLogo} />
                        </Pressable>
                        <Pressable style={styles.button} onPress={() => setView('welcome')}>
                            <Text style={styles.buttonText}>Login</Text>
                        </Pressable>
                    </>
                );
            case 'signup':
                return (
                    <>
                        <Pressable style={styles.backButton} onPress={() => setView('welcome')}>
                            <Icon name="arrow-back" size={24} color="#fff" />
                        </Pressable>
                        <Text style={styles.title}>Sign Up</Text>
                        <TextInput placeholder="Name" style={styles.input} />
                        <TextInput placeholder="Email" style={styles.input} />
                        <TextInput placeholder="Password" secureTextEntry style={styles.input} />
                        <Text style={{ color: 'white' }}> - or - </Text>
                        <Pressable style={styles.googleButton} onPress={() => {/* handle Google login */}}>
                            <Image source={googleLogo} style={styles.googleLogo} />
                        </Pressable>
                        <Pressable style={styles.button} onPress={() => setView('welcome')}>
                            <Text style={styles.buttonText}>Sign Up</Text>
                        </Pressable>
                    </>
                );
            default:
                return (
                    <>
                        <Text style={styles.welcomeText}>Welcome!</Text>
                        <Text style={styles.subtitleText}>{typedText}</Text>
                        <View style={styles.buttonContainer}>
                            <Pressable style={styles.button} onPress={() => setView('login')}>
                                <Text style={styles.buttonText}>Log In</Text>
                            </Pressable>
                            <Pressable style={styles.button} onPress={() => setView('signup')}>
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
            imageStyle={styles.backgroundImage}
        >
            <View style={[styles.overlay, view === 'welcome' ? styles.welcomeOverlay : styles.formOverlay]}>
                {renderContent()}
            </View>
        </ImageBackground>
    );
};

export default Welcome