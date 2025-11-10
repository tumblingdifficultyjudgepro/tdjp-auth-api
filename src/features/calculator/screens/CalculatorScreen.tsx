import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import TopBar from '@/shared/ui/TopBar';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { t } from '@/shared/i18n';
import useCalculator from '../state/useCalculator';
import SelectionBar from '../components/SelectionBar';
import SummaryBar from '../components/SummaryBar';
import ActionsBar from '../components/ActionsBar';
import SortingBar from '../components/SortingBar';
import ElementsGrid from '../components/ElementsGrid';

export default function CalculatorScreen() {
  const { colors } = useAppTheme();
  const { lang } = useLang();
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
  } = useCalculator();

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
  );

  const forceLTR = mode === 'symbol';
  const barDirection: 'ltr' | 'rtl' = forceLTR ? 'ltr' : (lang === 'he' ? 'rtl' : 'ltr');

  // --- הפרדה בין "המרה לעבר סימבולס" לבין "כתיבה ישירה בסימבולס" ---
  const prevModeRef = useRef<typeof mode>(mode);
  const [mirrorPulse, setMirrorPulse] = useState(false);

  useEffect(() => {
    if (prevModeRef.current !== mode) {
      const switchedToSymbols = mode === 'symbol';
      if (switchedToSymbols && lang === 'he') {
        setMirrorPulse(true);
        requestAnimationFrame(() => setMirrorPulse(false));
      } else {
        setMirrorPulse(false);
      }
      prevModeRef.current = mode;
    }
  }, [mode, lang]);
  // ----------------------------------------------------------------------

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
          titleFontSize={currentLabelFont}
          forceLTR={forceLTR}
          forceMirror={mirrorPulse}
          textMaxFont={7}
          textMinFont={5}
        />
        <View style={{ height: 6, backgroundColor: '#FFFFFF' }} />
        <View style={{ flex: 1 }}>
          <ElementsGrid
            elements={elements}
            onSelect={(it) => addById(it.id, it.value)}
            titleFontSize={14}
            header={header}
            forceLTR={forceLTR}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1, paddingHorizontal: 12, paddingTop: 12 },
});
