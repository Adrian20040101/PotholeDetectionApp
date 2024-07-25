import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Image, Alert, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword, signInWithPopup, signInWithCredential, signInAnonymously, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../../config/firebase/firebase-config';
import styles from './login.style';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const googleLogo = require('../../../assets/logos/google-logo-2.png');

const Login = ({ onBackPress }) => {
    const [isHovered, setIsHovered] =  useState({ login: false, googleButton: false})
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    //const navigation = useNavigation();

    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        clientId: '280319253024-a79cn7spqmoth4pktb198f7o6h7uttp7.apps.googleusercontent.com',
        redirectUri: AuthSession.makeRedirectUri({
            useProxy: true,
        }),
        scopes: ['profile', 'email'],
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            const credential = GoogleAuthProvider.credential(id_token);
            signInWithCredential(auth, credential)
                .then(() => {
                    //navigation.navigate('HomePage');
                })
                .catch((error) => {
                    console.error('Error signing in with Google:', error);
                    Alert.alert('Error', 'Error signing in with Google. Please try again.');
                });
        }
    }, [response]);

    const handleLogin = async () => {
        if (email === '' || password === '') 
            Alert.alert('Error', 'Please fill in both fields');
        try {
            await signInWithEmailAndPassword(auth, email, password)
            const user = auth.currentUser;
            if (user) {
                //navigation.navigate('HomePage');
            }
        } catch (error) {
            console.error('Error signing you in.')
            Alert.alert('Error', 'Error signing you in. Please try again.');
        }
    };

    const handleGoogleLogin = async () => {
        promptAsync(); 
    }

    return (
        <View style={styles.formContainer}>
            <Pressable style={styles.backButton} onPress={onBackPress}>
                <Icon name="arrow-back" size={24} color="#fff" />
            </Pressable>
            <Text style={styles.title}>Login</Text>
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
            <Text style={{color: 'white'}}>- or -</Text>
            <Pressable 
                style={[styles.googleButton, isHovered.googleButton && styles.googleButtonHover]} 
                onPress={handleGoogleLogin}
                onMouseEnter={() => setIsHovered({ ...isHovered, googleButton: true })}
                onMouseLeave={() => setIsHovered({ ...isHovered, googleButton: false })}
            >
                <Image source={googleLogo} style={styles.googleLogo} />
            </Pressable>
            <Pressable 
                style={[styles.button, isHovered.login && styles.buttonHover]} 
                onPress={handleLogin}
                onMouseEnter={() => setIsHovered({ ...isHovered, login: true })}
                onMouseLeave={() => setIsHovered({ ...isHovered, login: false })}
            >
                <Text style={styles.buttonText}>Login</Text>
            </Pressable>
        </View>
    );
};

export default Login;