import React, { useMemo, useState, useEffect } from 'react'
import { View, Text, StyleSheet, LayoutChangeEvent, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAppTheme } from '@/shared/theme/theme'
import AutoShrinkTextTariff from '@/features/tariff/text/TariffAutoShrinkText'
import WordWrapNoBreak from '@/features/tariff/text/TariffWordWrapNoBreak'

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
  bonusValues?: (number | null)[]
  illegalIndices?: number[]
  warningMessages?: string[]
  showValueRow?: boolean
  useAutoShrink?: boolean
  onSlotWidthMeasured?: (idx: number, width: number) => void
  slotWidthOverrides?: number[]
}

const H_LABEL = 56
const H_VALUE = 28
const H_BONUS = 24
const COLOR_VALUE = '#FFC107'
const COLOR_VALUE_BG = '#FFF8E1'
const COLOR_BONUS_BG = '#B3E5FC'
const SLOT_HPAD = 4
const COLOR_ILLEGAL_BORDER = '#DC2626'
const COLOR_WARNING = '#DC2626'

function getSymbolFontSizeByLength(label: string): number {
  const len = label ? label.length : 0
  if (len <= 1) return 20
  if (len === 2) return 18
  if (len === 3) return 14
  return 10
}

function getTextFontSizeByLength(label: string): number {
  const len = label ? label.length : 0
  if (len <= 8) return 16
  if (len <= 14) return 13
  if (len <= 22) return 11
  return 9
}

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
  bonusValues,
  illegalIndices,
  warningMessages,
  showValueRow = true,
  useAutoShrink = true,
  onSlotWidthMeasured,
  slotWidthOverrides,
}: Props) {
  const { colors } = useAppTheme()
  const accent = colors.text

  const layoutRTL = direction === 'rtl'
  const writing = layoutRTL ? 'rtl' : 'ltr'
  const CENTER = { textAlign: 'center' as const }

  const isHebrewTitle = /[\u0590-\u05FF]/.test(label)

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
    if (onSlotWidthMeasured) {
      onSlotWidthMeasured(idx, w)
    }
  }

  const maxFontText = 18
  const minFontText = 5

  const illegalSlotSet = useMemo(() => {
    const set = new Set<number>()
    if (!illegalIndices || illegalIndices.length === 0) return set
    for (const logicalIdx of illegalIndices) {
      if (logicalIdx < 0 || logicalIdx >= maxSlots) continue
      const slotIdx = layoutRTL ? maxSlots - 1 - logicalIdx : logicalIdx
      set.add(slotIdx)
    }
    return set
  }, [illegalIndices, layoutRTL, maxSlots])

  const bonusesSlots = useMemo<(number | null)[]>(() => {
    const src = bonusValues ?? []
    const out: (number | null)[] = new Array(maxSlots).fill(null)
    const k = Math.min(src.length, maxSlots)
    if (layoutRTL) {
      for (let i = 0; i < k; i++) out[maxSlots - 1 - i] = src[i]
    } else {
      for (let i = 0; i < k; i++) out[i] = src[i]
    }
    return out
  }, [bonusValues, layoutRTL, maxSlots])

  const hasWarnings = !!warningMessages && warningMessages.length > 0
  const isRtlWarning = isHebrewTitle

  const activeBorderColor = isActive ? accent : colors.border
  const activeBackgroundColor = isActive ? accent + '22' : 'transparent'

  const effectiveWidths = slotWidthOverrides && slotWidthOverrides.length === maxSlots
    ? slotWidthOverrides
    : slotWidths

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.container,
          {
            borderColor: activeBorderColor,
            backgroundColor: activeBackgroundColor,
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
                textAlign: isHebrewTitle ? 'right' : layoutRTL ? 'right' : 'left',
              },
            ]}
          >
            {label}
          </Text>
        </View>

        <View style={styles.slotsOuter}>
          <View style={styles.row}>
            {slots.map((x, idx) => {
              const symbolFont =
                x && isSymbolMode
                  ? getSymbolFontSizeByLength(String(x.label))
                  : 0

              const isIllegal = illegalSlotSet.has(idx)

              const textFont = x
                ? getTextFontSizeByLength(String(x.label))
                : maxFontText

              return (
                <View
                  key={`label_slot_${idx}`}
                  style={[
                    styles.slot,
                    {
                      height: H_LABEL,
                      borderColor: isIllegal ? COLOR_ILLEGAL_BORDER : colors.border,
                      backgroundColor: colors.card,
                    },
                  ]}
                  onLayout={onSlotLayout(idx)}
                >
                  {x ? (
                    isSymbolMode ? (
                      <Text
                        numberOfLines={1}
                        allowFontScaling={false}
                        style={{
                          ...CENTER,
                          fontSize: symbolFont,
                          lineHeight: symbolFont * 1.1,
                          maxHeight: symbolFont * 1.3,
                          fontWeight: '900',
                          color: colors.text,
                          writingDirection: 'ltr',
                        }}
                      >
                        {x.label}
                      </Text>
                    ) : useAutoShrink ? (
                      <AutoShrinkTextTariff
                        text={x.label}
                        maxFont={maxFontText}
                        minFont={minFontText}
                        maxLines={3}
                        lineHeightRatio={1.1}
                        maxWidth={effectiveWidths[idx] || undefined}
                        horizontalPadding={SLOT_HPAD}
                        style={{
                          ...CENTER,
                          fontWeight: '900',
                          color: colors.text,
                          writingDirection: writing,
                        }}
                      />
                    ) : (
                      <WordWrapNoBreak
                        text={x.label}
                        fontSize={textFont}
                        maxLines={3}
                        lineHeightRatio={1.1}
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
              )
            })}
          </View>

          {showValueRow && (
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
          )}

          {showBonusRow && (
            <View style={[styles.row, { marginTop: 4 }]}>
              {slots.map((slot, idx) => {
                const rawBonus = bonusesSlots[idx]
                const hasElement = !!slot
                let bonusText = '—'

                if (hasElement) {
                  if (
                    rawBonus == null ||
                    typeof rawBonus !== 'number' ||
                    !Number.isFinite(rawBonus)
                  ) {
                    bonusText = '0.0'
                  } else {
                    bonusText = rawBonus.toFixed(1)
                  }
                }

                return (
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
                        writingDirection: isSymbolMode ? 'ltr' : writing,
                      }}
                    >
                      {bonusText}
                    </Text>
                  </View>
                )
              })}
            </View>
          )}
        </View>
      </Pressable>

      {hasWarnings && (
        <View
          style={[
            styles.warningRow,
            {
              alignSelf: isRtlWarning ? 'flex-end' : 'flex-start',
              alignItems: isRtlWarning ? 'flex-end' : 'flex-start',
            },
          ]}
        >
          {warningMessages!.map((msg, i) => (
            <View
              key={`warn_${i}`}
              style={{
                flexDirection: isRtlWarning ? 'row-reverse' : 'row',
                alignItems: 'center',
                marginTop: i === 0 ? 0 : 2,
              }}
            >
              <Ionicons
                name="warning"
                size={16}
                color={COLOR_WARNING}
                style={isRtlWarning ? { marginLeft: 6 } : { marginRight: 6 }}
              />
              <Text
                style={[
                  styles.warningText,
                  {
                    textAlign: isRtlWarning ? 'right' : 'left',
                  },
                ]}
                numberOfLines={2}
              >
                {msg}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 4,
  },
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
  warningRow: {
    alignItems: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  warningText: {
    fontSize: 12,
    color: COLOR_WARNING,
    fontWeight: '600',
  },
})
