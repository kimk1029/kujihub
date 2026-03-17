import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Dimensions,
  Image,
} from 'react-native';
import { Text, Surface, Chip, useTheme, Avatar } from 'react-native-paper';
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
import type { CommunityPost } from '../features/community/community.types';

dayjs.locale('ko');

const { width } = Dimensions.get('window');

const BANNERS = [
  { id: 'b1', title: '이번 주 라인업', subtitle: '신규 발매 일정을 한 눈에 확인', icon: 'calendar-star', colors: ['#FFFFFF', '#F1F5F9'] }, 
  { id: 'b2', title: '쿠지 제보 리워드', subtitle: '현장 제보 작성하고 포인트 받기', icon: 'gift', colors: ['#FFFBEB', '#FEF3C7'] }, 
  { id: 'b3', title: '커뮤니티 핫토픽', subtitle: '인기 게시글을 빠르게 탐색', icon: 'fire', colors: ['#FEF2F2', '#FEE2E2'] }, 
];

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

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [year, setYear] = useState(() => dayjs().year());
  const [month, setMonth] = useState(() => dayjs().month() + 1);
  const [scheduleByDate, setScheduleByDate] = useState<ScheduleByDate>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [popularPosts, setPopularPosts] = useState<CommunityPost[]>([]);

  const loadMonth = useCallback(async (y: number, m: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLineup(y, m);
      const schedule = buildScheduleByDate(data);
      setScheduleByDate(schedule);
    } catch (e) {
      setScheduleByDate({});
      setError(e instanceof Error ? e.message : '스케줄을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMonth(year, month);
  }, [year, month, loadMonth]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const posts = await communityApi.getList();
        if (cancelled) return;
        setPopularPosts(posts.slice(0, 5));
      } catch {
        if (cancelled) return;
        setPopularPosts([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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

  const onMonthChange = useCallback(
    (nextMonth: { year: number; month: number }) => {
      setYear(nextMonth.year);
      setMonth(nextMonth.month);
      setSelectedDate(null);
    },
    [],
  );

  const selectedEntries: ScheduleEntry[] = selectedDate
    ? scheduleByDate[selectedDate] || []
    : [];

  const onBannerScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const w = e.nativeEvent.layoutMeasurement.width;
    const idx = Math.round(x / w);
    setBannerIndex(Math.max(0, Math.min(BANNERS.length - 1, idx)));
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>KOOJI HUB</Text>
              <Text style={styles.headerSubtitle}>Ichiban Kuji radar</Text>
            </View>
            <TouchableOpacity style={[styles.notificationBtn, { backgroundColor: theme.colors.surface }]}>
              <MaterialCommunityIcons name="bell-outline" size={24} color={theme.colors.primary} />
              <View style={[styles.notificationBadge, { borderColor: theme.colors.surface }]} />
            </TouchableOpacity>
          </View>
          
          <Surface style={styles.heroCard} elevation={2}>
            <Image 
              source={require('../assets/images/Gemini_Generated_Image_brlmgybrlmgybrlm.png')} 
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroOverlay}>
              <Text style={styles.heroText}>오늘의 인기 쿠지는?</Text>
            </View>
          </Surface>
        </View>

        <View style={styles.bannerSection}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onBannerScrollEnd}
            decelerationRate="fast"
            snapToInterval={width - 40 + 12}
          >
            {BANNERS.map((banner) => (
              <View key={banner.id} style={[styles.bannerCard, { backgroundColor: banner.colors[0] }]}>
                <View style={styles.bannerContent}>
                  <Text style={[styles.bannerTitle, banner.id === 'b2' && styles.bannerTitleDark]}>
                    {banner.title}
                  </Text>
                  <Text style={[styles.bannerSubtitle, banner.id === 'b2' && styles.bannerSubtitleDark]}>
                    {banner.subtitle}
                  </Text>
                </View>
                <View style={styles.bannerIconWrap}>
                  <MaterialCommunityIcons name={banner.icon} size={64} color="rgba(0,0,0,0.1)" />
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.dots}>
            {BANNERS.map((banner, idx) => (
              <View key={banner.id} style={[styles.dot, idx === bannerIndex && [styles.dotActive, { backgroundColor: theme.colors.primary }]]} />
            ))}
          </View>
        </View>

        <Surface style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]} elevation={1}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>발매 캘린더</Text>
            <Chip compact style={[styles.chip, { backgroundColor: theme.colors.surfaceVariant }]} textStyle={styles.chipText}>{year}년 {month}월</Chip>
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

        <Surface style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]} elevation={1}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedDate ? `${dayjs(selectedDate).format('M월 D일')} 일정` : '발매 일정'}
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

        <Surface style={[styles.sectionCard, styles.lastCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]} elevation={1}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleWithIcon}>
              <Text style={styles.sectionTitle}>인기 핫토픽</Text>
              <MaterialCommunityIcons name="fire" size={22} color={theme.colors.primary} style={styles.fireIcon} />
            </View>
            <TouchableOpacity>
              <Text style={[styles.moreText, { color: theme.colors.secondary }]}>더보기</Text>
            </TouchableOpacity>
          </View>

          {popularPosts.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="comment-text-outline" size={56} color="#333333" />
              <Text style={styles.emptyText}>아직 인기 게시물이 없습니다</Text>
            </View>
          ) : (
            popularPosts.map((post, idx) => (
              <TouchableOpacity key={post.id} activeOpacity={0.7} style={styles.postRow}>
                <Text style={[styles.rankText, idx < 3 && [styles.topRankText, { color: theme.colors.secondary }]]}>{idx + 1}</Text>
                <View style={styles.postBody}>
                  <Text numberOfLines={1} style={styles.postTitle}>{post.title}</Text>
                  <Text numberOfLines={1} style={styles.postMeta}>
                    {post.author} · {dayjs(post.createdAt).format('MM.DD')}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#333333" />
              </TouchableOpacity>
            ))
          )}
        </Surface>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontWeight: '900',
    fontSize: 30,
    letterSpacing: -1.5,
  },
  headerSubtitle: {
    color: '#94A3B8',
    marginTop: -2,
    fontWeight: '700',
    fontSize: 14,
    textTransform: 'uppercase',
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E63946',
    borderWidth: 2,
  },
  heroCard: {
    width: '100%',
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  heroText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  bannerSection: {
    marginBottom: 28,
  },
  bannerCard: {
    width: width - 40,
    marginLeft: 20,
    marginRight: 12,
    height: 120,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  bannerContent: {
    flex: 1,
    zIndex: 2,
  },
  bannerTitle: {
    color: '#1E293B',
    fontWeight: '900',
    fontSize: 20,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  bannerTitleDark: {
    color: '#1E293B',
  },
  bannerSubtitle: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 13,
  },
  bannerSubtitleDark: {
    color: '#64748B',
  },
  bannerIconWrap: {
    position: 'absolute',
    right: 10,
    bottom: -15,
    opacity: 0.1,
  },
  dots: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  dotActive: {
    width: 24,
  },
  sectionCard: {
    borderRadius: 24,
    marginHorizontal: 20,
    marginBottom: 20,
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
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fireIcon: {
    marginLeft: 6,
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
  moreText: {
    fontWeight: '800',
    fontSize: 14,
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
    fontSize: 14,
  },
  hintText: {
    color: '#EF4444',
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    minHeight: 100,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    marginTop: 16,
    fontWeight: '700',
    fontSize: 15,
  },
  postRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rankText: {
    width: 32,
    color: '#94A3B8',
    fontWeight: '900',
    fontSize: 18,
  },
  topRankText: {
    // color determined in-line
  },
  postBody: {
    flex: 1,
    paddingRight: 16,
  },
  postTitle: {
    color: '#1E293B',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  postMeta: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 13,
  },
});
