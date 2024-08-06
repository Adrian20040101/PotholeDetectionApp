import { StyleSheet } from 'react-native';

export const themeStyle = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    text: {
      color: theme.text,
    },
  });

  export default themeStyle;