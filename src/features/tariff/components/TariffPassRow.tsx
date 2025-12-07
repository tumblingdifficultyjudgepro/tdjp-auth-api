import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, Pressable } from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';
import TariffSlotRow from './TariffSlotRow';

type DisplaySlot = { id: string; label: string; value: number };

type Props = {
  label: string;
  items: DisplaySlot[];
  maxSlots: number;
  direction: 'ltr' | 'rtl';
  isActive: boolean;
  onPress: () => void;
  isSymbolMode: boolean;
  symbolFontSize?: number;
  showBonusRow?: boolean;
  onLayout?: (event: LayoutChangeEvent) => void;
  onSlotWidthsChange?: (widths: number[]) => void;
};

const H_LABEL = 56;
const H_VALUE = 28;
const H_BONUS = 24;
const COLOR_VALUE = '#FFC107';
const COLOR_VALUE_BG = '#FFF8E1';
const COLOR_BONUS_BG = '#B3E5FC';
const SLOT_HPAD = 4;

export default function TariffPassRow({
  label,
  items,
  maxSlots,
  direction,
  isActive,
  onPress,
  isSymbolMode,
  symbolFontSize,
  showBonusRow = false,
  onLayout,
  onSlotWidthsChange,
}: Props) {
  const { colors } = useAppTheme();

  const layoutRTL = direction === 'rtl';

  const ordered = useMemo(() => items, [items]);

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

  return (
    <Pressable
      onPress={onPress}
      onLayout={onLayout}
      style={({ pressed }) => [
        styles.container,
        {
          borderColor: isActive ? COLOR_VALUE : colors.border,
          backgroundColor: isActive ? colors.card : 'transparent',
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.labelRow}>
        <Text
          style={[
            styles.passTitle,
            {
              color: colors.text,
              textAlign: layoutRTL ? 'right' : 'left',
            },
          ]}
        >
          {label}
        </Text>
      </View>

      <View style={styles.slotsOuter}>
        <TariffSlotRow
          items={items}
          maxSlots={maxSlots}
          direction={direction}
          isSymbolMode={isSymbolMode}
          symbolFontSize={symbolFontSize}
          slotHPadding={SLOT_HPAD}
          height={H_LABEL}
          onWidthsChange={onSlotWidthsChange}
        />

        <View style={[styles.row, { marginTop: 6 }]}>
          {slots.map((x, idx) => (
            <View
              key={`value_slot_${idx}`}
              style={[
                styles.slot,
                styles.valueSlot,
                {
                  height: H_VALUE,
                  backgroundColor: COLOR_VALUE_BG,
                  borderColor: 'transparent',
                },
              ]}
            >
              <Text numberOfLines={1} style={styles.valueText}>
                {x ? x.value.toFixed(1) : '—'}
              </Text>
            </View>
          ))}
        </View>

        {showBonusRow && (
          <View style={[styles.row, { marginTop: 4 }]}>
            {slots.map((_, idx) => (
              <View
                key={`bonus_slot_${idx}`}
                style={[
                  styles.slot,
                  styles.bonusSlot,
                  {
                    height: H_BONUS,
                    backgroundColor: COLOR_BONUS_BG,
                    borderColor: 'transparent',
                  },
                ]}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: 14,
                    fontWeight: '800',
                    color: '#01579B',
                  }}
                >
                  —
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  labelRow: {
    marginBottom: 6,
  },
  passTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  slotsOuter: {
    paddingHorizontal: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
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
  valueSlot: {
    borderRadius: 8,
    borderWidth: 0,
  },
  valueText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLOR_VALUE,
    textAlign: 'center',
  },
  bonusSlot: {
    borderRadius: 8,
    borderWidth: 0,
  },
});
