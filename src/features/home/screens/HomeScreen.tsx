import React from 'react';
import Screen from '@/shared/ui/Screen';
import { useAppTheme } from '@/shared/theme/theme';
import { View, Text } from 'react-native';

export default function HomeScreen() {
  const { colors } = useAppTheme();
  return (
    <Screen title="Home">
      <View>
        <Text style={{ color: colors.text }}>Home content</Text>
      </View>
    </Screen>
  );
}
