import React from 'react';
import { View, StyleSheet } from 'react-native';
import SettingsSection from '@/features/quiz/components/SettingsSection';
import OptionCard from '@/features/quiz/components/OptionCard';
import { Mode } from '@/features/quiz/types';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { t } from '@/shared/i18n';

type Props = { value: Mode | null; onChange: (v: Mode) => void };

export default function StepMode({ value, onChange }: Props) {
  const { colors } = useAppTheme();
  const { lang } = useLang();
  const isRTL = lang === 'he';

  return (
    <View>
      <SettingsSection title={t(lang, 'quiz.settings.modeTitle')} colors={colors} isRTL={isRTL}>
        <View style={styles.row}>
          <OptionCard
            selected={value === 'custom'}
            icon="construct-outline"
            label={t(lang, 'quiz.settings.modeCustom')}
            onPress={() => onChange('custom')}
            colors={colors}
            width={170}
          />
          <OptionCard
            selected={value === 'random'}
            icon="shuffle-outline"
            label={t(lang, 'quiz.settings.modeRandom')}
            onPress={() => onChange('random')}
            colors={colors}
            width={170}
          />
        </View>
      </SettingsSection>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
