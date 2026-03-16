import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { KujiDrawListScreen } from '../features/kuji-draw/KujiDrawListScreen';
import { KujiDrawSelectionScreen } from '../features/kuji-draw/KujiDrawSelectionScreen';
import { KujiPurchaseScreen } from '../features/kuji-draw/KujiPurchaseScreen';
import { KujiBoardDrawScreen } from '../features/kuji-draw/KujiBoardDrawScreen';
import { KujiDrawResultScreen } from '../features/kuji-draw/KujiDrawResultScreen';
import type { KujiDrawStackParamList } from './types';

const Stack = createNativeStackNavigator<KujiDrawStackParamList>();

export function KujiDrawStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0A0A0A' },
      }}
    >
      <Stack.Screen name="KujiList" component={KujiDrawListScreen} />
      <Stack.Screen name="KujiSelection" component={KujiDrawSelectionScreen} />
      <Stack.Screen name="KujiPurchase" component={KujiPurchaseScreen} />
      <Stack.Screen name="KujiBoardDraw" component={KujiBoardDrawScreen} />
      <Stack.Screen name="KujiResult" component={KujiDrawResultScreen} />
    </Stack.Navigator>
  );
}
