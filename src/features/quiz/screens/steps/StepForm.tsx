import React from 'react';
import { View, StyleSheet } from 'react-native';
import SettingsSection from '@/features/quiz/components/SettingsSection';
import OptionCard from '@/features/quiz/components/OptionCard';
import { QuestionForm } from '@/features/quiz/types';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { t } from '@/shared/i18n';

type Props = { value: QuestionForm | null; onChange: (v: QuestionForm) => void };

export default function StepForm({ value, onChange }: Props) {
  const { colors } = useAppTheme();
  const { lang } = useLang();
  const isRTL = lang === 'he';

  return (
    <View>
      <SettingsSection title={t(lang, 'quiz.settings.formTitle')} colors={colors} isRTL={isRTL}>
        <View style={styles.row}>
          <OptionCard
            selected={value === 'mcq'}
            icon="list-outline"
            label={t(lang, 'quiz.settings.formMcq')}
            onPress={() => onChange('mcq')}
            colors={colors}
            width={170}
          />
          <OptionCard
            selected={value === 'open'}
            icon="create-outline"
            label={t(lang, 'quiz.settings.formOpen')}
            onPress={() => onChange('open')}
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
