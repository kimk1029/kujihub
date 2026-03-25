import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { KujiDrawStackParamList } from '../../navigation/types';
import type { KujiDrawRevealResult } from './kujiDraw.types';
import { api } from '../../shared/api';

const BOARD_SIZE = 80;
const { width } = Dimensions.get('window');
const BOARD_COLUMNS = 10;
const BOARD_GAP = 4;
const BOARD_H_PADDING = 10;
const SLOT_SIZE = Math.floor((width - BOARD_H_PADDING * 2 - BOARD_GAP * (BOARD_COLUMNS - 1)) / BOARD_COLUMNS);

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

type SlotStatus = 'locked' | 'drawn';
type SlotInfo = { status: SlotStatus; grade?: string; color?: string; name?: string };

export function KujiBoardDrawScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<KujiDrawStackParamList>>();
  const route = useRoute<RouteProp<KujiDrawStackParamList, 'KujiBoardDraw'>>();
  const { kujiId, quantity, purchaseId, playerId } = route.params;

  const [boardSlots, setBoardSlots] = useState<Map<number, SlotInfo>>(new Map());
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [reserving, setReserving] = useState(false);

  const readyToDraw = selectedSlots.length === quantity;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.get(`/api/kujis/${kujiId}/board`);
        if (!mounted) return;
        const map = new Map<number, SlotInfo>();
        for (const [k, v] of Object.entries(res.data.slots ?? {})) {
          map.set(Number(k), v as SlotInfo);
        }
        setBoardSlots(map);
      } catch {}
      if (mounted) setLoadingBoard(false);
    };

    load();
    const timer = setInterval(load, 5000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [kujiId]);

  async function refreshBoard() {
    try {
      const res = await api.get(`/api/kujis/${kujiId}/board`);
      const map = new Map<number, SlotInfo>();
      for (const [k, v] of Object.entries(res.data.slots ?? {})) {
        map.set(Number(k), v as SlotInfo);
      }
      setBoardSlots(map);
      setSelectedSlots([]);
    } catch {}
  }

  function toggleSlot(slot: number) {
    const info = boardSlots.get(slot);
    if (info?.status === 'drawn') return;
    if (info?.status === 'locked') {
      Alert.alert('사용중', '다른 사용자가 뽑는 중입니다.');
      return;
    }
    setSelectedSlots(prev => {
      if (prev.includes(slot)) return prev.filter(s => s !== slot);
      if (prev.length >= quantity) return prev;
      return [...prev, slot];
    });
  }

  async function handleDraw() {
    if (!readyToDraw || reserving) return;
    setReserving(true);
    try {
      const res = await api.post(`/api/kujis/${kujiId}/reserve`, {
        slots: selectedSlots,
        userId: playerId,
        purchaseId,
      });
      const results: KujiDrawRevealResult[] = res.data.results.map((r: any) => ({
        slotNumber: r.slot,
        grade: r.grade,
        name: r.name,
        color: r.color,
      }));
      const ordered = [...selectedSlots].sort((a, b) => a - b);
      navigation.navigate('KujiResult', { kujiId, quantity, purchaseId, playerId, selectedSlots: ordered, results });
    } catch (e: any) {
      if (e?.response?.status === 409) {
        Alert.alert(
          '슬롯 사용중',
          '선택한 슬롯 중 이미 다른 사람이 뽑는 중인 슬롯이 있습니다.\n보드를 새로고침합니다.',
          [{ text: '확인', onPress: refreshBoard }],
        );
      } else {
        Alert.alert('오류', '뽑기에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setReserving(false);
    }
  }

  const remaining = BOARD_SIZE - Array.from(boardSlots.values()).filter(s => s.status === 'drawn').length;

  return (
    <View style={styles.container}>
      {/* Scanline Overlay Effect */}
      <View style={styles.scanlines} pointerEvents="none" />

      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={ARCADE_COLORS.WHITE} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>KUJI BOARD</Text>
          <View style={styles.remainingBadge}>
            <Text style={styles.headerSubtitle}>LEFT: {remaining} / {BOARD_SIZE}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.selectedCount}>{selectedSlots.length}</Text>
          <Text style={styles.targetCount}>/{quantity}</Text>
        </View>
      </View>

      {/* 범례 */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: ARCADE_COLORS.SURFACE, borderColor: '#333' }]} />
          <Text style={styles.legendText}>TICKET</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: ARCADE_COLORS.ACCENT, borderColor: ARCADE_COLORS.WHITE }]} />
          <Text style={styles.legendText}>SELECTED</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#333', opacity: 0.5 }]} />
          <Text style={styles.legendText}>SOLD OUT</Text>
        </View>
      </View>

      {/* 뽑기판 */}
      {loadingBoard ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={ARCADE_COLORS.ACCENT} size="large" />
          <Text style={styles.loadingText}>LOADING BOARD...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.boardScroll}
          contentContainerStyle={styles.boardScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.board}>
            {Array.from({ length: BOARD_SIZE }, (_, i) => i + 1).map((slot) => {
              const info = boardSlots.get(slot);
              const isDrawn = info?.status === 'drawn';
              const isLocked = info?.status === 'locked';
              const isSelected = selectedSlots.includes(slot);
              const isBlocked = !isDrawn && !isLocked && !isSelected && selectedSlots.length >= quantity;

              return (
                <Pressable
                  key={slot}
                  style={[
                    styles.slot,
                    isDrawn && styles.slotDrawn,
                    isLocked && styles.slotLocked,
                    isSelected && styles.slotSelected,
                    isBlocked && styles.slotBlocked,
                  ]}
                  onPress={() => toggleSlot(slot)}
                  disabled={isDrawn}
                >
                  {isDrawn ? (
                    <View style={[styles.slotDrawnInner, { backgroundColor: info!.color || '#333' }]}>
                      <Text style={styles.slotGradeText}>{info!.grade}</Text>
                      <View style={styles.soldOutSticker}>
                        <Text style={styles.soldOutText}>HIT!</Text>
                      </View>
                    </View>
                  ) : isLocked ? (
                    <View style={styles.slotLockedInner}>
                      <ActivityIndicator size="small" color={ARCADE_COLORS.WHITE} />
                    </View>
                  ) : (
                    <View style={[styles.slotCover, isSelected && styles.slotCoverSelected]}>
                      <View style={styles.perforation} />
                      <Text style={[styles.slotText, isSelected && styles.slotTextSelected]}>
                        {slot}
                      </Text>
                      <View style={styles.ticketStub} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* 하단 뽑기 버튼 */}
      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerSelected}>
            {selectedSlots.length > 0 
              ? `SLOTS: ${selectedSlots.slice().sort((a, b) => a - b).join(', ')}` 
              : 'SELECT TICKETS TO DRAW'}
          </Text>
        </View>
        <Pressable
          style={[styles.drawBtn, (!readyToDraw || reserving) && styles.drawBtnDisabled]}
          onPress={handleDraw}
          disabled={!readyToDraw || reserving}
        >
          {reserving ? (
            <ActivityIndicator color={ARCADE_COLORS.BG} size="small" />
          ) : (
            <MaterialCommunityIcons
              name="ticket-confirmation"
              size={24}
              color={readyToDraw ? ARCADE_COLORS.BG : ARCADE_COLORS.TEXT_GRAY}
            />
          )}
          <Text style={[styles.drawBtnText, (!readyToDraw || reserving) && styles.drawBtnTextDisabled]}>
            {reserving ? 'RESERVING...' : readyToDraw ? 'INSERT COIN & DRAW!' : `PICK ${quantity - selectedSlots.length} MORE`}
          </Text>
        </Pressable>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: ARCADE_COLORS.BG,
    borderBottomWidth: 4,
    borderBottomColor: ARCADE_COLORS.PRIMARY,
  },
  backBtn: {
    padding: 8,
    borderWidth: 2,
    borderColor: ARCADE_COLORS.WHITE,
    backgroundColor: ARCADE_COLORS.SURFACE,
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
  headerRight: {
    minWidth: 60,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
  },
  selectedCount: {
    color: ARCADE_COLORS.ACCENT,
    fontWeight: '900',
    fontSize: 24,
  },
  targetCount: {
    color: ARCADE_COLORS.WHITE,
    fontWeight: '900',
    fontSize: 14,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 12,
    backgroundColor: ARCADE_COLORS.SURFACE,
    borderBottomWidth: 2,
    borderBottomColor: '#1E2433',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 14,
    height: 14,
    borderWidth: 1,
  },
  legendText: {
    color: ARCADE_COLORS.WHITE,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: ARCADE_COLORS.ACCENT,
    fontWeight: '900',
    letterSpacing: 2,
  },
  boardScroll: {
    flex: 1,
  },
  boardScrollContent: {
    paddingVertical: 20,
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: BOARD_GAP,
    paddingHorizontal: BOARD_H_PADDING,
    justifyContent: 'center',
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
  slotDrawn: {
    borderColor: '#222',
    backgroundColor: '#111',
    opacity: 0.8,
  },
  slotLocked: {
    borderColor: ARCADE_COLORS.PRIMARY,
    backgroundColor: '#200',
  },
  slotSelected: {
    borderColor: ARCADE_COLORS.WHITE,
    backgroundColor: ARCADE_COLORS.ACCENT,
    transform: [{ scale: 1.05 }],
    zIndex: 5,
    elevation: 10,
    shadowColor: ARCADE_COLORS.ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
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
    fontSize: SLOT_SIZE > 35 ? 14 : 11,
  },
  slotTextSelected: {
    color: ARCADE_COLORS.BG,
  },
  slotDrawnInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  slotGradeText: {
    color: ARCADE_COLORS.WHITE,
    fontWeight: '900',
    fontSize: SLOT_SIZE > 35 ? 20 : 16,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
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
    fontSize: 8,
    fontWeight: '900',
  },
  slotLockedInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    borderTopWidth: 4,
    borderTopColor: ARCADE_COLORS.SECONDARY,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: ARCADE_COLORS.BG,
    gap: 8,
  },
  footerInfo: {
    alignItems: 'center',
  },
  footerSelected: {
    color: ARCADE_COLORS.ACCENT,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  drawBtn: {
    backgroundColor: ARCADE_COLORS.ACCENT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: ARCADE_COLORS.WHITE,
  },
  drawBtnDisabled: {
    backgroundColor: ARCADE_COLORS.SURFACE,
    borderColor: '#333',
  },
  drawBtnText: {
    color: ARCADE_COLORS.BG,
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 1,
  },
  drawBtnTextDisabled: {
    color: ARCADE_COLORS.TEXT_GRAY,
  },
});
