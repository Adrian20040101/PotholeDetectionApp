import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Modal } from 'react-native';
import { auth } from '../../../../config/firebase/firebase-config';
import { toast } from 'react-toastify';
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import styles from './change-password.style';

const ChangePasswordModal = ({ isVisible, onClose }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isGoogleUser, setIsGoogleUser] = useState(false);

    // if signed in via google, doesn't make sense to change password
    useEffect(() => {
        const user = auth.currentUser;
        if (user && user.providerData.some(provider => provider.providerId === 'google.com')) {
            setIsGoogleUser(true);
        }
    }, []);

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        try {
            const user = auth.currentUser;
            const credential = EmailAuthProvider.credential(user.email, currentPassword);

            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            toast.success('Password updated successfully.');
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            onRequestClose={onClose}
            transparent={true}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Pressable style={styles.closeButton} onPress={onClose}>
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
                </View>
            </View>
        </Modal>
    );
};

export default ChangePasswordModal;