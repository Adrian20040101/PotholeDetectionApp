import React from 'react';
import { UserProvider } from './context-components/user-context';
import { ThemeProvider } from './components/home-page/sidebar-options/settings/theme/theme-context';
import Navigation from './Navigation';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  return (
    <UserProvider>
      <ThemeProvider>
        <Navigation />
        <ToastContainer />
      </ThemeProvider>
    </UserProvider>
  );
};

export default App;
