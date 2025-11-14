import React from 'react'
import { Pressable, Text, StyleSheet } from 'react-native'
import { useAppTheme } from '@/shared/theme/theme'
import { t } from '@/shared/i18n'
import { useLang } from '@/shared/state/lang'

type Props = { enabled: boolean; onPress: () => void; labelKey?: string }

export default function NextButton({ enabled, onPress, labelKey = 'quiz.actions.check' }: Props) {
  const { colors } = useAppTheme()
  const { lang } = useLang()
  return (
    <Pressable onPress={onPress} disabled={!enabled} style={({ pressed }) => [styles.btn, { backgroundColor: enabled ? colors.tint : colors.border, opacity: pressed ? 0.9 : 1 }]}>
      <Text style={[styles.txt, { color: colors.bg }]}>{t(lang, labelKey)}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 14, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  txt: { fontSize: 16, fontWeight: '700' },
})
