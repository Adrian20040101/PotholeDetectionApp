import React, {
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  Animated,
} from 'react-native';
import BottomSheet, {
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { FontAwesome } from '@expo/vector-icons';
import Voting from '../voting/votes.jsx';
import CommentSection from './comment-section/comment-section.native.jsx';
import ProfileModal from '../../profile-modal/profile-modal.jsx';
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../../../config/firebase/firebase-config.js';

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

const CustomBottomSheet = forwardRef(({ marker, isLoggedIn }, ref) => {
  const bottomSheetRef = useRef(null);
  const [markerInfo, setMarkerInfo] = useState(marker);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isFullCommentsActive, setIsFullCommentsActive] = useState(false);
  const [isProfileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const collapsedOpacity = useRef(new Animated.Value(1)).current;
  const fullCommentsOpacity = useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => ({
    expand: () => bottomSheetRef.current?.snapToIndex(0),
    expandFull: () => bottomSheetRef.current?.snapToIndex(1), 
    close: () => bottomSheetRef.current?.close(),
  }));

  const snapPoints = useMemo(() => ['35%', '100%'], []);

  const handleSheetChanges = useCallback((index) => {
    console.log('Sheet index changed to:', index);
    if (index === 1) {
      Animated.parallel([
        Animated.timing(collapsedOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fullCommentsOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setIsFullCommentsActive(true);
    } else {
      Animated.parallel([
        Animated.timing(fullCommentsOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(collapsedOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setIsFullCommentsActive(false);
    }
  }, [collapsedOpacity, fullCommentsOpacity]);

  useEffect(() => {
    if (!marker) {
      setMarkerInfo(null);
      return;
    }
    setMarkerInfo(marker);
    if (marker.userId && marker.userId !== 'anonymous') {
      const fetchUserData = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', marker.userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setMarkerInfo((prev) => ({
              ...prev,
              username: userData.username,
              userProfilePicture: userData.profilePictureUrl,
              contributions: userData.contributions,
            }));
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };
      fetchUserData();
    }
  }, [marker]);

  useEffect(() => {
    if (!marker) return;
    const commentsRef = collection(db, 'markers', marker.id, 'comments');
    const unsubscribe = onSnapshot(commentsRef, (snapshot) => {
      setCommentsCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [marker]);

  const handleCommentsPress = () => {
    ref.current?.expandFull();
    Animated.parallel([
      Animated.timing(collapsedOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fullCommentsOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    setIsFullCommentsActive(true);
  };

  const handleUserPress = (userId) => {
    setSelectedUserId(userId);
    setProfileModalVisible(true);
  };

  const closeProfileModal = () => {
    setProfileModalVisible(false);
    setSelectedUserId(null);
  };

  const renderCollapsedContent = () => (
    <View style={styles.contentWrapper}>
      <View style={styles.collapsedContainer}>
        <View style={styles.topRow}>
          <Image
            source={{ uri: markerInfo?.imageUrl || 'https://via.placeholder.com/150' }}
            style={styles.potholeImage}
          />
          <View style={styles.detailsCard}>
            <Text style={styles.title}>{markerInfo?.title || 'Pothole Report'}</Text>
            <View style={styles.reporterInfo}>
              <Pressable onPress={() => handleUserPress(markerInfo?.userId)}>
                <Image
                  source={{ uri: markerInfo?.userProfilePicture || 'https://t3.ftcdn.net/jpg/05/87/76/66/360_F_587766653_PkBNyGx7mQh9l1XXPtCAq1lBgOsLl6xH.jpg' }}
                  style={styles.userImage}
                />
              </Pressable>
              <View style={styles.userDetails}>
                <Text style={styles.username}>
                  {markerInfo?.userId === 'anonymous' ? 'Anonymous' : markerInfo?.username || 'Anonymous'}
                  <Image
                    source={badgeImages[calculateBadge(markerInfo?.contributions)]}
                    style={styles.badge}
                  />
                </Text>
                <Text style={styles.timestamp}>
                  {markerInfo?.timestamp ? new Date(markerInfo.timestamp.seconds * 1000).toLocaleString() : ''}
                </Text>
              </View>
            </View>
            <Text style={[styles.status, { color: markerInfo?.status === 'likely a pothole' ? 'green' : markerInfo?.status === 'unlikely a pothole' ? 'red' : '#333' }]}>
              Status: {markerInfo?.status}
            </Text>
            <View style={styles.actionsRow}>
              <Voting markerId={markerInfo?.id} />
              <Pressable style={styles.commentsButton} onPress={handleCommentsPress}>
                <FontAwesome name="comment" size={20} color="#007bff" />
                <Text style={styles.commentsCount}>{commentsCount}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderFullComments = () => (
    <View style={styles.contentWrapper}>
      <CommentSection markerId={markerInfo?.id} onClose={() => ref.current?.snapToIndex(0)} />
      <ProfileModal
        isVisible={isProfileModalVisible}
        onClose={closeProfileModal}
        userId={selectedUserId}
      />
    </View>
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      defaultIndex={-1}
    >
      <BottomSheetScrollView contentContainerStyle={styles.fullScrollContainer}>
        <Animated.View 
          style={[styles.contentAbsolute, { opacity: collapsedOpacity }]}
          pointerEvents={isFullCommentsActive ? 'none' : 'auto'}
        >
          {renderCollapsedContent()}
        </Animated.View>
        <Animated.View 
          style={[styles.contentAbsolute, { opacity: fullCommentsOpacity }]}
          pointerEvents={isFullCommentsActive ? 'auto' : 'none'}
        >
          {renderFullComments()}
        </Animated.View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

export default CustomBottomSheet;

const styles = StyleSheet.create({
  fullScrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  contentAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  contentWrapper: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  dragIndicator: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#ccc',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  collapsedContainer: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  potholeImage: {
    width: 110,
    borderRadius: 8,
    marginRight: 12,
  },
  detailsCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  reporterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  userDetails: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  username: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  timestamp: {
    fontSize: 14,
    color: '#888',
  },
  badge: {
    width: 24,
    height: 24,
    marginLeft: 10,
  },
  status: {
    fontSize: 16,
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  commentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentsCount: {
    marginLeft: 4,
    fontSize: 16,
    color: '#007bff',
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#777',
  },
});
