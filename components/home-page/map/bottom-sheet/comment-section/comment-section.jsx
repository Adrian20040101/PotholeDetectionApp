import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, FlatList, Image, Keyboard, Modal } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import EmojiModal from 'react-native-emoji-modal';
import { db } from '../../../../../config/firebase/firebase-config';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';
import styles from './comment-section.style';
import { auth } from '../../../../../config/firebase/firebase-config';
import ProfileModal from '../../../profile-modal/profile-modal';

const emojiPickerHeight = 150;

const CommentSection = ({ markerId, onClose, onEdit, onReply, onDelete }) => {
  const [newComment, setNewComment] = useState('');
  const currentUser = auth.currentUser;
  const [comments, setComments] = useState([]);
  const [keyboardPadding, setKeyboardPadding] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [userProfiles, setUserProfiles] = useState({});
  const flatListRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedComment, setSelectedComment] = useState(null);
  const [isProfileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const handleUserPress = (userId) => {
    setSelectedUserId(userId);
    setProfileModalVisible(true);
  };

  const closeProfileModal = () => {
    setProfileModalVisible(false);
    setSelectedUserId(null);
  };

  const scrollToBottom = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  // scroll to end on initial load and every time comments are updated
  useEffect(() => {
    if (comments.length > 0) { 
      setTimeout(() => {
        scrollToBottom();
      }, 100);
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

      const uniqueUserIds = [...new Set(fetchedComments.map((comment) => comment.userId))];
      const profiles = { ...userProfiles };
      for (const userId of uniqueUserIds) {
        if (!profiles[userId]) {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            profiles[userId] = userDoc.data();
          }
        }
      }
      setUserProfiles(profiles);
    });

    return () => unsubscribe();
  }, [markerId]);

  useEffect(() => {
    const handleKeyboardShow = (event) => {
      setKeyboardPadding(event.endCoordinates.height);
      setShowEmojiPicker(false);
    };
    const handleKeyboardHide = () => {
      setKeyboardPadding(0);
    };
    const keyboardShowListener = Keyboard.addListener('keyboardDidShow', handleKeyboardShow);
    const keyboardHideListener = Keyboard.addListener('keyboardDidHide', handleKeyboardHide);

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  const handleRightClick = (event, comment) => {
    event.preventDefault();
    setSelectedComment(comment);
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setShowContextMenu(true);
  };

  const handleClickOutside = () => {
    setShowContextMenu(false);
    setSelectedComment(null);
  };

  const handleEditComment = () => {
    console.log('Edit:', selectedComment);
    setShowContextMenu(false);
  };

  const handleDeleteComment = async () => {
    try {
      await deleteDoc(doc(db, 'markers', markerId, 'comments', selectedComment.id));
      setShowContextMenu(false);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleReplyToComment = () => {
    console.log('Reply to:', selectedComment);
    setShowContextMenu(false);
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    try {
      const commentsRef = collection(db, 'markers', markerId, 'comments');
      await addDoc(commentsRef, {
        userId: currentUser.uid,
        content: newComment.trim(),
        timestamp: new Date(),
      });
      setNewComment('');

      // scroll to the bottom after sending a comment
      scrollToBottom();

    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setNewComment((prev) => prev + emoji);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker((prev) => !prev);
    Keyboard.dismiss();
  };

  const renderComment = ({ item }) => {
    const isCurrentUser = item.userId === currentUser.uid;
    const userProfile = userProfiles[item.userId];
    const username = userProfile?.username || 'User';
    const profilePictureUrl = userProfile?.profilePictureUrl;
    const timestamp = item.timestamp.toDate();
    const formattedTimestamp = timestamp.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) + ', ' + timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return (
      <View style={[styles.commentContainer, isCurrentUser && styles.currentUserCommentContainer]}>
        {!isCurrentUser && 
        <Pressable onPress={() => handleUserPress(item.userId)}>
          <Image 
            source={{ uri: profilePictureUrl }} 
            style={styles.profilePicture} 
          />
        </Pressable>
        }
        <View style={[styles.bubble, isCurrentUser && styles.currentUserBubble]}>
          {!isCurrentUser && <Text style={styles.username}>{username}</Text>}
          <Text style={styles.commentText}>{item.content}</Text>
          <Text style={styles.timestampText}>{formattedTimestamp}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: keyboardPadding + (showEmojiPicker ? emojiPickerHeight : 0) }]}>
      <Text style={styles.commentsText}>Comments</Text>
      <Pressable style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>X</Text>
      </Pressable>
  
      <View style={styles.commentListContainer}>
        {comments.length === 0 ? (
          <View style={styles.noCommentsContainer}>
            <Text style={styles.noCommentsText}>No comments yet. Start the conversation</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.commentList}
            showsVerticalScrollIndicator={false}
            style={{ marginBottom: 200 }}
            onContentSizeChange={(width, height) => {
              if (height > contentHeight) {
                setContentHeight(height);
                scrollToBottom();
                
                setTimeout(() => {
                  if (flatListRef.current) {
                    flatListRef.current.scrollToOffset({
                      offset: height,
                      animated: true,
                    });
                  }
                }, 50);
              }
            }}
          />
        )}
      </View>
  
      {showEmojiPicker && (
        <Pressable
          style={[styles.emojiModalBackdrop]}
          onPress={() => setShowEmojiPicker(false)}
        >
          <View style={[styles.emojiPickerWrapper, styles.emojiPickerPosition]}>
            <EmojiModal
              onEmojiSelected={(emoji) => handleEmojiSelect(emoji)}
              onPressOutside={() => setShowEmojiPicker(false)}
              containerStyle={styles.emojiModalContent}
            />
          </View>
        </Pressable>
      )}

      {showContextMenu && (
        <CommentContextMenu
          position={contextMenuPosition}
          onClose={handleClickOutside}
          onEdit={handleEditComment}
          onDelete={handleDeleteComment}
          onReply={handleReplyToComment}
        />
      )}
  
      <View style={styles.inputContainer}>
        <Pressable onPress={toggleEmojiPicker} style={styles.emojiButton}>
          <FontAwesome name="smile-o" size={24} color="#007AFF" />
        </Pressable>
        <TextInput
          style={styles.input}
          placeholder="Type a comment..."
          value={newComment}
          onChangeText={setNewComment}
        />
        <Pressable style={styles.sendButton} onPress={handleSendComment}>
          <FontAwesome name="send" size={20} color="#007AFF" />
        </Pressable>
      </View>

      <ProfileModal
        isVisible={isProfileModalVisible}
        onClose={closeProfileModal}
        userId={selectedUserId}
      />
    </View>
  );
  
};

export default CommentSection;
