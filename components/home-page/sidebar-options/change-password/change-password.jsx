import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, Pressable, Animated, Easing, Dimensions } from 'react-native';
import { auth } from '../../../../config/firebase/firebase-config';
import Toast from 'react-native-toast-message';
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import styles from './change-password.style';

const ChangePasswordModal = ({ isVisible, onClose }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isGoogleUser, setIsGoogleUser] = useState(false);
    const [modalWidth, setModalWidth] = useState(Dimensions.get('window').width < 800 ? '85%' : '70%');

    const overlayAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        const user = auth.currentUser;
        if (user && user.providerData.some(provider => provider.providerId === 'google.com')) {
            setIsGoogleUser(true);
        }
    }, []);

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

      const handleChangePassword = useCallback(async () => {
        if (newPassword !== confirmPassword) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'New passwords do not match.',
            });
            return;
        }

        try {
            const user = auth.currentUser;
            if (!user) {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'No user is currently signed in.',
                });
                return;
            }

            const credential = EmailAuthProvider.credential(user.email, currentPassword);

            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Password updated successfully.',
            });
            onClose();
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: `Failed to update password: ${error.message}`,
            });
        }
    }, [currentPassword, newPassword, confirmPassword, onClose]);

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
                    <Text style={styles.modalTitle}>Change Password</Text>
                    {isGoogleUser ? (
                        <Text style={styles.googleUserMessage}>
                            Users connected via Google cannot change their password here. Please manage your password through your Google account settings.
                        </Text>
                    ) : (
                        <>
                            <TextInput
                                placeholder="Current Password"
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                secureTextEntry
                                style={styles.input}
                            />
                            <TextInput
                                placeholder="New Password"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                                style={styles.input}
                            />
                            <TextInput
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                style={styles.input}
                            />
                            <Pressable style={styles.saveButton} onPress={handleChangePassword}>
                                <Text style={styles.saveButtonText}>Change Password</Text>
                            </Pressable>
                        </>
                    )}
                </Animated.View>
            </Animated.View>
        )
    );
};

export default ChangePasswordModal;
