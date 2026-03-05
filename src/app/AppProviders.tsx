import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './RootNavigator';
import { appTheme } from '../theme/theme';
import { initAuthServices } from '../features/auth/auth.service';

initAuthServices();

export function AppProviders() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={appTheme}>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
