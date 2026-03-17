import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { ActivityIndicator, Surface, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { communityApi } from '../features/community/community.api';
import type { CommunityFeedItem } from '../features/community/community.types';

dayjs.locale('ko');

function iconName(type: string) {
  if (type === 'post_created') return 'post-outline';
  if (type === 'post_updated') return 'pencil-outline';
  if (type === 'post_deleted') return 'delete-outline';
  if (type === 'lineup_alert') return 'calendar-star';
  return 'rss';
}

export function FeedScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<CommunityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await communityApi.getFeed(40);
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '피드를 불러올 수 없습니다.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>LIVE FEED</Text>
        <Text style={styles.title}>실시간 피드</Text>
        <Text style={styles.subtitle}>게시글 생성, 수정, 삭제 흐름이 시간순으로 쌓입니다.</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#151926" />
        </View>
      ) : error ? (
        <Surface style={styles.errorCard} elevation={0}>
          <Text style={styles.errorText}>{error}</Text>
        </Surface>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={item.postId ? 0.8 : 1}
              disabled={!item.postId}
              onPress={() =>
                item.postId &&
                navigation.navigate('Community', {
                  screen: 'CommunityDetail',
                  params: { id: item.postId },
                })
              }
            >
              <Surface style={styles.row} elevation={0}>
                <View style={styles.iconWrap}>
                  <MaterialCommunityIcons name={iconName(item.type)} size={18} color="#8B6B12" />
                </View>
                <View style={styles.body}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowBody}>{item.body}</Text>
                </View>
                <Text style={styles.time}>{dayjs(item.createdAt).format('MM.DD HH:mm')}</Text>
              </Surface>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Surface style={styles.emptyCard} elevation={0}>
              <Text style={styles.emptyText}>아직 표시할 피드가 없습니다.</Text>
            </Surface>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F2EA',
  },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  eyebrow: {
    color: '#B08A1E',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  title: {
    marginTop: 6,
    color: '#151926',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 8,
    color: '#667085',
    fontSize: 14,
    lineHeight: 21,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: 18,
    paddingBottom: 120,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: '#E7E1D6',
    marginBottom: 10,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F4EDDC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  rowTitle: {
    color: '#141B2D',
    fontSize: 15,
    fontWeight: '800',
  },
  rowBody: {
    marginTop: 4,
    color: '#667085',
    fontSize: 13,
    lineHeight: 19,
  },
  time: {
    color: '#98A2B3',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyCard: {
    borderRadius: 12,
    paddingVertical: 32,
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: '#E7E1D6',
    alignItems: 'center',
  },
  emptyText: {
    color: '#667085',
    fontWeight: '700',
  },
  errorCard: {
    marginHorizontal: 18,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#B91C1C',
    fontWeight: '700',
  },
});
