import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Cookies from 'js-cookie';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../config/firebase/firebase-config';
import { getDoc, getDocs, doc, collection, query, where, setDoc } from 'firebase/firestore';

export const useAuth = () => {
    const navigation = useNavigation();
    const [error, setError] = useState('');

    const storeTokens = async (userUid, idToken, refreshToken) => {
        if (Platform.OS === 'web') {
            Cookies.set(`linkedAccount_${userUid}_idToken`, idToken, { expires: 7, secure: true });
            Cookies.set(`linkedAccount_${userUid}_refreshToken`, refreshToken, { expires: 7, secure: true });
        } else {
            try {
                await AsyncStorage.setItem(`linkedAccount_${userUid}_idToken`, idToken);
                await AsyncStorage.setItem(`linkedAccount_${userUid}_refreshToken`, refreshToken);
            } catch (error) {
                console.error('Error storing tokens:', error);
            }
        }
    };

    const handleLogin = async (emailOrUsername, password) => {
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
            const idToken = await user.getIdToken(true);
            const refreshToken = user.stsTokenManager.refreshToken;
            await storeTokens(user.uid, idToken, refreshToken);
            navigation.navigate('HomePage');
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

    return {
        handleLogin,
        error,
        setError,
        navigation,
    };
};
