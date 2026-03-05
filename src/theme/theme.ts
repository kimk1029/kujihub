import { MD3LightTheme } from 'react-native-paper';

export const appTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6750A4',
    secondary: '#625B71',
    tertiary: '#7D5260',
    error: '#B3261E',
    surface: '#FFFBFE',
  },
};

export type AppTheme = typeof appTheme;
