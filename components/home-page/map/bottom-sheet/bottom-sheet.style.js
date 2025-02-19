import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const sheetHeight = height / 2;

const styles = StyleSheet.create({
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: sheetHeight,
    minHeight: 100,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    padding: 15,
    zIndex: 3
  },
  content: {
    flex: 1,
    flexDirection: 'column',
    zIndex: 3
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  uploadedImage: {
    width: '30%',
    height: '100%',
    borderRadius: 10,
  },
  infoAndCommentsContainer: {
    flex: 1,
    paddingLeft: 15,
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  infoContainer: {
    marginBottom: 10,
  },
  userDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10
  },
  userProfilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  userInfo: {
    flex: 1,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  badgeImage: {
    width: 20,
    height: 20,
  },
  badgeImageSmall: {
    width: 13,
    height: 13,
    marginLeft: 3,
  },
  timestamp: {
    color: '#888',
    fontSize: 12,
  },
  votingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  votingCount: {
    marginLeft: 5,
    fontSize: 14,
  },
  closeButton: {
    position: 'absolute',
    top: -5,
    right: -10,
    padding: 0,
  },
  statusContainer: {
    paddingVertical: 10,
  },
  statusText: {
    fontSize: 14,
  },
  commentsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  commentPreviewTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
  },
  commentPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentUsername: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333333',
  },
  commentText: {
    fontSize: 14,
    color: '#555555',
  },
  viewCommentsButton: {
    marginTop: 10,
    paddingVertical: 5,
  },
  viewCommentsButtonText: {
    color: '#007BFF',
    fontWeight: 'bold',
  },
  noCommentsText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#888',
    paddingVertical: 10,
  },
  
});

export default styles;