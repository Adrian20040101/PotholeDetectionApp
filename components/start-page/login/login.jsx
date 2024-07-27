import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Image, Alert, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword, signInWithPopup, signInWithCredential, signInAnonymously, GoogleAuthProvider } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../../config/firebase/firebase-config';
import styles from './login.style';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Font from 'expo-font';
import AppLoading from 'expo-app-loading';

WebBrowser.maybeCompleteAuthSession();

const googleLogo = require('../../../assets/logos/google-logo-2.png');
const backArrow = require('../../../assets/icons/back-arrow-icon.png');

const Login = ({ onBackPress }) => {
    const navigation = useNavigation();
    const [isHovered, setIsHovered] =  useState({ login: false, googleButton: false})
    const [emailOrUsername, setEmailOrUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    //const navigation = useNavigation();

    // const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    //     clientId: '280319253024-a79cn7spqmoth4pktb198f7o6h7uttp7.apps.googleusercontent.com',
    //     redirectUri: AuthSession.makeRedirectUri({
    //         useProxy: true,
    //     }),
    //     scopes: ['profile', 'email'],
    // });

    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        clientId: Platform.select({
            android: '280319253024-hf4rrb3lgl0s052upabndsnpvdaiui7m.apps.googleusercontent.com',
            web: '280319253024-a79cn7spqmoth4pktb198f7o6h7uttp7.apps.googleusercontent.com',
        }),
        redirectUri: AuthSession.makeRedirectUri({
            scheme: 'potholedetection',
        }),
        scopes: ['profile', 'email'],
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            const credential = GoogleAuthProvider.credential(id_token);
            signInWithCredential(auth, credential)
                .then(() => {
                    navigation.navigate('HomePage');
                })
                .catch((error) => {
                    console.error('Error signing in with Google:', error);
                    Alert.alert('Error', 'Error signing in with Google. Please try again.');
                });
        }
    }, [response]);

    const handleLogin = async () => {
        setError('');
        if (emailOrUsername === '' || password === '') {
            setError('Please fill in both fields');
            return;
        }

        let email = emailOrUsername;

        if (!email.includes('@')) {
            try {
                // if the input is a username (doesn't contain an '@' symbol), fetch the corresponding email
                const usernamesRef = collection(db, 'users');
                const q = query(usernamesRef, where('username', '==', emailOrUsername));
                const querySnapshot = await getDocs(q);
                if (querySnapshot.empty) {
                    setError('Username not found');
                    return;
                }
                email = querySnapshot.docs[0].data().email;
            } catch (error) {
                setError('Error checking username. Please try again.');
                console.error('Error checking username:', error);
                return;
            }
        }
    
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigation.navigate('HomePage');
            console.log(`Login successful. Welcome ${emailOrUsername}`)
        } catch (error) {
            console.error('Error signing you in:', error.message);
            if (error.code === 'auth/invalid-email') {
                setError('No user found with this email.');
            } else if (error.code === 'auth/invalid-credential') {
                setError('Invalid credentials.');
            } else {
                setError('Error signing in. Please try again.');
            }
        }
    };

    const handleGoogleLogin = async () => {
        promptAsync(); 
    }

    return (
        <View style={styles.formContainer}>
            <Pressable style={styles.backButton} onPress={onBackPress}>
                <Image source={backArrow} style={styles.backArrow}/>
            </Pressable>
            <Text style={styles.title}>Login</Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TextInput
                placeholder="Email/Username"
                style={styles.input}
                value={emailOrUsername}
                onChangeText={setEmailOrUsername}
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