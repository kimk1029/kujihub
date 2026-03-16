import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface SectionTitleProps {
  title: string;
}

export function SectionTitle({ title }: SectionTitleProps) {
  const theme = useTheme();
  
  return (
    <View style={styles.container}>
      <View style={[styles.accent, { backgroundColor: theme.colors.secondary }]} />
      <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
        {title.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 20,
  },
  accent: {
    width: 4,
    height: 18,
    marginRight: 10,
  },
  title: {
    fontWeight: '900',
    letterSpacing: 2,
  },
});
