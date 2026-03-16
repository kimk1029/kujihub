import React, { useEffect, useRef, useState } from 'react';
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
const BOARD_GAP = 3;
const BOARD_H_PADDING = 12;
const SLOT_SIZE = Math.floor((width - BOARD_H_PADDING * 2 - BOARD_GAP * (BOARD_COLUMNS - 1)) / BOARD_COLUMNS);

type SlotStatus = 'locked' | 'drawn';
type SlotInfo = { status: SlotStatus; grade?: string; color?: string; name?: string };

export function KujiBoardDrawScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<KujiDrawStackParamList>>();
  const route = useRoute<RouteProp<KujiDrawStackParamList, 'KujiBoardDraw'>>();
  const { kujiId, quantity } = route.params;

  const userId = useRef(`u-${Date.now()}-${Math.random().toString(36).slice(2)}`).current;
  const [boardSlots, setBoardSlots] = useState<Map<number, SlotInfo>>(new Map());
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [reserving, setReserving] = useState(false);

  const readyToDraw = selectedSlots.length === quantity;

  useEffect(() => {
    api.get(`/api/kujis/${kujiId}/board`)
      .then(res => {
        const map = new Map<number, SlotInfo>();
        for (const [k, v] of Object.entries(res.data.slots ?? {})) {
          map.set(Number(k), v as SlotInfo);
        }
        setBoardSlots(map);
      })
      .catch(() => {})
      .finally(() => setLoadingBoard(false));
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
        userId,
      });
      const results: KujiDrawRevealResult[] = res.data.results.map((r: any) => ({
        slotNumber: r.slot,
        grade: r.grade,
        name: r.name,
        color: r.color,
      }));
      const ordered = [...selectedSlots].sort((a, b) => a - b);
      navigation.navigate('KujiResult', { kujiId, quantity, selectedSlots: ordered, results });
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
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
          <MaterialCommunityIcons name="chevron-left" size={30} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>DRAW BOARD</Text>
          <Text style={styles.headerSubtitle}>남은 슬롯 {remaining}개 중 {quantity}개 선택</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.selectedCount}>{selectedSlots.length}/{quantity}</Text>
        </View>
      </View>

      {/* 범례 */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#191919', borderColor: '#2E2E2E', borderWidth: 1 }]} />
          <Text style={styles.legendText}>선택 가능</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F9D71C' }]} />
          <Text style={styles.legendText}>내가 선택</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF7A00' }]} />
          <Text style={styles.legendText}>뽑는중</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#2A2A2A' }]} />
          <Text style={styles.legendText}>이미 뽑힘</Text>
        </View>
      </View>

      {/* 뽑기판 */}
      {loadingBoard ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#FFD700" size="large" />
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
                    <View style={[styles.slotDrawnInner, { backgroundColor: (info!.color ?? '#333') + '22' }]}>
                      <Text style={[styles.slotGrade, { color: info!.color }]}>{info!.grade}</Text>
                    </View>
                  ) : isLocked ? (
                    <View style={styles.slotLockedInner}>
                      <Text style={styles.slotLockedText}>{'...'}</Text>
                    </View>
                  ) : (
                    <View style={[styles.slotCover, isSelected && styles.slotCoverSelected]}>
                      <Text style={[styles.slotText, isSelected && styles.slotTextSelected]}>
                        {slot}
                      </Text>
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
            선택: {selectedSlots.length > 0 ? selectedSlots.slice().sort((a, b) => a - b).join(', ') : '없음'}
          </Text>
        </View>
        <Pressable
          style={[styles.drawBtn, (!readyToDraw || reserving) && styles.drawBtnDisabled]}
          onPress={handleDraw}
          disabled={!readyToDraw || reserving}
        >
          {reserving ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <MaterialCommunityIcons
              name="lightning-bolt"
              size={22}
              color={readyToDraw ? '#000000' : '#555555'}
            />
          )}
          <Text style={[styles.drawBtnText, (!readyToDraw || reserving) && styles.drawBtnTextDisabled]}>
            {reserving ? '처리 중...' : readyToDraw ? '뽑기!' : `${quantity - selectedSlots.length}개 더 선택하세요`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D17',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#0B0D17',
    borderBottomWidth: 1,
    borderBottomColor: '#1E2433',
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#151926',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 20,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: '#718096',
    fontSize: 13,
    marginTop: 2,
    fontWeight: '600',
  },
  headerRight: {
    minWidth: 48,
    alignItems: 'flex-end',
  },
  selectedCount: {
    color: '#FFD700',
    fontWeight: '900',
    fontSize: 20,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    paddingVertical: 12,
    backgroundColor: '#0B0D17',
    borderBottomWidth: 1,
    borderBottomColor: '#1E2433',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    color: '#718096',
    fontSize: 11,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardScroll: {
    flex: 1,
  },
  boardScrollContent: {
    paddingVertical: 16,
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  slot: {
    width: SLOT_SIZE - 2,
    height: SLOT_SIZE - 2,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#1E2433',
    backgroundColor: '#151926',
    overflow: 'hidden',
  },
  slotDrawn: {
    borderColor: '#151926',
    backgroundColor: '#0B0D17',
    opacity: 0.6,
  },
  slotLocked: {
    borderColor: '#FF7A00',
    backgroundColor: '#1A1100',
  },
  slotSelected: {
    borderColor: '#FFD700',
    backgroundColor: '#2D2700',
    elevation: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  slotBlocked: {
    opacity: 0.2,
  },
  slotCover: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotCoverSelected: {
    backgroundColor: 'transparent',
  },
  slotText: {
    color: '#4A5568',
    fontWeight: '900',
    fontSize: SLOT_SIZE > 35 ? 12 : 10,
  },
  slotTextSelected: {
    color: '#FFD700',
  },
  slotDrawnInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotGrade: {
    fontWeight: '900',
    fontSize: SLOT_SIZE > 35 ? 14 : 12,
  },
  slotLockedInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotLockedText: {
    color: '#FF7A00',
    fontWeight: '900',
    fontSize: 10,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#1E2433',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#0B0D17',
    gap: 12,
  },
  footerInfo: {
    alignItems: 'center',
  },
  footerSelected: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  drawBtn: {
    backgroundColor: '#FFD700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  drawBtnDisabled: {
    backgroundColor: '#1E2433',
  },
  drawBtnText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: -0.5,
  },
  drawBtnTextDisabled: {
    color: '#4A5568',
  },
});
