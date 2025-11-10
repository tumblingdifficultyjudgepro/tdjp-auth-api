import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useAppTheme } from '@/shared/theme/theme'

type Props = { index: number; total: number; remainingSec: number; timeLimitSec: number }

export default function QuestionHeader({ index, total, remainingSec, timeLimitSec }: Props) {
  const { colors } = useAppTheme()
  const pct = timeLimitSec > 0 ? Math.max(0, Math.min(1, remainingSec / timeLimitSec)) : 0
  return (
    <View style={[styles.wrap, { backgroundColor: colors.card }]}>
      <View style={styles.row}>
        <Text style={[styles.meta, { color: colors.text }]}>{index + 1}/{total}</Text>
        <Text style={[styles.meta, { color: colors.tint }]}>{timeLimitSec === 0 ? '∞' : `${remainingSec}s`}</Text>
      </View>
      {timeLimitSec > 0 && (
        <View style={[styles.bar, { backgroundColor: colors.border }]}>
          <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: colors.tint }]} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { fontSize: 14, fontWeight: '600' },
  bar: { height: 6, width: '100%', borderRadius: 999, overflow: 'hidden', marginTop: 8 },
  fill: { height: '100%' },
})
