import React, { useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, PanResponder, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { KujiDrawStackParamList } from '../../navigation/types';
import type { KujiDrawRevealResult } from './kujiDraw.types';

const ARCADE_COLORS = {
  PRIMARY: '#FF00FF', // Magenta
  SECONDARY: '#00FFFF', // Cyan
  ACCENT: '#F9D71C', // Yellow/Gold
  BG: '#05070A',
  SURFACE: '#121620',
  TEXT_GRAY: '#718096',
  WHITE: '#FFFFFF',
  ERROR: '#FF3131',
};

const DRAW_BOARD_SIZE = 80;
const DRAW_BOARD = Array.from({ length: DRAW_BOARD_SIZE }, (_, index) => index + 1);
const { width } = Dimensions.get('window');
const BOARD_COLUMNS = 10;
const BOARD_GAP = 4;
const BOARD_PADDING = 16;
const SLOT_SIZE = Math.floor((width - BOARD_PADDING * 2 - BOARD_GAP * (BOARD_COLUMNS - 1)) / BOARD_COLUMNS);

const PRIZE_POOL = [
  { grade: 'A', name: '킹 오브 아티스트 루피', total: 2, remaining: 1, color: '#00E5FF', chance: 0.04, badgeStyle: 'gradeBadgeA' },
  { grade: 'B', name: '배틀 레코드 조로', total: 2, remaining: 2, color: '#5AF6FF', chance: 0.08, badgeStyle: 'gradeBadgeB' },
  { grade: 'C', name: '컬렉션 비주얼 보드', total: 6, remaining: 4, color: '#F9D71C', chance: 0.22, badgeStyle: 'gradeBadgeC' },
  { grade: 'D', name: '러버 코스터', total: 20, remaining: 15, color: '#FF946A', chance: 0.3, badgeStyle: 'gradeBadgeD' },
  { grade: 'E', name: '클리어 파일 세트', total: 50, remaining: 32, color: '#8A8A8A', chance: 0.36, badgeStyle: 'gradeBadgeE' },
];

// Mock slot data for prototype
const MOCK_DRAWN_SLOTS = new Map<number, { grade: string, color: string }>();
MOCK_DRAWN_SLOTS.set(5, { grade: 'A', color: '#00E5FF' });
MOCK_DRAWN_SLOTS.set(12, { grade: 'B', color: '#5AF6FF' });
MOCK_DRAWN_SLOTS.set(28, { grade: 'C', color: '#F9D71C' });
MOCK_DRAWN_SLOTS.set(45, { grade: 'D', color: '#FF946A' });
MOCK_DRAWN_SLOTS.set(67, { grade: 'E', color: '#8A8A8A' });

export function KujiDrawSelectionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<KujiDrawStackParamList>>();
  const route = useRoute<RouteProp<KujiDrawStackParamList, 'KujiSelection'>>();
  const { kujiId } = route.params;

  const [quantity, setQuantity] = useState(1);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const pricePerDraw = 12000;
  const pullY = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  const readyToDraw = selectedSlots.length === quantity && quantity > 0;

  const summaryText = useMemo(() => {
    if (!selectedSlots.length) return 'SELECT TICKETS FROM BOARD';
    return `SELECTED: ${selectedSlots.slice().sort((a, b) => a - b).join(', ')}`;
  }, [selectedSlots]);

  const handleIncrement = () => {
    setQuantity((prev) => Math.min(prev + 1, 10));
  };

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(prev - 1, 1));
  };

  const generateResults = (slots: number[]): KujiDrawRevealResult[] =>
    slots.map((slotNumber) => {
      const random = Math.random();
      let cursor = 0;
      const prize =
        PRIZE_POOL.find((item) => {
          cursor += item.chance;
          return random <= cursor;
        }) ?? PRIZE_POOL[PRIZE_POOL.length - 1];

      return {
        slotNumber,
        grade: prize.grade,
        name: prize.name,
        color: prize.color,
      };
    });

  const finishDraw = () => {
    const orderedSlots = [...selectedSlots].sort((a, b) => a - b);
    navigation.navigate('KujiResult', {
      kujiId,
      quantity,
      purchaseId: 'PROTOTYPE_PURCHASE',
      playerId: 'PROTOTYPE_PLAYER',
      selectedSlots: orderedSlots,
      results: generateResults(orderedSlots),
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => readyToDraw && !isDrawing && gestureState.dy > 6,
      onPanResponderMove: (_, gestureState) => {
        const nextY = Math.max(0, Math.min(gestureState.dy, 150));
        pullY.setValue(nextY);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 && readyToDraw && !isDrawing) {
          setIsDrawing(true);
          Animated.parallel([
            Animated.timing(pullY, {
              toValue: 170,
              duration: 220,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(glow, { toValue: 1, duration: 180, useNativeDriver: true }),
              Animated.timing(glow, { toValue: 0, duration: 220, useNativeDriver: true }),
            ]),
          ]).start(() => {
            pullY.setValue(0);
            setIsDrawing(false);
            finishDraw();
          });
          return;
        }

        Animated.spring(pullY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 8,
        }).start();
      },
    }),
  ).current;

  function toggleSlot(slot: number) {
    if (isDrawing || MOCK_DRAWN_SLOTS.has(slot)) return;

    setSelectedSlots((prev) => {
      if (prev.includes(slot)) {
        return prev.filter((item) => item !== slot);
      }

      if (prev.length >= quantity) {
        return prev;
      }

      return [...prev, slot];
    });
  }

  React.useEffect(() => {
    setSelectedSlots((prev) => prev.slice(0, quantity));
  }, [quantity]);

  return (
    <View style={styles.container}>
      <View style={styles.scanlines} pointerEvents="none" />

      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={ARCADE_COLORS.WHITE} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>OFFLINE DRAW</Text>
          <View style={styles.remainingBadge}>
            <Text style={styles.headerSubtitle}>LOCAL PROTOTYPE MODE</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Surface style={styles.sectionCard} elevation={0}>
          <Text style={styles.sectionTitle}>PRIZE STATUS</Text>
          <View style={styles.poolList}>
            {PRIZE_POOL.map((prize) => (
                <View key={prize.grade} style={styles.prizeRow}>
                <View
                  style={[
                    styles.gradeBadge,
                    prize.remaining > 0 
                      ? { backgroundColor: prize.color } 
                      : styles.gradeBadgeSoldOut,
                  ]}
                >
                  <Text style={styles.gradeText}>{prize.grade}</Text>
                </View>
                <Text style={styles.prizeName}>{prize.name}</Text>
                <Text style={styles.prizeCount}>
                  {prize.remaining} / {prize.total}
                </Text>
              </View>
            ))}
          </View>
        </Surface>

        <Surface style={styles.quantityCard} elevation={0}>
          <Text style={styles.sectionTitle}>DRAW QUANTITY</Text>
          <View style={styles.quantityControls}>
            <Pressable onPress={handleDecrement} style={styles.controlBtn}>
              <MaterialCommunityIcons name="minus" size={24} color={ARCADE_COLORS.ACCENT} />
            </Pressable>
            <View style={styles.quantityDisplay}>
              <Text style={styles.quantityText}>{quantity}</Text>
              <Text style={styles.unitText}>회</Text>
            </View>
            <Pressable onPress={handleIncrement} style={styles.controlBtn}>
              <MaterialCommunityIcons name="plus" size={24} color={ARCADE_COLORS.ACCENT} />
            </Pressable>
          </View>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>
              {selectedSlots.length} / {quantity} SELECTED
            </Text>
            <Text style={styles.totalPrice}>{(quantity * pricePerDraw).toLocaleString()}원</Text>
          </View>
        </Surface>

        <View style={styles.boardHeader}>
          <Text style={styles.boardTitle}>80 DRAW BOARD</Text>
          <Text style={styles.boardHint}>{summaryText}</Text>
        </View>

        <View style={styles.board}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.drawFlash,
              {
                opacity: glow,
                transform: [
                  {
                    scale: glow.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  },
                ],
              },
            ]}
          />
          {DRAW_BOARD.map((slot) => {
            const selected = selectedSlots.includes(slot);
            const mockInfo = MOCK_DRAWN_SLOTS.get(slot);
            const isDrawn = !!mockInfo;
            const blocked = !selected && !isDrawn && selectedSlots.length >= quantity;

            return (
              <Pressable
                key={slot}
                style={[
                  styles.slot,
                  selected && styles.slotSelected,
                  isDrawn && styles.slotDrawn,
                  blocked && styles.slotBlocked,
                ]}
                onPress={() => toggleSlot(slot)}
                disabled={isDrawn}
              >
                {isDrawn ? (
                  <View style={[styles.slotDrawnInner, { backgroundColor: mockInfo!.color }]}>
                    <Text style={styles.slotGradeText}>{mockInfo!.grade}</Text>
                    <View style={styles.soldOutSticker}>
                      <Text style={styles.soldOutText}>HIT!</Text>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.slotCover, selected && styles.slotCoverSelected]}>
                    <View style={styles.perforation} />
                    <Text style={[styles.slotText, selected && styles.slotTextSelected]}>
                      {slot}
                    </Text>
                    <View style={styles.ticketStub} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Text style={styles.pullLabel}>
            {readyToDraw ? 'PULL HANDLE DOWN TO DRAW' : `SELECT ${quantity - selectedSlots.length} MORE TICKETS`}
          </Text>
          <View style={[styles.pullTrack, !readyToDraw && styles.pullTrackDisabled]}>
            <Animated.View
              style={[
                styles.pullHandle,
                {
                  transform: [{ translateY: pullY }],
                  backgroundColor: readyToDraw ? ARCADE_COLORS.SECONDARY : ARCADE_COLORS.SURFACE,
                },
              ]}
              {...panResponder.panHandlers}
            >
              <MaterialCommunityIcons name="ticket-confirmation" size={24} color={readyToDraw ? ARCADE_COLORS.BG : ARCADE_COLORS.TEXT_GRAY} />
              <Text style={[styles.pullHandleText, !readyToDraw && { color: ARCADE_COLORS.TEXT_GRAY }]}>PULL</Text>
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ARCADE_COLORS.BG,
  },
  scanlines: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 10,
    opacity: 0.1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: ARCADE_COLORS.BG,
    borderBottomWidth: 4,
    borderBottomColor: ARCADE_COLORS.PRIMARY,
    marginBottom: 16,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: ARCADE_COLORS.SECONDARY,
    fontWeight: '900',
    fontSize: 22,
    letterSpacing: 2,
    textShadowColor: ARCADE_COLORS.PRIMARY,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
  },
  remainingBadge: {
    backgroundColor: ARCADE_COLORS.PRIMARY,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  headerSubtitle: {
    color: ARCADE_COLORS.WHITE,
    fontSize: 11,
    fontWeight: '900',
  },
  backBtn: {
    padding: 8,
    borderWidth: 2,
    borderColor: ARCADE_COLORS.WHITE,
    backgroundColor: ARCADE_COLORS.SURFACE,
  },
  sectionCard: {
    backgroundColor: ARCADE_COLORS.SURFACE,
    borderWidth: 2,
    borderColor: '#333',
    padding: 14,
    marginBottom: 10,
  },
  sectionTitle: {
    color: ARCADE_COLORS.ACCENT,
    fontWeight: '900',
    marginBottom: 12,
    textTransform: 'uppercase',
    fontSize: 14,
  },
  poolList: {
    gap: 8,
  },
  prizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gradeBadge: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeBadgeSoldOut: {
    backgroundColor: '#333',
  },
  gradeText: {
    color: ARCADE_COLORS.BG,
    fontWeight: '900',
    fontSize: 14,
  },
  prizeName: {
    flex: 1,
    color: ARCADE_COLORS.WHITE,
    fontSize: 12,
    fontWeight: '700',
  },
  prizeCount: {
    color: ARCADE_COLORS.TEXT_GRAY,
    fontWeight: '900',
    fontSize: 12,
  },
  quantityCard: {
    backgroundColor: ARCADE_COLORS.SURFACE,
    borderWidth: 2,
    borderColor: ARCADE_COLORS.ACCENT,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginVertical: 6,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderWidth: 2,
    borderColor: ARCADE_COLORS.ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ARCADE_COLORS.BG,
  },
  quantityDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  quantityText: {
    color: ARCADE_COLORS.WHITE,
    fontWeight: '900',
    fontSize: 42,
  },
  unitText: {
    color: ARCADE_COLORS.ACCENT,
    fontWeight: '900',
  },
  totalBox: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(249, 215, 28, 0.2)',
    width: '100%',
    alignItems: 'center',
  },
  totalLabel: {
    color: ARCADE_COLORS.TEXT_GRAY,
    marginBottom: 4,
    fontWeight: '900',
    fontSize: 11,
  },
  totalPrice: {
    color: ARCADE_COLORS.ACCENT,
    fontWeight: '900',
    fontSize: 20,
  },
  boardHeader: {
    marginBottom: 10,
    alignItems: 'center',
  },
  boardTitle: {
    color: ARCADE_COLORS.WHITE,
    fontWeight: '900',
    letterSpacing: 2,
    fontSize: 16,
  },
  boardHint: {
    color: ARCADE_COLORS.ACCENT,
    marginTop: 4,
    fontSize: 11,
    fontWeight: '800',
  },
  drawFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: ARCADE_COLORS.SECONDARY,
    zIndex: 10,
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: BOARD_GAP,
    padding: BOARD_PADDING,
    backgroundColor: ARCADE_COLORS.BG,
    borderWidth: 2,
    borderColor: '#333',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  slot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE + 4,
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: ARCADE_COLORS.SURFACE,
    overflow: 'hidden',
    position: 'relative',
  },
  slotSelected: {
    borderColor: ARCADE_COLORS.WHITE,
    backgroundColor: ARCADE_COLORS.ACCENT,
    transform: [{ scale: 1.05 }],
    zIndex: 5,
  },
  slotDrawn: {
    borderColor: '#222',
    backgroundColor: '#111',
    opacity: 0.8,
  },
  slotBlocked: {
    opacity: 0.3,
  },
  slotCover: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotCoverSelected: {
    backgroundColor: 'transparent',
  },
  perforation: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  ticketStub: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  slotText: {
    color: ARCADE_COLORS.TEXT_GRAY,
    fontWeight: '900',
    fontSize: SLOT_SIZE > 30 ? 12 : 9,
  },
  slotTextSelected: {
    color: ARCADE_COLORS.BG,
  },
  slotDrawnInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotGradeText: {
    color: ARCADE_COLORS.WHITE,
    fontWeight: '900',
    fontSize: SLOT_SIZE > 30 ? 16 : 12,
  },
  soldOutSticker: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: ARCADE_COLORS.ERROR,
    paddingHorizontal: 3,
    paddingVertical: 1,
    transform: [{ rotate: '15deg' }],
  },
  soldOutText: {
    color: ARCADE_COLORS.WHITE,
    fontSize: 7,
    fontWeight: '900',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  pullLabel: {
    color: ARCADE_COLORS.WHITE,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
  },
  pullTrack: {
    width: 100,
    height: 160,
    borderWidth: 4,
    borderColor: ARCADE_COLORS.SECONDARY,
    backgroundColor: ARCADE_COLORS.BG,
    padding: 10,
    alignItems: 'center',
  },
  pullTrackDisabled: {
    borderColor: '#333',
    opacity: 0.6,
  },
  pullHandle: {
    width: 70,
    height: 70,
    borderWidth: 2,
    borderColor: ARCADE_COLORS.WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  pullHandleText: {
    color: ARCADE_COLORS.BG,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },
});
