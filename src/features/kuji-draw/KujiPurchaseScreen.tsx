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
        <ActivityIndicator color="#F9D71C" size="large" />
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
      <View style={styles.header}>
        <IconButton
          icon="chevron-left"
          iconColor="#FFFFFF"
          size={32}
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        />
        <View>
          <Text variant="titleLarge" style={styles.headerTitle}>수량 선택</Text>
          <Text variant="labelMedium" style={styles.headerSubtitle}>SELECT QUANTITY</Text>
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
          <Text variant="titleLarge" style={styles.kujiTitle}>{kuji.title}</Text>
          <Text variant="bodyMedium" style={styles.kujiDesc}>{kuji.description}</Text>
          {player && (
            <View style={styles.pointBalance}>
              <MaterialCommunityIcons name="star-circle" size={18} color="#F9D71C" />
              <Text style={styles.pointBalanceText}>보유 포인트 {player.points.toLocaleString()}P</Text>
            </View>
          )}
          <View style={styles.kujiMeta}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="ticket-confirmation" size={16} color="#F9D71C" />
              <Text variant="labelLarge" style={styles.metaLabel}>1회</Text>
              <Text variant="titleMedium" style={styles.metaValue}>{kuji.price.toLocaleString()}원</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="grid" size={16} color="#00E5FF" />
              <Text variant="labelLarge" style={styles.metaLabelBlue}>잔여</Text>
              <Text variant="titleMedium" style={styles.metaValueBlue}>
                {kuji.remaining} / {kuji.boardSize}
              </Text>
            </View>
          </View>
        </Surface>

        {/* 수량 조절 */}
        <Surface style={styles.quantityCard} elevation={0}>
          <Text variant="titleMedium" style={styles.sectionTitle}>구매 수량</Text>
          <View style={styles.quantityControls}>
            <Pressable
              onPress={() => setQuantity(prev => Math.max(prev - 1, 1))}
              style={styles.controlBtn}
            >
              <MaterialCommunityIcons name="minus" size={26} color="#F9D71C" />
            </Pressable>
            <View style={styles.quantityDisplay}>
              <Text style={styles.quantityText}>{quantity}</Text>
              <Text style={styles.unitText}>회</Text>
            </View>
            <Pressable
              onPress={() => setQuantity(prev => Math.min(prev + 1, maxQty))}
              style={styles.controlBtn}
            >
              <MaterialCommunityIcons name="plus" size={26} color="#F9D71C" />
            </Pressable>
          </View>
          <View style={styles.totalRow}>
            <Text variant="bodyLarge" style={styles.totalLabel}>총 결제 금액</Text>
            <Text style={styles.totalPrice}>{total.toLocaleString()}원</Text>
          </View>
        </Surface>

        {/* 안내 */}
        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information-outline" size={16} color="#8A8A8A" />
          <Text variant="bodySmall" style={styles.infoText}>
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
          <MaterialCommunityIcons name="lightning-bolt" size={22} color="#000000" />
          <Text style={styles.buyBtnText}>
            {kuji.remaining === 0 ? '매진되었습니다' : !canAfford ? '포인트가 부족합니다' : submitting ? '결제 중...' : `${total.toLocaleString()}P 결제하고 뽑기판으로!`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  center: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText: { color: '#FF3B30', fontSize: 15 },
  retryBtn: { borderWidth: 1, borderColor: '#F9D71C', paddingHorizontal: 20, paddingVertical: 8 },
  retryText: { color: '#F9D71C', fontWeight: '700' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 10, paddingBottom: 16, paddingHorizontal: 10 },
  backBtn: { marginRight: 0 },
  headerTitle: { color: '#FFFFFF', fontWeight: '900' },
  headerSubtitle: { color: '#00E5FF', fontWeight: '700', letterSpacing: 1 },
  content: { flex: 1, paddingHorizontal: 16, paddingBottom: 24 },
  kujiInfoCard: {
    backgroundColor: '#121212',
    borderWidth: 2,
    borderColor: '#2A2A2A',
    padding: 16,
    marginBottom: 14,
  },
  kujiInfoBadge: {
    backgroundColor: '#00E5FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 10,
  },
  badgeText: { color: '#000000', fontWeight: '900' },
  kujiTitle: { color: '#FFFFFF', fontWeight: '800', lineHeight: 28, marginBottom: 6 },
  kujiDesc: { color: '#8A8A8A', marginBottom: 14 },
  pointBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  pointBalanceText: { color: '#F9D71C', fontWeight: '800' },
  kujiMeta: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    alignItems: 'center',
  },
  metaItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaDivider: { width: 1, height: 24, backgroundColor: '#2A2A2A', marginHorizontal: 12 },
  metaLabel: { color: '#8A8A8A' },
  metaValue: { color: '#F9D71C', fontWeight: '900' },
  metaLabelBlue: { color: '#8A8A8A' },
  metaValueBlue: { color: '#00E5FF', fontWeight: '900' },
  quantityCard: {
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#F9D71C',
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: { color: '#F9D71C', fontWeight: '900', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 },
  quantityControls: { flexDirection: 'row', alignItems: 'center', gap: 28, marginBottom: 16 },
  controlBtn: { width: 52, height: 52, borderWidth: 2, borderColor: '#F9D71C', alignItems: 'center', justifyContent: 'center' },
  quantityDisplay: { flexDirection: 'row', alignItems: 'baseline', gap: 4, minWidth: 80, justifyContent: 'center' },
  quantityText: { color: '#FFFFFF', fontWeight: '900', fontSize: 52, lineHeight: 60 },
  unitText: { color: '#F9D71C', fontWeight: '800', fontSize: 18 },
  totalRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(249,215,28,0.2)',
  },
  totalLabel: { color: '#8A8A8A' },
  totalPrice: { color: '#F9D71C', fontWeight: '900', fontSize: 26 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#262626',
    padding: 12,
    marginBottom: 8,
  },
  infoText: { color: '#8A8A8A', flex: 1, lineHeight: 18 },
  spacer: { flex: 1 },
  buyBtn: {
    backgroundColor: '#F9D71C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  buyBtnDisabled: { backgroundColor: '#333' },
  buyBtnText: { color: '#000000', fontWeight: '900', fontSize: 17 },
});
