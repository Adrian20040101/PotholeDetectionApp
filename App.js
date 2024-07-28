import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './config/firebase/firebase-config';
import Welcome from './components/start-page/welcome/welcome';
import Login from './components/start-page/login/login';
import Signup from './components/start-page/signup/signup';
import HomePage from './components/home-page/home';
import { doc, getDoc } from 'firebase/firestore';

const Stack = createStackNavigator();

const App = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // fetch additional user info
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        setUser({ ...userData, email: user.email });
      } else {
        setUser(null);
      }
      if (initializing) setInitializing(false);
    });

    return () => unsubscribe();
  }, [initializing]);

  if (initializing) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={user ? 'HomePage' : 'Welcome'}>
        {!user ? (
          <>
            <Stack.Screen name="Welcome" component={Welcome} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
            <Stack.Screen name="Signup" component={Signup} options={{ headerShown: false }} />
          </>
        ) : (
          <Stack.Screen name="HomePage" component={HomePage} initialParams={{ user }} options={{ title: "RoadGuard" }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
