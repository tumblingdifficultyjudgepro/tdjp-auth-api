import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Screen from '@/shared/ui/Screen';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import TopBar from '@/shared/ui/TopBar';
import AthleteDetailsSection, { AthleteDetails } from '@/features/tariff/components/AthleteDetailsSection';

export default function TariffScreen() {
  const { colors } = useAppTheme();
  const { lang } = useLang();
  const [elementMode, setElementMode] = useState<'text' | 'symbol'>('text');

  const [athlete, setAthlete] = useState<AthleteDetails>({
    country: 'ISR',
    autoBonus: true,
    name: '',
    club: '',
    athleteNumber: '',
    round: '',
    gender: null,
    track: null,
  });

  return (
    <Screen>
      <View style={[styles.topBarWrapper, { borderBottomColor: colors.border }]}>
        <TopBar
          titleKey="tabs.tariff"
          showElementToggle
          elementMode={elementMode}
          onToggleElementMode={() =>
            setElementMode(prev => (prev === 'text' ? 'symbol' : 'text'))
          }
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <AthleteDetailsSection value={athlete} onChange={setAthlete} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBarWrapper: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
