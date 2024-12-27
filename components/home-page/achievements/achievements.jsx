import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, Button, Image, Animated, Dimensions } from 'react-native';
import { db, auth } from '../../../config/firebase/firebase-config';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useUser } from '../../../context-components/user-context';
import styles from './achievements.style';

const AchievementsModal = ({ isVisible, onClose }) => {
  const userId = auth.currentUser.uid;
  const { userData } = useUser();
  const [contributions, setContributions] = useState(0);
  const [modalWidth, setModalWidth] = useState(Dimensions.get('window').width < 800 ? '85%' : '60%');
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const thresholds = {
    Bronze: 5,
    Silver: 10,
    Gold: 20,
    Diamond: 50,
    Emerald: 100,
    Platinum: 250,
  };

  const badgeImages = {
    Bronze: require('../../../assets/images/bronze.png'),
    Silver: require('../../../assets/images/silver.png'),
    Gold: require('../../../assets/images/gold.png'),
    Diamond: require('../../../assets/images/diamond.png'),
    Emerald: require('../../../assets/images/emerald.png'),
    Platinum: require('../../../assets/images/platinum.png'),
  };

  const checkmarkImage = require('../../../assets/images/check-mark.png');

  useEffect(() => {
    const updateModalWidth = () => {
        const screenWidth = Dimensions.get('window').width;
        setModalWidth(screenWidth < 800 ? '85%' : '50%');
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

  useEffect(() => {
    if (isVisible) {
      const userDocRef = doc(db, 'users', userId);

      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          setContributions(userData.contributions || 0);
        }
      });

      return () => unsubscribe();
    }
  }, [isVisible, userData.id]);

  const calculateProgress = (current, threshold) => {
    return Math.min(current / threshold, 1);
  };

  return (
    <Modal transparent visible={isVisible}>
      <Animated.View style={[styles.modalOverlay, { opacity: overlayAnim }]}>
        <Animated.View style={[styles.modalContent, { width: modalWidth, transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.title}>Achievements</Text>
          <View style={styles.badgeGrid}>
            {Object.keys(thresholds).map((badge) => {
              const isClaimed = contributions >= thresholds[badge];
              const progress = calculateProgress(contributions, thresholds[badge]);
              return (
                <View key={badge} style={styles.badgeItem}>
                  <View style={styles.badgeWrapper}>
                    <Image source={badgeImages[badge]} style={styles.badgeImage} />
                    {isClaimed && (
                      <Image source={checkmarkImage} style={styles.checkmarkImage} />
                    )}
                  </View>
                  <Text style={styles.badgeText}>{badge}</Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progress * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.contributionText}>
                    {contributions}/{thresholds[badge]}
                  </Text>
                </View>
              );
            })}
          </View>
          <Button title="Close"
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
            }} 
          />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default AchievementsModal;
