import { MD3LightTheme } from 'react-native-paper';

export const appTheme = {
  ...MD3LightTheme,
  roundness: 20, // Modern, soft design
  colors: {
    ...MD3LightTheme.colors,
    primary: '#151926', // Deep Navy for primary elements
    secondary: '#D4AF37', // Gold
    tertiary: '#E63946', // Vibrant Red
    error: '#E63946',
    background: '#F8FAFC', // Light Grey/White from the image background
    surface: '#FFFFFF',
    surfaceVariant: '#EDF2F7',
    onSurface: '#1A202C',
    onSurfaceVariant: '#4A5568',
    outline: '#E2E8F0',
    primaryContainer: '#15192611',
    secondaryContainer: '#D4AF3722',
  },
};

export type AppTheme = typeof appTheme;
