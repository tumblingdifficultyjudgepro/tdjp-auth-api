import React from 'react';
import Screen from '@/shared/ui/Screen';
import { useAppTheme } from '@/shared/theme/theme';
import { View, Text } from 'react-native';

export default function QuizScreen() {
  const { colors } = useAppTheme();
  return (
    <Screen title="Quiz">
      <View>
        <Text style={{ color: colors.text }}>Quiz content</Text>
      </View>
    </Screen>
  );
}
