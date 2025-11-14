import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/shared/theme/theme';

type Props = {
  selected: boolean;
  label: string;
  colors: Colors;
  onPress: () => void;
  icon?: string;
  letter?: string;
  width?: number;
};

export default function OptionCard({ selected, label, colors, onPress, icon, letter, width }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor: selected ? colors.tint : colors.border,
          backgroundColor: selected ? colors.tint : colors.card,
          width: width ?? 160,
        },
        pressed ? { opacity: 0.9 } : undefined,
      ]}
      accessibilityRole="button"
    >
      <View style={styles.top}>
        {letter ? (
          <Text style={[styles.letter, { color: selected ? '#fff' : colors.text }]}>{letter}</Text>
        ) : (
          <Ionicons name={(icon ?? 'ellipse-outline') as any} size={28} color={selected ? '#fff' : colors.text} />
        )}
      </View>
      <Text style={[styles.label, { color: selected ? '#fff' : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 140,
    borderRadius: 16,
    borderWidth: 2,
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  top: { height: 50, alignItems: 'center', justifyContent: 'center' },
  letter: { fontSize: 28, fontWeight: '900' },
  label: { marginTop: 10, fontSize: 16, fontWeight: '800', textAlign: 'center' },
});
