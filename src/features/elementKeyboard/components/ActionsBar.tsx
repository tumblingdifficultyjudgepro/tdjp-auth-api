import React from 'react'
import { View, StyleSheet, Pressable, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLang } from '@/shared/state/lang'
import { t } from '@/shared/i18n'

type Props = {
  onDelete: () => void
  onClear: () => void
  alignSide?: 'start' | 'end'
}

export default function ActionsBar({ onDelete, onClear, alignSide = 'start' }: Props) {
  const { lang } = useLang()
  const isRTL = lang === 'he'
  const deleteLabel = t(lang, 'calculator.delete')
  const clearLabel = t(lang, 'calculator.clear')

  const DeleteBtn = (
    <Pressable
      onPress={onDelete}
      style={({ pressed }) => [
        styles.actionBtn,
        {
          backgroundColor: '#BDBDBD',
          borderColor: '#BDBDBD',
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={[styles.inner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Ionicons name="backspace-outline" size={18} color="#1A1A1A" />
        <Text style={[styles.actionText, { color: '#1A1A1A' }]}>{deleteLabel}</Text>
      </View>
    </Pressable>
  )

  const ClearBtn = (
    <Pressable
      onPress={onClear}
      style={({ pressed }) => [
        styles.actionBtn,
        {
          backgroundColor: '#D32F2F',
          borderColor: '#D32F2F',
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={[styles.inner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
        <Text style={[styles.actionText, { color: '#FFFFFF' }]}>{clearLabel}</Text>
      </View>
    </Pressable>
  )

  return (
    <View style={[styles.row, { justifyContent: alignSide === 'end' ? 'flex-end' : 'flex-start' }]}>
      {isRTL ? (
        <>
          {DeleteBtn}
          {ClearBtn}
        </>
      ) : (
        <>
          {ClearBtn}
          {DeleteBtn}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 8 },
  actionBtn: {
    minWidth: 90,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: { alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionText: { fontSize: 16, fontWeight: '800' },
})
