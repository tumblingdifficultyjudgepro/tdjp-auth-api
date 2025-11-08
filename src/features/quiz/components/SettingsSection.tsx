import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  title: string;
  isRTL: boolean;
  colors: { bg: string; text: string; card: string; tint: string; border: string };
  children: ReactNode;
  variant?: 'card' | 'plain';
};

export default function SettingsSection({ title, isRTL, colors, children, variant = 'plain' }: Props) {
  const wrapStyle =
    variant === 'card'
      ? [styles.card, { backgroundColor: colors.card, borderColor: colors.border }]
      : [styles.plain];
  return (
    <View style={wrapStyle}>
      <Text style={[styles.sectionTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
      <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 12 },
  plain: { paddingVertical: 6, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  row: { gap: 10, flexWrap: 'wrap', alignItems: 'center' }
});
