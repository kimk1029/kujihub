import React from 'react';
import { View } from 'react-native';
import { Screen } from '../components/Screen';
import { SectionTitle } from '../components/SectionTitle';
import { KujiCard } from '../components/KujiCard';
import { EmptyState } from '../components/EmptyState';
import { useReportStore } from '../features/report/report.store';
import dayjs from 'dayjs';

const DUMMY_RELEASES = [
  { title: '이치방쿠지 A상', subtitle: '3/10 발매 · 롯데월드' },
  { title: '가챠 박스', subtitle: '3/12 발매 · 강남점' },
  { title: '한정판 라스트원', subtitle: '3/15 발매 · 홍대입구' },
];

export function HomeScreen() {
  const reports = useReportStore((s) => s.reports);

  return (
    <Screen>
      <SectionTitle title="이번 주 발매" />
      {DUMMY_RELEASES.map((item, i) => (
        <KujiCard key={i} title={item.title} subtitle={item.subtitle} />
      ))}

      <SectionTitle title="최신 제보" />
      {reports.length === 0 ? (
        <EmptyState message="아직 제보가 없습니다. FAB을 눌러 제보해보세요!" />
      ) : (
        reports.map((r) => (
          <KujiCard
            key={r.id}
            title={r.storeName}
            subtitle={`${r.tags.join(', ')} ${r.memo ? `· ${r.memo}` : ''} · ${dayjs(r.createdAt).format('MM/DD HH:mm')}`}
          />
        ))
      )}
    </Screen>
  );
}
