import React from 'react';
import { Platform } from 'react-native';
import { UserProvider } from './context-components/user-context';
import { ThemeProvider } from './components/home-page/sidebar-options/settings/theme/theme-context';
import Navigation from './Navigation';
import { ToastContainer } from 'react-toastify';
import Toast from 'react-native-toast-message';
import 'react-toastify/dist/ReactToastify.css';
import { Dimensions } from 'react-native';

if (typeof Dimensions.removeEventListener !== 'function') {
  Dimensions.removeEventListener = () => {};
}

const App = () => {
  return (
    <UserProvider>
      <ThemeProvider>
        <Navigation />
        {Platform.OS === 'web' && <ToastContainer />}
        <Toast />
      </ThemeProvider>
    </UserProvider>
  );
};

export default App;
