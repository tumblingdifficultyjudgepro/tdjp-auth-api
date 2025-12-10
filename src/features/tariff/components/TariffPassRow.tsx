import React, { useMemo, useState, useEffect } from 'react'
import { View, Text, StyleSheet, LayoutChangeEvent, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAppTheme } from '@/shared/theme/theme'

type DisplaySlot = { id: string; label: string; value: number };

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
  // === פרמטר חדש ===
  isSticky?: boolean
}

const H_LABEL = 56
const H_VALUE = 28
const H_BONUS = 24
const COLOR_VALUE = '#FFC107'
const COLOR_VALUE_BG = '#FFF8E1'
const COLOR_BONUS_BG = '#B3E5FC'
const SLOT_HPAD = 0
const COLOR_ILLEGAL_BORDER = '#DC2626'
const COLOR_WARNING = '#DC2626'

function getSymbolFontSizeByLength(label: string): number {
  const len = label ? label.length : 0
  if (len <= 1) return 20
  if (len === 2) return 18
  if (len === 3) return 14
  return 10
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
  // === קבלת הפרמטר החדש ===
  isSticky = false,
}: Props) {
  const { colors } = useAppTheme()
  const accent = colors.text

  const layoutRTL = direction === 'rtl';
  const writing = layoutRTL ? 'rtl' : 'ltr';

  const isHebrewTitle = /[\u0590-\u05FF]/.test(label)

  const ordered = useMemo(() => items, [items])

  const slots = useMemo(() => {
    const out: Array<DisplaySlot | null> = new Array(maxSlots).fill(null);
    const k = Math.min(ordered.length, maxSlots);
    if (layoutRTL) {
      for (let i = 0; i < k; i++) out[maxSlots - 1 - i] = ordered[i];
    } else {
      for (let i = 0; i < k; i++) out[i] = ordered[i];
    }
    return out
  }, [ordered, layoutRTL, maxSlots])

  const [slotWidths, setSlotWidths] = useState<number[]>(() => Array(maxSlots).fill(0))

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
    // === השינוי כאן: אם זה סטיקי, אין מרווח תחתון ===
    <View style={[styles.wrapper, isSticky && { marginBottom: 0 }]}>
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
              const isIllegal = illegalSlotSet.has(idx)
              const forcedWidth = effectiveWidths[idx] ? effectiveWidths[idx] : undefined
              const symbolFont = x && isSymbolMode ? getSymbolFontSizeByLength(String(x.label)) : 0

              return (
                <View
                  key={`label_slot_${idx}`}
                  style={[
                    styles.slot,
                    {
                      height: H_LABEL,
                      width: forcedWidth,
                      borderColor: isIllegal ? COLOR_ILLEGAL_BORDER : colors.border,
                      backgroundColor: colors.card,
                      overflow: 'hidden',
                      paddingHorizontal: SLOT_HPAD,
                    },
                  ]}
                  onLayout={onSlotLayout(idx)}
                >
                  {x ? (
                    isSymbolMode ? (
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        style={{
                          ...CENTER,
                          fontSize: symbolFont,
                          fontWeight: '900',
                          color: colors.text,
                          width: '100%',
                        }}
                      >
                        {x.label}
                      </Text>
                    ) : (
                      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                        <Text
                          adjustsFontSizeToFit={true}
                          minimumFontScale={0.3}
                          numberOfLines={3}
                          textBreakStrategy="simple"
                          android_hyphenationFrequency="none"
                          style={{
                            textAlign: 'center',
                            fontWeight: '900',
                            color: colors.text,
                            fontSize: 11,
                            lineHeight: 12,
                            writingDirection: writing,
                          }}
                        >
                          {x.label}
                        </Text>
                      </View>
                    )
                  ) : (
                    <Text
                      style={{
                        ...CENTER,
                        fontSize: 18,
                        fontWeight: '900',
                        color: colors.text,
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
                      width: effectiveWidths[idx] ? effectiveWidths[idx] : undefined,
                      backgroundColor: COLOR_VALUE_BG,
                      borderColor: 'transparent',
                    },
                  ]}
                >
                  <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5} style={styles.valueText}>
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
                  bonusText = (rawBonus != null && Number.isFinite(rawBonus)) ? rawBonus.toFixed(1) : '0.0'
                }

                return (
                  <View
                    key={`bonus_slot_${idx}`}
                    style={[
                      styles.slot,
                      styles.bonusSlot,
                      {
                        height: H_BONUS,
                        width: effectiveWidths[idx] ? effectiveWidths[idx] : undefined,
                        backgroundColor: COLOR_BONUS_BG,
                        borderColor: 'transparent',
                      },
                    ]}
                  >
                    <Text
                      adjustsFontSizeToFit
                      minimumFontScale={0.5}
                      style={{
                        ...CENTER,
                        fontSize: 14,
                        fontWeight: '800',
                        color: '#01579B',
                        writingDirection: 'ltr',
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
                  { textAlign: isRtlWarning ? 'right' : 'left' },
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
  wrapper: { marginBottom: 4 },
  container: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  labelRow: { marginBottom: 6 },
  passTitle: {
    fontSize: 14,
    fontWeight: '800'
  },
  slotsOuter: { paddingHorizontal: 2 },
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
  valueSlot: { borderRadius: 8, borderWidth: 0 },
  valueText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLOR_VALUE,
    textAlign: 'center',
  },
  bonusSlot: { borderRadius: 8, borderWidth: 0 },
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

const CENTER = { alignItems: 'center' as const, justifyContent: 'center' as const, textAlign: 'center' as const }
