import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { t } from '@/shared/i18n';

type Props = {
  showSymbols: boolean;
  onToggleSymbols: () => void;
  onOpenSettings: () => void;
};

export default function TariffTopBar({ showSymbols, onToggleSymbols, onOpenSettings }: Props) {
  const { colors } = useAppTheme();
  const { lang } = useLang();
  const isRTL = lang === 'he';

  const label = showSymbols
    ? t(lang, 'tariff.header.symbolMode.symbols')
    : t(lang, 'tariff.header.symbolMode.names');

  const accent = colors.text;

  return (
    <View
      style={[
        styles.container,
        {
          flexDirection: isRTL ? 'row' : 'row-reverse',
          backgroundColor: colors.card,
        },
      ]}
    >
      <Pressable
        onPress={onOpenSettings}
        style={({ pressed }) => [
          styles.iconButton,
          {
            opacity: pressed ? 0.6 : 1,
          },
        ]}
      >
        <Ionicons name="settings-outline" size={22} color={colors.text} />
      </Pressable>

      <View style={styles.centerArea}>
        <Pressable
          onPress={onToggleSymbols}
          style={({ pressed }) => [
            styles.toggleChip,
            {
              backgroundColor: pressed ? accent + '33' : accent + '22',
              borderColor: accent,
            },
          ]}
        >
          <Text style={[styles.toggleText, { color: colors.text }]}>
            {label}
          </Text>
        </Pressable>
      </View>

      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
  },
  toggleChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  toggleText: {
    fontSize: 14,
  },
  spacer: {
    width: 40,
  },
});
