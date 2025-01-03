import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Animated, PanResponder, Image, Pressable, useWindowDimensions, Easing } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { collection, query, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../config/firebase/firebase-config.js';
import Voting from '../voting/votes.jsx';
import CommentSection from './comment-section/comment-section.jsx';
import ProfileModal from '../../profile-modal/profile-modal.jsx';
import styles from './bottom-sheet.style';

const BottomSheet = ({ visible, onClose, marker, isLoggedIn }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isPC = screenWidth >= 800;
  const sheetHeight = 425;
  const expandedHeight = screenHeight + 80; 
  const animatedValue = useRef(new Animated.Value(0)).current;
  const pan = useRef(new Animated.Value(0)).current; 
  const animatedHeight = useRef(new Animated.Value(sheetHeight)).current; 
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState([]);
  const [isProfileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isVisibleInternal, setIsVisibleInternal] = useState(visible);
  const closingMethodRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false); 

  const handleExpand = () => setExpanded(true);
  const handleCollapse = () => setExpanded(false);

  const getStatusColor = () => {
    if (marker.status === 'likely a pothole') return 'green';
    if (marker.status === 'unlikely a pothole') return 'red';
    return 'black';
  };

  const badgeImages = {
    bronze: require('../../../../assets/images/bronze.png'),
    silver: require('../../../../assets/images/silver.png'),
    gold: require('../../../../assets/images/gold.png'),
    diamond: require('../../../../assets/images/diamond.png'),
    emerald: require('../../../../assets/images/emerald.png'),
    platinum: require('../../../../assets/images/platinum.png'),
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

  const handleUserPress = (userId) => {
    setSelectedUserId(userId);
    setProfileModalVisible(true);
  };

  const closeProfileModal = () => {
    setProfileModalVisible(false);
    setSelectedUserId(null);
  };

  const handleCloseButton = () => {
    if (isAnimating || closingMethodRef.current) return; 
    closingMethodRef.current = 'button';
    setIsAnimating(true);
    setExpanded(false); 

    onClose();
  };

  const handleSwipeClose = () => {
    if (isAnimating || closingMethodRef.current) return; 
    closingMethodRef.current = 'swipe';
    setIsAnimating(true);
    setExpanded(false);

    Animated.timing(animatedValue, {
      toValue: 0, 
      duration: 300,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setIsVisibleInternal(false); 
      setIsAnimating(false);
      closingMethodRef.current = null;
      onClose();
    });
  };

  useEffect(() => {
    if (!marker) return;

    const commentsRef = collection(db, 'markers', marker.id, 'comments');
    const commentsQuery = query(commentsRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(commentsQuery, async (snapshot) => {
      const fetchedComments = await Promise.all(
        snapshot.docs.map(async (commentDoc) => {
          const commentData = commentDoc.data();
          const userRef = doc(db, 'users', commentData.userId);
          const userDoc = await getDoc(userRef);

          return {
            id: commentDoc.id,
            ...commentData,
            username: userDoc.exists() || commentData.userId !== 'anonymous' ? userDoc.data().username : 'Anonymous User',
            userProfilePicture: userDoc.exists() || commentData.userId !== 'anonymous' ? userDoc.data().profilePictureUrl : 'https://t3.ftcdn.net/jpg/05/87/76/66/360_F_587766653_PkBNyGx7mQh9l1XXPtCAq1lBgOsLl6xH.jpg',
            contributions: userDoc.exists() || commentData.userId !== 'anonymous' ? userDoc.data().contributions : 'N/A',
          };
        })
      );
      setComments(fetchedComments);
    });

    return () => unsubscribe();
  }, [marker]);

  useEffect(() => {
    if (marker?.userId) {
      const fetchUserData = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', marker.userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            marker.username = marker.userId === 'anonymous' ? 'Anonymous User' : userData.username;
            marker.userProfilePicture = marker.userId === 'anonymous' ? 'https://t3.ftcdn.net/jpg/05/87/76/66/360_F_587766653_PkBNyGx7mQh9l1XXPtCAq1lBgOsLl6xH.jpg' :userData.profilePictureUrl;
            marker.contributions = marker.userId === 'anonymous' ? 'N/A' : userData.contributions;
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };

      fetchUserData();
    }
  }, [marker]);

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: expanded ? expandedHeight : sheetHeight,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false, 
    }).start();
  }, [expanded]);

  useEffect(() => {
    if (visible) {
      setIsVisibleInternal(true);
      setIsAnimating(true);
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        setIsAnimating(false);
      });
    } else {
      if (closingMethodRef.current === 'button') {
        setIsAnimating(true);
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }).start(() => {
          setIsVisibleInternal(false); 
          setIsAnimating(false);
          closingMethodRef.current = null;
        });
      } else if (closingMethodRef.current === 'swipe') {
      } else {
        setIsVisibleInternal(false);
      }
    }
  }, [visible]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 10,
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        const limitedDy = Math.min(gestureState.dy, sheetHeight);
        const normalizedDy = limitedDy / sheetHeight;
        animatedValue.setValue(1 - normalizedDy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 125) {
        handleSwipeClose();
      } else {
        Animated.spring(animatedValue, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        }).start(() => {
          setIsAnimating(false);
          closingMethodRef.current = null;
        });
      }
    },
  });

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetHeight + 80, 160],
  });

  const badge = marker ? calculateBadge(marker.contributions) : null;

  if (!isVisibleInternal) return null;

  return (
    <Animated.View
      style={[
        styles.bottomSheet,
        {
          height: animatedHeight,
          transform: [{ translateY }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {expanded ? (
        <CommentSection markerId={marker.id} onClose={handleCollapse} />
      ) : (
        <View style={styles.content}>
          <View style={styles.rowContainer}>
            <Image source={{ uri: marker.imageUrl }} style={styles.uploadedImage} />

            <View style={styles.infoAndCommentsContainer}>
              <View style={styles.infoContainer}>
                <View style={styles.userDetails}>
                  {marker.userId === 'anonymous' ? (
                    <Image
                      source={'https://t3.ftcdn.net/jpg/05/87/76/66/360_F_587766653_PkBNyGx7mQh9l1XXPtCAq1lBgOsLl6xH.jpg'}
                      style={styles.userProfilePicture}
                    />
                  ) : (
                    <Pressable onPress={() => handleUserPress(marker.userId)}>
                      <Image
                        source={{ uri: marker.userProfilePicture }}
                        style={styles.userProfilePicture}
                      />
                    </Pressable>
                  )}
                  <View style={styles.userInfo}>
                    <View style={styles.usernameContainer}>
                      <Text style={styles.username}>{marker.userId === 'anonymous' ? 'Anonymous User' : marker.username}</Text>
                      {badge && (
                        <Image
                          source={badgeImages[badge]}
                          style={styles.badgeImage}
                        />
                      )}
                    </View>
                    <Text style={styles.timestamp}>
                      {new Date(marker.timestamp.seconds * 1000).toLocaleString()}
                    </Text>
                  </View>

                  <View style={[styles.votingContainer, isPC && { marginRight: 20 }]}>
                    <Voting markerId={marker.id} />
                  </View>

                  {isPC && (
                    <Pressable
                      onPress={handleCloseButton}
                      style={styles.closeButton}
                      accessibilityLabel="Close Bottom Sheet"
                      accessibilityRole="button"
                    >
                      <FontAwesome name="times" size={24} color="#000" />
                    </Pressable>
                  )}
                </View>
              </View>

              <View style={styles.statusContainer}>
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: getStatusColor(),
                      fontWeight:
                        marker.status !== 'likely a pothole' &&
                        marker.status !== 'unlikely a pothole'
                          ? 'bold'
                          : 'normal',
                    },
                  ]}
                >
                  Current Status: {marker.status}
                </Text>
              </View>

              <View style={styles.commentsContainer}>
                <Text style={styles.commentPreviewTitle}>Comments Preview:</Text>
                {comments.length > 0 ? (
                  comments.slice(-2).map((comment, index) => {
                    const commentBadge = calculateBadge(comment.contributions);
                    return (
                      <View key={index} style={styles.commentPreviewItem}>
                        <Text style={styles.commentUsername}>{comment.username}</Text>
                        {commentBadge && (
                          <Image
                            source={badgeImages[commentBadge]}
                            style={styles.badgeImageSmall}
                          />
                        )}
                        <Text style={styles.commentText}>
                          : {comment.content}
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.noCommentsText}>
                    No comments yet. Start the conversation!
                  </Text>
                )}
                <Pressable style={styles.viewCommentsButton} onPress={handleExpand}>
                  <Text style={styles.viewCommentsButtonText}>Join The Conversation</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      )}
      <ProfileModal
        isVisible={isProfileModalVisible}
        onClose={closeProfileModal}
        userId={selectedUserId}
      />
    </Animated.View>
  );
};

export default BottomSheet;
