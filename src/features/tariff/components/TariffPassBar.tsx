import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';
import AutoShrinkText from '@/features/calculator/components/AutoShrinkText';

type SlotItem = { id: string; label: string; value: number };

type Props = {
  items: SlotItem[];
  direction: 'ltr' | 'rtl';
  maxSlots: number;
};

const H_LABEL = 56;
const H_VALUE = 28;
const COLOR_VALUE = '#FFC107';
const SLOT_HPAD = 4;

export default function TariffPassBar({ items, direction, maxSlots }: Props) {
  const { colors } = useAppTheme();

  const layoutRTL = direction === 'rtl';

  const slots = useMemo(() => {
    const out: Array<SlotItem | null> = new Array(maxSlots).fill(null);
    const k = Math.min(items.length, maxSlots);
    if (layoutRTL) {
      for (let i = 0; i < k; i++) out[maxSlots - 1 - i] = items[i];
    } else {
      for (let i = 0; i < k; i++) out[i] = items[i];
    }
    return out;
  }, [items, layoutRTL, maxSlots]);

  const writing = layoutRTL ? 'rtl' : 'ltr';
  const CENTER = { textAlign: 'center' as const };

  const [slotWidths, setSlotWidths] = useState<number[]>([]);
  const onSlotLayout = (idx: number) => (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setSlotWidths((prev) => {
      const next = prev.slice();
      next[idx] = w;
      return next;
    });
  };

  const maxFontText = 18;
  const textMinFont = 10;

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
            style={[
              styles.slot,
              styles.valueSlot,
              { height: H_VALUE, borderColor: colors.border },
            ]}
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
  outer: { marginTop: 8, paddingHorizontal: 2 },
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
