import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Surface, Chip, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { KujiCard } from '../components/KujiCard';
import { fetchLineup, buildScheduleByDate } from '../features/kuji-lineup/kujiLineup.api';
import type { ScheduleByDate } from '../features/kuji-lineup/kujiLineup.api';
import type { ScheduleEntry } from '../features/kuji-lineup/kujiLineup.types';
import { buildOriginalLabel, translateKujiTitle, translateReleaseLabel } from '../features/kuji-lineup/translateKujiText';
import { communityApi } from '../features/community/community.api';
import type { CommunityFeedItem, CommunityOverview, CommunityPost } from '../features/community/community.types';

dayjs.locale('ko');

const { width } = Dimensions.get('window');

const CALENDAR_THEME = {
  backgroundColor: 'transparent',
  calendarBackground: 'transparent',
  textSectionTitleColor: '#94A3B8',
  textSectionTitleDisabledColor: '#CBD5E1',
  selectedDayBackgroundColor: '#151926',
  selectedDayTextColor: '#FFFFFF',
  todayTextColor: '#D4AF37',
  dayTextColor: '#1E293B',
  textDisabledColor: '#CBD5E1',
  dotColor: '#D4AF37',
  selectedDotColor: '#FFFFFF',
  arrowColor: '#D4AF37',
  monthTextColor: '#1E293B',
  textDayFontWeight: '600' as const,
  textMonthFontWeight: '900' as const,
  textDayHeaderFontWeight: '700' as const,
};

