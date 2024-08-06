import React from 'react';
import { Switch, View, Text } from 'react-native';
import { useTheme } from '../theme/theme-context';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center'}}>
      <Switch
        style={{ marginLeft: 20 }}
        value={isDark}
        onValueChange={toggleTheme}
        thumbColor={isDark ? '#f5dd4b' : '#f4f3f4'}
        trackColor={{ false: '#767577', true: '#81b0ff' }}
      />
    </View>
  );
};

export default ThemeToggle;
