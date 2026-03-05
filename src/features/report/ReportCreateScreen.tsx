import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, TextInput, Chip, Text } from 'react-native-paper';
import { useReportStore } from './report.store';
import type { ReportTag } from './report.store';

const PRESET_TAGS: ReportTag[] = ['완판', 'A상', '라스트원', '혼잡도', '박스상태'];

interface ReportCreateScreenProps {
  onClose: () => void;
}

export function ReportCreateScreen({ onClose }: ReportCreateScreenProps) {
  const [storeName, setStoreName] = useState('');
  const [memo, setMemo] = useState('');
  const [selectedTags, setSelectedTags] = useState<ReportTag[]>([]);
  const addReport = useReportStore((s) => s.addReport);

  const toggleTag = (tag: ReportTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    if (!storeName.trim()) return;
    addReport({
      storeName: storeName.trim(),
      memo: memo.trim() || undefined,
      tags: selectedTags,
    });
    onClose();
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="매장명 *"
        value={storeName}
        onChangeText={setStoreName}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="메모"
        value={memo}
        onChangeText={setMemo}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.input}
      />

      <Text variant="bodyMedium" style={styles.label}>
        태그
      </Text>
      <View style={styles.chips}>
        {PRESET_TAGS.map((tag) => (
          <Chip
            key={tag}
            selected={selectedTags.includes(tag)}
            onPress={() => toggleTag(tag)}
            style={styles.chip}
          >
            {tag}
          </Chip>
        ))}
      </View>

      <View style={styles.actions}>
        <Button mode="outlined" onPress={onClose} style={styles.button}>
          취소
        </Button>
        <Button
          mode="contained"
          onPress={handleSubmit}
          disabled={!storeName.trim()}
          style={styles.button}
        >
          등록
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    marginRight: 4,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    minWidth: 80,
  },
});
