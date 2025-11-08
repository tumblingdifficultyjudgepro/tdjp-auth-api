import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import OptionButton from './OptionButton';

type Colors = { bg: string; text: string; card: string; tint: string; border: string };

export default function RadioGroup({
  title,
  options,
  selectedKey,
  onSelect,
  colors,
  isRTL
}: {
  title: string;
  options: { key: string; label: string }[];
  selectedKey: string;
  onSelect: (k: string) => void;
  colors: Colors;
  isRTL: boolean;
}) {
  return (
    <View style={styles.card}>
      <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={{ gap: 8 }}>
        {options.map(opt => (
          <OptionButton
            key={opt.key}
            label={opt.label}
            selected={selectedKey === opt.key}
            onPress={() => onSelect(opt.key)}
            colors={colors as any}
            dense
            fullWidth
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 160, maxWidth: 360, gap: 8 },
  title: { fontSize: 15, fontWeight: '800' }
});