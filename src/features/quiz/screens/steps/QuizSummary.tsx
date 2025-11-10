import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useRoute } from '@react-navigation/native'
import { useAppTheme } from '@/shared/theme/theme'

export default function QuizSummary() {
  const { colors } = useAppTheme()
  const route = useRoute<any>()
  const results = route.params?.results as { correct: boolean }[] | undefined
  const total = results?.length ?? 0
  const correct = results?.filter(r => r.correct).length ?? 0

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>סיכום מבחן</Text>
      <Text style={{ color: colors.text }}>{correct}/{total}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
})
