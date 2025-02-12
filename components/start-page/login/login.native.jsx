import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Image, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword, signInWithCredential, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { getDoc, getDocs, doc, collection, query, where, setDoc } from 'firebase/firestore';
import { auth, db } from '../../../config/firebase/firebase-config';
import styles from './login.style';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

WebBrowser.maybeCompleteAuthSession();

const backArrow = require('../../../assets/icons/back-arrow-icon.png');
const googleLogo = require('../../../assets/logos/google-logo-2.png');

const Login = ({ onBackPress, onSignupPress, onForgotPasswordPress }) => {
  const navigation = useNavigation();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const redirectUri = AuthSession.makeRedirectUri({
    useProxy: true,
  });

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    androidClientId: '240153903599-nlse1hmu784682nn6c4m1eleb2tkqvsl.apps.googleusercontent.com',
    iosClientId: '240153903599-qsqsrccf6a9p4o2nsvo7pjong2tma1f7.apps.googleusercontent.com',
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

          const idTokenValue = await user.getIdToken();
          const refreshToken = user.refreshToken;

          await AsyncStorage.setItem(`linkedAccount_${user.uid}_idToken`, idTokenValue);
          await AsyncStorage.setItem(`linkedAccount_${user.uid}_refreshToken`, refreshToken);

          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            await setDoc(userDocRef, {
              username: user.displayName,
              email: user.email,
              profilePictureUrl: user.photoURL,
              contributions: 0,
              joinDate: new Date(),
            });
          }

          Toast.show({
            type: 'success',
            text1: 'Login successful! Welcome.',
          });
          navigation.navigate('HomePage');
        } catch (error) {
          console.error('Error signing in with Google:', error);
          Alert.alert('Error', 'Error signing in with Google. Please try again.');
        }
      }
    };

    handleGoogleSignIn();
  }, [response]);

  const onSubmit = () => {
    handleLogin(emailOrUsername, password);
  };

  const handleLogin = async (emailOrUsername, password) => {
    setError('');
    if (emailOrUsername === '' || password === '') {
      setError('Please fill in both fields');
      Toast.show({
        type: 'error',
        text1: 'Please fill in both fields',
      });
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
          Toast.show({
            type: 'error',
            text1: 'Username not found',
          });
          return;
        }
        email = querySnapshot.docs[0].data().email;
      } catch (error) {
        setError('Error checking username. Please try again.');
        console.error('Error checking username:', error);
        Toast.show({
          type: 'error',
          text1: 'Error checking username. Please try again.',
        });
        return;
      }
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const idTokenValue = await user.getIdToken(true);
      const refreshToken = user.refreshToken;

      await AsyncStorage.setItem(`linkedAccount_${user.uid}_idToken`, idTokenValue);
      await AsyncStorage.setItem(`linkedAccount_${user.uid}_refreshToken`, refreshToken);

      navigation.navigate('HomePage');

      Toast.show({
        type: 'success',
        text1: `Login successful. Welcome ${emailOrUsername}`,
      });
    } catch (error) {
      console.error('Error signing you in:', error.message);
      if (error.code === 'auth/invalid-email') {
        setError('No user found with this email.');
        Toast.show({
          type: 'error',
          text1: 'No user found with this email.',
        });
      } else if (error.code === 'auth/invalid-credential') {
        setError('Invalid credentials.');
        Toast.show({
          type: 'error',
          text1: 'Invalid credentials.',
        });
      } else {
        setError('Error signing in. Please try again.');
        Toast.show({
          type: 'error',
          text1: 'Error signing in. Please try again.',
        });
      }
    }
  };

  const handleGoogleLogin = () => {
    promptAsync();
  };

  const handleForgotPassword = () => {
    if (!emailOrUsername) {
      Toast.show({
        type: 'error',
        text1: 'Please enter your email to reset your password.',
      });
      return;
    }

    sendPasswordResetEmail(auth, emailOrUsername)
      .then(() => {
        Toast.show({
          type: 'success',
          text1: 'Reset Link has been sent! Check your email.',
        });
      })
      .catch((error) => {
        console.error('Error sending password reset email:', error.message);
        Toast.show({
          type: 'error',
          text1: 'An error occurred. Please make sure you typed your email correctly and try again.',
        });
      });
  };

  return (
    <View style={styles.formContainer}>
      <Pressable style={styles.backButton} onPress={onBackPress}>
        <Image source={backArrow} style={styles.backArrow} />
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
        <Text style={styles.signUpText}>
          New here? <Text style={styles.signUpLink}>Sign Up</Text>
        </Text>
      </Pressable>
      <Text style={{ color: 'black', marginVertical: 10 }}>- or -</Text>
      <Pressable style={styles.googleButton} onPress={handleGoogleLogin}>
        <Image source={googleLogo} style={styles.googleLogo} />
        <Text style={styles.googleButtonText}>Continue With Google</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={onSubmit}>
        <Text style={styles.buttonText}>Login</Text>
      </Pressable>
      <Pressable onPress={handleForgotPassword}>
        <Text style={styles.signUpText}>
          Forgot your password? <Text style={styles.forgotPasswordText}>Reset it</Text>
        </Text>
      </Pressable>
      <Toast ref={(ref) => Toast.setRef(ref)} />
    </View>
  );
};

export default Login;
