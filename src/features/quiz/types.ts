export type Mode = 'custom' | 'random';
export type QuestionForm = 'mcq' | 'open';
export type PromptKind = 'symbol' | 'name';
export type Mapping = 'valueToElement' | 'elementToValue';

export type TimerPreset = 10 | 20 | 30 | 60 | 'unlimited';

export type QuizConfig = {
  mode: Mode;
  form?: QuestionForm;
  prompt?: PromptKind;
  mapping?: Mapping;
  count: number;
  timer: TimerPreset;
};
