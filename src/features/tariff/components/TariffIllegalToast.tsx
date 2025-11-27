import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Easing } from 'react-native'
import { useAppTheme } from '@/shared/theme/theme'
import { useLang } from '@/shared/state/lang'
import { t } from '@/shared/i18n'

type Props = {
  visible: boolean
  onHide: () => void
}

export default function TariffIllegalToast({ visible, onHide }: Props) {
  const { colors } = useAppTheme()
  const { lang } = useLang()

  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.9)).current
  const isAnimatingOut = useRef(false)

  useEffect(() => {
    if (!visible) return

    isAnimatingOut.current = false
    opacity.setValue(0)
    scale.setValue(0.9)

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start()

    const timeoutId = setTimeout(() => {
      if (isAnimatingOut.current) return
      isAnimatingOut.current = true
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.9,
          duration: 220,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) onHide()
      })
    }, 3000)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [visible, opacity, scale, onHide])

  if (!visible) return null

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.toastBox,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>!</Text>
        </View>
        <Text
          style={[
            styles.toastText,
            {
              color: colors.text,
              textAlign: lang === 'he' ? 'right' : 'left',
            },
          ]}
        >
          {t(lang, 'tariff.messages.passesIllegal')}
        </Text>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  toastBox: {
    minWidth: 280,
    maxWidth: '85%',
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 24,
    paddingVertical: 22,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#c0392b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
  },
  toastText: {
    fontSize: 18,
    fontWeight: '600',
  },
})
