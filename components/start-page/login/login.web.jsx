import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Image, Alert } from 'react-native';
import { toast } from 'react-toastify';
import { useAuth } from '../../../context-components/use-auth';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth, db } from '../../../config/firebase/firebase-config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import styles from './login.style';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Cookies from 'js-cookie';

WebBrowser.maybeCompleteAuthSession();

const backArrow = require('../../../assets/icons/back-arrow-icon.png');
const googleLogo = require('../../../assets/logos/google-logo-2.png');

const Login = ({ onBackPress, onSignupPress, onForgotPasswordPress }) => {
    const { handleLogin, error, setError, navigation } = useAuth();
    const [emailOrUsername, setEmailOrUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isHovered, setIsHovered] = useState({ login: false, googleButton: false });

    const redirectUri = AuthSession.makeRedirectUri({
        useProxy: true,
    });

    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        clientId: '240153903599-6vjlau3mss0643ktcji5vk2uc1t5qdfl.apps.googleusercontent.com',
        redirectUri: redirectUri,
        scopes: ['profile', 'email'],
    });

    useEffect(() => {
        const handleGoogleSignIn = async () => {
            if (response?.type === 'success') {
                try {
                    const { id_token } = response.params;
                    const credential = GoogleAuthProvider.credential(id_token);
                    
                    const userCredential = await signInWithCredential(auth, credential);
                    const user = userCredential.user;
    
                    Cookies.set(`linkedAccount_${user.uid}_idToken`, id_token, { expires: 7, secure: true });
                    Cookies.set(`linkedAccount_${user.uid}_refreshToken`, user.stsTokenManager.refreshToken, { expires: 7, secure: true });
                    
                    await fetchOrCreateUserData(user);
                    navigation.navigate('HomePage');
                } catch (error) {
                    console.error('Error signing in with Google:', error);
                    Alert.alert('Error', 'Error signing in with Google. Please try again.');
                }
            }
        };

        handleGoogleSignIn();
    }, [response]);

    const fetchOrCreateUserData = async (user) => {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            const googleProfilePictureUrl = user.photoURL;
            await setDoc(userDocRef, {
                username: user.displayName,
                email: user.email,
                profilePictureUrl: googleProfilePictureUrl,
                contributions: 0,
                joinDate: new Date()
            });
        }
    };

    const onSubmit = () => {
        handleLogin(emailOrUsername, password);
    };

    const handleForgotPassword = () => {
        if (!emailOrUsername) {
            toast.error('Please enter your email to reset your password.');
            return;
        }

        sendPasswordResetEmail(auth, emailOrUsername)
            .then(() => {
                toast.success('Reset Link has been sent! Check your email.');
            })
            .catch((error) => {
                console.error('Error sending password reset email:', error.message);
                toast.error('An error occurred. Please make sure you typed your email correctly and try again.');
            });
    };

    const handleGoogleLogin = () => {
        promptAsync();
    };

    return (
        <View style={styles.formContainer}>
            <Pressable 
                style={styles.backButton} 
                onPress={onBackPress}
                onMouseEnter={() => setIsHovered({ ...isHovered, backButton: true })}
                onMouseLeave={() => setIsHovered({ ...isHovered, backButton: false })}
            >
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
            <Pressable onPress={onSignupPress}>
                <Text style={styles.signUpText}>New here? <Text style={styles.signUpLink}>Sign Up</Text></Text>
            </Pressable>
            <Text style={{color: '#fff', marginVertical: 10}}>- or -</Text>
            <Pressable 
                style={[styles.googleButton, isHovered.googleButton && styles.googleButtonHover]} 
                onPress={handleGoogleLogin}
                onMouseEnter={() => setIsHovered({ ...isHovered, googleButton: true })}
                onMouseLeave={() => setIsHovered({ ...isHovered, googleButton: false })}
            >
                <Image source={googleLogo} style={styles.googleLogo} />
                <Text style={styles.googleButtonText}>Continue With Google</Text>
            </Pressable>
            <Pressable 
                style={[styles.button, isHovered.login && styles.buttonHover]} 
                onPress={onSubmit}
                onMouseEnter={() => setIsHovered({ ...isHovered, login: true })}
                onMouseLeave={() => setIsHovered({ ...isHovered, login: false })}
            >
                <Text style={styles.buttonText}>Login</Text>
            </Pressable>
            <Pressable onPress={handleForgotPassword}>
                <Text style={styles.signUpText}>
                    Forgot your password? <Text style={styles.forgotPasswordText}>Reset it</Text>
                </Text>
            </Pressable>
        </View>
    );
};

export default Login;
