import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, Surface } from 'react-native-paper';
import { useAuthStore } from './auth.store';
import { signInWithGoogle, signInWithKakao } from './auth.service';

export function LoginScreen() {
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      const ok = await signInWithGoogle();
      if (!ok) setError('로그인을 취소했습니다.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google 로그인 실패');
    }
  };

  const handleKakaoLogin = async () => {
    setError(null);
    try {
      const ok = await signInWithKakao();
      if (!ok) setError('로그인을 취소했습니다.');
    } catch (e) {
      setError(e instanceof Error ? e.message : '카카오 로그인 실패');
    }
  };

  const handleDevLogin = () => {
    setError(null);
    setAuth(true, null, 'dev_token');
  };

  return (
    <Surface style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        쿠지허브
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        이치방쿠지 & 가챠 정보를 한곳에서
      </Text>

      <View style={styles.buttons}>
        <Button
          mode="contained"
          onPress={handleGoogleLogin}
          style={styles.button}
          icon="google"
        >
          구글 로그인
        </Button>
        <Button
          mode="contained"
          onPress={handleKakaoLogin}
          style={[styles.button, styles.kakaoButton]}
          icon="chat"
        >
          카카오 로그인
        </Button>
        <Button
          mode="outlined"
          onPress={handleDevLogin}
          style={styles.button}
        >
          DEV 빠른 로그인
        </Button>
      </View>

      {error && (
        <Text variant="bodySmall" style={styles.error}>
          {error}
        </Text>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 32,
    color: '#666',
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  button: {
    marginBottom: 8,
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
  },
  error: {
    marginTop: 16,
    color: '#B3261E',
  },
});
