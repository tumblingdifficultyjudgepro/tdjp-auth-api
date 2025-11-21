import React, { useMemo, useState, useEffect } from 'react'
import { View, Text, StyleSheet, LayoutChangeEvent, Pressable } from 'react-native'
import { useAppTheme } from '@/shared/theme/theme'
import AutoShrinkTextTariff from '@/features/tariff/text/TariffAutoShrinkText'

type DisplaySlot = { id: string; label: string; value: number }

type Props = {
  label: string
  items: DisplaySlot[]
  maxSlots: number
  direction: 'ltr' | 'rtl'
  isActive: boolean
  onPress: () => void
  isSymbolMode: boolean
  symbolFontSize?: number
  showBonusRow?: boolean
}

const H_LABEL = 56
const H_VALUE = 28
const H_BONUS = 24
const COLOR_VALUE = '#FFC107'
const COLOR_VALUE_BG = '#FFF8E1'
const COLOR_BONUS_BG = '#B3E5FC'
const SLOT_HPAD = 4

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
}: Props) {
  const { colors } = useAppTheme()

  const layoutRTL = direction === 'rtl'
  const writing = layoutRTL ? 'rtl' : 'ltr'
  const CENTER = { textAlign: 'center' as const }

  const ordered = useMemo(() => items, [items])

  const slots = useMemo(() => {
    const out: Array<DisplaySlot | null> = new Array(maxSlots).fill(null)
    const k = Math.min(ordered.length, maxSlots)
    if (layoutRTL) {
      for (let i = 0; i < k; i++) out[maxSlots - 1 - i] = ordered[i]
    } else {
      for (let i = 0; i < k; i++) out[i] = ordered[i]
    }
    return out
  }, [ordered, layoutRTL, maxSlots])

  const [slotWidths, setSlotWidths] = useState<number[]>(() =>
    Array(maxSlots).fill(0)
  )

  useEffect(() => {
    setSlotWidths(Array(maxSlots).fill(0))
  }, [maxSlots])

  const onSlotLayout = (idx: number) => (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width
    setSlotWidths(prev => {
      if (prev[idx] === w) return prev
      const next = [...prev]
      next[idx] = w
      return next
    })
  }

  const maxFontText = 18
  const minFontText = 5
  const effectiveSymbolFont = symbolFontSize ?? 18
  const symbolLine = Math.round(effectiveSymbolFont * 1.1)
  const symbolMaxH = symbolLine * 3

  return (
    <Pressable
      onPress={onPress}
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
        <View style={styles.row}>
          {slots.map((x, idx) => (
            <View
              key={`label_slot_${idx}`}
              style={[
                styles.slot,
                {
                  height: H_LABEL,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
              onLayout={onSlotLayout(idx)}
            >
              {x ? (
                isSymbolMode ? (
                  <Text
                    numberOfLines={3}
                    allowFontScaling={false}
                    style={{
                      ...CENTER,
                      fontSize: effectiveSymbolFont,
                      lineHeight: symbolLine,
                      maxHeight: symbolMaxH,
                      fontWeight: '900',
                      color: colors.text,
                      writingDirection: 'ltr',
                    }}
                  >
                    {x.label}
                  </Text>
                ) : (
                  <AutoShrinkTextTariff
                    text={x.label}
                    maxFont={maxFontText}
                    minFont={minFontText}
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
                    ...CENTER,
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
  )
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
})
