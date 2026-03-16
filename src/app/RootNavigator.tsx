import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../features/auth/auth.store';
import { LoginScreen } from '../features/auth/LoginScreen';
import { MainTabs } from '../navigation/MainTabs';
import { ReportCreateScreen } from '../features/report/ReportCreateScreen';
import type { RootStackParamList } from '../navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const isAuthed = useAuthStore((s) => s.isAuthed);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFBFE' },
      }}
    >
      {!isAuthed ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="ReportCreate"
            component={ReportCreateModal}
            options={{
              presentation: 'modal',
              headerShown: true,
              title: '제보 작성',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

function ReportCreateModal() {
  const navigation = useNavigation();
  return <ReportCreateScreen onClose={() => navigation.goBack()} />;
}
