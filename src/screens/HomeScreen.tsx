import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text, Surface, Chip, useTheme } from 'react-native-paper';
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

dayjs.locale('ko');

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
  const [selectedDate, setSelectedDate] = useState<string | null>(() => dayjs().format('YYYY-MM-DD'));

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

  useEffect(() => {
    loadMonth(year, month);
  }, [year, month, loadMonth]);

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

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 18 }]}>
        <View style={styles.header}>
          <Text style={[styles.headerEyebrow, { color: theme.colors.secondary }]}>HOME</Text>
          <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>KOOJI HUB</Text>
          <Text style={styles.headerSubtitle}>발매 일정만 빠르게 확인할 수 있는 홈 화면입니다.</Text>
        </View>

        <Surface style={styles.hero} elevation={1}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>MONTHLY LINEUP</Text>
              <Text style={styles.heroTitle}>{month}월 발매 캘린더</Text>
            </View>
            <MaterialCommunityIcons name="calendar-month-outline" size={28} color="#D4AF37" />
          </View>
          <Text style={styles.heroBody}>달력은 작게 두고, 선택한 날짜의 발매 정보를 아래에서 바로 보도록 구성했습니다.</Text>
        </Surface>

        <Surface style={[styles.calendarCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]} elevation={1}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>달력</Text>
            <Chip compact style={[styles.chip, { backgroundColor: theme.colors.surfaceVariant }]} textStyle={styles.chipText}>
              {year}년 {month}월
            </Chip>
          </View>

          <View style={styles.calendarWrap}>
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

        <Surface style={[styles.listCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]} elevation={1}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedDate ? `${dayjs(selectedDate).format('M월 D일')} 발매 일정` : '발매 일정'}
            </Text>
            {selectedDate && <MaterialCommunityIcons name="calendar-check" size={20} color={theme.colors.secondary} />}
          </View>

          {error && (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#FF7A7A" style={styles.errorIcon} />
              <View>
                <Text style={styles.errorText}>{error}</Text>
                <Text style={styles.hintText}>서버 연결을 확인해주세요.</Text>
              </View>
            </View>
          )}

          <View style={styles.list}>
            {!selectedDate ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="calendar-search" size={44} color="#333333" />
                <Text style={styles.emptyText}>달력에서 날짜를 선택하세요</Text>
              </View>
            ) : selectedEntries.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="package-variant" size={44} color="#333333" />
                <Text style={styles.emptyText}>이 날짜에 발매 일정이 없습니다</Text>
              </View>
            ) : (
              selectedEntries.map((entry, index) => {
                const translatedTitle = entry.item.translatedTitle || translateKujiTitle(entry.item.title);
                const translatedLabel =
                  (entry.type === 'store' ? entry.item.translatedStoreDate : entry.item.translatedOnlineDate) ||
                  translateReleaseLabel(entry.label);
                const saleType = entry.type === 'store' ? '오프라인 매장 판매' : '온라인 판매';
                const rawTitleCaption = translatedTitle !== entry.item.title ? `원문 제목: ${entry.item.title}` : undefined;
                const rawLabelCaption = translatedLabel !== entry.label ? buildOriginalLabel(entry.label) : undefined;
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
    backgroundColor: '#F5F2EA',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  headerTitle: {
    marginTop: 6,
    fontWeight: '900',
    fontSize: 30,
    letterSpacing: -1.2,
  },
  headerSubtitle: {
    marginTop: 8,
    color: '#667085',
    fontSize: 14,
    lineHeight: 20,
  },
  hero: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#151926',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    color: '#F8E7A0',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  heroTitle: {
    marginTop: 8,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  heroBody: {
    marginTop: 10,
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 19,
  },
  calendarCard: {
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  listCard: {
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#1E293B',
    fontWeight: '900',
    fontSize: 17,
  },
  chip: {
    borderRadius: 8,
  },
  chipText: {
    color: '#8B6B12',
    fontWeight: '800',
    fontSize: 12,
  },
  calendarWrap: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    transform: [{ scale: 0.9 }],
    marginHorizontal: -16,
    marginVertical: -18,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  emptyText: {
    marginTop: 10,
    color: '#667085',
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  errorIcon: {
    marginRight: 10,
  },
  errorText: {
    color: '#B91C1C',
    fontWeight: '800',
  },
  hintText: {
    color: '#7F1D1D',
    marginTop: 2,
  },
});
