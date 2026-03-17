import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { FAB, Portal } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { HomeScreen } from '../screens/HomeScreen';
import { FeedScreen } from '../screens/FeedScreen';
import { KujiDrawStack } from './KujiDrawStack';
import { CommunityStack } from './CommunityStack';
import { MyScreen } from '../screens/MyScreen';
import type { MainTabsParamList } from './types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

const Tab = createBottomTabNavigator<MainTabsParamList>();

export function MainTabs() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#FFD700',
          tabBarInactiveTintColor: '#718096',
          sceneStyle: { backgroundColor: '#0B0D17' },
          tabBarLabelStyle: {
            fontWeight: '900',
            letterSpacing: -0.2,
            fontSize: 11,
            marginTop: -4,
          },
          tabBarStyle: {
            height: 60 + bottomInset,
            paddingBottom: bottomInset,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: '#1E2433',
            backgroundColor: '#0B0D17',
            elevation: 0,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: '홈',
            tabBarIcon: ({ color, size: _size }) => (
              <MaterialCommunityIcons name="home-variant" size={26} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Feed"
          component={FeedScreen}
          options={{
            title: '피드',
            tabBarIcon: ({ color, size: _size }) => (
              <MaterialCommunityIcons name="rss" size={26} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Draw"
          component={KujiDrawStack}
          options={{
            title: '뽑기',
            tabBarIcon: ({ color, size: _size }) => (
              <MaterialCommunityIcons name="ticket-percent" size={26} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Community"
          component={CommunityStack}
          options={{
            title: '커뮤니티',
            tabBarIcon: ({ color, size: _size }) => (
              <MaterialCommunityIcons name="chat-processing" size={26} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="My"
          component={MyScreen}
          options={{
            title: '마이',
            tabBarIcon: ({ color, size: _size }) => (
              <MaterialCommunityIcons name="account-circle" size={26} color={color} />
            ),
          }}
        />
      </Tab.Navigator>

      <Portal>
        <FAB
          icon="plus"
          style={{ 
            position: 'absolute', 
            right: 20, 
            bottom: 80 + bottomInset, 
            backgroundColor: '#FFD700',
            borderRadius: 20,
            elevation: 8,
            shadowColor: '#FFD700',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
          }}
          color="#000000"
          onPress={() => navigation.navigate('ReportCreate')}
        />
      </Portal>
    </>
  );
}
