import React, { useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { Text, Surface, IconButton } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { KujiDrawStackParamList } from '../../navigation/types';
import type { KujiDrawRevealResult } from './kujiDraw.types';

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
    if (!selectedSlots.length) return '80개의 뽑기판 중 원하는 번호를 먼저 고르세요.';
    return `선택 번호: ${selectedSlots.slice().sort((a, b) => a - b).join(', ')}`;
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
    if (isDrawing) return;

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
      <View style={styles.header}>
        <IconButton
          icon="chevron-left"
          iconColor="#FFFFFF"
          size={32}
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        />
        <View>
          <Text variant="titleLarge" style={styles.headerTitle}>뽑기판 선택</Text>
          <Text variant="labelMedium" style={styles.headerSubtitle}>PICK YOUR TICKETS</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Surface style={styles.sectionCard} elevation={0}>
          <Text variant="titleMedium" style={styles.sectionTitle}>잔여 현황</Text>
          <View style={styles.poolList}>
            {PRIZE_POOL.map((prize) => (
                <View key={prize.grade} style={styles.prizeRow}>
                <View
                  style={[
                    styles.gradeBadge,
                    prize.remaining > 0 ? styles[prize.badgeStyle] : styles.gradeBadgeSoldOut,
                  ]}
                >
                  <Text style={styles.gradeText}>{prize.grade}</Text>
                </View>
                <Text variant="bodyMedium" style={styles.prizeName}>{prize.name}</Text>
                <Text variant="titleMedium" style={styles.prizeCount}>
                  {prize.remaining} / {prize.total}
                </Text>
              </View>
            ))}
          </View>
        </Surface>

        <Surface style={styles.quantityCard} elevation={0}>
          <Text variant="titleMedium" style={styles.sectionTitle}>구매 수량</Text>
          <View style={styles.quantityControls}>
            <Pressable onPress={handleDecrement} style={styles.controlBtn}>
              <MaterialCommunityIcons name="minus" size={24} color="#F9D71C" />
            </Pressable>
            <View style={styles.quantityDisplay}>
              <Text variant="headlineMedium" style={styles.quantityText}>{quantity}</Text>
              <Text variant="labelLarge" style={styles.unitText}>회</Text>
            </View>
            <Pressable onPress={handleIncrement} style={styles.controlBtn}>
              <MaterialCommunityIcons name="plus" size={24} color="#F9D71C" />
            </Pressable>
          </View>
          <View style={styles.totalBox}>
            <Text variant="labelLarge" style={styles.totalLabel}>
              {selectedSlots.length} / {quantity} 선택 완료
            </Text>
            <Text variant="headlineSmall" style={styles.totalPrice}>{(quantity * pricePerDraw).toLocaleString()}원</Text>
          </View>
        </Surface>

        <View style={styles.boardHeader}>
          <Text variant="titleMedium" style={styles.boardTitle}>80 DRAW BOARD</Text>
          <Text variant="bodySmall" style={styles.boardHint}>{summaryText}</Text>
        </View>

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

        <View style={styles.board}>
          {DRAW_BOARD.map((slot) => {
            const selected = selectedSlots.includes(slot);
            const blocked = !selected && selectedSlots.length >= quantity;

            return (
              <Pressable
                key={slot}
                style={[
                  styles.slot,
                  selected && styles.slotSelected,
                  blocked && styles.slotBlocked,
                ]}
                onPress={() => toggleSlot(slot)}
              >
                <View style={styles.slotCover}>
                  <Text style={[styles.slotText, selected && styles.slotTextSelected]}>
                    {slot}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Text variant="labelLarge" style={styles.pullLabel}>
            {readyToDraw ? '손잡이를 아래로 당겨 뽑기' : `먼저 ${quantity}개를 선택하세요`}
          </Text>
          <View style={[styles.pullTrack, !readyToDraw && styles.pullTrackDisabled]}>
            <Animated.View
              style={[
                styles.pullHandle,
                {
                  transform: [{ translateY: pullY }],
                },
              ]}
              {...panResponder.panHandlers}
            >
              <MaterialCommunityIcons name="arrow-down-bold-circle" size={24} color="#000000" />
              <Text variant="labelLarge" style={styles.pullHandleText}>PULL</Text>
            </Animated.View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 10,
  },
  backBtn: {
    marginRight: 0,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  headerSubtitle: {
    color: '#00E5FF',
    fontWeight: '700',
    letterSpacing: 1,
  },
  sectionCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 14,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#F9D71C',
    fontWeight: '900',
    marginBottom: 12,
    textTransform: 'uppercase',
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
    borderRadius: 0,
  },
  gradeBadgeA: {
    backgroundColor: '#00E5FF',
  },
  gradeBadgeB: {
    backgroundColor: '#5AF6FF',
  },
  gradeBadgeC: {
    backgroundColor: '#F9D71C',
  },
  gradeBadgeD: {
    backgroundColor: '#FF946A',
  },
  gradeBadgeE: {
    backgroundColor: '#8A8A8A',
  },
  gradeBadgeSoldOut: {
    backgroundColor: '#4A4A4A',
  },
  gradeText: {
    color: '#000000',
    fontWeight: '950',
    fontSize: 14,
  },
  prizeName: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  prizeCount: {
    color: '#8A8A8A',
    fontWeight: '700',
    fontSize: 13,
  },
  quantityCard: {
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#F9D71C',
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
    borderRadius: 0,
    borderWidth: 2,
    borderColor: '#F9D71C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  quantityText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 42,
  },
  unitText: {
    color: '#F9D71C',
    fontWeight: '800',
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
    color: '#8A8A8A',
    marginBottom: 4,
  },
  totalPrice: {
    color: '#F9D71C',
    fontWeight: '900',
  },
  boardHeader: {
    marginBottom: 10,
  },
  boardTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 1,
  },
  boardHint: {
    color: '#9A9A9A',
    marginTop: 4,
  },
  drawFlash: {
    ...StyleSheet.absoluteFillObject,
    top: 210,
    bottom: 90,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderRadius: 20,
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: BOARD_GAP,
    padding: BOARD_PADDING,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 20,
  },
  slot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2E2E2E',
    backgroundColor: '#191919',
    padding: 2,
  },
  slotSelected: {
    borderColor: '#F9D71C',
    backgroundColor: '#2A2305',
  },
  slotBlocked: {
    opacity: 0.36,
  },
  slotCover: {
    flex: 1,
    borderRadius: 6,
    backgroundColor: '#0C0C0C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotText: {
    color: '#7E7E7E',
    fontWeight: '800',
    fontSize: SLOT_SIZE > 26 ? 11 : 9,
  },
  slotTextSelected: {
    color: '#F9D71C',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 12,
  },
  pullLabel: {
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: 10,
  },
  pullTrack: {
    width: 88,
    height: 140,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#171717',
    padding: 8,
    alignItems: 'center',
  },
  pullTrackDisabled: {
    opacity: 0.4,
  },
  pullHandle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#00E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  pullHandleText: {
    color: '#000000',
    fontWeight: '950',
    letterSpacing: 1,
  },
});
