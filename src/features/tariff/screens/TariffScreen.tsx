import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import TopBar from '@/shared/ui/TopBar';
import AthleteDetailsSection, { AthleteDetails } from '@/features/tariff/components/AthleteDetailsSection';

import ElementsGrid from '@/features/calculator/components/ElementsGrid';
import SortingBar from '@/features/calculator/components/SortingBar';
import ActionsBar from '@/features/calculator/components/ActionsBar';
import SelectionBar from '@/features/calculator/components/SelectionBar';

import useTariffPassKeyboard from '@/features/tariff/state/useTariffPassKeyboard';
import { t } from '@/shared/i18n';

export default function TariffScreen() {
  const { colors } = useAppTheme();
  const { lang } = useLang();
  const isRTL = lang === 'he';

  const [athlete, setAthlete] = useState<AthleteDetails>({
    country: 'ISR',
    autoBonus: true,
    name: '',
    club: '',
    athleteNumber: '',
    round: '',
    gender: null,
    track: null,
    level: null,
  });

  const {
    elements,
    sortKey,
    sortOrder,
    cycleSortKey,
    toggleOrder,
    addElement,
    deleteLast,
    clearAll,
    activePass,
    setActivePass,
    pass1Display,
    pass2Display,
    maxSlots,
  } = useTariffPassKeyboard(athlete.track);

  const showKeyboard = Boolean(athlete.track && athlete.level);

  const renderPass = (pass: 1 | 2, items: any[]) => (
    <View style={{ marginTop: 8 }}>
      <Pressable
        onPress={() => setActivePass(pass)}
        style={[
          styles.passHeader,
          {
            flexDirection: isRTL ? 'row-reverse' : 'row',
            borderColor: activePass === pass ? colors.tint : 'transparent',
          },
        ]}
      >
        <Text style={[styles.passTitle, { color: colors.text }]}>
          {pass === 1 ? t(lang, 'tariff.passes.pass1') : t(lang, 'tariff.passes.pass2')}
        </Text>
      </Pressable>

      <SelectionBar
        items={items}
        direction={isRTL ? 'rtl' : 'ltr'}
        titleFontSize={7}
        forceLTR={false}
        forceMirror={false}
        textMaxFont={7}
        textMinFont={5}
      />

      <Text style={[styles.maxText, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
        ({items.length}/{maxSlots})
      </Text>
    </View>
  );

  const header = (
    <View style={styles.headerWrapper}>
      <AthleteDetailsSection value={athlete} onChange={setAthlete} />

      {showKeyboard && (
        <View style={{ marginTop: 16 }}>
          {renderPass(1, pass1Display)}
          {renderPass(2, pass2Display)}

          <View style={styles.divider} />

          <View style={{ paddingTop: 6 }}>
            <ActionsBar
              onDelete={deleteLast}
              onClear={clearAll}
              alignSide={isRTL ? 'end' : 'start'}
            />
            <SortingBar
              sortKey={sortKey}
              sortOrder={sortOrder}
              onChangeKey={cycleSortKey}
              onToggleOrder={toggleOrder}
              isRTL={isRTL}
            />
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={[styles.topBarWrapper, { borderBottomColor: colors.border }]}>
        <TopBar titleKey="tabs.tariff" showBack={false} />
      </View>

      <View style={styles.body}>
        <ElementsGrid
          elements={showKeyboard ? elements : []}
          onSelect={(it) => addElement(it.id, it.value)}
          titleFontSize={14}
          header={header}
          forceLTR={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBarWrapper: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  body: {
    flex: 1,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  headerWrapper: {
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  divider: {
    height: 6,
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    marginBottom: 12,
  },
  passHeader: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderRadius: 10,
    alignSelf: 'stretch',
    marginBottom: 4,
  },
  passTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  maxText: {
    marginTop: 2,
    fontSize: 11,
  },
});
