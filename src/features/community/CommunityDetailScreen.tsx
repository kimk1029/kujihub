import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Alert, useWindowDimensions } from 'react-native';
import { Text, ActivityIndicator, Button, Surface, Chip, Avatar, useTheme } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { Screen } from '../../components/Screen';
import { AppHeader } from '../../components/AppHeader';
import { communityApi } from './community.api';
import type { CommunityPost } from './community.types';
import type { CommunityStackParamList } from '../../navigation/types';

dayjs.locale('ko');

type Nav = NativeStackNavigationProp<CommunityStackParamList, 'CommunityDetail'>;
type Route = RouteProp<CommunityStackParamList, 'CommunityDetail'>;

function formatDateLabel(value: string) {
  return dayjs(value).format('YYYY.MM.DD HH:mm');
}

export function CommunityDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { id } = route.params;

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Responsive values
  const isSmallDevice = width < 375;
  const horizontalPadding = useMemo(() => (width > 600 ? 32 : 20), [width]);
  const heroTitleSize = useMemo(() => (width > 400 ? 30 : 24), [width]);

  const fetchPost = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await communityApi.getOne(id);
      setPost(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '글을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleEdit = () => {
    if (post) navigation.navigate('CommunityPostForm', { id: post.id });
  };

  const handleDelete = () => {
    Alert.alert('삭제', '이 글을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await communityApi.remove(id);
            navigation.goBack();
          } catch (e) {
            Alert.alert('오류', e instanceof Error ? e.message : '삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };

  const authorInitial = useMemo(() => (post?.author || '익').slice(0, 1).toUpperCase(), [post?.author]);
  const contentLength = useMemo(() => post?.content.trim().length ?? 0, [post?.content]);
  const isEdited = useMemo(
    () => (post ? dayjs(post.updatedAt).diff(dayjs(post.createdAt), 'minute') >= 1 : false),
    [post],
  );

  if (loading) {
    return (
      <Screen scroll={false} style={styles.screen}>
        <AppHeader title="커뮤니티" showBack onBack={() => navigation.goBack()} />
        <View style={styles.loadingWrap}>
          <Surface style={styles.loadingCard} elevation={2}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.loadingTitle}>게시글을 불러오는 중</Text>
            <Text variant="bodyMedium" style={styles.loadingBody}>조금만 기다리면 상세 내용을 보여줍니다.</Text>
          </Surface>
        </View>
      </Screen>
    );
  }

  if (error || !post) {
    return (
      <Screen scroll={false} style={styles.screen}>
        <AppHeader title="커뮤니티" showBack onBack={() => navigation.goBack()} />
        <View style={styles.loadingWrap}>
          <Surface style={styles.errorCard} elevation={1}>
            <MaterialCommunityIcons name="alert-circle-outline" size={34} color="#EF4444" />
            <Text variant="titleMedium" style={styles.errorTitle}>게시글을 불러오지 못했습니다</Text>
            <Text variant="bodyMedium" style={styles.errorBody}>{error ?? '글을 찾을 수 없습니다.'}</Text>
            <Button mode="contained" onPress={fetchPost} style={styles.retryButton}>
              다시 시도
            </Button>
          </Surface>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen} contentContainerStyle={{ paddingHorizontal: horizontalPadding }}>
      <AppHeader title="커뮤니티" showBack onBack={() => navigation.goBack()} />

      <Surface style={[styles.heroCard, { padding: isSmallDevice ? 18 : 24 }]} elevation={3}>
        <View style={styles.heroBackdropTop} />
        <View style={styles.heroBackdropBottom} />
        <View style={styles.heroBadgeRow}>
          <Chip compact style={styles.heroBadge} textStyle={styles.heroBadgeText}>Community Pick</Chip>
          <View style={styles.heroMetaPill}>
            <MaterialCommunityIcons name="clock-time-four-outline" size={14} color="#F8E7A0" />
            <Text style={styles.heroMetaPillText}>{formatDateLabel(post.createdAt)}</Text>
          </View>
        </View>

        <Text style={[styles.heroTitle, { fontSize: heroTitleSize }]}>{post.title}</Text>
        <Text style={styles.heroSubtitle}>
          쿠지 팬들의 생생한 이야기와 정보를 한 화면에서 확인할 수 있습니다.
        </Text>

        <View style={styles.authorRow}>
          <Avatar.Text size={isSmallDevice ? 40 : 46} label={authorInitial} color="#151926" style={styles.avatar} />
          <View style={styles.authorMeta}>
            <Text style={styles.authorName}>{post.author || '익명'}</Text>
            <Text style={styles.authorSubtext}>
              {isEdited ? `수정됨 · ${formatDateLabel(post.updatedAt)}` : '최초 등록'}
            </Text>
          </View>
        </View>
      </Surface>

      <View style={styles.infoStrip}>
        <Surface style={styles.infoCard} elevation={1}>
          <MaterialCommunityIcons name="file-document-outline" size={16} color="#D4AF37" />
          <Text style={styles.infoLabel}>본문 길이</Text>
          <Text style={styles.infoValue}>{contentLength.toLocaleString()}자</Text>
        </Surface>
        <Surface style={styles.infoCard} elevation={1}>
          <MaterialCommunityIcons name="update" size={16} color="#D4AF37" />
          <Text style={styles.infoLabel}>최근 수정</Text>
          <Text style={styles.infoValue}>{isEdited ? '있음' : '없음'}</Text>
        </Surface>
      </View>

      <Surface style={styles.bodyCard} elevation={1}>
        <View style={styles.bodyHeader}>
          <View>
            <Text style={styles.bodyEyebrow}>POST BODY</Text>
            <Text style={styles.bodyTitle}>본문</Text>
          </View>
          <MaterialCommunityIcons name="post-outline" size={22} color="#D4AF37" />
        </View>

        <Text style={styles.bodyText}>
          {post.content?.trim() || '아직 입력된 본문이 없습니다.'}
        </Text>
      </Surface>

      <View style={styles.actionRow}>
        <Button mode="contained-tonal" onPress={handleEdit} style={styles.editButton} contentStyle={styles.buttonContent}>
          수정하기
        </Button>
        <Button mode="contained" buttonColor="#B91C1C" onPress={handleDelete} style={styles.deleteButton} contentStyle={styles.buttonContent}>
          삭제하기
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F6F1E8',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    width: '100%',
    borderRadius: 28,
    paddingVertical: 34,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: '#FFFDF8',
  },
  loadingTitle: {
    marginTop: 18,
    fontWeight: '800',
    color: '#151926',
  },
  loadingBody: {
    marginTop: 8,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorCard: {
    width: '100%',
    borderRadius: 28,
    paddingVertical: 30,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: '#FFF7F7',
  },
  errorTitle: {
    marginTop: 14,
    fontWeight: '800',
    color: '#111827',
  },
  errorBody: {
    marginTop: 8,
    color: '#6B7280',
    lineHeight: 22,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    borderRadius: 14,
  },
  heroCard: {
    overflow: 'hidden',
    marginTop: 18,
    borderRadius: 32,
    backgroundColor: '#151926',
  },
  heroBackdropTop: {
    position: 'absolute',
    top: -42,
    right: -12,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#263041',
  },
  heroBackdropBottom: {
    position: 'absolute',
    bottom: -74,
    left: -34,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: '#1E2533',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  heroBadge: {
    backgroundColor: '#F8E7A0',
  },
  heroBadgeText: {
    color: '#151926',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroMetaPillText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    marginTop: 18,
    color: '#FFFFFF',
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -0.9,
  },
  heroSubtitle: {
    marginTop: 12,
    color: '#CBD5E1',
    fontSize: 15,
    lineHeight: 24,
  },
  authorRow: {
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#F8E7A0',
  },
  authorMeta: {
    marginLeft: 14,
    flex: 1,
  },
  authorName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  authorSubtext: {
    marginTop: 4,
    color: '#A8B3C7',
    fontSize: 13,
  },
  infoStrip: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  infoCard: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: '#FFFDF8',
  },
  infoLabel: {
    marginTop: 10,
    color: '#7C8799',
    fontSize: 12,
    fontWeight: '700',
  },
  infoValue: {
    marginTop: 4,
    color: '#111827',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  bodyCard: {
    marginTop: 16,
    borderRadius: 28,
    paddingVertical: 22,
    paddingHorizontal: 20,
    backgroundColor: '#FFFDF8',
  },
  bodyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  bodyEyebrow: {
    color: '#B08A1E',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  bodyTitle: {
    marginTop: 5,
    color: '#151926',
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  bodyText: {
    color: '#273244',
    fontSize: 16,
    lineHeight: 28,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    marginBottom: 28,
  },
  editButton: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#ECE7DA',
  },
  deleteButton: {
    flex: 1,
    borderRadius: 18,
  },
  buttonContent: {
    height: 52,
  },
});
