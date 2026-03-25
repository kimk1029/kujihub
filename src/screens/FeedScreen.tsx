import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput, Keyboard, Pressable, Image } from 'react-native';
import { ActivityIndicator, Surface, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { communityApi } from '../features/community/community.api';
import type { CommunityFeedItem } from '../features/community/community.types';

dayjs.locale('ko');

function iconName(type: string) {
  if (type === 'post_created') return 'post-outline';
  if (type === 'post_updated') return 'pencil-outline';
  if (type === 'post_deleted') return 'delete-outline';
  if (type === 'lineup_alert') return 'calendar-star';
  return 'rss';
}

export function FeedScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<CommunityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // DOS Input & Tags state
  const [inputText, setInputText] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const tags = ['가챠교환', '쿠지현황'];

  const loadFeed = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await communityApi.getFeed(60);
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '피드를 불러올 수 없습니다.');
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleQuickPost = async () => {
    const text = inputText.trim();
    if (!text || isSubmitting) return;

    const finalTitle = selectedTag ? `[${selectedTag}] ${text}` : text;

    setIsSubmitting(true);
    try {
      await communityApi.create({
        title: finalTitle.length > 40 ? finalTitle.substring(0, 40) + '...' : finalTitle,
        content: text,
        author: '익명_CLI',
        category: selectedTag || '자유',
        // In a real scenario, we would upload selectedImage here
      });
      setInputText('');
      setSelectedImage(null);
      Keyboard.dismiss();
      await loadFeed(false);
    } catch (e) {
      console.error('Failed to post from CLI:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!selectedTag) return items;
    return items.filter(item => 
      item.title.includes(`[${selectedTag}]`) || 
      item.body.includes(selectedTag)
    );
  }, [items, selectedTag]);

  const toggleTag = (tag: string) => {
    setSelectedTag(prev => prev === tag ? null : tag);
  };

  const pickImage = () => {
    // Placeholder for image picker integration
    // In actual use, call launchImageLibrary from react-native-image-picker
    // For now, let's toggle a placeholder image to show the UI
    if (selectedImage) {
      setSelectedImage(null);
    } else {
      setSelectedImage('https://via.placeholder.com/150/000000/39FF14?text=CLI_IMG');
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>LIVE FEED</Text>
        <Text style={styles.title}>실시간 피드</Text>
        
        {/* DOS Style Input & Tags */}
        <Surface style={styles.dosContainer} elevation={4}>
          <View style={styles.dosHeader}>
            <View style={styles.dosDot} />
            <Text style={styles.dosHeaderText}>KUJI_TERMINAL_V1.0.EXE</Text>
          </View>
          
          <View style={styles.dosBody}>
            <View style={styles.dosInputRow}>
              <Text style={styles.dosPrompt}>C:\FEED&gt; </Text>
              <TextInput
                ref={inputRef}
                style={styles.dosInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="입력 후 ENTER..."
                placeholderTextColor="#2D5A27"
                selectionColor="#39FF14"
                onSubmitEditing={handleQuickPost}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="send"
                editable={!isSubmitting}
              />
              <Pressable onPress={pickImage} style={styles.dosImagePicker}>
                <MaterialCommunityIcons 
                  name={selectedImage ? "image-check" : "image-plus"} 
                  size={20} 
                  color={selectedImage ? "#39FF14" : "#008F11"} 
                />
              </Pressable>
              {isSubmitting && <ActivityIndicator size="small" color="#39FF14" style={{ marginLeft: 8 }} />}
            </View>

            {/* Image Preview in DOS Style */}
            {selectedImage && (
              <View style={styles.dosImagePreviewContainer}>
                <Text style={styles.dosTagPrompt}>ATTACHED_FILE: </Text>
                <View style={styles.dosImageFrame}>
                  <Image source={{ uri: selectedImage }} style={styles.dosPreviewImage} />
                  <Pressable onPress={() => setSelectedImage(null)} style={styles.dosImageClose}>
                    <Text style={styles.dosCloseText}>[X]</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Retro Tag Selection */}
            <View style={styles.dosTagRow}>
              <Text style={styles.dosTagPrompt}>SELECT_TAG: </Text>
              {tags.map((tag) => (
                <Pressable 
                  key={tag} 
                  onPress={() => toggleTag(tag)}
                  style={({ pressed }) => [
                    styles.dosTagButton,
                    selectedTag === tag && styles.dosTagActive,
                    pressed && { opacity: 0.7 }
                  ]}
                >
                  <Text style={[
                    styles.dosTagText, 
                    selectedTag === tag && styles.dosTagTextActive
                  ]}>
                    {selectedTag === tag ? `[*${tag}]` : `[ ${tag} ]`}
                  </Text>
                </Pressable>
              ))}
              <View style={styles.dosCursor} />
            </View>
          </View>
        </Surface>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#151926" />
        </View>
      ) : error ? (
        <Surface style={styles.errorCard} elevation={0}>
          <Text style={styles.errorText}>{error}</Text>
        </Surface>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadFeed(false);
          }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={item.postId ? 0.8 : 1}
              disabled={!item.postId}
              onPress={() =>
                item.postId &&
                navigation.navigate('Community', {
                  screen: 'CommunityDetail',
                  params: { id: item.postId },
                })
              }
            >
              <Surface style={styles.row} elevation={0}>
                <View style={styles.iconWrap}>
                  <MaterialCommunityIcons name={iconName(item.type)} size={18} color="#8B6B12" />
                </View>
                <View style={styles.body}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowBody}>{item.body}</Text>
                </View>
                <Text style={styles.time}>{dayjs(item.createdAt).format('MM.DD HH:mm')}</Text>
              </Surface>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Surface style={styles.emptyCard} elevation={0}>
              <Text style={styles.emptyText}>
                {selectedTag ? `'${selectedTag}' 태그의 소식이 없습니다.` : '아직 표시할 피드가 없습니다.'}
              </Text>
            </Surface>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F2EA',
  },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  eyebrow: {
    color: '#B08A1E',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: {
    color: '#151926',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginBottom: 16,
  },
  dosContainer: {
    backgroundColor: '#000000',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333333',
  },
  dosHeader: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  dosDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#39FF14',
    opacity: 0.8,
  },
  dosHeaderText: {
    color: '#888888',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  dosBody: {
    padding: 14,
  },
  dosInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dosPrompt: {
    color: '#39FF14',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  dosInput: {
    flex: 1,
    color: '#39FF14',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'monospace',
    padding: 0,
    margin: 0,
  },
  dosImagePicker: {
    padding: 4,
    marginLeft: 8,
  },
  dosImagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dosImageFrame: {
    width: 64,
    height: 64,
    borderWidth: 1,
    borderColor: '#39FF14',
    padding: 2,
    position: 'relative',
  },
  dosPreviewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.8,
  },
  dosImageClose: {
    position: 'absolute',
    top: -8,
    right: -24,
  },
  dosCloseText: {
    color: '#FF5F56',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  dosTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  dosTagPrompt: {
    color: '#008F11',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  dosTagButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  dosTagActive: {
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
  },
  dosTagText: {
    color: '#008F11',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  dosTagTextActive: {
    color: '#39FF14',
    textShadowColor: 'rgba(57, 255, 20, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  dosCursor: {
    width: 8,
    height: 14,
    backgroundColor: '#39FF14',
    marginLeft: 4,
    opacity: 0.8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: 18,
    paddingBottom: 120,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: '#E7E1D6',
    marginBottom: 10,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F4EDDC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  rowTitle: {
    color: '#141B2D',
    fontSize: 15,
    fontWeight: '800',
  },
  rowBody: {
    marginTop: 4,
    color: '#667085',
    fontSize: 13,
    lineHeight: 19,
  },
  time: {
    color: '#98A2B3',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyCard: {
    borderRadius: 12,
    paddingVertical: 32,
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: '#E7E1D6',
    alignItems: 'center',
  },
  emptyText: {
    color: '#667085',
    fontWeight: '700',
  },
  errorCard: {
    marginHorizontal: 18,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#B91C1C',
    fontWeight: '700',
  },
});
