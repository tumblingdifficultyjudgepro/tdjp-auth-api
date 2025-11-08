import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { t } from '@/shared/i18n';
import TopBar from '@/shared/ui/TopBar';
import OptionButton from '../components/OptionButton';
import SettingsSection from '../components/SettingsSection';
import ModeCards from '../components/ModeCards';
import RadioGroup from '../components/RadioGroup';
import { useQuizSettings } from '../hooks/useQuizSettings';
import { TimerPreset } from '../types';
import StepperField from '../components/StepperField';

const TIMER_PRESETS: { key: TimerPreset; he: string; en: string }[] = [
  { key: 10, he: '10 שנ׳', en: '10s' },
  { key: 20, he: '20 שנ׳', en: '20s' },
  { key: 30, he: '30 שנ׳', en: '30s' },
  { key: 60, he: 'דקה', en: '1m' },
  { key: 'unlimited', he: 'ללא הגבלה', en: 'Unlimited' }
];

export default function QuizSettingsScreen() {
  const { colors } = useAppTheme();
  const { lang } = useLang();
  const isRTL = lang === 'he';

  const {
    mode,
    setMode,
    form,
    setForm,
    prompt,
    setPrompt,
    mapping,
    setMapping,
    count,
    setCount,
    timer,
    setTimer,
    buildConfig,
    isValidCustom
  } = useQuizSettings();

  const countItems = [5, 10, 15, 20].map(n => ({ key: n, label: String(n) }));
  const timerItems = TIMER_PRESETS.map(p => ({ key: p.key, label: isRTL ? p.he : p.en }));

  function onStart() {
    if (mode === 'custom' && !isValidCustom()) {
      Alert.alert(t(lang, 'quiz.settings.select_options'));
      return;
    }
    const config = buildConfig();
    Alert.alert(t(lang, 'quiz.settings.ready'), JSON.stringify(config, null, 2));
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar titleKey="quiz.settings.title" />
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingHorizontal: 16, paddingVertical: 16, backgroundColor: colors.bg }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ModeCards
          mode={mode}
          onChange={setMode}
          labels={{
            customTitle: t(lang, 'quiz.settings.mode_custom'),
            customDesc: isRTL ? 'שלוט על סוג השאלות' : 'Choose exact question types',
            randomTitle: t(lang, 'quiz.settings.mode_random'),
            randomDesc: isRTL ? 'כל שאלה מפתיעה' : 'Each question is a surprise'
          }}
          colors={colors as any}
          isRTL={isRTL}
        />

        {mode === 'custom' && (
          <>
            <View style={[styles.twoColRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <RadioGroup
                title={t(lang, 'quiz.settings.section_forms')}
                options={[
                  { key: 'mcq', label: t(lang, 'quiz.settings.form_mcq') },
                  { key: 'open', label: t(lang, 'quiz.settings.form_open') }
                ]}
                selectedKey={form}
                onSelect={k => setForm(k as any)}
                colors={colors as any}
                isRTL={isRTL}
              />
              <RadioGroup
                title={t(lang, 'quiz.settings.section_prompt')}
                options={[
                  { key: 'symbol', label: t(lang, 'quiz.settings.prompt_symbol') },
                  { key: 'name', label: t(lang, 'quiz.settings.prompt_name') }
                ]}
                selectedKey={prompt}
                onSelect={k => setPrompt(k as any)}
                colors={colors as any}
                isRTL={isRTL}
              />
            </View>

            <SettingsSection title={t(lang, 'quiz.settings.section_mapping')} isRTL={isRTL} colors={colors as any} variant="plain">
              <OptionButton label={t(lang, 'quiz.settings.map_v_to_e')} selected={mapping === 'valueToElement'} onPress={() => setMapping('valueToElement')} colors={colors as any} />
              <OptionButton label={t(lang, 'quiz.settings.map_e_to_v')} selected={mapping === 'elementToValue'} onPress={() => setMapping('elementToValue')} colors={colors as any} />
            </SettingsSection>
          </>
        )}

        <View style={[styles.steppersRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <StepperField<number>
            title={t(lang, 'quiz.settings.section_count')}
            items={countItems}
            value={count}
            onChange={(v) => setCount(v)}
            colors={colors as any}
            isRTL={isRTL}
            width={120}
          />
          <StepperField<TimerPreset>
            title={isRTL ? 'טיימר לשאלה' : 'Timer per Question'}
            items={timerItems}
            value={timer}
            onChange={(v) => setTimer(v)}
            colors={colors as any}
            isRTL={isRTL}
            width={150}
          />
        </View>

        <Pressable onPress={onStart} style={[styles.startButton, { backgroundColor: colors.tint }]}>
          <Text style={[styles.startText, { color: colors.bg }]}>{t(lang, 'quiz.settings.start')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  twoColRow: { gap: 12, flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between' },
  steppersRow: { gap: 16, alignItems: 'flex-start', justifyContent: 'space-between' },
  startButton: { marginTop: 10, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  startText: { fontSize: 18, fontWeight: '800', textAlign: 'center' }
});