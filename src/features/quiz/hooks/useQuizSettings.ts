import { useState } from 'react';
import { Mode, QuestionForm, PromptKind, Mapping, QuizConfig, TimerPreset } from '../types';

export function useQuizSettings() {
  const [mode, setMode] = useState<Mode>('custom');
  const [form, setForm] = useState<QuestionForm>('mcq');
  const [prompt, setPrompt] = useState<PromptKind>('symbol');
  const [mapping, setMapping] = useState<Mapping>('valueToElement');
  const [count, setCount] = useState<number>(10);
  const [timer, setTimer] = useState<TimerPreset>(20);

  function buildConfig(): QuizConfig {
    if (mode === 'random') return { mode, count, timer };
    return { mode, form, prompt, mapping, count, timer };
  }

  function isValidCustom() {
    return Boolean(form && prompt && mapping);
  }

  return {
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
  };
}
