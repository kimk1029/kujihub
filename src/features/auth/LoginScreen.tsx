import React, { useState } from 'react';
import { View, StyleSheet, Image, Dimensions, TouchableOpacity } from 'react-native';
import { Button, Text, Surface, useTheme } from 'react-native-paper';
import { useAuthStore } from './auth.store';
import { signInWithGoogle, signInWithKakao } from './auth.service';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

export function LoginScreen() {
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const theme = useTheme();

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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.topSection}>
        <Surface style={styles.imageCard} elevation={8}>
          <Image 
            source={require('../../assets/images/Gemini_Generated_Image_brlmgybrlmgybrlm.png')} 
            style={styles.heroImage}
            resizeMode="cover"
          />
        </Surface>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.textGroup}>
          <Text style={[styles.title, { color: theme.colors.primary }]}>KOOJI HUB</Text>
          <Text style={[styles.subtitle, { color: theme.colors.secondary }]}>제일복권 종합 정보 앱</Text>
          <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
            로그인하여 나만의 쿠지 리스트를 관리하고{'\n'}새로운 발매 소식을 빠르게 받아보세요.
          </Text>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={[styles.loginBtn, styles.googleBtn]} 
            onPress={handleGoogleLogin}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="google" size={24} color="#FFFFFF" />
            <Text style={styles.googleBtnText}>Google 계정으로 로그인</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.loginBtn, styles.kakaoBtn]} 
            onPress={handleKakaoLogin}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="chat" size={24} color="#3C1E1E" />
            <Text style={styles.kakaoBtnText}>카카오톡으로 시작하기</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.line, { backgroundColor: theme.colors.outline }]} />
            <Text style={[styles.dividerText, { color: theme.colors.onSurfaceVariant }]}>또는</Text>
            <View style={[styles.line, { backgroundColor: theme.colors.outline }]} />
          </View>

          <Button
            mode="text"
            onPress={handleDevLogin}
            style={styles.devBtn}
            labelStyle={[styles.devBtnLabel, { color: theme.colors.secondary }]}
          >
            게스트로 둘러보기
          </Button>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={18} color={theme.colors.error} />
            <Text style={[styles.error, { color: theme.colors.error }]}>
              {error}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
          로그인 시 KOOJI HUB의 이용약관 및{'\n'}개인정보 처리방침에 동의하게 됩니다.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    height: '45%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  imageCard: {
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  bottomSection: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  textGroup: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 1,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
  },
  loginBtn: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  googleBtn: {
    backgroundColor: '#1E293B',
  },
  googleBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  kakaoBtn: {
    backgroundColor: '#FEE500',
  },
  kakaoBtnText: {
    color: '#3C1E1E',
    fontSize: 16,
    fontWeight: '800',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  line: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '700',
  },
  devBtn: {
    marginTop: 4,
  },
  devBtnLabel: {
    fontSize: 15,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  error: {
    fontWeight: '700',
    fontSize: 13,
  },
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '600',
    opacity: 0.6,
  },
});
