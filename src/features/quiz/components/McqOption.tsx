import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/shared/theme/theme';

type Status = 'idle' | 'correct' | 'wrong';

type Props = {
  selected: boolean;
  label: string;
  labelNode?: React.ReactNode;
  colors: Colors;
  onPress: () => void;
  width?: number;
  minHeight?: number;
  paddingH?: number;
  paddingV?: number;
  borderRadius?: number;
  borderWidth?: number;
  labelSize?: number;
  spacing?: number;
  align?: 'center' | 'stretch';
  status?: Status;
  style?: ViewStyle;
};

export default function McqOption({
  selected,
  label,
  labelNode,
  colors,
  onPress,
  width,
  minHeight = 56,
  paddingH = 14,
  paddingV = 14,
  borderRadius = 16,
  borderWidth = 2,
  labelSize = 16,
  spacing = 12,
  align = 'stretch',
  status = 'idle',
  style,
}: Props) {
  const GREEN = '#22c55e';
  const RED = '#ef4444';

  const borderColor =
    status === 'correct' ? GREEN :
    status === 'wrong'   ? RED   :
    selected ? colors.tint : colors.border;

  const backgroundColor =
    status === 'correct' ? 'rgba(34,197,94,0.08)' :
    status === 'wrong'   ? 'rgba(239,68,68,0.08)' :
    selected ? colors.tint : colors.card;

  const textColor =
    status === 'correct' || status === 'wrong'
      ? colors.text
      : selected
        ? '#fff'
        : colors.text;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      style={({ pressed }) => [
        styles.card,
        {
          minHeight,
          borderRadius,
          borderWidth,
          marginBottom: spacing,
          paddingHorizontal: paddingH,
          paddingVertical: paddingV,
          borderColor,
          backgroundColor,
        },
        width != null ? { width } : align === 'stretch' ? { alignSelf: 'stretch' } : { alignSelf: 'center' },
        pressed ? { opacity: 0.95 } : undefined,
        style,
      ]}
      accessibilityRole="button"
    >
      {labelNode ? (
        <>{labelNode}</>
      ) : (
        <Text numberOfLines={2} style={{ fontSize: labelSize, fontWeight: '700', color: textColor, textAlign: 'center' }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
});
