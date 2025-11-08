import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Colors = { bg: string; text: string; card: string; tint: string; border: string };

export default function StepperField<T extends string | number>({
  title,
  items,
  value,
  onChange,
  colors,
  isRTL,
  width = 140
}: {
  title: string;
  items: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  colors: Colors;
  isRTL: boolean;
  width?: number;
}) {
  const index = Math.max(0, items.findIndex(i => i.key === value));
  const isMin = index <= 0;
  const isMax = index >= items.length - 1;

  const currentLabel = useMemo(() => items[index]?.label ?? '', [items, index]);

  const upBg = withAlpha(colors.tint, 0.12);
  const downBg = withAlpha(colors.tint, 0.12);

  return (
    <View style={[styles.wrap, { width }]}>
      <Text style={[styles.title, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.column}>
        <Pressable
          onPress={() => !isMax && onChange(items[index + 1].key)}
          disabled={isMax}
          style={[
            styles.arrowBtn,
            {
              backgroundColor: isMax ? withAlpha(colors.text, 0.06) : upBg,
              shadowColor: '#000',
            }
          ]}
        >
          <Ionicons name="chevron-up" size={20} color={isMax ? withAlpha(colors.text, 0.35) : colors.text} />
        </Pressable>

        <View style={styles.valueWrap}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[styles.valueText, { color: colors.text }]}
          >
            {currentLabel}
          </Text>
        </View>

        <Pressable
          onPress={() => !isMin && onChange(items[index - 1].key)}
          disabled={isMin}
          style={[
            styles.arrowBtn,
            {
              backgroundColor: isMin ? withAlpha(colors.text, 0.06) : downBg,
              shadowColor: '#000',
            }
          ]}
        >
          <Ionicons name="chevron-down" size={20} color={isMin ? withAlpha(colors.text, 0.35) : colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

function withAlpha(hexOrRgb: string, alpha: number) {
  // מאפשר גם rgb/rgba וגם hex קצר/מלא; fallback ל־rgba צבע טקסט
  if (hexOrRgb.startsWith('rgb')) {
    const parts = hexOrRgb.replace(/rgba?\(|\)|\s/g, '').split(',');
    const [r, g, b] = parts.map(p => parseInt(p, 10)).slice(0, 3);
    const a = Math.min(1, Math.max(0, alpha));
    return `rgba(${isNaN(r) ? 0 : r},${isNaN(g) ? 0 : g},${isNaN(b) ? 0 : b},${a})`;
    }
  // hex -> rgba
  let hex = hexOrRgb.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${Math.min(1, Math.max(0, alpha))})`;
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  title: { fontSize: 15, fontWeight: '800' },

  // תצורה ללא מסגרת: עמודה קטנה עם חץ ↑, ערך גדול, חץ ↓
  column: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },

  arrowBtn: {
    width: 40,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 }
    })
  },

  valueWrap: {
    minWidth: 72,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },

  // מספר גדול, מודגש, ללא מסגרת
  valueText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.2,
    textAlign: 'center'
  }
});