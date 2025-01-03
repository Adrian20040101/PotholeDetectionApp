import React, { useState, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, Animated, CheckBox, Dimensions } from 'react-native';
import { auth, db } from '../../../../config/firebase/firebase-config';
import { deleteUser } from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";
import { toast } from 'react-toastify';
import styles from './delete-account.style';
import { useUser } from '../../../../context-components/user-context';

const DeleteAccountModal = ({ isVisible, onClose }) => {
    const [isAcknowledged, setIsAcknowledged] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation();
    const { setUserData } = useUser();
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

    const handleDeleteAccount = async () => {
        try {
            setIsLoading(true);
            const user = auth.currentUser;
            if (user) {
                await deleteDoc(doc(db, 'users', user.uid));
                await deleteUser(user);
                setUserData(null);
                toast.success('Account deleted successfully.');
                navigation.navigate('Welcome');
            } else {
                toast.error('No user is currently signed in.');
            }
        } catch (error) {
            toast.error(`Failed to delete account: ${error.message}`);
            console.error(error.message);
        } finally {
            setIsLoading(false);
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
                </Animated.View>
            </Animated.View>
        )
    );
};

export default DeleteAccountModal;
