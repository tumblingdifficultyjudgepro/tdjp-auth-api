import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import TopBar from '@/shared/ui/TopBar';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { useQuizSettings } from '@/features/quiz/hooks/useQuizSettings';
import FadeSwap from '@/features/quiz/components/FadeSwap';
import BottomPrimaryButton from '@/features/quiz/components/BottomPrimaryButton';
import StepMode from './steps/StepMode';
import StepForm from './steps/StepForm';
import StepPrompt from './steps/StepPrompt';
import StepMapping from './steps/StepMapping';
import StepCountTimer from './steps/StepCountTimer';
import { Mode, QuestionForm, PromptKind, Mapping, TimerPreset } from '@/features/quiz/types';
import { useNavigation } from '@react-navigation/native';

type StepId = 'mode' | 'form' | 'prompt' | 'mapping' | 'count_timer';

export default function QuizSettingsWizard() {
  const { colors } = useAppTheme();
  useLang();
  const nav = useNavigation<any>();

  const {
    mode, setMode,
    form, setForm,
    prompt, setPrompt,
    mapping, setMapping,
    count, setCount,
    timer, setTimer,
    buildConfig,
  } = useQuizSettings();

  const [step, setStep] = useState<StepId>('mode');

  const flow: StepId[] = useMemo(() => {
    if (mode === 'custom') return ['mode', 'form', 'prompt', 'mapping', 'count_timer'];
    if (mode === 'random') return ['mode', 'count_timer'];
    return ['mode'];
  }, [mode]);

  useEffect(() => {
    if (!flow.includes(step)) {
      if (mode === 'random') setStep('count_timer');
      else setStep('mode');
    }
  }, [mode, flow, step]);

  const idx = Math.max(0, flow.indexOf(step));
  const isLast = idx === flow.length - 1;

  const isValid = useMemo(() => {
    if (step === 'mode') return mode === 'custom' || mode === 'random';
    if (step === 'form') return form !== null;
    if (step === 'prompt') return prompt !== null;
    if (step === 'mapping') return mapping !== null;
    if (step === 'count_timer') return count > 0 && (typeof timer === 'number' || timer === 'unlimited');
    return false;
  }, [step, mode, form, prompt, mapping, count, timer]);

  const busyRef = useRef(false);
  const isMountedRef = useRef(true);
  useEffect(() => () => { isMountedRef.current = false; }, []);

  const onNext = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const release = () => { if (isMountedRef.current) busyRef.current = false; };

    if (isLast) {
      const cfg = buildConfig();
      if (!cfg) { release(); return; }
      setTimeout(() => {
        if (!isMountedRef.current) return;
        nav.navigate('QuizRun', { config: cfg });
        release();
      }, 0);
    } else {
      const nextIdx = Math.min(idx + 1, flow.length - 1);
      setStep(flow[nextIdx]);
      setTimeout(release, 200);
    }
  }, [isLast, idx, flow, buildConfig, nav]);

  const onBack = useCallback(() => {
    if (idx > 0) {
      const prevIdx = Math.max(0, idx - 1);
      setStep(flow[prevIdx]);
    } else {
      nav.goBack();
    }
  }, [idx, flow, nav]);

  const handleTimer = useCallback((v: number | 'unlimited') => {
    const next = (v === 'unlimited' ? 'unlimited' : v) as TimerPreset;
    setTimer(next);
  }, [setTimer]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <TopBar titleKey="quiz.settings.title" showBack={step !== 'mode'} onBack={onBack} />
      <FadeSwap id={step} style={styles.body}>
        {step === 'mode' && <StepMode value={mode as Mode | null} onChange={setMode} />}
        {step === 'form' && <StepForm value={form as QuestionForm} onChange={setForm} />}
        {step === 'prompt' && <StepPrompt value={prompt as PromptKind} onChange={setPrompt} />}
        {step === 'mapping' && <StepMapping value={mapping as Mapping | null} onChange={setMapping} />}
        {step === 'count_timer' && (
          <StepCountTimer
            count={count}
            timer={timer}
            onChangeCount={setCount}
            onChangeTimer={handleTimer}
          />
        )}
      </FadeSwap>
      <BottomPrimaryButton
        text={isLast ? 'התחלת מבחן' : 'הבא'}
        disabled={!isValid}
        onPress={onNext}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1, paddingHorizontal: 0, paddingTop: 36, paddingBottom: 112, alignItems: 'center' },
});
