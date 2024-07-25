import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Image, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from './signup.style';

const googleLogo = require('../../../assets/logos/google-logo-2.png'); // Ensure you have a Google logo image in your assets folder

const Signup = ({ onBackPress }) => {
    const [isHovered, setIsHovered] =  useState({ signup: false, googleButton: false})
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSignup = () => {
        if (name === '' || email === '' || password === '' || confirmPassword === '') {
            Alert.alert('Error', 'Please fill in all fields');
        } else {
            Alert.alert('Success', `Signed up with email: ${email}`);
        }
    };

    return (
        <View style={styles.formContainer}>
            <Pressable style={styles.backButton} onPress={onBackPress}>
                <Icon name="arrow-back" size={24} color="#fff" />
            </Pressable>
            <Text style={styles.title}>Sign Up</Text>
            <TextInput
                placeholder="Name"
                style={styles.input}
                value={name}
                onChangeText={setName}
            />
            <TextInput
                placeholder="Email"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <TextInput
                placeholder="Password"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <TextInput
                placeholder="Confirm Password"
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
            />
            <Text style={{color: 'white'}}>- or -</Text>
            <Pressable 
                style={[styles.googleButton, isHovered.googleButton && styles.googleButtonHover]} 
                onPress={() => {/* handle Google login */}}
                onMouseEnter={() => setIsHovered({ ...isHovered, googleButton: true })}
                onMouseLeave={() => setIsHovered({ ...isHovered, googleButton: false })}
            >
                <Image source={googleLogo} style={styles.googleLogo} />
            </Pressable>
            <Pressable 
                style={[styles.button, isHovered.signup && styles.buttonHover]} 
                onPress={handleSignup}
                onMouseEnter={() => setIsHovered({ ...isHovered, signup: true })}
                onMouseLeave={() => setIsHovered({ ...isHovered, signup: false })}
            >
                <Text style={styles.buttonText}>Sign Up</Text>
            </Pressable>
        </View>
    );
};

export default Signup;
