import { useState, useCallback } from 'react';
import { Mode, QuestionForm, PromptKind, Mapping, QuizConfig, TimerPreset } from '../types';

export function useQuizSettings() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [form, setForm] = useState<QuestionForm | null>(null);
  const [prompt, setPrompt] = useState<PromptKind | null>(null);
  const [mapping, setMapping] = useState<Mapping>('elementToValue');
  const [count, setCount] = useState<number>(5);
  const [timer, setTimer] = useState<TimerPreset>(10);

  const buildConfig = useCallback((): QuizConfig | null => {
    if (mode === 'random') return { mode, count, timer } as QuizConfig;
    if (mode === 'custom' && form && prompt && mapping) return { mode, form, prompt, mapping, count, timer };
    return null;
  }, [mode, form, prompt, mapping, count, timer]);

  const isValidCustom = useCallback(() => Boolean(form && prompt && mapping), [form, prompt, mapping]);

  return {
    mode,
    setMode: (v: Mode) => setMode(v),
    form,
    setForm: (v: QuestionForm) => setForm(v),
    prompt,
    setPrompt: (v: PromptKind) => setPrompt(v),
    mapping,
    setMapping: (v: Mapping) => setMapping(v),
    count,
    setCount: (n: number) => setCount(n),
    timer,
    setTimer: (v: TimerPreset) => setTimer(v),
    buildConfig,
    isValidCustom,
  };
}
