import React from 'react';
import { Platform, Dimensions } from 'react-native';
import AccountDetailsSidebarDesktop from './desktop-animation';
import AccountDetailsSidebarMobile from './mobile-animation';

const AccountDetailsSidebar = ({ sidebarVisible, toggleSidebar, sidebarAnim, overlayAnim }) => {
  const { width } = Dimensions.get('window');
  const isMobileLayout = width < 800;

  if (Platform.OS === 'web' && !isMobileLayout) {
    return (
        <AccountDetailsSidebarDesktop
            sidebarAnim={sidebarAnim}
            overlayAnim={overlayAnim}
            sidebarVisible={sidebarVisible}
            toggleSidebar={toggleSidebar}
        />
    )
  }

  return (
    <AccountDetailsSidebarMobile
        sidebarVisible={sidebarVisible}
        toggleSidebar={toggleSidebar}
    />
  )
};

export default AccountDetailsSidebar;
