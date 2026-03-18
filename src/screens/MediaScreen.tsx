import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ImageBackground,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { api } from '../shared/api';

type MediaVideo = {
  id: string;
  title: string;
  creator: string;
  description: string;
  videoId: string;
  duration?: string;
  published?: string;
  views?: string;
  isShort: boolean;
  thumbnail: string;
};

type AnimeCategory = {
  id: string;
  name: string;
  query: string;
  imageUrl: string | null;
  accentColor: string;
};

type AnimeCategoryResponse = {
  items: AnimeCategory[];
};

type YouTubeSearchResponse = {
  query: string;
  effectiveQuery: string;
  page: number;
  items: MediaVideo[];
};

const { width } = Dimensions.get('window');
const GRID_GAP = 12;
const HORIZONTAL_PADDING = 18;
const TILE_WIDTH = Math.floor((width - HORIZONTAL_PADDING * 2 - GRID_GAP) / 2);

const PALETTE = {
  bg: '#07111F',
  panel: '#0E172A',
  panelSoft: '#122033',
  border: '#1F314A',
  cardBorder: '#1A2B41',
  text: '#E2E8F0',
  textDim: '#94A3B8',
  textMuted: '#64748B',
  accent: '#F6C945',
  accentStrong: '#F59E0B',
  overlay: 'rgba(5, 10, 18, 0.45)',
  overlayStrong: 'rgba(3, 7, 18, 0.72)',
  errorBg: '#3A1118',
  errorBorder: '#7F1D1D',
  errorText: '#FECACA',
};

function buildYouTubeUrl(video: MediaVideo) {
  return video.isShort
    ? `https://www.youtube.com/shorts/${video.videoId}`
    : `https://www.youtube.com/watch?v=${video.videoId}`;
}

