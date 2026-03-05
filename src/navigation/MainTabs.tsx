import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { FAB, Portal } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { HomeScreen } from '../screens/HomeScreen';
import { MapScreen } from '../screens/MapScreen';
import { CommunityScreen } from '../screens/CommunityScreen';
import { MyScreen } from '../screens/MyScreen';
import { ReportCreateScreen } from '../features/report/ReportCreateScreen';
import type { MainTabsParamList } from './types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

const Tab = createBottomTabNavigator<MainTabsParamList>();

export function MainTabs() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#6750A4',
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: '홈',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Map"
          component={MapScreen}
          options={{
            title: '지도',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="map" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Community"
          component={CommunityScreen}
          options={{
            title: '커뮤니티',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="forum" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="My"
          component={MyScreen}
          options={{
            title: '마이',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="account" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>

      <Portal>
        <FAB
          icon="plus"
          style={{ position: 'absolute', right: 16, bottom: 80 }}
          onPress={() => navigation.navigate('ReportCreate')}
        />
      </Portal>
    </>
  );
}
