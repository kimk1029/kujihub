import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CommunityListScreen } from '../features/community/CommunityListScreen';
import { CommunityDetailScreen } from '../features/community/CommunityDetailScreen';
import { CommunityPostFormScreen } from '../features/community/CommunityPostFormScreen';
import type { CommunityStackParamList } from './types';

const Stack = createNativeStackNavigator<CommunityStackParamList>();

export function CommunityStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFBFE' },
      }}
    >
      <Stack.Screen name="CommunityList" component={CommunityListScreen} />
      <Stack.Screen name="CommunityDetail" component={CommunityDetailScreen} />
      <Stack.Screen name="CommunityPostForm" component={CommunityPostFormScreen} />
    </Stack.Navigator>
  );
}