export function MediaScreen() {
  const insets = useSafeAreaInsets();
  const requestIdRef = useRef(0);
  const [categories, setCategories] = useState<AnimeCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [videos, setVideos] = useState<MediaVideo[]>([]);
  const [page, setPage] = useState(1);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingCategories(true);
      try {
        const { data } = await api.get<AnimeCategoryResponse>('/api/media/anime-categories');
        if (cancelled) {
          return;
        }

        setCategories(data.items);
        setSelectedCategoryId((current) => current ?? data.items[0]?.id ?? null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '애니 카테고리를 불러오지 못했습니다.');
          setLoadingInitial(false);
        }
      } finally {
        if (!cancelled) {
          setLoadingCategories(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedCategory) {
      return;
    }

    void loadVideos({ reset: true, category: selectedCategory });
  }, [selectedCategory?.id]);

  async function loadVideos({
    reset,
    category,
  }: {
    reset: boolean;
    category: AnimeCategory;
  }) {
    if (reset) {
      setLoadingInitial(true);
      setPage(1);
      setHasMore(true);
    } else {
      if (loadingMore || !hasMore) {
        return;
      }
      setLoadingMore(true);
    }

    setError(null);

    const targetPage = reset ? 1 : page + 1;
    const requestId = ++requestIdRef.current;

    try {
      const { data } = await api.get<YouTubeSearchResponse>('/api/media/youtube-search', {
        params: {
          query: category.query,
          page: targetPage,
          limit: 18,
        },
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      setVideos((current) => {
        if (reset) {
          return data.items;
        }

        const existing = new Set(current.map((item) => item.videoId));
        const next = data.items.filter((item) => !existing.has(item.videoId));
        return [...current, ...next];
      });

      setPage(targetPage);
      setHasMore(data.items.length >= 12);
    } catch (e) {
      setError(e instanceof Error ? e.message : '영상을 불러오지 못했습니다.');
      if (reset) {
        setVideos([]);
      }
    } finally {
      setLoadingInitial(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }

  async function handleRefresh() {
    if (!selectedCategory) {
      return;
    }

    setRefreshing(true);
    await loadVideos({ reset: true, category: selectedCategory });
  }

  async function handleEndReached() {
    if (!selectedCategory || loadingInitial || loadingMore || !hasMore) {
      return;
    }

    await loadVideos({ reset: false, category: selectedCategory });
  }

  async function openVideo(video: MediaVideo) {
    try {
      await Linking.openURL(buildYouTubeUrl(video));
    } catch {
      setError('유튜브를 열 수 없습니다.');
    }
  }

  function renderHeader() {
    return (
      <View style={styles.headerWrap}>
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>MEDIA</Text>
          <Text style={styles.headerTitle}>애니별 쿠지 영상 모아보기</Text>
          <Text style={styles.headerSubtitle}>
            애니 탭을 누르면 `{selectedCategory?.query ?? '애니명 쿠지'}` 기준으로 영상이 타일형으로 계속 로드됩니다.
          </Text>
        </View>

        <FlatList
          data={categories}
          horizontal
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => {
            const active = item.id === selectedCategoryId;

            return (
              <Pressable
                onPress={() => setSelectedCategoryId(item.id)}
                style={[styles.categoryCard, active && styles.categoryCardActive]}
              >
                <ImageBackground
                  source={item.imageUrl ? { uri: item.imageUrl } : undefined}
                  style={styles.categoryImage}
                  imageStyle={styles.categoryImageInner}
                >
                  <View
                    style={[
                      styles.categoryShade,
                      active && { borderColor: item.accentColor || PALETTE.accent },
                    ]}
                  >
                    <Text style={styles.categoryName}>{item.name}</Text>
                    <Text style={styles.categoryQuery}>{item.query}</Text>
                  </View>
                </ImageBackground>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            loadingCategories ? (
              <View style={styles.loadingCategories}>
                <ActivityIndicator size="small" color={PALETTE.accent} />
                <Text style={styles.loadingCategoriesText}>애니 카테고리 불러오는 중</Text>
              </View>
            ) : null
          }
        />

        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>
            {selectedCategory ? `${selectedCategory.name} 영상` : '영상 목록'}
          </Text>
          <Text style={styles.resultHint}>
            {videos.length}개 로드됨{hasMore ? ' · 더 불러오는 중' : ' · 마지막 목록'}
          </Text>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color={PALETTE.errorText} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  function renderFooter() {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={PALETTE.accent} />
          <Text style={styles.footerText}>추가 영상을 불러오는 중</Text>
        </View>
      );
    }

    if (!hasMore && videos.length > 0) {
      return (
        <View style={styles.footerLoader}>
          <Text style={styles.footerText}>더 표시할 영상이 없습니다.</Text>
        </View>
      );
    }

    return <View style={styles.footerSpacer} />;
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FlatList
        data={videos}
        keyExtractor={(item, index) => `${item.videoId}-${index}`}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.content}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void handleRefresh();
            }}
            tintColor={PALETTE.accent}
          />
        }
        onEndReachedThreshold={0.45}
        onEndReached={() => {
          void handleEndReached();
        }}
        renderItem={({ item }) => (
          <Pressable style={styles.tileCard} onPress={() => void openVideo(item)}>
            <ImageBackground
              source={{ uri: item.thumbnail }}
              style={styles.tileThumb}
              imageStyle={styles.tileThumbImage}
            >
              <View style={styles.tileShade}>
                <View style={styles.badge}>
                  <MaterialCommunityIcons
                    name={item.isShort ? 'lightning-bolt' : 'youtube'}
                    size={12}
                    color="#FFFFFF"
                  />
                  <Text style={styles.badgeText}>{item.isShort ? 'SHORTS' : 'YOUTUBE'}</Text>
                </View>
                <MaterialCommunityIcons name="play-circle" size={36} color="#FFFFFF" />
              </View>
            </ImageBackground>
            <View style={styles.tileBody}>
              <Text numberOfLines={2} style={styles.tileTitle}>
                {item.title}
              </Text>
              <Text numberOfLines={1} style={styles.tileCreator}>
                {item.creator}
              </Text>
              <Text numberOfLines={1} style={styles.tileMeta}>
                {[item.duration, item.views, item.published].filter(Boolean).join(' · ') || 'YouTube'}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          loadingInitial ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={PALETTE.accent} />
              <Text style={styles.emptyText}>유튜브 영상 목록을 불러오는 중</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="television-play" size={42} color={PALETTE.textMuted} />
              <Text style={styles.emptyText}>표시할 영상이 없습니다.</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PALETTE.bg,
  },
  content: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 110,
  },
  headerWrap: {
    paddingBottom: 18,
  },
  header: {
    paddingTop: 14,
    paddingBottom: 18,
  },
  headerEyebrow: {
    color: PALETTE.accent,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  headerTitle: {
    marginTop: 8,
    color: PALETTE.text,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1.1,
  },
  headerSubtitle: {
    marginTop: 10,
    color: PALETTE.textDim,
    lineHeight: 21,
  },
  categoryList: {
    gap: 12,
    paddingBottom: 14,
  },
  categoryCard: {
    width: 170,
    height: 118,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: PALETTE.panel,
    borderWidth: 1,
    borderColor: PALETTE.cardBorder,
  },
  categoryCardActive: {
    transform: [{ translateY: -2 }],
    borderColor: PALETTE.accent,
  },
  categoryImage: {
    flex: 1,
    backgroundColor: '#101826',
  },
  categoryImageInner: {
    borderRadius: 24,
  },
  categoryShade: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 14,
    backgroundColor: PALETTE.overlay,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 24,
  },
  categoryName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  categoryQuery: {
    marginTop: 4,
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingCategories: {
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingCategoriesText: {
    color: PALETTE.textDim,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  resultLabel: {
    color: PALETTE.text,
    fontSize: 18,
    fontWeight: '900',
  },
  resultHint: {
    color: PALETTE.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: PALETTE.errorBg,
    borderWidth: 1,
    borderColor: PALETTE.errorBorder,
    marginBottom: 8,
  },
  errorText: {
    color: PALETTE.errorText,
    flex: 1,
    fontWeight: '700',
  },
  column: {
    gap: GRID_GAP,
  },
  tileCard: {
    width: TILE_WIDTH,
    marginBottom: GRID_GAP,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: PALETTE.panel,
    borderWidth: 1,
    borderColor: PALETTE.cardBorder,
  },
  tileThumb: {
    height: TILE_WIDTH * 1.35,
    justifyContent: 'space-between',
  },
  tileThumbImage: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  tileShade: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: PALETTE.overlayStrong,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  tileBody: {
    padding: 12,
  },
  tileTitle: {
    color: PALETTE.text,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    minHeight: 40,
  },
  tileCreator: {
    marginTop: 8,
    color: PALETTE.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  tileMeta: {
    marginTop: 6,
    color: PALETTE.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 72,
    gap: 12,
  },
  emptyText: {
    color: PALETTE.textDim,
    fontWeight: '700',
  },
  footerLoader: {
    paddingTop: 8,
    paddingBottom: 18,
    alignItems: 'center',
    gap: 10,
  },
  footerText: {
    color: PALETTE.textMuted,
    fontWeight: '700',
  },
  footerSpacer: {
    height: 24,
  },
});
