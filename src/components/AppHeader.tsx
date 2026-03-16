import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function AppHeader({ title, showBack, onBack }: AppHeaderProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header mode="center-aligned" style={{ backgroundColor: 'transparent', height: 60 }}>
        {showBack && onBack && (
          <Appbar.BackAction onPress={onBack} color={theme.colors.onSurface} size={24} />
        )}
        <Appbar.Content 
          title={title} 
          titleStyle={{ 
            fontWeight: '900', 
            color: '#FFFFFF', 
            letterSpacing: -0.5,
            fontSize: 20,
          }} 
        />
      </Appbar.Header>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
});
