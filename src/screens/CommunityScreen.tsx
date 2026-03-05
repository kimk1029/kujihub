import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Screen } from '../components/Screen';

export function CommunityScreen() {
  return (
    <Screen>
      <View style={styles.placeholder}>
        <Text variant="bodyLarge">커뮤니티</Text>
        <Text variant="bodySmall" style={styles.hint}>
          후기 / 질문 / 정보 글 목록 placeholder
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    padding: 24,
    alignItems: 'center',
  },
  hint: {
    marginTop: 8,
    color: '#666',
  },
});
