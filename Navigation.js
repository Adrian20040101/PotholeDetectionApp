import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './AuthStack';
import AppStack from './AppStack';
import { useUser } from './context-components/user-context';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';

const Navigation = () => {
  const { userData, isAnonymous, loading } = useUser();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading user data...</Text>
      </View>
    );
  }

  const isLoggedIn = isAnonymous || (userData && userData.username);

  return (
    <NavigationContainer>
      {isLoggedIn ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex:1,
    justifyContent:'center',
    alignItems:'center'
  },
});

export default Navigation;
