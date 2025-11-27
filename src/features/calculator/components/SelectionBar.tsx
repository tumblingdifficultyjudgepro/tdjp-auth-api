import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native'
import { useAppTheme } from '@/shared/theme/theme'
import AutoShrinkText from './AutoShrinkText'

type DisplaySlot = { id: string; label: string; value: number }

type Props = {
  items: DisplaySlot[]
  direction: 'ltr' | 'rtl'
  titleFontSize: number
  forceLTR?: boolean
  forceMirror?: boolean
  textMaxFont?: number
  textMinFont?: number
}

const MAX_SLOTS = 8
const H_LABEL = 56
const H_VALUE = 28
const COLOR_VALUE = '#FFC107'
const COLOR_VALUE_BG = '#FFF8E1'
const SLOT_HPAD = 4

export default function SelectionBar({
  items,
  direction,
  titleFontSize,
  forceLTR,
  forceMirror,
  textMaxFont = 22,
  textMinFont = 10,
}: Props) {
  const { colors } = useAppTheme()

  const isDirRTL = direction === 'rtl'
  const layoutRTL = forceLTR ? false : isDirRTL

  const ordered = useMemo(() => {
    let arr = items
    if (forceLTR && forceMirror) arr = [...arr].reverse()
    return arr
  }, [items, forceLTR, forceMirror])

  const slots = useMemo(() => {
    const out: Array<DisplaySlot | null> = new Array(MAX_SLOTS).fill(null)
    const k = Math.min(ordered.length, MAX_SLOTS)
    if (layoutRTL) {
      for (let i = 0; i < k; i++) out[MAX_SLOTS - 1 - i] = ordered[i]
    } else {
      for (let i = 0; i < k; i++) out[i] = ordered[i]
    }
    return out
  }, [ordered, layoutRTL])

  const writing = forceLTR ? 'ltr' : layoutRTL ? 'rtl' : 'ltr'
  const CENTER = { textAlign: 'center' as const }

  const [slotWidths, setSlotWidths] = useState<number[]>(Array(MAX_SLOTS).fill(0))
  const onSlotLayout = (idx: number) => (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width
    setSlotWidths(prev => {
      if (prev[idx] === w) return prev
      const next = [...prev]
      next[idx] = w
      return next
    })
  }

  const maxFontText = Math.max(textMinFont, Math.min(textMaxFont, titleFontSize))
  const textMode = !forceLTR

  const getSymbolFontSize = (label: string): number => {
    const len = label ? String(label).length : 0
    if (len <= 1) return 20
    if (len === 2) return 18
    if (len === 3) return 14
    return 10
  }

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
                (() => {
                  const label = x.label ?? ''
                  const symbolFont = getSymbolFontSize(label)
                  const lineHeight = Math.round(symbolFont * 1.1)
                  const maxHeight = lineHeight * 3
                  return (
                    <Text
                      numberOfLines={1}
                      style={{
                        ...CENTER,
                        fontSize: symbolFont,
                        lineHeight,
                        maxHeight,
                        fontWeight: '900',
                        color: colors.text,
                        writingDirection: writing,
                      }}
                    >
                      {label}
                    </Text>
                  )
                })()
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
    </View>
  )
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
})
