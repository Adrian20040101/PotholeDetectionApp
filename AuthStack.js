import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import Welcome from './components/start-page/welcome/welcome';
import Login from './components/start-page/login/login';
import Signup from './components/start-page/signup/signup';

const Stack = createStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator initialRouteName="Welcome">
      <Stack.Screen
        name="Welcome"
        component={Welcome}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={Login}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Signup"
        component={Signup}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default AuthStack;
