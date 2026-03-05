import React from 'react';
import { Card, Text } from 'react-native-paper';
import { StyleSheet } from 'react-native';

interface KujiCardProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
}

export function KujiCard({ title, subtitle, onPress }: KujiCardProps) {
  return (
    <Card style={styles.card} onPress={onPress} mode="elevated">
      <Card.Content>
        <Text variant="titleMedium">{title}</Text>
        {subtitle && (
          <Text variant="bodySmall" style={styles.subtitle}>
            {subtitle}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 8,
  },
  subtitle: {
    marginTop: 4,
    color: '#666',
  },
});
