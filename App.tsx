/**
 * KujiHub - 이치방쿠지 & 가챠 종합 앱
 * @format
 */

import React from 'react';
import { StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { AppProviders } from './src/app/AppProviders';
import { BrandSplash } from './src/components/BrandSplash';

function App() {
  const [showSplash, setShowSplash] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {showSplash ? (
          <View style={{ flex: 1 }}>
            <StatusBar barStyle="light-content" />
            <BrandSplash />
          </View>
        ) : (
          <View style={{ flex: 1, backgroundColor: '#F4F7FB' }}>
            <StatusBar barStyle="dark-content" />
            <AppProviders />
          </View>
        )}
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

export default App;
