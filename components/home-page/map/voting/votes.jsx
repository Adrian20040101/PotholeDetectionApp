import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { FontAwesome } from '@expo/vector-icons';
import { getUserLocation } from '../location-handling/location';
import Toast from 'react-native-toast-message';
import { auth, db } from '../../../../config/firebase/firebase-config';
import { useUser } from '../../../../context-components/user-context';

const Voting = ({ markerId }) => {
  const [userVote, setUserVote] = useState(null);
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [markerLocation, setMarkerLocation] = useState(null);

  const { userData, isAnonymous } = useUser();

  // formula that calculates the distance between two points on the globe
  function haversineDistance(coords1, coords2) {
    const toRad = (x) => (x * Math.PI) / 180;
  
    const lat1 = coords1.lat;
    const lon1 = coords1.lng;
  
    const lat2 = coords2.lat;
    const lon2 = coords2.lng;
  
    const R = 6371; // radius of the Earth in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    return R * c; // distance in kilometers
  }

  useEffect(() => {
    const fetchMarkerData = async () => {
      try {
        const markerRef = doc(db, 'markers', markerId);
        const markerDoc = await getDoc(markerRef);

        if (markerDoc.exists()) {
          const markerData = markerDoc.data();
          setMarkerLocation({
            lat: markerData.lat,
            lng: markerData.lon,
          });
        } else {
          console.error('Marker not found');
        }
      } catch (error) {
        console.error('Error fetching marker data:', error);
      }
    };

    fetchMarkerData();
  }, [markerId]);

  useEffect(() => {
    const fetchVotes = async () => {
      const votesRef = collection(db, 'votes');
      const userVoteQuery = query(votesRef, where('userId', '==', userData.uid), where('markerId', '==', markerId));
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
  }, [markerId, userData.uid]);

  const handleVote = async (type) => {
    if (isAnonymous) {
      Toast.show({
        type: 'info',
        text1: 'Sign in to be able to vote.',
      });
      return;
    }

    const userLocation = await getUserLocation();
    if (!userLocation) {
      console.log('Unable to retrieve location');
      Toast.show({
        type: 'error',
        text1: 'Unable to retrieve location.',
      });
      return;
    }

    if (!markerLocation) {
      console.log('Marker location not available');
      return;
    }
  
    const potholeLocation = { lat: markerLocation.lat, lng: markerLocation.lng };
  
    const fetchRegion = async (lat, lng) => {
      try {
        const response = await fetch(`https://road-guard.netlify.app/.netlify/functions/reverse_geocoding?lat=${lat}&lng=${lng}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        if (!response.ok) {
          throw new Error('Failed to fetch region data');
        }
  
        const data = await response.json();
        return data.region || null;
      } catch (error) {
        console.error('Error fetching region:', error);
        return null;
      }
    };

    const userRegion = await fetchRegion(userLocation.lat, userLocation.lng);
    const potholeRegion = await fetchRegion(potholeLocation.lat, potholeLocation.lng);
  
    console.log(userRegion);
    console.log(potholeRegion);

    const distance = haversineDistance(userLocation, potholeLocation);
    const isAllowedToVote = userRegion === potholeRegion || distance <= 50;
  
    if (!isAllowedToVote) {
      Toast.show({
        type: 'error',
        text1: 'You are not allowed to vote on this pothole as it is not in your area.',
      });    
    }
  
    const votesRef = collection(db, 'votes');
    const userVoteQuery = query(votesRef, where('userId', '==', userData.uid), where('markerId', '==', markerId));
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
          userId: userData.uid,
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
        userId: userData.uid,
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