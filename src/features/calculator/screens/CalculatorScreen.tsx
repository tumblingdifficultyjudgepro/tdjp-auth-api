import React, { useEffect, useRef, useState, useMemo } from 'react'
import { View, StyleSheet, BackHandler } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import TopBar from '@/shared/ui/TopBar'
import { useAppTheme } from '@/shared/theme/theme'
import { useLang } from '@/shared/state/lang'
import { t } from '@/shared/i18n'
import useCalculator from '../state/useCalculator'
import SelectionBar from '../components/SelectionBar'
import SummaryBar from '../components/SummaryBar'
import ActionsBar from '@/features/elementKeyboard/components/ActionsBar'
import SortingBar from '@/features/elementKeyboard/components/SortingBar'
import ElementsGrid from '@/features/elementKeyboard/components/ElementsGrid'

export default function CalculatorScreen() {
  const { colors } = useAppTheme()
  const { lang } = useLang()
  const nav = useNavigation<any>()

  // === חזרה ל-Home בלחיצה על כפתור חזור ===
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        nav.navigate('Home');
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [nav])
  );
  // ========================================

  const {
    mode,
    elements,
    sequenceDisplay,
    addById,
    toggleMode,
    currentLabelFont,
    sortKey,
    sortOrder,
    cycleSortKey,
    toggleOrder,
    total,
    deleteLast,
    clearAll,
  } = useCalculator()

  const forceLTR = mode === 'symbol'
  const barDirection: 'ltr' | 'rtl' = forceLTR ? 'ltr' : lang === 'he' ? 'rtl' : 'ltr'

  const symbolFonts = useMemo(() => {
    if (mode !== 'symbol') {
      return { max: currentLabelFont, min: 5 }
    }
    let maxLen = 1
    for (const item of sequenceDisplay) {
      const label = item?.label
      if (!label) continue
      const len = String(label).length
      if (len > maxLen) maxLen = len
    }
    if (maxLen <= 1) return { max: 20, min: 18 }
    if (maxLen === 2) return { max: 18, min: 16 }
    if (maxLen === 3) return { max: 14, min: 12 }
    return { max: 10, min: 10 }
  }, [mode, sequenceDisplay, currentLabelFont])

  const slotSymbolMaxFont = symbolFonts.max
  const slotSymbolMinFont = symbolFonts.min
  const keyboardSymbolFontSize = 25

  const prevModeRef = useRef<typeof mode>(mode)
  const [mirrorPulse, setMirrorPulse] = useState(false)

  useEffect(() => {
    if (prevModeRef.current !== mode) {
      const switchedToSymbols = mode === 'symbol'
      if (switchedToSymbols && lang === 'he') {
        setMirrorPulse(true)
        requestAnimationFrame(() => setMirrorPulse(false))
      } else {
        setMirrorPulse(false)
      }
      prevModeRef.current = mode
    }
  }, [mode, lang])

  const header = (
    <View
      style={{
        paddingTop: 8,
        alignItems: lang === 'he' ? 'flex-end' : 'flex-start',
      }}
    >
      <SummaryBar
        label={t(lang, 'calculator.total')}
        value={total}
        alignSide={lang === 'he' ? 'end' : 'start'}
        reverse={lang === 'he'}
      />
      <ActionsBar
        onDelete={deleteLast}
        onClear={clearAll}
        alignSide={lang === 'he' ? 'end' : 'start'}
      />
      <SortingBar
        sortKey={sortKey}
        sortOrder={sortOrder}
        onChangeKey={cycleSortKey}
        onToggleOrder={toggleOrder}
        isRTL={lang === 'he'}
      />
    </View>
  )

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <TopBar
        titleKey="tabs.calc"
        showBack={false}
        showElementToggle
        elementMode={mode}
        onToggleElementMode={toggleMode}
      />
      <View style={styles.body}>
        <SelectionBar
          items={sequenceDisplay}
          direction={barDirection}
          titleFontSize={mode === 'symbol' ? slotSymbolMaxFont : currentLabelFont}
          forceLTR={forceLTR}
          forceMirror={mirrorPulse}
          textMaxFont={mode === 'symbol' ? slotSymbolMaxFont : 7}
          textMinFont={mode === 'symbol' ? slotSymbolMinFont : 5}
        />
        <View style={{ height: 6, backgroundColor: colors.bg }} />
        <View style={{ flex: 1 }}>
          <ElementsGrid
            elements={elements}
            onSelect={it => addById(it.id, it.value)}
            titleFontSize={14}
            header={header}
            forceLTR={forceLTR}
            isSymbolMode={mode === 'symbol'}
            symbolFontSize={keyboardSymbolFontSize}
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1, paddingHorizontal: 12, paddingTop: 12 },
})