import React from 'react';
import { Appbar } from 'react-native-paper';

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function AppHeader({ title, showBack, onBack }: AppHeaderProps) {
  return (
    <Appbar.Header>
      {showBack && onBack && (
        <Appbar.BackAction onPress={onBack} />
      )}
      <Appbar.Content title={title} />
    </Appbar.Header>
  );
}
