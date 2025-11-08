import React from 'react';
import Screen from '@/shared/ui/Screen';
import { useAppTheme } from '@/shared/theme/theme';
import { View, Text } from 'react-native';

export default function CalculatorScreen() {
  const { colors } = useAppTheme();
  return (
    <Screen title="Calculator">
      <View>
        <Text style={{ color: colors.text }}>Calculator content</Text>
      </View>
    </Screen>
  );
}
