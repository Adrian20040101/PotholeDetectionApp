import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './config/firebase/firebase-config';
import Welcome from './components/start-page/welcome/welcome';
import Login from './components/start-page/login/login';
import Signup from './components/start-page/signup/signup';
import HomePage from './components/home-page/home/home';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider } from './components/home-page/sidebar-options/settings/theme/theme-context';
import { doc, getDoc } from 'firebase/firestore';
import { UserProvider } from './context-components/user-context';

const Stack = createStackNavigator();

const App = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        setUser({ ...userData, email: user.email });
        setIsAnonymous(user.isAnonymous);
      } else {
        setUser(null);
        setIsAnonymous(false);
      }
      if (initializing) setInitializing(false);
    });

    return () => unsubscribe();
  }, [initializing]);

  if (initializing) return null;

  return (
    <UserProvider>
      <ThemeProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName={user ? 'HomePage' : 'Welcome'}>
            {user && !isAnonymous ? (
              <Stack.Screen name="HomePage" component={HomePage} initialParams={{ user }} options={{ headerShown: false }} />
            ) : (
              <>
                <Stack.Screen name="Welcome" component={Welcome} options={{ headerShown: false }} />
                <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
                <Stack.Screen name="Signup" component={Signup} options={{ headerShown: false }} />
                {user && isAnonymous && (
                  <Stack.Screen name="HomePage" component={HomePage} initialParams={{ user }} options={{ headerShown: false }} />
                )}
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
        <ToastContainer />
      </ThemeProvider>
    </UserProvider>
  );
};

export default App;
