import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
    return () => { cancelled = true; };
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
    } catch (e) {
      setLoading(false);
    }
  }, [editId, title, content, author, navigation]);

  if (fetching) {
    return (
      <Screen scroll={false}>
        <AppHeader title={editId ? '글 수정' : '글쓰기'} showBack onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title={editId ? '글 수정' : '글쓰기'} showBack onBack={() => navigation.goBack()} />
      <View style={styles.form}>
        <TextInput
          label="제목"
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          style={styles.input}
          placeholder="제목을 입력하세요"
        />
        <TextInput
          label="작성자"
          value={author}
          onChangeText={setAuthor}
          mode="outlined"
          style={styles.input}
          placeholder="익명"
        />
        <TextInput
          label="내용"
          value={content}
          onChangeText={setContent}
          mode="outlined"
          multiline
          numberOfLines={6}
          style={[styles.input, styles.contentInput]}
          placeholder="내용을 입력하세요"
        />
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={!title.trim()}
          style={styles.submit}
        >
          {editId ? '수정' : '등록'}
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  form: { paddingBottom: 24 },
  input: { marginBottom: 12 },
  contentInput: { minHeight: 120 },
  submit: { marginTop: 16 },
});
