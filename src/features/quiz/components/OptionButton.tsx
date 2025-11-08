import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: { bg: string; text: string; card: string; tint: string; border: string };
  dense?: boolean;
  minWidth?: number;
  fullWidth?: boolean; // חדש
};

export default function OptionButton({ label, selected, onPress, colors, dense, minWidth, fullWidth }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.btn,
        dense ? styles.dense : null,
        fullWidth ? styles.fullWidth : null,
        {
          minWidth: fullWidth ? undefined : (minWidth ?? (dense ? 68 : 96)),
          borderColor: colors.border,
          backgroundColor: selected ? colors.tint : colors.card
        }
      ]}
    >
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[
          styles.label,
          dense ? styles.labelDense : null,
          { color: selected ? colors.bg : colors.text }
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  fullWidth: {
    alignSelf: 'stretch'
  },
  dense: {
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center'
  },
  labelDense: {
    fontSize: 14
  }
});
