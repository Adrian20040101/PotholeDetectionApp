import { StyleSheet } from 'react-native';

const emojiPickerHeight = 150;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
    zIndex: 3
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
    backgroundColor: 'rgba(0,0,0,0.3)',
    width: 30,
    height: 30,
    borderRadius: 15,
    zIndex: 3,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  noCommentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noCommentsText: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#888',
    marginTop: -100
  },
  commentsText: {
    fontWeight: 'bold',
    fontSize: 24,
    textAlign: 'center',
  },
  commentList: {
    flexGrow: 1,
    paddingHorizontal: 10,
    marginTop: 20,
  },
  commentContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  commentListContainer: { 
    flex: 1,
    paddingBottom: 10,
  },
  currentUserCommentContainer: {
    flexDirection: 'row-reverse',
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  bubble: {
    backgroundColor: '#E6E6E6',
    padding: 10,
    borderRadius: 15,
    maxWidth: '80%',
  },
  currentUserBubble: {
    backgroundColor: '#D0E8FF',
    marginLeft: 10,
  },
  username: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  timestampText: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
    textAlign: 'right',
  },
  currentUserName: {
    textAlign: 'right',
  },
  commentText: {
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFF',
    paddingBottom: 10,
    position: 'absolute',
    bottom: emojiPickerHeight,
    width: '100%',
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    padding: 8,
    backgroundColor: 'transparent',
  },
  emojiButton: {
    marginRight: 10,
  },
  emojiPickerWrapper: {
    position: 'absolute',
    bottom: 225,
    left: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  emojiModalContent: {
    width: '100%',
    maxWidth: 300,
  },
  emojiModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    cursor: 'default'
  },
});

export default styles;
