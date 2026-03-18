import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing,
  Pressable,
} from 'react-native';
import { Button, Text, Surface, useTheme } from 'react-native-paper';
import { useAuthStore } from './auth.store';
import { signInWithGoogle, signInWithKakao, signInWithNaver } from './auth.service';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

export function LoginScreen() {
  const [error, setError] = useState<string | null>(null);
  const [showLoginOptions, setShowLoginOptions] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const theme = useTheme();
  const transition = useRef(new Animated.Value(0)).current;

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

  const handleNaverLogin = async () => {
    setError(null);
    try {
      const ok = await signInWithNaver();
      if (!ok) setError('로그인을 취소했습니다.');
    } catch (e) {
      setError(e instanceof Error ? e.message : '네이버 로그인 실패');
    }
  };

  const handlePressButton = () => {
    if (showLoginOptions || isAnimating) {
      return;
    }

    setError(null);
    setIsAnimating(true);

    Animated.sequence([
      Animated.timing(transition, {
        toValue: 1,
        duration: 260,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowLoginOptions(true);
      transition.setValue(0);
      Animated.spring(transition, {
        toValue: 1,
        friction: 7,
        tension: 72,
        useNativeDriver: true,
      }).start(() => {
        setIsAnimating(false);
      });
    });
  };

  const pressCardStyle = {
    opacity: showLoginOptions
      ? transition.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0],
        })
      : transition.interpolate({
          inputRange: [0, 0.55, 1],
          outputRange: [1, 0.24, 0],
        }),
    transform: [
      { perspective: 1200 },
      {
        rotateX: transition.interpolate({
          inputRange: [0, 1],
          outputRange: showLoginOptions ? ['-82deg', '0deg'] : ['0deg', '82deg'],
        }),
      },
      {
        translateY: transition.interpolate({
          inputRange: [0, 1],
          outputRange: showLoginOptions ? [28, 0] : [0, -32],
        }),
      },
      {
        scale: transition.interpolate({
          inputRange: [0, 1],
          outputRange: showLoginOptions ? [0.94, 1] : [1, 0.88],
        }),
      },
    ],
  };

  const socialCardStyle = {
    opacity: showLoginOptions
      ? transition.interpolate({
          inputRange: [0, 0.4, 1],
          outputRange: [0, 0.12, 1],
        })
      : transition.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0],
        }),
    transform: [
      { perspective: 1200 },
      {
        rotateX: transition.interpolate({
          inputRange: [0, 1],
          outputRange: showLoginOptions ? ['-82deg', '0deg'] : ['0deg', '82deg'],
        }),
      },
      {
        translateY: transition.interpolate({
          inputRange: [0, 1],
          outputRange: showLoginOptions ? [34, 0] : [0, -30],
        }),
      },
      {
        scale: transition.interpolate({
          inputRange: [0, 1],
          outputRange: showLoginOptions ? [0.92, 1] : [1, 0.9],
        }),
      },
    ],
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.topSection}>
        <Surface style={styles.imageCard} elevation={5}>
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

        <View style={styles.buttonStage}>
          <Animated.View
            pointerEvents={showLoginOptions ? 'none' : 'auto'}
            style={[
              styles.pressCard,
              pressCardStyle,
              showLoginOptions && styles.cardFaceHidden,
            ]}
          >
            <Pressable
              onPress={handlePressButton}
              style={({ pressed }) => [
                styles.pressButton,
                pressed && styles.pressButtonPressed,
              ]}
            >
              <View style={styles.pressButtonGlow} />
              <Text style={styles.pressLabelTop}>ENTER THE HUB</Text>
              <Text style={styles.pressLabelMain}>PRESS START</Text>
              <View style={styles.pressCtaRow}>
                <Text style={styles.pressLabelBottom}>tap to unlock social login</Text>
                <MaterialCommunityIcons name="arrow-right-circle" size={22} color="#F8FAFC" />
              </View>
            </Pressable>
          </Animated.View>

          <Animated.View
            pointerEvents={showLoginOptions ? 'auto' : 'none'}
            style={[
              styles.buttonGroup,
              styles.socialCard,
              socialCardStyle,
              !showLoginOptions && styles.cardFaceHidden,
            ]}
          >
            <TouchableOpacity
              style={[styles.loginBtn, styles.kakaoBtn]}
              onPress={handleKakaoLogin}
              activeOpacity={0.88}
            >
              <MaterialCommunityIcons name="chat" size={24} color="#3C1E1E" />
              <Text style={styles.kakaoBtnText}>카카오톡으로 시작하기</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginBtn, styles.googleBtn]}
              onPress={handleGoogleLogin}
              activeOpacity={0.88}
            >
              <MaterialCommunityIcons name="google" size={24} color="#FFFFFF" />
              <Text style={styles.googleBtnText}>Google 계정으로 로그인</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginBtn, styles.naverBtn]}
              onPress={handleNaverLogin}
              activeOpacity={0.88}
            >
              <MaterialCommunityIcons name="alpha-n-circle" size={24} color="#FFFFFF" />
              <Text style={styles.naverBtnText}>네이버로 빠르게 시작하기</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={[styles.line, { backgroundColor: theme.colors.outline }]} />
              <Text style={[styles.dividerText, { color: theme.colors.onSurfaceVariant }]}>LOGIN ONLY</Text>
              <View style={[styles.line, { backgroundColor: theme.colors.outline }]} />
            </View>

            <View style={styles.lockedNotice}>
              <MaterialCommunityIcons name="shield-lock" size={18} color={theme.colors.secondary} />
              <Text style={[styles.lockedNoticeText, { color: theme.colors.onSurfaceVariant }]}>
                소셜 로그인 완료 후에만 다음 화면으로 이동할 수 있습니다.
              </Text>
            </View>
          </Animated.View>
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
  buttonStage: {
    width: '100%',
    minHeight: 356,
    position: 'relative',
  },
  pressCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    backfaceVisibility: 'hidden',
  },
  pressButton: {
    minHeight: 188,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 26,
    justifyContent: 'space-between',
    overflow: 'hidden',
    backgroundColor: '#111827',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 10,
  },
  pressButtonPressed: {
    transform: [{ scale: 0.985 }],
  },
  pressButtonGlow: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(56, 189, 248, 0.22)',
  },
  pressLabelTop: {
    color: '#7DD3FC',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2.4,
  },
  pressLabelMain: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 34,
  },
  pressCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  pressLabelBottom: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    flex: 1,
  },
  socialCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 18,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 7,
    minHeight: 322,
    backfaceVisibility: 'hidden',
    zIndex: 3,
  },
  cardFaceHidden: {
    zIndex: 0,
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
  naverBtn: {
    backgroundColor: '#03C75A',
  },
  naverBtnText: {
    color: '#FFFFFF',
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
  lockedNotice: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lockedNoticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
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
