import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { Text, FAB, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { communityApi } from './community.api';
import type { CommunityPost } from './community.types';
import type { CommunityStackParamList } from '../../navigation/types';
import dayjs from 'dayjs';

type Nav = NativeStackNavigationProp<CommunityStackParamList, 'CommunityList'>;

export function CommunityListScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const list = await communityApi.getList();
      setPosts(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : '목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => fetchList());
    return unsubscribe;
  }, [navigation, fetchList]);

  if (loading && !refreshing) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  const renderItem = ({ item }: { item: CommunityPost }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('CommunityDetail', { id: item.id })}
      activeOpacity={0.7}
    >
      <Text variant="titleMedium" numberOfLines={1}>{item.title}</Text>
      <Text variant="bodySmall" style={styles.meta}>
        {item.author} · {dayjs(item.createdAt).format('YYYY.MM.DD HH:mm')}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {error ? (
        <View style={styles.errorBox}>
          <Text variant="bodySmall" style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, posts.length === 0 && styles.listEmpty]}
        ListEmptyComponent={
          !error ? (
            <View style={styles.empty}>
              <Text variant="bodyLarge" style={styles.emptyText}>아직 글이 없습니다.</Text>
              <Text variant="bodySmall" style={styles.emptyHint}>우측 하단 버튼으로 글을 작성해 보세요.</Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchList(true)} />
        }
      />
      <FAB
        icon="pencil"
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={() => navigation.navigate('CommunityPostForm', {})}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFBFE' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorBox: { padding: 12, backgroundColor: '#FCE4EC', marginHorizontal: 16, marginTop: 8 },
  errorText: { color: '#FF4081' },
  listContent: { padding: 16, paddingBottom: 100 },
  listEmpty: { flexGrow: 1 },
  empty: { paddingVertical: 48, alignItems: 'center' },
  emptyText: { color: '#666' },
  emptyHint: { marginTop: 8, color: '#999' },
  card: {
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  meta: { marginTop: 4, color: '#666' },
  fab: { position: 'absolute', right: 16 },
});
