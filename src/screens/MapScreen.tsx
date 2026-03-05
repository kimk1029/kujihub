import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Screen } from '../components/Screen';

export function MapScreen() {
  return (
    <Screen scroll={false}>
      <View style={styles.placeholder}>
        <Text variant="bodyLarge">지도 (MVP 1차 placeholder)</Text>
        <Text variant="bodySmall" style={styles.hint}>
          추후 react-native-maps 연결 예정
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  hint: {
    marginTop: 8,
    color: '#666',
  },
});
