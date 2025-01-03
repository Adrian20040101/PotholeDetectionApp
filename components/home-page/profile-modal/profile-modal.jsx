import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, Image, ScrollView, Dimensions, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { doc, getDoc, getDocs, query, where, orderBy, limit, collection } from 'firebase/firestore';
import { db } from '../../../config/firebase/firebase-config';
import styles from './profile-modal.style';

const ProfileModal = ({ isVisible, onClose, userId }) => {
  const [userData, setUserData] = useState(null);  // need dynamic userData, can't just take it from the context component
  const [latestPotholes, setLatestPotholes] = useState([]);
  const [loadingPotholes, setLoadingPotholes] = useState(false); 
  const [modalWidth, setModalWidth] = useState(Dimensions.get('window').width < 800 ? '85%' : '50%');
  const [isCompact, setIsCompact] = useState(Dimensions.get('window').width < 800);
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

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
    const updateModalWidth = () => {
      const screenWidth = Dimensions.get('window').width;
      setModalWidth(screenWidth < 800 ? '85%' : '50%');
      setIsCompact(screenWidth < 800);
    };

    Dimensions.addEventListener('change', updateModalWidth);
    return () => {
      Dimensions.removeEventListener('change', updateModalWidth);
    };
  }, []);
  const badgeImages = {
    bronze: require('../../../assets/images/bronze.png'),
    silver: require('../../../assets/images/silver.png'),
    gold: require('../../../assets/images/gold.png'),
    diamond: require('../../../assets/images/diamond.png'),
    emerald: require('../../../assets/images/emerald.png'),
    platinum: require('../../../assets/images/platinum.png'),
  };

  const calculateBadge = (contributions) => {
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
  };

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
          }
        } catch (error) {
          console.error('Error fetching user data or potholes:', error);
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

  const badgeImage = userData ? badgeImages[calculateBadge(userData.contributions)] : null;

  return (
    <Modal transparent visible={isVisible}>
       <Animated.View style={[styles.modalOverlay, { opacity: overlayAnim }]}>
         <Animated.View style={[styles.modalContent, { width: modalWidth, transform: [{ scale: scaleAnim }] }]}>
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
                            <Image
                                source={badgeImage}
                                style={styles.badge}
                            />
                        </View>
                        <Text style={styles.joinDate}>
                        Joined: {userData.joinDate && new Date(userData.joinDate.toDate()).toLocaleDateString()}
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
                        <ActivityIndicator />
                        <Text style={styles.loadingText}>Loading...</Text>
                    </View>
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.potholeScroll}>
                    {latestPotholes.length > 0 ? (
                        latestPotholes.map((pothole) => (
                        <View key={pothole.id} style={styles.potholeCard}>
                            <Image source={{ uri: pothole.imageUrl }} style={styles.potholeImage} />
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
                <Text style={styles.loadingText}>Loading user data...</Text>
            )}
         </Animated.View>
       </Animated.View>
    </Modal>
  );
};

export default ProfileModal;
