import React, { useEffect } from 'react';
import { StyleSheet, View, Animated, Image } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

export function BrandSplash() {
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const theme = useTheme();

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
        <View style={styles.imageContainer}>
          <Image 
            source={require('../assets/images/Gemini_Generated_Image_brlmgybrlmgybrlm.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        
        <Text style={[styles.title, { color: theme.colors.primary }]}>
          KOOJI HUB
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.secondary }]}>
          제일복권 종합 정보 앱
        </Text>
        
        <View style={styles.loadingContainer}>
          <View style={[styles.progressBar, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Animated.View style={[styles.progressActive, { backgroundColor: theme.colors.secondary, width: '60%' }]} />
          </View>
          <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
            데이터를 불러오는 중...
          </Text>
        </View>
      </Animated.View>

      <View style={styles.bottomBranding}>
        <Text style={[styles.copyright, { color: theme.colors.onSurfaceVariant }]}>
          © 2026 KOOJI HUB. All Rights Reserved.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  imageContainer: {
    width: 280,
    height: 280,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    opacity: 0.8,
  },
  loadingContainer: {
    marginTop: 80,
    width: '60%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressActive: {
    height: '100%',
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  bottomBranding: {
    position: 'absolute',
    bottom: 50,
  },
  copyright: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.5,
  },
});
