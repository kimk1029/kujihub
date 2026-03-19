import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { TextInput, Button, ActivityIndicator, Surface, Text, Chip } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Screen } from '../../components/Screen';
import { AppHeader } from '../../components/AppHeader';
import { communityApi } from './community.api';
import type { CommunityStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<CommunityStackParamList, 'CommunityPostForm'>;
type Route = RouteProp<CommunityStackParamList, 'CommunityPostForm'>;

export function CommunityPostFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { width } = useWindowDimensions();
  const editId = route.params?.id;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('익명');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!editId);

  // Responsive values
  const isSmallDevice = width < 375;
  const horizontalPadding = useMemo(() => (width > 600 ? 32 : 20), [width]);
  const heroTitleSize = useMemo(() => (width > 400 ? 30 : 26), [width]);

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    (async () => {
      try {
        const post = await communityApi.getOne(editId);
        if (!cancelled) {
          setTitle(post.title);
          setContent(post.content);
          setAuthor(post.author);
        }
      } catch {
        if (!cancelled) setFetching(false);
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId]);

  const handleSubmit = useCallback(async () => {
    const t = title.trim();
    if (!t) return;
    setLoading(true);
    try {
      if (editId) {
        await communityApi.update(editId, { title: t, content: content.trim(), author: author.trim() });
      } else {
        await communityApi.create({ title: t, content: content.trim(), author: author.trim() || '익명' });
      }
      navigation.goBack();
    } catch {
      setLoading(false);
    }
  }, [editId, title, content, author, navigation]);

  const bodyCount = useMemo(() => content.trim().length, [content]);

  if (fetching) {
    return (
      <Screen scroll={false} style={styles.screen}>
        <AppHeader title={editId ? '글 수정' : '글쓰기'} showBack onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <Surface style={styles.loadingCard} elevation={2}>
            <ActivityIndicator size="large" color="#151926" />
            <Text style={styles.loadingTitle}>게시글 불러오는 중</Text>
          </Surface>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen} contentContainerStyle={{ paddingHorizontal: horizontalPadding }}>
      <AppHeader title={editId ? '글 수정' : '글쓰기'} showBack onBack={() => navigation.goBack()} />

      <Surface style={[styles.heroCard, { padding: isSmallDevice ? 18 : 24 }]} elevation={3}>
        <View style={styles.heroGlowA} />
        <View style={styles.heroGlowB} />
        <Text style={styles.heroEyebrow}>{editId ? 'EDIT POST' : 'NEW POST'}</Text>
        <Text style={[styles.heroTitle, { fontSize: heroTitleSize }]}>{editId ? '기존 글 다듬기' : '새 글 작성하기'}</Text>
        <Text style={styles.heroBody}>
          제목은 짧고 명확하게, 본문은 정보 위주로 정리하는 것이 좋습니다.
        </Text>
        <View style={styles.heroMetaRow}>
          <Chip compact style={styles.heroChip} textStyle={styles.heroChipText}>자유게시판</Chip>
          <Chip compact style={styles.heroChip} textStyle={styles.heroChipText}>{bodyCount.toLocaleString()}자</Chip>
        </View>
      </Surface>

      <Surface style={styles.formCard} elevation={1}>
        <View style={styles.formSectionHeader}>
          <View>
            <Text style={styles.formEyebrow}>EDITOR</Text>
            <Text style={styles.formTitle}>내용 작성</Text>
          </View>
          <MaterialCommunityIcons name="square-edit-outline" size={20} color="#D4AF37" />
        </View>

        <TextInput
          label="제목"
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          style={styles.input}
          placeholder="제목을 입력하세요"
          outlineColor="#DCCFB6"
          activeOutlineColor="#B08A1E"
        />
        <TextInput
          label="작성자"
          value={author}
          onChangeText={setAuthor}
          mode="outlined"
          style={styles.input}
          placeholder="익명"
          outlineColor="#DCCFB6"
          activeOutlineColor="#B08A1E"
        />
        <TextInput
          label="내용"
          value={content}
          onChangeText={setContent}
          mode="outlined"
          multiline
          numberOfLines={8}
          style={[styles.input, styles.contentInput]}
          placeholder="여기에 내용을 입력하세요..."
          outlineColor="#DCCFB6"
          activeOutlineColor="#B08A1E"
        />

        <View style={styles.guideRow}>
          <View style={styles.guidePill}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={14} color="#B08A1E" />
            <Text style={styles.guideText}>제목은 핵심만 간단히!</Text>
          </View>
        </View>
      </Surface>

      <View style={styles.actionRow}>
        <Button mode="contained-tonal" onPress={() => navigation.goBack()} style={styles.cancelButton} contentStyle={styles.buttonContent}>
          취소
        </Button>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={!title.trim()}
          buttonColor="#151926"
          style={styles.submitButton}
          contentStyle={styles.buttonContent}
        >
          {editId ? '수정 완료' : '등록하기'}
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F6F1E8',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 18,
    fontWeight: '900',
  },
  heroCard: {
    overflow: 'hidden',
    marginTop: 18,
    borderRadius: 30,
    paddingVertical: 24,
    backgroundColor: '#151926',
  },
  heroGlowA: {
    position: 'absolute',
    top: -52,
    right: -12,
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: '#253143',
  },
  heroGlowB: {
    position: 'absolute',
    bottom: -76,
    left: -34,
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
    fontWeight: '900',
    letterSpacing: -0.9,
  },
  heroBody: {
    marginTop: 10,
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 22,
  },
  heroMetaRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  heroChip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroChipText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  formCard: {
    marginTop: 16,
    borderRadius: 28,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#FFFDF8',
  },
  formSectionHeader: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formEyebrow: {
    color: '#B08A1E',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  formTitle: {
    marginTop: 2,
    color: '#151926',
    fontSize: 22,
    fontWeight: '900',
  },
  input: {
    marginBottom: 10,
    backgroundColor: '#FFFDF8',
  },
  contentInput: {
    minHeight: 160,
  },
  guideRow: {
    marginTop: 4,
  },
  guidePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F8F3E9',
    alignSelf: 'flex-start',
  },
  guideText: {
    color: '#5B6472',
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    marginBottom: 28,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#ECE7DA',
  },
  submitButton: {
    flex: 1.4,
    borderRadius: 18,
  },
  buttonContent: {
    height: 52,
  },
});
