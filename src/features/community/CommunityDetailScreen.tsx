import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, ActivityIndicator, Button } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { AppHeader } from '../../components/AppHeader';
import { communityApi } from './community.api';
import type { CommunityPost } from './community.types';
import type { CommunityStackParamList } from '../../navigation/types';
import dayjs from 'dayjs';

type Nav = NativeStackNavigationProp<CommunityStackParamList, 'CommunityDetail'>;
type Route = RouteProp<CommunityStackParamList, 'CommunityDetail'>;

export function CommunityDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { id } = route.params;
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <Screen scroll={false}>
        <AppHeader title="글 보기" showBack onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </Screen>
    );
  }

  if (error || !post) {
    return (
      <Screen scroll={false}>
        <AppHeader title="글 보기" showBack onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <Text variant="bodyLarge" style={styles.errorText}>{error ?? '글을 찾을 수 없습니다.'}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="글 보기" showBack onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>{post.title}</Text>
        <Text variant="bodySmall" style={styles.meta}>
          {post.author} · {dayjs(post.updatedAt).format('YYYY.MM.DD HH:mm')}
        </Text>
        <Text variant="bodyLarge" style={styles.body}>{post.content || '(내용 없음)'}</Text>
        <View style={styles.actions}>
          <Button mode="outlined" onPress={handleEdit} style={styles.btn}>수정</Button>
          <Button mode="outlined" onPress={handleDelete} textColor="#FF4081" style={styles.btn}>삭제</Button>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { color: '#FF4081' },
  content: { paddingBottom: 24 },
  title: { marginBottom: 8 },
  meta: { color: '#666', marginBottom: 16 },
  body: { lineHeight: 24 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  btn: { flex: 1 },
});
