import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  runOnJS,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TICKET_WIDTH = SCREEN_WIDTH * 0.85;
const TICKET_HEIGHT = TICKET_WIDTH * 0.55;

interface KujiPeelRevealProps {
  grade: string;
  name: string;
  color: string;
  slotNumber: number;
  onRevealed: () => void;
}

const Particle = ({ p, isVisible }: { p: any, isVisible: boolean }) => {
  const pAnim = useSharedValue(0);
  
  useEffect(() => {
    if (isVisible) {
      pAnim.value = 0;
      pAnim.value = withTiming(1, { duration: 1000 + Math.random() * 500 });
    }
  }, [isVisible]);

  const pStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(pAnim.value, [0, 1], [0, p.x]) },
      { translateY: interpolate(pAnim.value, [0, 1], [0, p.y]) },
      { scale: interpolate(pAnim.value, [0, 0.2, 0.8, 1], [0, 1.5, 1, 0]) },
      { rotate: `${pAnim.value * 360}deg` },
    ],
    opacity: interpolate(pAnim.value, [0.8, 1], [1, 0]),
  }));

  return (
    <Animated.View 
      style={[
        styles.particle, 
        { backgroundColor: p.color, left: TICKET_WIDTH/2, top: TICKET_HEIGHT/2 }, 
        pStyle
      ]} 
    />
  );
};

export function KujiPeelReveal({ grade, name, color, slotNumber, onRevealed }: KujiPeelRevealProps) {
  const [isDone, setIsDone] = useState(false);
  
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isRevealing = useSharedValue(false);
  const winnerScale = useSharedValue(0);
  const winnerOpacity = useSharedValue(0);

  const triggerWinnerAnim = () => {
    winnerScale.value = 0;
    winnerOpacity.value = 1;
    winnerScale.value = withSpring(1, { damping: 8, stiffness: 120 });
  };

  const gesture = Gesture.Pan()
    .onStart(() => {
      isRevealing.value = true;
    })
    .onUpdate((event) => {
      const resistance = interpolate(event.translationX, [0, TICKET_WIDTH], [1, 1.8], Extrapolate.CLAMP);
      translateX.value = Math.max(0, event.translationX / resistance);
      translateY.value = Math.min(0, event.translationY / resistance);
    })
    .onEnd((event) => {
      if (translateX.value > TICKET_WIDTH * 0.5) {
        translateX.value = withSpring(TICKET_WIDTH * 1.5);
        translateY.value = withSpring(-TICKET_HEIGHT * 0.5);
        runOnJS(setIsDone)(true);
        runOnJS(triggerWinnerAnim)();
        runOnJS(onRevealed)();
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
      isRevealing.value = false;
    });

  const animatedTopStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [0, TICKET_WIDTH], [0, -20], Extrapolate.CLAMP);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const animatedBackStyle = useAnimatedStyle(() => {
    const shake = isRevealing.value ? Math.sin(Date.now() / 40) * 2 : 0;
    return {
      transform: [{ translateX: shake }],
    };
  });

  const winnerStyle = useAnimatedStyle(() => ({
    opacity: winnerOpacity.value,
    transform: [{ scale: winnerScale.value }, { rotate: '-12deg' }],
  }));

  const particles = Array.from({ length: 20 }).map((_, i) => {
    const angle = (i / 20) * Math.PI * 2;
    const dist = 100 + Math.random() * 100;
    return {
      id: i,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      color: ['#FFD700', '#FF3B30', '#4A90E2', '#FFFFFF', '#00E5FF'][i % 5],
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.ticketWrapper}>
        {/* Confetti effect */}
        {isDone && particles.map((p) => (
          <Particle key={p.id} p={p} isVisible={isDone} />
        ))}

        {/* Underneath Layer (Result) */}
        <Animated.View style={[styles.bottomLayer, { borderColor: color }, animatedBackStyle]}>
          <Surface style={[styles.resultSurface, { backgroundColor: color + '15' }]} elevation={0}>
            <View style={[styles.gradeCircle, { backgroundColor: color }]}>
              <Text style={styles.gradeText}>{grade}</Text>
            </View>
            <View style={styles.resultInfo}>
              <Text style={styles.resultName}>{name}</Text>
              <Text style={styles.resultSlot}>{slotNumber}번 슬롯 결과</Text>
            </View>
          </Surface>
          
          <Animated.View style={[styles.winnerBadge, winnerStyle]}>
            <Text style={styles.winnerLabel}>WINNER!</Text>
          </Animated.View>
        </Animated.View>

        {/* Top Layer (Peelable Cover) */}
        {!isDone && (
          <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.topLayer, animatedTopStyle]}>
              <Surface style={styles.topSurface} elevation={4}>
                <View style={styles.topContent}>
                  <MaterialCommunityIcons name="ticket-confirmation" size={48} color="#D4AF37" />
                  <Text style={styles.topText}>당기면 결과가 공개됩니다!</Text>
                  <View style={styles.dragHint}>
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#CBD5E1" />
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#94A3B8" />
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#475569" />
                  </View>
                </View>
                <View style={styles.peelCorner}>
                  <MaterialCommunityIcons name="gesture-swipe-right" size={24} color="#151926" />
                </View>
              </Surface>
            </Animated.View>
          </GestureDetector>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  ticketWrapper: {
    width: TICKET_WIDTH,
    height: TICKET_HEIGHT,
    position: 'relative',
  },
  topLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  topSurface: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  topContent: {
    alignItems: 'center',
  },
  topText: {
    color: '#1E293B',
    fontWeight: '900',
    marginTop: 12,
    fontSize: 16,
  },
  dragHint: {
    flexDirection: 'row',
    marginTop: 12,
    opacity: 0.8,
  },
  peelCorner: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    opacity: 0.6,
  },
  bottomLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
    borderRadius: 20,
    borderWidth: 4,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  resultSurface: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  gradeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  gradeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 32,
  },
  resultInfo: {
    flex: 1,
    marginLeft: 20,
  },
  resultName: {
    color: '#1E293B',
    fontSize: 18,
    fontWeight: '900',
  },
  resultSlot: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '700',
  },
  winnerBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#E63946',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 12,
    zIndex: 10,
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  winnerLabel: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 20,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  particle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 2,
    zIndex: 5,
  },
});
