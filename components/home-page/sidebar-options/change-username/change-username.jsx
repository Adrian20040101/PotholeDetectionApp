import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, Animated, Dimensions } from 'react-native';
import { auth, db } from '../../../../config/firebase/firebase-config';
import { doc, updateDoc } from "firebase/firestore";
import { toast } from 'react-toastify';
import styles from './change-username.style';

const ChangeUsernameModal = ({ isVisible, onClose }) => {
    const [newUsername, setNewUsername] = useState('');
    const [modalWidth, setModalWidth] = useState(Dimensions.get('window').width < 800 ? '85%' : '35%');

    const overlayAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        const updateModalWidth = () => {
            const screenWidth = Dimensions.get('window').width;
            setModalWidth(screenWidth < 800 ? '85%' : '35%');
        };

        Dimensions.addEventListener('change', updateModalWidth);
        return () => {
            Dimensions.removeEventListener('change', updateModalWidth);
        };
    }, []);

    useEffect(() => {
        if (isVisible) {
            Animated.parallel([
                Animated.timing(overlayAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 5,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(overlayAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.8,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                overlayAnim.setValue(0);
                scaleAnim.setValue(0.8);
            });
        }
    }, [isVisible]);

    const handleChangeUsername = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                await updateDoc(userDocRef, { username: newUsername });
                toast.success('Username updated successfully.');
                onClose();
            } else {
                toast.error('No user is currently signed in.');
            }
        } catch (error) {
            toast.error(`Failed to update username: ${error.message}`);
        }
    };

    return (
        isVisible && (
            <Animated.View style={[styles.modalOverlay, { opacity: overlayAnim }]}>
                <Animated.View style={[styles.modalContent, { width: modalWidth, transform: [{ scale: scaleAnim }] }]}>
                    <Pressable style={styles.closeButton}
                        onPress={() => {
                        Animated.parallel([
                            Animated.timing(overlayAnim, {
                            toValue: 0,
                            duration: 200,
                            useNativeDriver: true,
                            }),
                            Animated.timing(scaleAnim, {
                            toValue: 0.8,
                            duration: 200,
                            useNativeDriver: true,
                            }),
                        ]).start(() => {
                            onClose();
                        });
                        }}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </Pressable>
                    <Text style={styles.modalTitle}>Change Username</Text>
                    <TextInput
                        placeholder="New Username"
                        value={newUsername}
                        onChangeText={(username) => setNewUsername(username)}
                        style={styles.input}
                    />
                    <Pressable style={styles.saveButton} onPress={handleChangeUsername}>
                        <Text style={styles.saveButtonText}>Change Username</Text>
                    </Pressable>
                </Animated.View>
            </Animated.View>
        )
    );
};

export default ChangeUsernameModal;
