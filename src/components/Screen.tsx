import React from 'react';
import { ScrollView, View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
}

export function Screen({ children, scroll = true, style }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const containerStyle = [
    styles.container,
    {
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      backgroundColor: theme.colors.background,
    },
    style,
  ];

  if (scroll) {
    return (
      <ScrollView
        style={containerStyle}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[containerStyle, styles.content]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 18,
  },
});
