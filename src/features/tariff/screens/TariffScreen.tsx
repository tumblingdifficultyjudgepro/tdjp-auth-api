import React from 'react';
import Screen from '@/shared/ui/Screen';
import { useAppTheme } from '@/shared/theme/theme';
import { View, Text } from 'react-native';

export default function TariffScreen() {
  const { colors } = useAppTheme();
  return (
    <Screen title="Tariff">
      <View>
        <Text style={{ color: colors.text }}>Tariff content</Text>
      </View>
    </Screen>
  );
}
