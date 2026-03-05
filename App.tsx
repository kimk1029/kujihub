/**
 * KujiHub - 이치방쿠지 & 가챠 종합 앱
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { AppProviders } from './src/app/AppProviders';

function App() {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <AppProviders />
    </>
  );
}

export default App;
