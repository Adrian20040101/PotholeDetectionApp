import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Keyboard,
  StyleSheet,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { collection, addDoc, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../../config/firebase/firebase-config';
import { useUser } from '../../../../../context-components/user-context';
import ProfileModal from '../../../profile-modal/profile-modal';
import { ScrollView } from 'react-native-gesture-handler';

const HEADER_HEIGHT = 50;
const INPUT_HEIGHT = 60;
const BOTTOM_OFFSET = 40;

const badgeImages = {
  bronze: require('../../../../../assets/images/bronze.png'),
  silver: require('../../../../../assets/images/silver.png'),
  gold: require('../../../../../assets/images/gold.png'),
  diamond: require('../../../../../assets/images/diamond.png'),
  emerald: require('../../../../../assets/images/emerald.png'),
  platinum: require('../../../../../assets/images/platinum.png'),
};

const calculateBadge = (contributions) => {
  if (typeof contributions !== 'number') return null;
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

const CommentSection = ({ markerId, onClose }) => {
  const [newComment, setNewComment] = useState('');
  const { userData, isAnonymous } = useUser();
  const [comments, setComments] = useState([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [userProfiles, setUserProfiles] = useState({});
  const flatListRef = useRef(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isProfileModalVisible, setProfileModalVisible] = useState(false);

  const scrollToBottom = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  useEffect(() => {
    if (comments.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [comments]);

  useEffect(() => {
    const commentsRef = collection(db, 'markers', markerId, 'comments');
    const commentsQuery = query(commentsRef, orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(commentsQuery, async (snapshot) => {
      const fetchedComments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(fetchedComments);
      scrollToBottom();
      const uniqueUserIds = [...new Set(fetchedComments.map((c) => c.userId))];
      const profiles = { ...userProfiles };
      for (const userId of uniqueUserIds) {
        if (!profiles[userId]) {
          try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
              profiles[userId] = userDoc.data();
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
          }
        }
      }
      setUserProfiles(profiles);
    });
    return () => unsubscribe();
  }, [markerId]);

  useEffect(() => {
    const handleKeyboardShow = (event) => setKeyboardHeight(event.endCoordinates.height);
    const handleKeyboardHide = () => setKeyboardHeight(0);
    const showListener = Keyboard.addListener('keyboardDidShow', handleKeyboardShow);
    const hideListener = Keyboard.addListener('keyboardDidHide', handleKeyboardHide);
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    try {
      const commentsRef = collection(db, 'markers', markerId, 'comments');
      await addDoc(commentsRef, {
        userId: userData.uid,
        content: newComment.trim(),
        timestamp: new Date(),
      });
      setNewComment('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending comment:', error);
    }
  };

  const handleUserPress = (userId) => {
    setSelectedUserId(userId);
    setProfileModalVisible(true);
  };

  const closeProfileModal = () => {
    setProfileModalVisible(false);
    setSelectedUserId(null);
  };

  const renderComment = ({ item }) => {
    const userProfile = userProfiles[item.userId] || {};
    const username = userProfile.username || 'User';
    const isCurrentUser = item.userId === userData.uid;
    const timestampText = item.timestamp?.seconds
      ? new Date(item.timestamp.seconds * 1000).toLocaleString()
      : '';
    const contributions = userProfile.contributions ?? 0;
    const badge = calculateBadge(contributions);

    return (
      <View style={[styles.commentContainer, isCurrentUser && styles.currentUserContainer]}>
        {!isCurrentUser && (
          <Pressable onPress={() => handleUserPress(item.userId)}>
            <Image
              source={{ uri: userProfile.profilePictureUrl || 'https://via.placeholder.com/40' }}
              style={styles.profilePicture}
            />
          </Pressable>
        )}
        <View style={[styles.commentBubble, isCurrentUser && styles.currentUserBubble]}>
          {!isCurrentUser && (
            <View style={styles.usernameRow}>
              <Text style={styles.commentUsername}>{username}</Text>
              {badge && (
                <Image
                  source={badgeImages[badge]}
                  style={styles.badgeImage}
                  resizeMode="contain"
                />
              )}
            </View>
          )}
          <Text style={styles.commentText}>{item.content}</Text>
          <Text style={styles.timestampText}>{timestampText}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.kaContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={styles.fixedHeader}>
          <Text style={styles.headerTitle}>Comments</Text>
        </View>
        <ScrollView style={styles.scrollContainer}>
          <FlatList
            ref={flatListRef}
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.commentList}
            showsVerticalScrollIndicator={true}
          />
        </ScrollView>
        {!isAnonymous && (
          <View style={[styles.fixedInputContainer, { bottom: BOTTOM_OFFSET }]}>
            <TextInput
              style={styles.input}
              placeholder="Type a comment..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <Pressable style={styles.sendButton} onPress={handleSendComment}>
              <FontAwesome name="send" size={20} color="#007AFF" />
            </Pressable>
          </View>
        )}
        <ProfileModal
          isVisible={isProfileModalVisible}
          onClose={closeProfileModal}
          userId={selectedUserId}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default CommentSection;

const styles = StyleSheet.create({
  kaContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  fixedHeader: {
    height: HEADER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContainer: {
    flex: 1,
    marginBottom: INPUT_HEIGHT + BOTTOM_OFFSET,
  },
  commentList: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  currentUserContainer: {
    flexDirection: 'row-reverse',
    alignSelf: 'flex-end',
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  commentBubble: {
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    padding: 10,
    marginLeft: 10,
    flex: 1,
  },
  currentUserBubble: {
    backgroundColor: '#d0eaff',
    marginRight: 10,
    marginLeft: 0,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  badgeImage: {
    width: 20,
    height: 20,
    marginLeft: 4,
  },
  commentText: {
    fontSize: 16,
    color: '#333',
    marginTop: 4,
  },
  timestampText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  fixedInputContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: INPUT_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  sendButton: {
    padding: 8,
    marginLeft: 10,
  },
});