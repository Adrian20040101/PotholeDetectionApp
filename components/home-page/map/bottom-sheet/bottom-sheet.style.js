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
  },
  userProfilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
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
  commentText: {
    fontSize: 14,
    marginBottom: 5,
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