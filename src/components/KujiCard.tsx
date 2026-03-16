import React from 'react';
import { Card, Text, useTheme } from 'react-native-paper';
import { StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface KujiCardProps {
  title: string;
  subtitle?: string;
  caption?: string;
  onPress?: () => void;
}

export function KujiCard({ title, subtitle, caption, onPress }: KujiCardProps) {
  const theme = useTheme();
  
  return (
    <Card 
      style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]} 
      onPress={onPress} 
      mode="outlined"
    >
      <View style={styles.cardInner}>
        <View style={[styles.sideAccent, { backgroundColor: theme.colors.primary }]} />
        <Card.Content style={styles.content}>
          <Text variant="titleMedium" style={{ color: '#FFFFFF', fontWeight: '900', letterSpacing: -0.5 }}>{title}</Text>
          {subtitle && (
            <Text variant="bodySmall" style={[styles.subtitle, { color: theme.colors.secondary }]}>
              {subtitle}
            </Text>
          )}
          {caption && (
            <View style={styles.captionContainer}>
              <Text variant="labelSmall" style={[styles.caption, { color: theme.colors.onSurfaceVariant }]}>
                {caption}
              </Text>
            </View>
          )}
        </Card.Content>
        <View style={styles.arrowContainer}>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.outline} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 16, // More modern
    borderWidth: 1.5,
    overflow: 'hidden',
    elevation: 4,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sideAccent: {
    width: 6,
    height: '60%',
    borderRadius: 3,
    marginLeft: 12,
  },
  content: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  subtitle: {
    marginTop: 4,
    fontWeight: '700',
    fontSize: 12,
  },
  captionContainer: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E2433',
  },
  caption: {
    lineHeight: 16,
    opacity: 0.8,
  },
  arrowContainer: {
    paddingRight: 12,
  },
});
