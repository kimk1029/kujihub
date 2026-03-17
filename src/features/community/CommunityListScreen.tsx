import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { Text, FAB, ActivityIndicator, Surface, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';
import type { CommunityStackParamList } from '../../navigation/types';
import { communityApi } from './community.api';
import type { CommunityPost } from './community.types';

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

  const latestDateLabel = useMemo(() => {
    if (posts.length === 0) return '아직 글이 없습니다';
    return dayjs(posts[0].createdAt).format('YYYY.MM.DD HH:mm');
  }, [posts]);

  const renderItem = ({ item, index }: { item: CommunityPost; index: number }) => (
    <TouchableOpacity
      style={styles.rowLink}
      onPress={() => navigation.navigate('CommunityDetail', { id: item.id })}
      activeOpacity={0.78}
    >
      <Surface style={styles.rowCard} elevation={0}>
        <View style={styles.rowIndexWrap}>
          <Text style={styles.rowIndex}>{String(index + 1).padStart(2, '0')}</Text>
        </View>

        <View style={styles.rowBody}>
          <View style={styles.rowHeader}>
            <Chip compact style={styles.categoryChip} textStyle={styles.categoryChipText}>자유게시판</Chip>
            <Text style={styles.rowDate}>{dayjs(item.createdAt).format('MM.DD HH:mm')}</Text>
          </View>

          <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.rowExcerpt} numberOfLines={2}>
            {item.content?.trim() || '내용이 없는 게시글입니다.'}
          </Text>

          <View style={styles.rowMeta}>
            <View style={styles.metaPill}>
              <MaterialCommunityIcons name="account-circle-outline" size={16} color="#B08A1E" />
              <Text style={styles.metaText}>{item.author}</Text>
            </View>
            <View style={styles.metaPill}>
              <MaterialCommunityIcons name="text-box-outline" size={16} color="#B08A1E" />
              <Text style={styles.metaText}>{item.content.trim().length.toLocaleString()}자</Text>
            </View>
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.loadingWrap}>
          <Surface style={styles.loadingCard} elevation={2}>
            <ActivityIndicator size="large" color="#151926" />
            <Text style={styles.loadingTitle}>커뮤니티 포털 불러오는 중</Text>
            <Text style={styles.loadingBody}>최신 글과 메타 정보를 정리하고 있습니다.</Text>
          </Surface>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, posts.length === 0 && styles.listEmpty]}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <Surface style={styles.heroCard} elevation={3}>
              <View style={styles.heroGlowA} />
              <View style={styles.heroGlowB} />
              <Text style={styles.heroEyebrow}>KOOJI COMMUNITY</Text>
              <Text style={styles.heroTitle}>쿠지 포털</Text>
              <Text style={styles.heroBody}>
                클리앙처럼 제목과 메타가 먼저 보이는 보드형 레이아웃으로, 최신 글을 빠르게 읽고 이동할 수 있게 정리했습니다.
              </Text>
              <View style={styles.heroFooter}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>전체 글</Text>
                  <Text style={styles.heroStatValue}>{posts.length}</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>최신 등록</Text>
                  <Text style={styles.heroStatSmall}>{latestDateLabel}</Text>
                </View>
              </View>
            </Surface>

            <View style={styles.boardHeader}>
              <Text style={styles.boardTitle}>게시판 목록</Text>
              <Chip compact style={styles.sortChip} textStyle={styles.sortChipText}>최신순</Chip>
            </View>

            {error ? (
              <Surface style={styles.errorBox} elevation={0}>
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#B91C1C" />
                <Text style={styles.errorText}>{error}</Text>
              </Surface>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !error ? (
            <Surface style={styles.emptyCard} elevation={1}>
              <MaterialCommunityIcons name="post-outline" size={42} color="#D4AF37" />
              <Text style={styles.emptyTitle}>아직 등록된 글이 없습니다</Text>
              <Text style={styles.emptyBody}>오른쪽 아래 버튼으로 첫 글을 작성해 커뮤니티 보드를 시작해보세요.</Text>
            </Surface>
          ) : null
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchList(true)} />}
      />

      <FAB
        icon="pencil"
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => navigation.navigate('CommunityPostForm', {})}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F1E8',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  loadingCard: {
    width: '100%',
    borderRadius: 28,
    paddingVertical: 34,
    paddingHorizontal: 24,
    backgroundColor: '#FFFDF8',
    alignItems: 'center',
  },
  loadingTitle: {
    marginTop: 16,
    color: '#151926',
    fontSize: 19,
    fontWeight: '900',
  },
  loadingBody: {
    marginTop: 8,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 108,
  },
  listEmpty: {
    flexGrow: 1,
  },
  headerWrap: {
    paddingBottom: 8,
  },
  heroCard: {
    overflow: 'hidden',
    marginTop: 18,
    borderRadius: 30,
    paddingVertical: 24,
    paddingHorizontal: 22,
    backgroundColor: '#151926',
  },
  heroGlowA: {
    position: 'absolute',
    top: -48,
    right: -8,
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: '#253143',
  },
  heroGlowB: {
    position: 'absolute',
    bottom: -72,
    left: -30,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#1E2533',
  },
  heroEyebrow: {
    color: '#F8E7A0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  heroTitle: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '900',
    letterSpacing: -0.9,
  },
  heroBody: {
    marginTop: 12,
    color: '#CBD5E1',
    fontSize: 15,
    lineHeight: 24,
  },
  heroFooter: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  heroStat: {
    flex: 1,
  },
  heroDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 16,
  },
  heroStatLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  heroStatValue: {
    marginTop: 5,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  heroStatSmall: {
    marginTop: 6,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  boardHeader: {
    marginTop: 18,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boardTitle: {
    color: '#151926',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  sortChip: {
    backgroundColor: '#ECE7DA',
  },
  sortChipText: {
    color: '#5B6472',
    fontWeight: '800',
  },
  errorBox: {
    marginBottom: 14,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFF1F2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#9F1239',
    fontWeight: '700',
  },
  rowLink: {
    marginBottom: 10,
  },
  rowCard: {
    borderRadius: 22,
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: '#E8DFD2',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rowIndexWrap: {
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
  },
  rowIndex: {
    color: '#C59717',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  rowBody: {
    flex: 1,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  categoryChip: {
    backgroundColor: '#F4EDDC',
  },
  categoryChipText: {
    color: '#8B6B12',
    fontWeight: '800',
  },
  rowDate: {
    color: '#8A94A5',
    fontSize: 12,
    fontWeight: '700',
  },
  rowTitle: {
    marginTop: 10,
    color: '#141B2D',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  rowExcerpt: {
    marginTop: 8,
    color: '#5B6472',
    fontSize: 14,
    lineHeight: 22,
  },
  rowMeta: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#F8F3E9',
  },
  metaText: {
    color: '#5B6472',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    marginTop: 12,
    borderRadius: 24,
    paddingVertical: 34,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#FFFDF8',
  },
  emptyTitle: {
    marginTop: 12,
    color: '#151926',
    fontSize: 19,
    fontWeight: '900',
  },
  emptyBody: {
    marginTop: 8,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    right: 18,
    backgroundColor: '#151926',
  },
});
