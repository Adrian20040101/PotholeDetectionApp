import React, { useState, useEffect } from 'react';
import { Platform, Dimensions } from 'react-native';
import DesktopSidebar from './desktop-animation';
import MobileSidebar from './mobile-animation';

const Sidebar = ({ sidebarAnim, menuAnim, overlayAnim, sidebarVisible, toggleSidebar, menuItems }) => {
    const [isDesktop, setIsDesktop] = useState(false);
    const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);

    useEffect(() => {
        const updateLayout = () => {
            const width = Dimensions.get('window').width;
            setWindowWidth(width);
            if (Platform.OS === 'web') {
                setIsDesktop(width >= 800);
            } else {
                setIsDesktop(false);
            }
        };

        const subscription = Dimensions.addEventListener('change', updateLayout);

        updateLayout();

        return () => {
            if (subscription?.remove) {
                subscription.remove();
            } else {
                Dimensions.removeEventListener('change', updateLayout);
            }
        };
    }, []);

    if (Platform.OS === 'web' && isDesktop) {
        return (
            <DesktopSidebar
                sidebarAnim={sidebarAnim}
                overlayAnim={overlayAnim}
                sidebarVisible={sidebarVisible}
                toggleSidebar={toggleSidebar}
                menuItems={menuItems}
            />
        );
    } else {
        return (
            <MobileSidebar
                menuAnim={menuAnim}
                sidebarVisible={sidebarVisible}
                toggleSidebar={toggleSidebar}
                menuItems={menuItems}
            />
        );
    }
};

export default Sidebar;
