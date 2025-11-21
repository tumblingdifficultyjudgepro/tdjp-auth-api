import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';
import AutoShrinkText from './TariffAutoShrinkText';

type DisplaySlot = { id: string; label: string; value: number };

type Props = {
  items: DisplaySlot[];
  direction: 'ltr' | 'rtl';
  titleFontSize: number;
  forceLTR?: boolean;
  forceMirror?: boolean;
  textMaxFont?: number;
  textMinFont?: number;
  maxSlots?: number;
};

const H_LABEL = 56;
const H_VALUE = 28;
const COLOR_VALUE = '#FFC107';
const SLOT_HPAD = 4;

export default function TariffSelectionBar({
  items,
  direction,
  titleFontSize,
  forceLTR,
  forceMirror,
  textMaxFont = 22,
  textMinFont = 10,
  maxSlots = 8,
}: Props) {
  const { colors } = useAppTheme();

  const isDirRTL = direction === 'rtl';
  const layoutRTL = forceLTR ? false : isDirRTL;

  const ordered = useMemo(() => {
    let arr = items;
    if (forceLTR && forceMirror) arr = [...arr].reverse();
    return arr;
  }, [items, forceLTR, forceMirror]);

  const slots = useMemo(() => {
    const out: Array<DisplaySlot | null> = new Array(maxSlots).fill(null);
    const k = Math.min(ordered.length, maxSlots);
    if (layoutRTL) {
      for (let i = 0; i < k; i++) out[maxSlots - 1 - i] = ordered[i];
    } else {
      for (let i = 0; i < k; i++) out[i] = ordered[i];
    }
    return out;
  }, [ordered, layoutRTL, maxSlots]);

  const writing = forceLTR ? 'ltr' : layoutRTL ? 'rtl' : 'ltr';
  const CENTER = { textAlign: 'center' as const };

  const [slotWidths, setSlotWidths] = useState<number[]>(Array(maxSlots).fill(0));
  const onSlotLayout = (idx: number) => (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setSlotWidths(prev => {
      if (prev[idx] === w) return prev;
      const next = [...prev];
      next[idx] = w;
      return next;
    });
  };

  const maxFontText = Math.max(textMinFont, Math.min(textMaxFont, titleFontSize));
  const fixedSymbolFont = Math.max(10, Math.min(titleFontSize, 22));
  const textMode = !forceLTR;

  return (
    <View style={styles.outer}>
      <View style={styles.row}>
        {slots.map((x, idx) => (
          <View
            key={`label_slot_${idx}`}
            style={[styles.slot, { height: H_LABEL, borderColor: colors.border }]}
            onLayout={onSlotLayout(idx)}
          >
            {x ? (
              textMode ? (
                <AutoShrinkText
                  text={x.label}
                  maxFont={maxFontText}
                  minFont={textMinFont}
                  maxLines={3}
                  lineHeightRatio={1.1}
                  maxWidth={slotWidths[idx] || undefined}
                  horizontalPadding={SLOT_HPAD}
                  style={{
                    ...CENTER,
                    fontWeight: '900',
                    color: colors.text,
                    writingDirection: writing,
                  }}
                />
              ) : (
                <Text
                  numberOfLines={3}
                  style={{
                    ...CENTER,
                    fontSize: fixedSymbolFont,
                    lineHeight: Math.round(fixedSymbolFont * 1.1),
                    maxHeight: Math.round(fixedSymbolFont * 1.1) * 3,
                    fontWeight: '900',
                    color: colors.text,
                    writingDirection: writing,
                  }}
                >
                  {x.label}
                </Text>
              )
            ) : (
              <Text
                style={{
                  ...CENTER,
                  fontSize: 18,
                  fontWeight: '900',
                  color: colors.text,
                  writingDirection: writing,
                }}
              >
                —
              </Text>
            )}
          </View>
        ))}
      </View>

      <View style={[styles.row, { marginTop: 6 }]}>
        {slots.map((x, idx) => (
          <View
            key={`value_slot_${idx}`}
            style={[styles.slot, styles.valueSlot, { height: H_VALUE, borderColor: colors.border }]}
          >
            <Text numberOfLines={1} style={styles.valueText}>
              {x ? x.value.toFixed(1) : '—'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { marginTop: 14, paddingHorizontal: 2 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  slot: {
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SLOT_HPAD,
  },
  valueSlot: { borderRadius: 8 },
  valueText: { fontSize: 13, fontWeight: '800', color: COLOR_VALUE, textAlign: 'center' },
});
