import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import WebView from 'react-native-webview';
import { Screen } from '../components/Screen';
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

type YouTubeSearchResponse = {
  query: string;
  items: MediaVideo[];
};

const { width } = Dimensions.get('window');
const GRID_CARD_WIDTH = Math.floor((width - 48) / 2);

const MEDIA_CATEGORIES = [
  '드래곤볼',
  '원피스',
  '나루토',
  '블리치',
  '귀멸의 칼날',
  '주술회전',
  '하이큐',
  '포켓몬',
];

const PALETTE = {
  bg: '#F8FAFC',
  panel: '#FFFFFF',
  panelSoft: '#F1F5F9',
  border: '#E2E8F0',
  accent: '#151926',
  accentSoft: '#D4AF37',
  accentMuted: '#1E293B',
  text: '#1E293B',
  textDim: '#475569',
  textMuted: '#94A3B8',
  overlay: 'rgba(0, 0, 0, 0.05)',
  overlayStrong: 'rgba(0, 0, 0, 0.4)',
  errorBg: '#FEF2F2',
  errorBorder: '#FEE2E2',
  errorText: '#B91C1C',
};

function buildQuery(category: string) {
  return `${category} 쿠지`;
}

function buildPlayerHtml(videoId: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
    iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
  <iframe
    src="https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
  ></iframe>
</body>
</html>`;
}

function getYouTubeUrl(video: MediaVideo) {
  return video.isShort
    ? `https://www.youtube.com/shorts/${video.videoId}`
    : `https://www.youtube.com/watch?v=${video.videoId}`;
}

