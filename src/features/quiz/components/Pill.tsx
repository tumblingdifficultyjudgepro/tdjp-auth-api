import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  colors: { bg: string; text: string; card: string; tint: string; border: string };
};

export default function Pill({ label, selected, onPress, disabled, colors }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.pill,
        {
          borderColor: colors.border,
          backgroundColor: selected ? colors.tint : colors.card,
          opacity: disabled ? 0.5 : 1
        }
      ]}
    >
      <Text style={{ color: selected ? colors.bg : colors.text, fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1 }
});
