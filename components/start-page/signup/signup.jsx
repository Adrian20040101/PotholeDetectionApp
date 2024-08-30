import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Image } from 'react-native';
import { collection, where, query, getDocs, getDoc, setDoc, doc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../../config/firebase/firebase-config';
import styles from './signup.style';

const googleLogo = require('../../../assets/logos/google-logo-2.png');
const backArrow = require('../../../assets/icons/back-arrow-icon.png');

const Signup = ({ onBackPress, onLoginPress }) => {
    const [isHovered, setIsHovered] = useState({ signup: false, googleButton: false });
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [validation, setValidation] = useState(false);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSignup = async () => {
        setError('');
        try {
            if (username === '' || email === '' || password === '' || confirmPassword === '') {
                setError('Please fill in all fields');
                setValidation(false);
                return;
            }

            if (username.includes('@')) {
                setError("Username cannot contain '@' symbol");
                setValidation(false);
                return;
            }

            if (!validateEmail(email)) {
                setError('Email is not valid.');
                setValidation(false);
                return;
            }

            if (password !== confirmPassword) {
                setError('Passwords do not match.');
                setValidation(false);
                return;
            }

            // check if username already exists
            const usernamesRef = collection(db, 'users');
            const q = query(usernamesRef, where('username', '==', username));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                setError('Username is already taken.');
                setValidation(false);
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            setValidation(true);
            const user = userCredential.user;
            console.log('User signed up:', user);

            // save a default profile picture along with username and email (can be changed later on)
            const defaultProfilePictureUrl = 'https://t3.ftcdn.net/jpg/05/87/76/66/360_F_587766653_PkBNyGx7mQh9l1XXPtCAq1lBgOsLl6xH.jpg';

            // save the username in Firestore
            await setDoc(doc(db, 'users', user.uid), { username, email, profilePictureUrl: defaultProfilePictureUrl });
        } catch (error) {
            console.error('Error signing up:', error.message);
            if (error.code === 'auth/email-already-in-use') {
                setError('This email is already in use. Please use a different email or reset your password if you forgot it.');
            } else if (error.code === 'auth/weak-password') {
                setError('The password is too weak.');
            } else {
                setError('An error occurred during signup. Please try again.');
            }
        }
    };

    return (
        <View style={styles.formContainer}>
            <Pressable style={styles.backButton} onPress={onBackPress}>
                <Image source={backArrow} style={styles.backArrow} />
            </Pressable>
            <Text style={styles.title}>Sign Up</Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {validation ? <Text style={styles.validationText}>Sign up successful! You can now log in using these credentials</Text> : null}
            <TextInput
                placeholder="Username"
                style={styles.input}
                value={username}
                onChangeText={setUsername}
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
            <Pressable
                style={[styles.button, isHovered.signup && styles.buttonHover]}
                onPress={handleSignup}
                onMouseEnter={() => setIsHovered({ ...isHovered, signup: true })}
                onMouseLeave={() => setIsHovered({ ...isHovered, signup: false })}
            >
                <Text style={styles.buttonText}>Sign Up</Text>
            </Pressable>
            <Pressable onPress={onLoginPress}>
                <Text style={styles.signUpText}>Already have an account? <Text style={styles.signUpLink}>Log In</Text></Text>
            </Pressable>
        </View>
    );
};

export default Signup;