export function MediaScreen() {
  const [selectedCategory, setSelectedCategory] = useState('드래곤볼');
  const [videos, setVideos] = useState<MediaVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<MediaVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const query = useMemo(() => buildQuery(selectedCategory), [selectedCategory]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await api.get<YouTubeSearchResponse>('/api/media/youtube-search', {
          params: { query, limit: 18 },
        });

        if (cancelled) return;

        setVideos(data.items);
        setSelectedVideo(data.items[0] ?? null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '미디어를 불러올 수 없습니다.');
        setVideos([]);
        setSelectedVideo(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [query]);

  const shorts = useMemo(() => {
    const shortItems = videos.filter((video) => video.isShort);
    return shortItems.length > 0 ? shortItems.slice(0, 8) : videos.slice(0, 6);
  }, [videos]);

  const features = useMemo(
    () => videos.filter((video) => !shorts.some((short) => short.id === video.id)),
    [shorts, videos],
  );

  async function openInYouTube(video: MediaVideo) {
    const url = getYouTubeUrl(video);

    try {
      await Linking.openURL(url);
    } catch {
      setError('유튜브를 열 수 없습니다.');
    }
  }

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={[styles.title, { color: PALETTE.accent }]}>KUJI MEDIA</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          유튜브에서 "{query}" 검색 결과를 바로 재생
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text variant="titleMedium" style={styles.sectionTitle}>애니 카테고리</Text>
        <Text variant="bodySmall" style={styles.sectionHint}>누르면 자동 검색</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {MEDIA_CATEGORIES.map((category) => {
          const active = selectedCategory === category;
          return (
            <Pressable
              key={category}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                variant="labelLarge"
                style={[styles.categoryChipText, active && styles.categoryChipTextActive]}
              >
                {category}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={PALETTE.accentSoft} />
          <Text variant="bodyMedium" style={styles.loadingText}>유튜브 검색 결과를 불러오는 중</Text>
        </View>
      ) : error ? (
        <View style={styles.errorCard}>
          <MaterialCommunityIcons name="alert-circle-outline" size={22} color="#FF8E8E" />
          <Text variant="bodyMedium" style={styles.errorText}>{error}</Text>
        </View>
      ) : selectedVideo ? (
        <>
          <View style={styles.playerStage}>
            <View style={styles.playerFrame}>
              {selectedVideo.isShort ? (
                <ImageBackground
                  source={{ uri: selectedVideo.thumbnail }}
                  style={styles.shortHero}
                  imageStyle={styles.shortHeroImage}
                >
                  <View style={styles.shortHeroShade}>
                    <View style={styles.shortHeroBadge}>
                      <MaterialCommunityIcons name="lightning-bolt" size={14} color="#FFFFFF" />
                      <Text variant="labelMedium" style={styles.shortHeroBadgeText}>SHORTS PREVIEW</Text>
                    </View>
                    <Pressable style={styles.shortHeroButton} onPress={() => openInYouTube(selectedVideo)}>
                      <MaterialCommunityIcons name="youtube" size={18} color="#1C120F" />
                      <Text variant="labelLarge" style={styles.shortHeroButtonText}>유튜브에서 보기</Text>
                    </Pressable>
                  </View>
                </ImageBackground>
              ) : (
                <WebView
                  source={{ html: buildPlayerHtml(selectedVideo.videoId) }}
                  style={styles.webview}
                  javaScriptEnabled
                  domStorageEnabled
                  allowsInlineMediaPlayback
                  allowsFullscreenVideo
                  mediaPlaybackRequiresUserAction={false}
                  originWhitelist={['*']}
                  mixedContentMode="always"
                />
              )}
            </View>
            <View style={styles.playerTopOverlay}>
              <View style={styles.liveBadge}>
                <MaterialCommunityIcons name="youtube" size={16} color="#FFFFFF" />
                <Text variant="labelMedium" style={styles.liveBadgeText}>
                  {selectedVideo.isShort ? 'Shorts Preview' : 'YouTube Player'}
                </Text>
              </View>
            </View>
            <View style={styles.playerBottomOverlay}>
              <Text variant="labelLarge" style={styles.creatorText}>@{selectedVideo.creator}</Text>
              <Text variant="titleMedium" style={styles.playerTitle}>{selectedVideo.title}</Text>
              <Text variant="bodySmall" style={styles.playerMeta}>
                {[selectedVideo.duration, selectedVideo.views, selectedVideo.published].filter(Boolean).join(' · ') || 'YouTube'}
              </Text>
              {!!selectedVideo.description && !selectedVideo.isShort && (
                <Text variant="bodySmall" numberOfLines={3} style={styles.playerDescription}>
                  {selectedVideo.description}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>쇼츠/짧은 영상</Text>
            <Text variant="bodySmall" style={styles.sectionHint}>검색 결과에서 빠르게 보기</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.shortsRow}
          >
            {shorts.map((video) => {
              const active = selectedVideo.id === video.id;
              return (
                <Pressable
                  key={video.id}
                  style={[styles.shortCard, active && styles.shortCardActive]}
                  onPress={() => setSelectedVideo(video)}
                >
                  <ImageBackground
                    source={{ uri: video.thumbnail }}
                    style={styles.shortThumb}
                    imageStyle={styles.shortThumbImage}
                  >
                    <View style={styles.shortOverlay}>
                      <View style={styles.shortPill}>
                        <MaterialCommunityIcons name="lightning-bolt" size={12} color="#FFFFFF" />
                        <Text variant="labelSmall" style={styles.shortPillText}>SHORT</Text>
                      </View>
                      <MaterialCommunityIcons name="play-circle" size={28} color="#FFFFFF" />
                    </View>
                  </ImageBackground>
                  <Text numberOfLines={2} variant="labelLarge" style={styles.shortTitle}>{video.title}</Text>
                  <Text variant="bodySmall" numberOfLines={1} style={styles.shortCreator}>{video.creator}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>전체 검색 결과</Text>
            <Text variant="bodySmall" style={styles.sectionHint}>썸네일을 누르면 바로 재생</Text>
          </View>
          <View style={styles.list}>
            {features.map((video) => {
              const active = selectedVideo.id === video.id;
              return (
                <Pressable
                  key={video.id}
                  style={[styles.listCard, active && styles.listCardActive]}
                  onPress={() => setSelectedVideo(video)}
                >
                  <ImageBackground
                    source={{ uri: video.thumbnail }}
                    style={styles.listThumb}
                    imageStyle={styles.listThumbImage}
                  >
                    <View style={styles.listThumbShade}>
                      <MaterialCommunityIcons name="play" size={24} color="#FFFFFF" />
                    </View>
                  </ImageBackground>
                  <View style={styles.listBody}>
                    <Text variant="titleSmall" numberOfLines={2} style={styles.listTitle}>{video.title}</Text>
                    <Text variant="labelMedium" numberOfLines={1} style={styles.listCreator}>{video.creator}</Text>
                    <Text variant="bodySmall" numberOfLines={1} style={styles.listMeta}>
                      {[video.duration, video.published, video.views].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : (
        <View style={styles.errorCard}>
          <MaterialCommunityIcons name="youtube" size={22} color="#FF8E8E" />
          <Text variant="bodyMedium" style={styles.errorText}>검색 결과가 없습니다.</Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: PALETTE.bg,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    color: PALETTE.text,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  subtitle: {
    marginTop: 6,
    color: PALETTE.textDim,
  },
  categoryRow: {
    gap: 10,
    paddingBottom: 12,
    marginBottom: 14,
    alignItems: 'center',
  },
  categoryChip: {
    minWidth: 88,
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: PALETTE.panel,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  categoryChipActive: {
    backgroundColor: PALETTE.accent,
    borderColor: PALETTE.accent,
  },
  categoryChipText: {
    color: PALETTE.textDim,
    fontWeight: '700',
  },
  categoryChipTextActive: {
    color: '#1C120F',
  },
  loadingCard: {
    backgroundColor: PALETTE.panel,
    borderRadius: 24,
    paddingVertical: 42,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 20,
  },
  loadingText: {
    color: PALETTE.textDim,
    marginTop: 12,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: PALETTE.errorBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.errorBorder,
  },
  errorText: {
    color: PALETTE.errorText,
    flex: 1,
  },
  playerStage: {
    width: width,
    marginLeft: -18,
    marginRight: -18,
    marginBottom: 22,
    backgroundColor: '#0A0908',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PALETTE.accentMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  liveBadgeText: {
    color: PALETTE.text,
    fontWeight: '800',
  },
  playerTopOverlay: {
    position: 'absolute',
    top: 18,
    left: 18,
    right: 18,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  playerBottomOverlay: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
    paddingTop: 36,
  },
  creatorText: {
    color: PALETTE.accentSoft,
    fontWeight: '800',
  },
  playerFrame: {
    width: '100%',
    height: width * 1.62,
    overflow: 'hidden',
    backgroundColor: '#0A0908',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0A0908',
  },
  shortHero: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  shortHeroImage: {
    resizeMode: 'cover',
  },
  shortHeroShade: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 18,
    backgroundColor: 'rgba(7, 7, 7, 0.34)',
  },
  shortHeroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PALETTE.overlayStrong,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  shortHeroBadgeText: {
    color: PALETTE.text,
    fontWeight: '800',
  },
  shortHeroButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PALETTE.accentSoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  shortHeroButtonText: {
    color: '#1C120F',
    fontWeight: '900',
  },
  playerTitle: {
    marginTop: 8,
    color: PALETTE.text,
    fontWeight: '800',
  },
  playerMeta: {
    marginTop: 6,
    color: PALETTE.accentSoft,
  },
  playerDescription: {
    marginTop: 8,
    color: '#EEE4D8',
    lineHeight: 19,
    maxWidth: '88%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: PALETTE.text,
    fontWeight: '800',
  },
  sectionHint: {
    color: PALETTE.textMuted,
  },
  shortsRow: {
    paddingBottom: 8,
    gap: 12,
    marginBottom: 18,
  },
  shortCard: {
    width: 142,
    backgroundColor: PALETTE.panel,
    borderRadius: 18,
    padding: 8,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  shortCardActive: {
    borderColor: PALETTE.accentSoft,
    backgroundColor: PALETTE.panelSoft,
    transform: [{ translateY: -2 }],
  },
  shortThumb: {
    height: 220,
    justifyContent: 'space-between',
    padding: 10,
  },
  shortThumbImage: {
    borderRadius: 14,
  },
  shortOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  shortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PALETTE.overlayStrong,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  shortPillText: {
    color: PALETTE.text,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  shortTitle: {
    color: PALETTE.text,
    marginTop: 10,
    minHeight: 40,
  },
  shortCreator: {
    color: PALETTE.textMuted,
    marginTop: 4,
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 18,
  },
  listCard: {
    width: GRID_CARD_WIDTH,
    backgroundColor: PALETTE.panel,
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  listCardActive: {
    borderColor: PALETTE.accent,
    backgroundColor: PALETTE.panelSoft,
  },
  listThumb: {
    width: '100%',
    height: GRID_CARD_WIDTH * 1.38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listThumbImage: {
    borderRadius: 12,
  },
  listThumbShade: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: PALETTE.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listBody: {
    paddingTop: 10,
  },
  listTitle: {
    color: PALETTE.text,
    fontWeight: '800',
  },
  listCreator: {
    color: PALETTE.accentSoft,
    marginTop: 6,
  },
  listMeta: {
    color: PALETTE.textMuted,
    marginTop: 4,
  },
});
