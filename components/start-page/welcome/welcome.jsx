import React from "react";
import { useState } from "react";
import { View, Text, Pressable, ImageBackground } from 'react-native'
import styles from "./welcome.style";

const backgroundImage = require('../../../assets/images/pothole-cinematic-2.jpg');

const Welcome = () => {
    const [isHovered, setIsHovered] = useState({ login: false, signup: false });

    return (
        <ImageBackground 
            source={{uri: 'https://img.freepik.com/premium-photo/pothole-road-ground-view-cinematic-lighting-generative-aixa_40453-3640.jpg'}} 
            style={styles.background}
            resizeMode="cover"
        >
            <View style={styles.overlay}>
                <Text style={styles.welcomeText}>Welcome!</Text>
                <Text style={styles.subtitleText}>Making roads safer, one pothole at a time.</Text>
                <View style={styles.buttonContainer}>
                    <Pressable 
                        style={[styles.button, isHovered.login && styles.buttonHover]} 
                        onPress={() => {/* Navigate to Log In */}}
                        onMouseEnter={() => setIsHovered({ ...isHovered, login: true })}
                        onMouseLeave={() => setIsHovered({ ...isHovered, login: false })}
                    >
                        <Text style={styles.buttonText}>Log In</Text>
                    </Pressable>
                    <Pressable 
                        style={[styles.button, isHovered.signup && styles.buttonHover]} 
                        onPress={() => {/* Navigate to Sign Up */}}
                        onMouseEnter={() => setIsHovered({ ...isHovered, signup: true })}
                        onMouseLeave={() => setIsHovered({ ...isHovered, signup: false })}
                    >
                        <Text style={styles.buttonText}>Sign Up</Text>
                    </Pressable>
                </View>
            </View>
        </ImageBackground>
    )
}

export default Welcome