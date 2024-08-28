import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Modal } from 'react-native';
import { auth, db } from '../../../../config/firebase/firebase-config';
import { doc, updateDoc } from "firebase/firestore";
import { toast } from 'react-toastify';
import styles from './change-username.style';

const ChangeUsernameModal = ({ isVisible, onClose }) => {
    const [newUsername, setNewUsername] = useState('');

    const handleChangeUsername = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                await updateDoc(userDocRef, { username: newUsername });
                toast.success('Username updated successfully.');
            } else {
                toast.error('No user is currently signed in.');
            }
        } catch (error) {
            toast.error(`Failed to update username: ${error.message}`);
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
                </View>
            </View>
        </Modal>
    );
};

export default ChangeUsernameModal;
