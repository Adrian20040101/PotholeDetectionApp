import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { FontAwesome } from '@expo/vector-icons';
import { getUserLocation } from '../location-handling/location';
import { auth, db } from '../../../../config/firebase/firebase-config';

const Voting = ({ markerId }) => {
  const [userVote, setUserVote] = useState(null);
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);

  const user = auth.currentUser;

  useEffect(() => {
    const fetchVotes = async () => {
      const votesRef = collection(db, 'votes');
      const userVoteQuery = query(votesRef, where('userId', '==', user.uid), where('markerId', '==', markerId));
      const existingVotes = await getDocs(userVoteQuery);

      if (!existingVotes.empty) {
        const userVoteData = existingVotes.docs[0].data();
        setUserVote(userVoteData.type);
      }

      const allVotesQuery = query(votesRef, where('markerId', '==', markerId));
      const allVotesSnapshot = await getDocs(allVotesQuery);
      let upvoteCount = 0;
      let downvoteCount = 0;

      allVotesSnapshot.forEach((doc) => {
        const vote = doc.data();
        if (vote.type === 'upvote') {
          upvoteCount++;
        } else if (vote.type === 'downvote') {
          downvoteCount++;
        }
      });

      setUpvotes(upvoteCount);
      setDownvotes(downvoteCount);
    };

    fetchVotes();
  }, [markerId, user.uid]);

  const handleVote = async (type) => {
    const userLocation = await getUserLocation();
    if (!userLocation) {
      console.log('Unable to retrieve location');
      alert('Unable to retrieve location.');
      return;
    }

    const votesRef = collection(db, 'votes');
    const userVoteQuery = query(votesRef, where('userId', '==', user.uid), where('markerId', '==', markerId));
    const existingVotes = await getDocs(userVoteQuery);

    if (!existingVotes.empty) {
      const userVoteDoc = existingVotes.docs[0];
      const existingVoteType = userVoteDoc.data().type;

      if (existingVoteType === type) {
        await deleteDoc(doc(db, 'votes', userVoteDoc.id));
        setUserVote(null);
        if (type === 'upvote') {
          setUpvotes((prev) => prev - 1);
        } else {
          setDownvotes((prev) => prev - 1);
        }
        return;
      } else {
        await deleteDoc(doc(db, 'votes', userVoteDoc.id));
        await addDoc(votesRef, {
          userId: user.uid,
          markerId,
          type,
          timestamp: new Date(),
        });
        if (type === 'upvote') {
          setUpvotes((prev) => prev + 1);
          setDownvotes((prev) => prev - 1);
        } else {
          setDownvotes((prev) => prev + 1);
          setUpvotes((prev) => prev - 1);
        }
        setUserVote(type);
      }
    } else {
      await addDoc(votesRef, {
        userId: user.uid,
        markerId,
        type,
        timestamp: new Date(),
      });
      if (type === 'upvote') {
        setUpvotes((prev) => prev + 1);
      } else {
        setDownvotes((prev) => prev + 1);
      }
      setUserVote(type);
    }
  };

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
      <TouchableOpacity
        onPress={() => handleVote('upvote')}
        style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20 }}
      >
        <FontAwesome
          name="thumbs-up"
          size={24}
          color={userVote === 'upvote' ? 'green' : 'gray'}
          style={{
            textShadowColor: userVote === 'upvote' ? 'green' : 'transparent',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 4,
          }}
        />
        <Text style={{ marginLeft: 5, color: 'gray' }}>{upvotes}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleVote('downvote')}
        style={{ flexDirection: 'row', alignItems: 'center' }}
      >
        <FontAwesome
          name="thumbs-down"
          size={24}
          color={userVote === 'downvote' ? 'red' : 'gray'}
          style={{
            textShadowColor: userVote === 'downvote' ? 'red' : 'transparent',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 4,
          }}
        />
        <Text style={{ marginLeft: 5, color: 'gray' }}>{downvotes}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Voting;