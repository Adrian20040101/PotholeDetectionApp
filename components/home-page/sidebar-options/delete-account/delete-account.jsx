import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, Modal, CheckBox, StyleSheet } from 'react-native';
import { auth, db } from '../../../../config/firebase/firebase-config';
import { deleteUser } from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";
import { toast } from 'react-toastify';
import styles from './delete-account.style';

const DeleteAccountModal = ({ isVisible, onClose }) => {
    const [isAcknowledged, setIsAcknowledged] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation();

    const handleDeleteAccount = async () => {
        try {
            setIsLoading(true);
            const user = auth.currentUser;
            if (user) {
                await deleteDoc(doc(db, 'users', user.uid));
                await deleteUser(user);
                toast.success('Account deleted successfully.');
                navigation.navigate('Welcome');
            } else {
                toast.error('No user is currently signed in.');
            }
        } catch (error) {
            toast.error(`Failed to delete account: ${error.message}`);
        } finally {
            setIsLoading(false);
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
                    <Text style={styles.modalTitle}>Warning</Text>
                    <Text style={styles.warningText}>
                        This action cannot be undone! Deleting your account will permanently remove all your data.
                    </Text>
                    <View style={styles.checkboxContainer}>
                        <CheckBox
                            value={isAcknowledged}
                            onValueChange={setIsAcknowledged}
                        />
                        <Text style={styles.checkboxLabel}>
                            I acknowledge that the action is irreversible and I consent to continue.
                        </Text>
                    </View>
                    <Pressable
                        style={[
                            styles.deleteButton,
                            { backgroundColor: isAcknowledged ? '#FF4D4F' : '#ccc' },
                        ]}
                        onPress={handleDeleteAccount}
                        disabled={!isAcknowledged || isLoading}
                    >
                        <Text style={styles.deleteButtonText}>
                            {isLoading ? 'Deleting...' : 'Delete Account'}
                        </Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

export default DeleteAccountModal;