const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

exports.evaluatePotholes = functions.pubsub.schedule('every 48 hours').onRun(async (context) => {
  const now = admin.firestore.Timestamp.now();
  const thresholdTime = admin.firestore.Timestamp.fromMillis(now.toMillis() - 2 * 24 * 60 * 60 * 1000); // each report is open 2 days for voting

  const markerQuerySnapshot = await db.collection('markers').where('status', '==', 'pending').get();

  markerQuerySnapshot.forEach(async (markerDoc) => {
    const markerData = markerDoc.data();

    if (markerData.timestamp < thresholdTime) {
      const markerId = markerDoc.id;

      const votesQuerySnapshot = await db.collection('votes').where('markerId', '==', markerId).get();

      let upvoteCount = 0;
      let downvoteCount = 0;

      votesQuerySnapshot.forEach((voteDoc) => {
        const voteData = voteDoc.data();
        if (voteData.type === 'upvote') {
          upvoteCount++;
        } else if (voteData.type === 'downvote') {
          downvoteCount++;
        }
      });

      console.log(`Evaluating pothole ${markerId} with upvotes=${upvoteCount}, downvotes=${downvoteCount}`);

      // if there is at least an upvote or at least a downvote, classify them accordingly. If there is no info, update accordingly (beta)
      if (upvoteCount >= 1 && upvoteCount > downvoteCount) {
        await markerDoc.ref.update({ status: 'likely a pothole' });
        console.log(`Pothole ${markerId} is likely a pothole`);
      } else if (upvoteCount + downvoteCount < 1) {
        await markerDoc.ref.update({ status: 'too low info' });
        console.log(`Pothole ${markerId} has too low info`);
      } else if (downvoteCount >= 1 && downvoteCount >= upvoteCount) {
        await markerDoc.ref.update({ status: 'unlikely a pothole' });
        console.log(`Pothole ${markerId} is unlikely a pothole`);
      }
    } else {
      console.log(`Pothole ${markerDoc.id} can't be evaluated already!`);
    }
  });
});
