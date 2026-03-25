import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { IconButton, Surface, Text } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { KujiDrawStackParamList } from '../../navigation/types';
import { api } from '../../shared/api';
import { ensureKujiPlayer, type KujiPlayer } from './kujiPlayer';

type KujiDetail = {
  id: string;
  title: string;
  description: string;
  price: number;
  boardSize: number;
  remaining: number;
  status: string;
};

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

export function KujiPurchaseScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<KujiDrawStackParamList>>();
  const route = useRoute<RouteProp<KujiDrawStackParamList, 'KujiPurchase'>>();
  const { kujiId } = route.params;

  const [kuji, setKuji] = useState<KujiDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [player, setPlayer] = useState<KujiPlayer | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([api.get(`/api/kujis/${kujiId}`), ensureKujiPlayer()])
      .then(([res, ensuredPlayer]) => {
        setKuji(res.data);
        setPlayer(ensuredPlayer);
      })
      .catch(() => setError('쿠지 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [kujiId]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={ARCADE_COLORS.ACCENT} size="large" />
      </View>
    );
  }

  if (error || !kuji) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{error ?? '알 수 없는 오류'}</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.retryBtn}>
          <Text style={styles.retryText}>돌아가기</Text>
        </Pressable>
      </View>
    );
  }

  const maxQty = Math.min(10, kuji.remaining);
  const total = quantity * kuji.price;
  const canAfford = (player?.points ?? 0) >= total;

  return (
    <View style={styles.container}>
      <View style={styles.scanlines} pointerEvents="none" />
      
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={ARCADE_COLORS.WHITE} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>PURCHASE</Text>
          <View style={styles.remainingBadge}>
            <Text style={styles.headerSubtitle}>POINT BALANCE: {player?.points.toLocaleString()}P</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* 쿠지 정보 */}
        <Surface style={styles.kujiInfoCard} elevation={0}>
          <View style={styles.kujiInfoBadge}>
            <Text variant="labelSmall" style={styles.badgeText}>
              {kuji.status === 'sold_out' ? 'SOLD OUT' : 'ACTIVE'}
            </Text>
          </View>
          <Text style={styles.kujiTitle}>{kuji.title}</Text>
          <Text style={styles.kujiDesc}>{kuji.description}</Text>
          
          <View style={styles.kujiMeta}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="ticket-confirmation" size={16} color={ARCADE_COLORS.ACCENT} />
              <Text style={styles.metaLabel}>1회</Text>
              <Text style={styles.metaValue}>{kuji.price.toLocaleString()}원</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="grid" size={16} color={ARCADE_COLORS.SECONDARY} />
              <Text style={styles.metaLabelBlue}>잔여</Text>
              <Text style={styles.metaValueBlue}>
                {kuji.remaining} / {kuji.boardSize}
              </Text>
            </View>
          </View>
        </Surface>

        {/* 수량 조절 */}
        <Surface style={styles.quantityCard} elevation={0}>
          <Text style={styles.sectionTitle}>SELECT QUANTITY</Text>
          <View style={styles.quantityControls}>
            <Pressable
              onPress={() => setQuantity(prev => Math.max(prev - 1, 1))}
              style={styles.controlBtn}
            >
              <MaterialCommunityIcons name="minus" size={26} color={ARCADE_COLORS.ACCENT} />
            </Pressable>
            <View style={styles.quantityDisplay}>
              <Text style={styles.quantityText}>{quantity}</Text>
              <Text style={styles.unitText}>회</Text>
            </View>
            <Pressable
              onPress={() => setQuantity(prev => Math.min(prev + 1, maxQty))}
              style={styles.controlBtn}
            >
              <MaterialCommunityIcons name="plus" size={26} color={ARCADE_COLORS.ACCENT} />
            </Pressable>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL PRICE</Text>
            <Text style={styles.totalPrice}>{total.toLocaleString()}원</Text>
          </View>
        </Surface>

        {/* 안내 */}
        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information-outline" size={16} color={ARCADE_COLORS.TEXT_GRAY} />
          <Text style={styles.infoText}>
            구매 후 뽑기판에서 남은 슬롯 중 원하는 번호를 선택해 뽑기를 진행합니다.
          </Text>
        </View>

        <View style={styles.spacer} />

        {/* 구매 버튼 */}
        <Pressable
          style={[styles.buyBtn, (kuji.remaining === 0 || !canAfford || submitting) && styles.buyBtnDisabled]}
          disabled={kuji.remaining === 0 || !canAfford || submitting}
          onPress={async () => {
            if (!player || submitting) return;
            setSubmitting(true);
            try {
              const { data } = await api.post(`/api/kujis/${kujiId}/purchase`, {
                playerId: player.id,
                quantity,
              });
              setPlayer(data.player);
              navigation.navigate('KujiBoardDraw', {
                kujiId,
                quantity,
                purchaseId: data.purchase.id,
                playerId: player.id,
              });
            } catch (e: any) {
              const apiError = e?.response?.data?.error;
              if (apiError === 'insufficient_points') setError('포인트가 부족합니다.');
              else if (apiError === 'not_enough_slots') setError('남은 슬롯이 부족합니다.');
              else setError('결제 처리에 실패했습니다.');
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {submitting ? (
            <ActivityIndicator color={ARCADE_COLORS.BG} size="small" />
          ) : (
            <MaterialCommunityIcons name="lightning-bolt" size={22} color={!submitting && canAfford ? ARCADE_COLORS.BG : ARCADE_COLORS.TEXT_GRAY} />
          )}
          <Text style={[styles.buyBtnText, (kuji.remaining === 0 || !canAfford || submitting) && styles.buyBtnDisabledText]}>
            {kuji.remaining === 0 ? 'SOLD OUT' : !canAfford ? 'INSUFFICIENT POINTS' : submitting ? 'PROCESSING...' : `${total.toLocaleString()}P PAY & DRAW!`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ARCADE_COLORS.BG },
  center: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText: { color: ARCADE_COLORS.ERROR, fontSize: 15, fontWeight: '900' },
  retryBtn: { borderWidth: 2, borderColor: ARCADE_COLORS.ACCENT, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: ARCADE_COLORS.SURFACE },
  retryText: { color: ARCADE_COLORS.ACCENT, fontWeight: '900' },
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
  content: { flex: 1, paddingHorizontal: 16, paddingBottom: 24, paddingTop: 16 },
  kujiInfoCard: {
    backgroundColor: ARCADE_COLORS.SURFACE,
    borderWidth: 2,
    borderColor: '#333',
    padding: 16,
    marginBottom: 14,
  },
  kujiInfoBadge: {
    backgroundColor: ARCADE_COLORS.SECONDARY,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 10,
  },
  badgeText: { color: ARCADE_COLORS.BG, fontWeight: '900', fontSize: 10 },
  kujiTitle: { color: ARCADE_COLORS.WHITE, fontWeight: '900', fontSize: 20, lineHeight: 28, marginBottom: 6 },
  kujiDesc: { color: ARCADE_COLORS.TEXT_GRAY, fontSize: 13, marginBottom: 14 },
  kujiMeta: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
    alignItems: 'center',
  },
  metaItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaDivider: { width: 1, height: 24, backgroundColor: '#333', marginHorizontal: 12 },
  metaLabel: { color: ARCADE_COLORS.TEXT_GRAY, fontSize: 11, fontWeight: '900' },
  metaValue: { color: ARCADE_COLORS.ACCENT, fontWeight: '900', fontSize: 14 },
  metaLabelBlue: { color: ARCADE_COLORS.TEXT_GRAY, fontSize: 11, fontWeight: '900' },
  metaValueBlue: { color: ARCADE_COLORS.SECONDARY, fontWeight: '900', fontSize: 14 },
  quantityCard: {
    backgroundColor: ARCADE_COLORS.SURFACE,
    borderWidth: 2,
    borderColor: ARCADE_COLORS.ACCENT,
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: { color: ARCADE_COLORS.ACCENT, fontWeight: '900', fontSize: 14, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 },
  quantityControls: { flexDirection: 'row', alignItems: 'center', gap: 28, marginBottom: 16 },
  controlBtn: { width: 52, height: 52, borderWidth: 2, borderColor: ARCADE_COLORS.ACCENT, alignItems: 'center', justifyContent: 'center', backgroundColor: ARCADE_COLORS.BG },
  quantityDisplay: { flexDirection: 'row', alignItems: 'baseline', gap: 4, minWidth: 80, justifyContent: 'center' },
  quantityText: { color: ARCADE_COLORS.WHITE, fontWeight: '900', fontSize: 52 },
  unitText: { color: ARCADE_COLORS.ACCENT, fontWeight: '900', fontSize: 18 },
  totalRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(249,215,28,0.2)',
  },
  totalLabel: { color: ARCADE_COLORS.TEXT_GRAY, fontWeight: '900', fontSize: 12 },
  totalPrice: { color: ARCADE_COLORS.ACCENT, fontWeight: '900', fontSize: 26 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#333',
    padding: 12,
    marginBottom: 8,
  },
  infoText: { color: ARCADE_COLORS.TEXT_GRAY, flex: 1, fontSize: 11, lineHeight: 18, fontWeight: '600' },
  spacer: { flex: 1 },
  buyBtn: {
    backgroundColor: ARCADE_COLORS.ACCENT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderWidth: 2,
    borderColor: ARCADE_COLORS.WHITE,
  },
  buyBtnDisabled: { backgroundColor: ARCADE_COLORS.SURFACE, borderColor: '#333' },
  buyBtnText: { color: ARCADE_COLORS.BG, fontWeight: '900', fontSize: 18, letterSpacing: 1 },
  buyBtnDisabledText: { color: ARCADE_COLORS.TEXT_GRAY },
});