function feedIconName(item: CommunityFeedItem): string {
  if (item.type === 'post_created') return 'post-outline';
  if (item.type === 'post_updated') return 'pencil-outline';
  if (item.type === 'post_deleted') return 'delete-outline';
  if (item.type === 'lineup_alert') return 'calendar-star';
  return 'rss';
}

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isWide = width >= 420;

  const [year, setYear] = useState(() => dayjs().year());
  const [month, setMonth] = useState(() => dayjs().month() + 1);
  const [scheduleByDate, setScheduleByDate] = useState<ScheduleByDate>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(() => dayjs().format('YYYY-MM-DD'));
  const [overview, setOverview] = useState<CommunityOverview | null>(null);

  const loadMonth = useCallback(async (y: number, m: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLineup(y, m);
      setScheduleByDate(buildScheduleByDate(data));
    } catch (e) {
      setScheduleByDate({});
      setError(e instanceof Error ? e.message : '스케줄을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOverview = useCallback(async () => {
    try {
      const data = await communityApi.getOverview(6, 10);
      setOverview(data);
    } catch {
      setOverview(null);
    }
  }, []);

  useEffect(() => {
    loadMonth(year, month);
  }, [year, month, loadMonth]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const currentMonthKey = useMemo(
    () => `${year}-${String(month).padStart(2, '0')}-01`,
    [year, month],
  );

  const markedDates = useMemo(() => {
    const marked: Record<string, { marked: boolean; dotColor: string; selected?: boolean }> = {};
    for (const date of Object.keys(scheduleByDate)) {
      marked[date] = {
        marked: true,
        dotColor: '#F9D71C',
        ...(selectedDate === date && { selected: true }),
      };
    }
    if (selectedDate && !marked[selectedDate]) {
      marked[selectedDate] = { marked: false, dotColor: '#F9D71C', selected: true };
    }
    return marked;
  }, [scheduleByDate, selectedDate]);

  const onMonthChange = useCallback((nextMonth: { year: number; month: number }) => {
    setYear(nextMonth.year);
    setMonth(nextMonth.month);
    setSelectedDate(null);
  }, []);

  const selectedEntries: ScheduleEntry[] = selectedDate ? scheduleByDate[selectedDate] || [] : [];
  const recentPosts: CommunityPost[] = overview?.posts ?? [];
  const feedItems: CommunityFeedItem[] = overview?.feed ?? [];

  const openPost = useCallback(
    (postId: number) => {
      navigation.navigate('Community', {
        screen: 'CommunityDetail',
        params: { id: postId },
      });
    },
    [navigation],
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 18 }]}
      >
        <View style={styles.header}>
          <Text style={[styles.headerEyebrow, { color: theme.colors.secondary }]}>MAIN</Text>
          <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>KOOJI HUB</Text>
          <Text style={styles.headerSubtitle}>
            발매 일정, 게시판 글 목록, 실시간 피드를 한 화면에서 보는 메인 포털입니다.
          </Text>
        </View>

        <Surface style={styles.portalHero} elevation={3}>
          <View style={styles.portalGlowTop} />
          <View style={styles.portalGlowBottom} />
          <View style={styles.portalHeroTop}>
            <View>
              <Text style={styles.portalEyebrow}>HOME OVERVIEW</Text>
              <Text style={styles.portalTitle}>오늘의 흐름</Text>
              <Text style={styles.portalBody}>
                최근 게시글과 실시간 피드를 먼저 보고, 아래에서 발매 캘린더와 일정 상세를 바로 확인할 수 있습니다.
              </Text>
            </View>
            <View style={styles.portalIconWrap}>
              <MaterialCommunityIcons name="view-dashboard-outline" size={44} color="#F8E7A0" />
            </View>
          </View>
          <View style={styles.portalStats}>
            <View style={styles.portalStatCard}>
              <Text style={styles.portalStatLabel}>게시글</Text>
              <Text style={styles.portalStatValue}>{overview?.stats.postCount ?? 0}</Text>
            </View>
            <View style={styles.portalStatCard}>
              <Text style={styles.portalStatLabel}>실시간 피드</Text>
              <Text style={styles.portalStatValue}>{overview?.stats.feedCount ?? 0}</Text>
            </View>
            <View style={styles.portalStatCard}>
              <Text style={styles.portalStatLabel}>선택 일정</Text>
              <Text style={styles.portalStatSmall}>{selectedDate ? dayjs(selectedDate).format('M월 D일') : '없음'}</Text>
            </View>
          </View>
        </Surface>

        <View style={[styles.portalRow, isWide && styles.portalRowWide]}>
          <Surface style={[styles.portalPanel, isWide && styles.portalPanelWide]} elevation={1}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>커뮤니티</Text>
              <Chip compact style={styles.headerChip} textStyle={styles.headerChipText}>최신 글</Chip>
            </View>

            {recentPosts.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="post-outline" size={34} color="#D4AF37" />
                <Text style={styles.emptyText}>게시글이 아직 없습니다</Text>
              </View>
            ) : (
              recentPosts.map((post, index) => (
                <TouchableOpacity key={post.id} style={styles.boardRow} activeOpacity={0.78} onPress={() => openPost(post.id)}>
                  <Text style={styles.boardIndex}>{String(index + 1).padStart(2, '0')}</Text>
                  <View style={styles.boardBody}>
                    <Text numberOfLines={1} style={styles.boardTitle}>{post.title}</Text>
                    <Text numberOfLines={1} style={styles.boardMeta}>
                      {post.author} · {dayjs(post.createdAt).format('MM.DD HH:mm')}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={18} color="#7C8799" />
                </TouchableOpacity>
              ))
            )}
          </Surface>

          <Surface style={[styles.portalPanel, isWide && styles.portalPanelWide]} elevation={1}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>실시간 피드</Text>
              <Chip compact style={styles.headerChip} textStyle={styles.headerChipText}>LIVE</Chip>
            </View>

            {feedItems.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="rss" size={34} color="#D4AF37" />
                <Text style={styles.emptyText}>표시할 피드가 없습니다</Text>
              </View>
            ) : (
              feedItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.feedRow}
                  activeOpacity={item.postId ? 0.78 : 1}
                  disabled={!item.postId}
                  onPress={() => item.postId && openPost(item.postId)}
                >
                  <View style={styles.feedIconWrap}>
                    <MaterialCommunityIcons name={feedIconName(item)} size={16} color="#B08A1E" />
                  </View>
                  <View style={styles.feedBody}>
                    <Text numberOfLines={1} style={styles.feedTitle}>{item.title}</Text>
                    <Text numberOfLines={2} style={styles.feedMeta}>
                      {item.body}
                    </Text>
                  </View>
                  <Text style={styles.feedTime}>{dayjs(item.createdAt).format('HH:mm')}</Text>
                </TouchableOpacity>
              ))
            )}
          </Surface>
        </View>

        <Surface style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]} elevation={1}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>발매 캘린더</Text>
            <Chip compact style={[styles.chip, { backgroundColor: theme.colors.surfaceVariant }]} textStyle={styles.chipText}>
              {year}년 {month}월
            </Chip>
          </View>
          <View style={styles.calendarContainer}>
            <Calendar
              current={currentMonthKey}
              onMonthChange={onMonthChange}
              markedDates={markedDates}
              onDayPress={(day) => setSelectedDate(day.dateString)}
              theme={CALENDAR_THEME}
              markingType="dot"
              firstDay={0}
              enableSwipeMonths
              hideExtraDays
            />
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            )}
          </View>
        </Surface>

        <Surface style={[styles.sectionCard, styles.lastCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]} elevation={1}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedDate ? `${dayjs(selectedDate).format('M월 D일')} 발매 일정` : '발매 일정'}
            </Text>
            {selectedDate && <MaterialCommunityIcons name="calendar-check" size={22} color={theme.colors.secondary} />}
          </View>

          {error && (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#FF7A7A" style={styles.errorIcon} />
              <View>
                <Text style={styles.errorText}>{error}</Text>
                <Text style={styles.hintText}>서버 연결을 확인해주세요.</Text>
              </View>
            </View>
          )}

          <View style={styles.list}>
            {!selectedDate ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="calendar-search" size={56} color="#333333" />
                <Text style={styles.emptyText}>캘린더에서 날짜를 선택하세요</Text>
              </View>
            ) : selectedEntries.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="package-variant" size={56} color="#333333" />
                <Text style={styles.emptyText}>이 날짜에 발매 일정이 없습니다</Text>
              </View>
            ) : (
              selectedEntries.map((entry, index) => {
                const translatedTitle = entry.item.translatedTitle || translateKujiTitle(entry.item.title);
                const translatedLabel =
                  (entry.type === 'store' ? entry.item.translatedStoreDate : entry.item.translatedOnlineDate) ||
                  translateReleaseLabel(entry.label);
                const saleType = entry.type === 'store' ? '오프라인 매장 판매' : '온라인 판매';
                const rawTitleCaption =
                  translatedTitle !== entry.item.title ? `원문 제목: ${entry.item.title}` : undefined;
                const rawLabelCaption =
                  translatedLabel !== entry.label ? buildOriginalLabel(entry.label) : undefined;
                const caption = [rawTitleCaption, rawLabelCaption].filter(Boolean).join('\n') || undefined;

                return (
                  <KujiCard
                    key={`${entry.item.slug}-${entry.type}-${index}`}
                    title={translatedTitle}
                    subtitle={[saleType, translatedLabel].filter(Boolean).join(' · ')}
                    caption={caption}
                  />
                );
              })
            )}
          </View>
        </Surface>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F1E8',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerEyebrow: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  headerTitle: {
    marginTop: 6,
    fontWeight: '900',
    fontSize: 32,
    letterSpacing: -1.5,
  },
  headerSubtitle: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
  },
  portalHero: {
    overflow: 'hidden',
    marginHorizontal: 20,
    borderRadius: 30,
    padding: 22,
    backgroundColor: '#151926',
  },
  portalGlowTop: {
    position: 'absolute',
    top: -46,
    right: -14,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#263041',
  },
  portalGlowBottom: {
    position: 'absolute',
    bottom: -72,
    left: -30,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#1E2533',
  },
  portalHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  portalEyebrow: {
    color: '#F8E7A0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  portalTitle: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  portalBody: {
    marginTop: 12,
    color: '#CBD5E1',
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 260,
  },
  portalIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalStats: {
    marginTop: 24,
    flexDirection: 'row',
    gap: 10,
  },
  portalStatCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  portalStatLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  portalStatValue: {
    marginTop: 6,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  portalStatSmall: {
    marginTop: 7,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  portalRow: {
    marginTop: 18,
    paddingHorizontal: 20,
    gap: 16,
  },
  portalRowWide: {
    flexDirection: 'row',
  },
  portalPanel: {
    borderRadius: 26,
    padding: 18,
    backgroundColor: '#FFFDF8',
  },
  portalPanelWide: {
    flex: 1,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  panelTitle: {
    color: '#151926',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerChip: {
    backgroundColor: '#F4EDDC',
  },
  headerChipText: {
    color: '#8B6B12',
    fontWeight: '800',
  },
  boardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE7D8',
  },
  boardIndex: {
    width: 28,
    color: '#C59717',
    fontSize: 12,
    fontWeight: '900',
  },
  boardBody: {
    flex: 1,
  },
  boardTitle: {
    color: '#141B2D',
    fontSize: 15,
    fontWeight: '900',
  },
  boardMeta: {
    marginTop: 4,
    color: '#7C8799',
    fontSize: 12,
    fontWeight: '700',
  },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE7D8',
  },
  feedIconWrap: {
    marginTop: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F8F3E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedBody: {
    flex: 1,
  },
  feedTitle: {
    color: '#141B2D',
    fontSize: 14,
    fontWeight: '900',
  },
  feedMeta: {
    marginTop: 4,
    color: '#5B6472',
    fontSize: 12,
    lineHeight: 18,
  },
  feedTime: {
    color: '#9AA3B2',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  sectionCard: {
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: 18,
    padding: 24,
    borderWidth: 1,
  },
  lastCard: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#1E293B',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: -0.5,
  },
  chip: {
    borderRadius: 10,
  },
  chipText: {
    color: '#D4AF37',
    fontWeight: '800',
    fontSize: 12,
  },
  calendarContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  errorIcon: {
    marginRight: 12,
  },
  errorText: {
    color: '#B91C1C',
    fontWeight: '800',
  },
  hintText: {
    color: '#7F1D1D',
    marginTop: 3,
  },
  list: {
    gap: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  emptyText: {
    marginTop: 12,
    color: '#5B6472',
    fontWeight: '700',
    textAlign: 'center',
  },
});
