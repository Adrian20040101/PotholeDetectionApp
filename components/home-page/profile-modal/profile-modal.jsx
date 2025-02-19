import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, View, Text, Image, ScrollView, Dimensions, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { doc, getDoc, getDocs, query, where, orderBy, limit, collection } from 'firebase/firestore';
import { db } from '../../../config/firebase/firebase-config';
import Toast from 'react-native-toast-message';
import styles from './profile-modal.style';

const ProfileModal = ({ isVisible, onClose, userId }) => {
  const [userData, setUserData] = useState(null);
  const [latestPotholes, setLatestPotholes] = useState([]);
  const [loadingPotholes, setLoadingPotholes] = useState(false); 
  const [modalWidth, setModalWidth] = useState(getModalWidth(Dimensions.get('window').width));
  const [isCompact, setIsCompact] = useState(Dimensions.get('window').width < 800);
  
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  function getModalWidth(width) {
    return width < 800 ? '85%' : '50%';
  }

  useEffect(() => {
    const updateModalWidth = ({ window: { width } }) => {
      setModalWidth(getModalWidth(width));
      setIsCompact(width < 800);
    };

    const subscription = Dimensions.addEventListener('change', updateModalWidth);

    return () => {
      if (subscription?.remove) {
        subscription.remove();
      } else {
        Dimensions.removeEventListener('change', updateModalWidth);
      }
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
  }, [isVisible, overlayAnim, scaleAnim]);

  useEffect(() => {
    if (isVisible) {
      const fetchUserData = async () => {
        setLoadingPotholes(true);
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserData(userData);

            const potholesQuery = query(
              collection(db, 'markers'),
              where('userId', '==', userId),
              orderBy('timestamp', 'desc'),
              limit(5)
            );

            const potholesSnapshot = await getDocs(potholesQuery);

            const potholes = await Promise.all(
              potholesSnapshot.docs.map(async (potholeDoc) => {
                const data = potholeDoc.data();
                const location = await fetchLocation(data.lat, data.lon); 
                return {
                  id: potholeDoc.id,
                  ...data,
                  location,
                };
              })
            );

            setLatestPotholes(potholes);
          } else {
            console.error('No such user!');
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: 'User data not found.',
            });
          }
        } catch (error) {
          console.error('Error fetching user data or potholes:', error);
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to fetch user data.',
          });
        } finally {
          setLoadingPotholes(false);
        }
      };

      fetchUserData();
    } else {
      setUserData(null);
      setLatestPotholes([]);
    }
  }, [isVisible, userId]);

  const fetchLocation = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://road-guard.netlify.app/.netlify/functions/reverse_geocoding?lat=${latitude}&lng=${longitude}`
      );
      const data = await response.json();
  
      if (response.ok) {
        return `${data.county || 'Unknown County'}, ${data.region || 'Unknown Region'}`;
      } else {
        console.error('Error fetching location:', data.message);
        return 'Unknown Location';
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      return 'Unknown Location';
    }
  };

  const badgeImages = {
    bronze: require('../../../assets/images/bronze.png'),
    silver: require('../../../assets/images/silver.png'),
    gold: require('../../../assets/images/gold.png'),
    diamond: require('../../../assets/images/diamond.png'),
    emerald: require('../../../assets/images/emerald.png'),
    platinum: require('../../../assets/images/platinum.png'),
  };

  const calculateBadge = useCallback((contributions) => {
    const thresholds = {
      Bronze: 5,
      Silver: 10,
      Gold: 20,
      Diamond: 50,
      Emerald: 100,
      Platinum: 250,
    };

    let badge = null;
    for (const [key, threshold] of Object.entries(thresholds)) {
      if (contributions >= threshold) {
        badge = key.toLowerCase();
      }
    }
    return badge;
  }, []);

  const badgeImage = userData ? badgeImages[calculateBadge(userData.contributions)] : null;

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal 
      transparent 
      visible={isVisible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: overlayAnim }]}>
        <Animated.View 
          style={[
            styles.modalContent, 
            { 
              width: modalWidth, 
              transform: [{ scale: scaleAnim }] 
            }
          ]}
          accessible={true}
        >
          <TouchableOpacity 
            style={styles.closeButton}
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
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.modalTitle}>User Profile</Text>

          {userData ? (
            <>
              <View style={[styles.profileSection, isCompact && styles.profileSectionCompact]}>
                <View style={styles.profileInfo}>
                  <Image
                    source={{ uri: userData.profilePictureUrl }}
                    style={styles.profilePicture}
                  />
                  <View style={styles.profileDetails}>
                    <View style={styles.nameAndBadgeContainer}>
                      <Text style={styles.username}>{userData.username}</Text>
                      {badgeImage && (
                        <Image
                          source={badgeImage}
                          style={styles.badge}
                        />
                      )}
                    </View>
                    <Text style={styles.joinDate}>
                      Joined: {userData.joinDate ? new Date(userData.joinDate.toDate()).toLocaleDateString() : 'N/A'}
                    </Text>
                  </View>
                </View>
                <View
                  style={[styles.contributionsSection, isCompact && styles.contributionsSectionCompact]}
                >
                  <Text style={styles.contributionsLabel}>Total Contributions</Text>
                  <Text style={styles.contributionsCount}>{userData.contributions}</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Latest Reported Potholes</Text>
              {loadingPotholes ? ( 
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#0000ff" />
                  <Text style={styles.loadingText}>Loading...</Text>
                </View>
              ) : (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  style={styles.potholeScroll}
                  contentContainerStyle={latestPotholes.length === 0 && styles.noPotholesContainer}
                >
                  {latestPotholes.length > 0 ? (
                    latestPotholes.map((pothole) => (
                      <View key={pothole.id} style={styles.potholeCard}>
                        <Image 
                          source={{ uri: pothole.imageUrl }} 
                          style={styles.potholeImage} 
                        />
                        <Text style={styles.potholeTimestamp}>
                          Reported on: {new Date(pothole.timestamp.toDate()).toLocaleDateString()}
                        </Text>
                        <Text style={styles.potholeStatus}>Status: {pothole.status}</Text>
                        <Text style={styles.potholeLocation}>Located in: {pothole.location}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noPotholesText}>This user has not reported any potholes yet.</Text>
                  )}
                </ScrollView>
              )}
            </>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text style={styles.loadingText}>Loading user data...</Text>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default ProfileModal;
