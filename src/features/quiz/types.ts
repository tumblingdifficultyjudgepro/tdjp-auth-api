export type Mode = 'custom' | 'random'
export type QuestionForm = 'mcq' | 'open'
export type PromptKind = 'symbol' | 'name'
export type Mapping = 'valueToElement' | 'elementToValue'
export type TimerPreset = 10 | 20 | 30 | 60 | 'unlimited'

export type QuizConfig = {
  mode: Mode
  form?: QuestionForm
  prompt?: PromptKind
  mapping?: Mapping
  count: number
  timer: TimerPreset
}

export type QuestionTemplateType = 'nameToValue' | 'symbolToValue' | 'valueToName' | 'valueToSymbol'

export type ElementItem = {
  id: string
  name: { he: string; en: string }
  symbol: string
  value: number
}

export type QuestionOption = { id: string; label: string; value: string }

export type QuizQuestion = {
  id: string
  template: QuestionTemplateType
  prompt: string
  correct: QuestionOption
  options: QuestionOption[] | null
  elementId?: string
  targetValue?: number
  timeLimitSec: number
}

export type QuestionResult = {
  questionId: string
  correct: boolean
  chosenOptionId?: string
  elapsedMs: number
}

export type QuizRunState = {
  questions: QuizQuestion[]
  index: number
  finished: boolean
  results: QuestionResult[]
}
