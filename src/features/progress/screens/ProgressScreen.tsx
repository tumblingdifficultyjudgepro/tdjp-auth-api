import React from 'react';
import Screen from '@/shared/ui/Screen';
import { useAppTheme } from '@/shared/theme/theme';
import { View, Text } from 'react-native';

export default function ProgressScreen() {
  const { colors } = useAppTheme();
  return (
    <Screen title="Progress">
      <View>
        <Text style={{ color: colors.text }}>Progress content</Text>
      </View>
    </Screen>
  );
}
