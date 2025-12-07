import React from 'react'
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAppTheme } from '@/shared/theme/theme'
import { useLang } from '@/shared/state/lang'
import { t } from '@/shared/i18n'

type Props = {
  visible: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function TariffIllegalExportConfirm({
  visible,
  onConfirm,
  onCancel,
}: Props) {
  const { colors } = useAppTheme()
  const { lang } = useLang()
  const isRTL = lang === 'he'

  if (!visible) return null

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.panel,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="warning" size={28} color="#FFFFFF" />
          </View>

          <Text
            style={[
              styles.title,
              {
                color: colors.text,
                textAlign: 'center',
              },
            ]}
          >
            {t(lang, 'tariff.confirmIllegalExport.title')}
          </Text>

          <Text
            style={[
              styles.message,
              {
                color: colors.text,
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
          >
            {t(lang, 'tariff.confirmIllegalExport.message')}
          </Text>

          <View
            style={[
              styles.buttonsRow,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.buttonSecondary,
                {
                  borderColor: colors.border,
                  backgroundColor: pressed ? colors.bg : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.buttonSecondaryText,
                  { color: colors.text },
                ]}
              >
                {t(lang, 'tariff.confirmIllegalExport.no')}
              </Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.buttonPrimary,
                {
                  backgroundColor: colors.tint,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Text style={styles.buttonPrimaryText}>
                {t(lang, 'tariff.confirmIllegalExport.yes')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    minWidth: 260,
    maxWidth: '85%',
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 20,
    paddingVertical: 18,
    alignItems: 'center',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#c0392b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  buttonsRow: {
    marginTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  buttonSecondary: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  buttonPrimary: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
})
