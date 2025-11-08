import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Mode } from '../types';

type Props = {
  mode: Mode;
  onChange: (m: Mode) => void;
  labels: {
    customTitle: string;
    customDesc: string;
    randomTitle: string;
    randomDesc: string;
  };
  colors: { bg: string; text: string; card: string; tint: string; border: string };
  isRTL: boolean;
};

export default function ModeCards({ mode, onChange, labels, colors, isRTL }: Props) {
  const Card = ({
    selected,
    icon,
    title,
    desc,
    onPress
  }: {
    selected: boolean;
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    desc: string;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: selected ? colors.tint : colors.card,
          borderColor: selected ? colors.tint : colors.border,
          shadowColor: '#000'
        }
      ]}
    >
      <Ionicons name={icon} size={22} color={selected ? colors.bg : colors.text} style={{ marginBottom: 6 }} />
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[
          styles.title,
          { color: selected ? colors.bg : colors.text, textAlign: 'center' }
        ]}
      >
        {title}
      </Text>
      <Text
        numberOfLines={2}
        style={[
          styles.desc,
          {
            color: selected ? colors.bg : colors.text,
            opacity: 0.8,
            textAlign: 'center'
          }
        ]}
      >
        {desc}
      </Text>
    </Pressable>
  );

  return (
    <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <Card
        selected={mode === 'custom'}
        icon="options-outline"
        title={labels.customTitle}
        desc={labels.customDesc}
        onPress={() => onChange('custom')}
      />
      <Card
        selected={mode === 'random'}
        icon="shuffle"
        title={labels.randomTitle}
        desc={labels.randomDesc}
        onPress={() => onChange('random')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 12,
    alignItems: 'stretch',
    justifyContent: 'space-between'
  },
  card: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 96,
    // צל עדין
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  title: { fontSize: 16, fontWeight: '800' },
  desc: { fontSize: 12, lineHeight: 16, marginTop: 2 }
});
