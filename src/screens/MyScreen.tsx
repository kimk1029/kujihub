import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { Screen } from '../components/Screen';
import { useAuthStore } from '../features/auth/auth.store';

export function MyScreen() {
  const { isAuthed, provider, logout } = useAuthStore();

  return (
    <Screen>
      <View style={styles.profile}>
        <Text variant="titleLarge">프로필</Text>
        <Text variant="bodyMedium" style={styles.provider}>
          {provider ? `${provider} 로그인` : isAuthed ? 'DEV 로그인' : '-'}
        </Text>
      </View>
      <Button mode="outlined" onPress={logout} style={styles.logout}>
        로그아웃
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: {
    marginBottom: 24,
  },
  provider: {
    marginTop: 4,
    color: '#666',
  },
  logout: {
    alignSelf: 'flex-start',
  },
});
