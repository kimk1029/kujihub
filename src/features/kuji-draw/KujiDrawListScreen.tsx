import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { KujiDrawStackParamList } from '../../navigation/types';
import { api } from '../../shared/api';
import { ensureKujiPlayer } from './kujiPlayer';

type KujiListItem = {
  id: string;
  title: string;
  description: string;
  price: number;
  boardSize: number;
  remaining: number;
  status: 'active' | 'sold_out' | 'draft';
};

type KujiPlayerSummary = {
  id: string;
  nickname: string;
  points: number;
};

export function KujiDrawListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<KujiDrawStackParamList>>();

  const [kujis, setKujis] = useState<KujiListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [player, setPlayer] = useState<KujiPlayerSummary | null>(null);

  const fetchKujis = useCallback(async () => {
    try {
      setError(null);
      const [res, ensuredPlayer] = await Promise.all([
        api.get('/api/kujis'),
        ensureKujiPlayer(),
      ]);
      setKujis(res.data);
      setPlayer(ensuredPlayer);
    } catch {
      setError('목록을 불러오지 못했습니다.');
    }
  }, []);

  useEffect(() => {
    fetchKujis().finally(() => setLoading(false));
  }, [fetchKujis]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchKujis();
    setRefreshing(false);
  }, [fetchKujis]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>ONLINE DRAW</Text>
        <Text variant="labelLarge" style={styles.headerSubtitle}>실시간 온라인 쿠지 뽑기</Text>
        {player && (
          <View style={styles.pointTag}>
            <MaterialCommunityIcons name="star-circle" size={16} color="#F9D71C" />
            <Text style={styles.pointText}>{player.points.toLocaleString()}P</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#00E5FF" size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchKujis}>
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#00E5FF"
            />
          }
        >
          {kujis.length === 0 && (
            <Text style={styles.emptyText}>진행 중인 쿠지가 없습니다.</Text>
          )}
          {kujis.map((kuji) => {
            const isSoldOut = kuji.status === 'sold_out' || kuji.remaining === 0;
            return (
              <TouchableOpacity
                key={kuji.id}
                activeOpacity={isSoldOut ? 1 : 0.9}
                onPress={() => {
                  if (!isSoldOut) navigation.navigate('KujiPurchase', { kujiId: kuji.id });
                }}
              >
                <Surface style={[styles.kujiCard, isSoldOut && styles.kujiCardSoldOut]} elevation={0}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.badge, isSoldOut && styles.badgeSoldOut]}>
                      <Text variant="labelSmall" style={styles.badgeText}>
                        {isSoldOut ? 'SOLD OUT' : 'ACTIVE'}
                      </Text>
                    </View>
                    <Text variant="titleLarge" style={styles.cardTitle}>{kuji.title}</Text>
                  </View>

                  <Text variant="bodyMedium" style={styles.cardDesc}>{kuji.description}</Text>

                  <View style={styles.cardFooter}>
                    <View style={styles.priceTag}>
                      <MaterialCommunityIcons name="ticket-confirmation" size={16} color="#F9D71C" />
                      <Text variant="titleMedium" style={styles.priceText}>
                        {kuji.price.toLocaleString()}원
                      </Text>
                    </View>
                    <View style={styles.remainTag}>
                      <MaterialCommunityIcons name="grid" size={14} color="#00E5FF" />
                      <Text style={styles.remainText}>
                        {kuji.remaining} / {kuji.boardSize}
                      </Text>
                    </View>
                    {!isSoldOut && (
                      <View style={styles.drawBtn}>
                        <Text variant="labelLarge" style={styles.drawBtnText}>지금 도전!</Text>
                        <MaterialCommunityIcons name="arrow-right-bold-circle" size={20} color="#000000" />
                      </View>
                    )}
                  </View>

                  <View style={styles.cornerAccent} />
                </Surface>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomWidth: 4,
    borderBottomColor: '#121212',
  },
  headerTitle: { color: '#00E5FF', fontWeight: '900', fontStyle: 'italic', letterSpacing: 2 },
  headerSubtitle: { color: '#F9D71C', fontWeight: '700', marginTop: 4 },
  pointTag: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: '#101010',
  },
  pointText: { color: '#F9D71C', fontWeight: '900' },
  scrollContent: { padding: 20, gap: 16 },
  emptyText: { color: '#555', textAlign: 'center', marginTop: 40 },
  errorText: { color: '#FF3B30', fontSize: 15 },
  retryBtn: {
    borderWidth: 1,
    borderColor: '#00E5FF',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  retryText: { color: '#00E5FF', fontWeight: '700' },
  kujiCard: {
    backgroundColor: '#121212',
    borderWidth: 2,
    borderColor: '#2A2A2A',
    borderRadius: 0,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  kujiCardSoldOut: { opacity: 0.5 },
  cardHeader: { marginBottom: 10 },
  badge: {
    backgroundColor: '#00E5FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 8,
  },
  badgeSoldOut: { backgroundColor: '#555' },
  badgeText: { color: '#000000', fontWeight: '900' },
  cardTitle: { color: '#FFFFFF', fontWeight: '800', lineHeight: 28 },
  cardDesc: { color: '#8A8A8A', marginBottom: 20 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    flexWrap: 'wrap',
    gap: 8,
  },
  priceTag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  priceText: { color: '#F9D71C', fontWeight: '900' },
  remainTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  remainText: { color: '#00E5FF', fontWeight: '700', fontSize: 13 },
  drawBtn: {
    backgroundColor: '#F9D71C',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 0,
  },
  drawBtnText: { color: '#000000', fontWeight: '900' },
  cornerAccent: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#00E5FF',
    transform: [{ rotate: '45deg' }],
  },
});
