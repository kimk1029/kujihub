import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
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
  const editId = route.params?.id;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('익명');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!editId);

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
            <Text style={styles.loadingTitle}>게시글 정보를 불러오는 중</Text>
            <Text style={styles.loadingBody}>기존 내용을 편집할 수 있게 준비하고 있습니다.</Text>
          </Surface>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <AppHeader title={editId ? '글 수정' : '글쓰기'} showBack onBack={() => navigation.goBack()} />

      <Surface style={styles.heroCard} elevation={3}>
        <View style={styles.heroGlowA} />
        <View style={styles.heroGlowB} />
        <Text style={styles.heroEyebrow}>{editId ? 'EDIT POST' : 'NEW POST'}</Text>
        <Text style={styles.heroTitle}>{editId ? '기존 글 다듬기' : '새 글 작성하기'}</Text>
        <Text style={styles.heroBody}>
          클리앙식 보드 톤에 맞춰 제목과 요지가 먼저 보이는 글이 잘 읽힙니다. 제목은 짧고 명확하게, 본문은 정보 위주로 정리하면 좋습니다.
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
            <Text style={styles.formTitle}>게시글 입력</Text>
          </View>
          <MaterialCommunityIcons name="square-edit-outline" size={22} color="#D4AF37" />
        </View>

        <TextInput
          label="제목"
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          style={styles.input}
          placeholder="한 줄로 핵심이 보이게 작성하세요"
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
          numberOfLines={10}
          style={[styles.input, styles.contentInput]}
          placeholder="발매 정보, 후기, 질문 내용을 문단별로 정리해보세요"
          outlineColor="#DCCFB6"
          activeOutlineColor="#B08A1E"
        />

        <View style={styles.guideRow}>
          <View style={styles.guidePill}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={16} color="#B08A1E" />
            <Text style={styles.guideText}>제목은 30자 안팎이 읽기 좋습니다</Text>
          </View>
          <View style={styles.guidePill}>
            <MaterialCommunityIcons name="format-paragraph" size={16} color="#B08A1E" />
            <Text style={styles.guideText}>본문은 문단을 나누면 가독성이 좋아집니다</Text>
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
    fontSize: 19,
    fontWeight: '900',
  },
  loadingBody: {
    marginTop: 8,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
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
  heroMetaRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
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
    paddingVertical: 22,
    paddingHorizontal: 18,
    backgroundColor: '#FFFDF8',
  },
  formSectionHeader: {
    marginBottom: 18,
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
    marginTop: 4,
    color: '#151926',
    fontSize: 23,
    fontWeight: '900',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#FFFDF8',
  },
  contentInput: {
    minHeight: 180,
  },
  guideRow: {
    marginTop: 6,
    gap: 10,
  },
  guidePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#F8F3E9',
  },
  guideText: {
    color: '#5B6472',
    fontSize: 13,
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
