import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomePage from './components/home-page/home/home';

const Stack = createStackNavigator();

const AppStack = () => {
  return (
    <Stack.Navigator initialRouteName="HomePage">
      <Stack.Screen
        name="HomePage"
        component={HomePage}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default AppStack;
