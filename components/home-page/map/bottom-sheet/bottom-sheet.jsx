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
  const { height: screenHeight } = useWindowDimensions();
  const sheetHeight = 425; // initial sheet height
  const expandedHeight = screenHeight + 80; // height when showing comments only
  const animatedValue = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const pan = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = useState(false);
  const animatedHeight = useRef(new Animated.Value(sheetHeight)).current;
  const [comments, setComments] = useState([]);
  const [isProfileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

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

  // fetch comments in real time
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
            id: doc.id,
            ...commentData,
            username: userDoc.exists() ? userDoc.data().username : 'Unknown User',
            userProfilePicture: userDoc.data().profilePictureUrl,
            contributions: userDoc.data().contributions
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
            marker.username = userData.username || 'Unknown User';
            marker.userProfilePicture = userData.profilePictureUrl || null;
            marker.contributions = userData.contributions || 0;
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
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        pan.setValue(0);
      });
    }
  }, [visible]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 10,
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        pan.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 100) {
        Animated.timing(pan, {
          toValue: sheetHeight,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onClose();
          pan.setValue(0);
        });
      } else {
        Animated.spring(pan, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const translateY = Animated.add(
    animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [sheetHeight + 80, 80],
    }),
    pan
  );

  const badge = marker ? calculateBadge(marker.contributions) : null;

  return (
    visible && (
      <Animated.View
        style={[styles.bottomSheet, { height: animatedHeight, transform: [{ translateY }],}]}
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
                    <Pressable onPress={() => handleUserPress(marker.userId)}>
                      <Image
                        source={{ uri: marker.userProfilePicture }}
                        style={styles.userProfilePicture}
                      />
                    </Pressable>
                    <View style={styles.userInfo}>
                      <View style={styles.usernameContainer}>
                        <Text style={styles.username}>{marker.username}</Text>
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

                    <View style={styles.votingContainer}>
                      <Voting markerId={marker.id} />
                    </View>
                  </View>
                </View>

                <View style={styles.statusContainer}>
                  <Text style={[styles.statusText, { color: getStatusColor(), fontWeight: marker.status !== 'likely a pothole' && marker.status !== 'unlikely a pothole' ? 'bold' : 'normal' }]}>
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
                      ) 
                    })
                  ) : (
                    <Text style={styles.noCommentsText}>No comments yet. Start the conversation!</Text>
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
    )
  );
};

export default BottomSheet;
