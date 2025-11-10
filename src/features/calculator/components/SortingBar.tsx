import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { t } from '@/shared/i18n';
import type { SortKey, SortOrder } from '../types';

type Props = {
  sortKey: SortKey;
  sortOrder: SortOrder;
  onChangeKey: () => void;
  onToggleOrder: () => void;
  isRTL: boolean;
};

export default function SortingBar({ sortKey, sortOrder, onChangeKey, onToggleOrder, isRTL }: Props) {
  const { colors } = useAppTheme();
  const { lang } = useLang();

  const arrow = sortOrder === 'asc' ? 'chevron-up' : 'chevron-down';
  const keyLabel =
    sortKey === 'difficulty'
      ? t(lang, 'calculator.sort.difficulty')
      : sortKey === 'direction'
      ? t(lang, 'calculator.sort.direction')
      : t(lang, 'calculator.sort.usage');

  return (
    <View style={[styles.wrap]}>
      <View style={[styles.sidePack, isRTL ? { right: 0, flexDirection: 'row-reverse' } : { left: 0, flexDirection: 'row' }]}>
        <Pressable onPress={onChangeKey} style={[styles.btn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.btnText, { color: colors.text }]}>{keyLabel}</Text>
        </Pressable>
        <Pressable onPress={onToggleOrder} style={[styles.btn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name={arrow as any} size={18} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const BTN = 40;

const styles = StyleSheet.create({
  wrap: { height: 48, justifyContent: 'center', marginTop: 6, marginBottom: 6 },
  sidePack: { position: 'absolute', alignItems: 'center', gap: 8 },
  btn: { height: BTN, minWidth: 44, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 14, fontWeight: '800' },
});
