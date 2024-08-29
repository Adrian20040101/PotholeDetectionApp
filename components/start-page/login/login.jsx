import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Image, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword, signInWithCredential, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { getDoc, getDocs, doc, collection, query, where, setDoc } from 'firebase/firestore';
import { auth, db } from '../../../config/firebase/firebase-config';
import { toast } from 'react-toastify';
import styles from './login.style';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const googleLogo = require('../../../assets/logos/google-logo-2.png');
const backArrow = require('../../../assets/icons/back-arrow-icon.png');

const Login = ({ onBackPress, onSignupPress, onForgotPasswordPress }) => {
    const navigation = useNavigation();
    const [isHovered, setIsHovered] =  useState({ login: false, googleButton: false });
    const [emailOrUsername, setEmailOrUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        clientId: Platform.select({
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
                .then(async (userCredential) => {
                    const user = userCredential.user;
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (!userDoc.exists()) {
                    // if new google user, save google profile picture
                    const googleProfilePictureUrl = user.photoURL;

                    await setDoc(userDocRef, {
                        username: user.displayName,
                        email: user.email,
                        profilePictureUrl: googleProfilePictureUrl,
                    });
                }
                    navigateToHome(userCredential.user);
                })
                .catch((error) => {
                    console.error('Error signing in with Google:', error);
                    Alert.alert('Error', 'Error signing in with Google. Please try again.');
                });
        }
    }, [response]);

    const navigateToHome = async (user) => {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        navigation.navigate('HomePage', { user: { ...user, ...userData } });
    };

    const handleLogin = async () => {
        setError('');
        if (emailOrUsername === '' || password === '') {
            setError('Please fill in both fields');
            return;
        }

        let email = emailOrUsername;

        if (!email.includes('@')) {
            try {
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
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            if (user) {
              const userDoc = await getDoc(doc(db, 'users', user.uid));
              const userData = userDoc.data();
              navigation.navigate('HomePage', { user: { ...userData, email: user.email } });
            }
            console.log(`Login successful. Welcome ${emailOrUsername}`);
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

    const handleForgotPassword = () => {
        if (!emailOrUsername) {
            toast.error('Please enter your email to reset your password.');
            return;
        }

        sendPasswordResetEmail(auth, emailOrUsername)
            .then(() => {
              toast.success('Reset Link has been sent! Check your email.')  
            })
            .catch((error) => {
                console.error('Error sending password reset email:', error.message);
                toast.error('An error occurred. Please make sure you typed your email correctly and try again.')
            });
    };

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
            <Pressable onPress={onSignupPress}>
                <Text style={styles.signUpText}>New here? <Text style={styles.signUpLink}>Sign Up</Text></Text>
            </Pressable>
            <Text style={{color: 'white'}}>- or -</Text>
            <Pressable 
                style={[styles.googleButton, isHovered.googleButton && styles.googleButtonHover]} 
                onPress={handleGoogleLogin}
                onMouseEnter={() => setIsHovered({ ...isHovered, googleButton: true })}
                onMouseLeave={() => setIsHovered({ ...isHovered, googleButton: false })}
            >
                Continue With Google <Image source={googleLogo} style={styles.googleLogo} />
            </Pressable>
            <Pressable 
                style={[styles.button, isHovered.login && styles.buttonHover]} 
                onPress={handleLogin}
                onMouseEnter={() => setIsHovered({ ...isHovered, login: true })}
                onMouseLeave={() => setIsHovered({ ...isHovered, login: false })}
            >
                <Text style={styles.buttonText}>Login</Text>
            </Pressable>
            <Pressable onPress={handleForgotPassword}>
            <Text style={styles.signUpText}>Forgot your password? <Text style={styles.forgotPasswordText}>Reset it</Text></Text>
            </Pressable>
        </View>
    );
};

export default Login;
