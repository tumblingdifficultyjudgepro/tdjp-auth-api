import * as React from 'react'
import he from '@/shared/i18n/he'
import en from '@/shared/i18n/en'
import { QuizConfig, ElementItem } from '../types'

type Option = { id: string; label: string }
type Template = 'nameToValue' | 'symbolToValue' | 'valueToName' | 'valueToSymbol'

export type Question = {
  id: string
  prompt: string
  template: Template
  options?: Option[]
  correct: { id: string; value: string }
  timeLimitSec: number
  symbol?: string
  name?: string
  value?: string
}

type Result = { qid: string; selectedId: string | null; correct: boolean; selectedText?: string }

type State = {
  questions: Question[]
  index: number
  finished: boolean
  results: Result[]
}

type Return = {
  state: State
  selectedId: string | null
  remaining: number
  locked: boolean
  onChoose: (id: string) => void
  onSubmit: (selectedId: string | null, selectedText?: string | null) => void
  next: () => void
}

function toVal(v: string | number): string {
  const n = Number(v)
  if (!Number.isNaN(n) && Number.isFinite(n) && Number.isInteger(n)) {
    return n.toFixed(1)
  }
  return String(v)
}

function pickN<T>(arr: T[], n: number): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, n)
}

function getT(lang: 'he' | 'en') {
  return lang === 'he' ? he.quiz.templates : en.quiz.templates
}

function tpl(s: string, vars: Record<string, string>) {
  return s.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? '')
}

function makeTemplate(config: QuizConfig, random: boolean): Template {
  if (random) {
    const all: Template[] = ['nameToValue', 'symbolToValue', 'valueToName', 'valueToSymbol']
    return all[Math.floor(Math.random() * all.length)]
  }
  if (config.mapping === 'elementToValue') {
    return config.prompt === 'symbol' ? 'symbolToValue' : 'nameToValue'
  } else {
    return config.prompt === 'symbol' ? 'valueToSymbol' : 'valueToName'
  }
}

function makePrompt(
  t: Template,
  item: ElementItem,
  lang: 'he' | 'en'
): { prompt: string; symbol?: string; name?: string; value?: string } {
  const v = toVal(item.value)
  const dict = getT(lang)
  if (t === 'nameToValue')   return { prompt: tpl(dict.nameToValue,   { name: lang === 'he' ? item.name.he : item.name.en }), name: lang === 'he' ? item.name.he : item.name.en }
  if (t === 'symbolToValue') return { prompt: tpl(dict.symbolToValue, { symbol: item.symbol }), symbol: item.symbol }
  if (t === 'valueToName')   return { prompt: tpl(dict.valueToName,   { value: v }), value: v }
  return                           { prompt: tpl(dict.valueToSymbol, { value: v }), value: v }
}

function buildQuestionFor(
  item: ElementItem,
  bank: ElementItem[],
  template: Template,
  timedSec: number,
  lang: 'he' | 'en'
): Question {
  const qid = `${template}:${item.id}`
  const { prompt, symbol, name, value } = makePrompt(template, item, lang)

  if (template === 'nameToValue' || template === 'symbolToValue') {
    const correctLabel = toVal(item.value)
    const distractorsRaw = bank
      .filter(b => b.id !== item.id)
      .map(b => toVal(b.value))
      .filter(v => v !== correctLabel)
      .filter((v, i, arr) => arr.indexOf(v) === i)
    const distractors = pickN(distractorsRaw, 3)
    const opts: Option[] = pickN(
      [{ id: 'correct', label: correctLabel }, ...distractors.map((v, i) => ({ id: `d${i}`, label: v }))],
      4
    )
    const correctId = opts.find(o => o.label === correctLabel)!.id
    return {
      id: qid,
      prompt,
      template,
      options: opts,
      correct: { id: correctId, value: correctLabel },
      timeLimitSec: timedSec,
      symbol,
      name,
    }
  } else {
    const answerLabel = template === 'valueToName' ? (lang === 'he' ? item.name.he : item.name.en) : item.symbol
    const wrongOptions = pickN(
      bank
        .filter(b => b.id !== item.id && Number(b.value) !== Number(item.value))
        .map(b => (template === 'valueToName' ? (lang === 'he' ? b.name.he : b.name.en) : b.symbol))
        .filter((v, i, arr) => arr.indexOf(v) === i),
      3
    )
    const opts: Option[] = pickN(
      [{ id: 'correct', label: answerLabel }, ...wrongOptions.map((v, i) => ({ id: `d${i}`, label: v }))],
      4
    )
    const correctId = opts.find(o => o.label === answerLabel)!.id
    return {
      id: qid,
      prompt,
      template,
      options: opts,
      correct: { id: correctId, value: answerLabel },
      timeLimitSec: timedSec,
      value,
    }
  }
}

function buildOpenQuestionFor(
  item: ElementItem,
  bank: ElementItem[],
  template: Template,
  timedSec: number,
  lang: 'he' | 'en'
): Question {
  const qid = `open:${template}:${item.id}`
  const { prompt, symbol, name, value } = makePrompt(template, item, lang)
  if (template === 'nameToValue' || template === 'symbolToValue') {
    return {
      id: qid,
      prompt,
      template,
      options: undefined,
      correct: { id: 'correct', value: toVal(item.value) },
      timeLimitSec: timedSec,
      symbol,
      name,
    }
  } else if (template === 'valueToName') {
    return {
      id: qid,
      prompt,
      template,
      options: undefined,
      correct: { id: 'correct', value: (lang === 'he' ? item.name.he : item.name.en) },
      timeLimitSec: timedSec,
      value,
    }
  } else {
    return {
      id: qid,
      prompt,
      template,
      options: undefined,
      correct: { id: 'correct', value: item.symbol },
      timeLimitSec: timedSec,
      value,
    }
  }
}

function buildFromSeed(
  list: ElementItem[],
  seedQids: string[],
  config: QuizConfig,
  lang: 'he' | 'en'
): Question[] {
  const timedSec = typeof config.timer === 'number' ? config.timer : 0
  return seedQids.map((qid) => {
    const isOpen = qid.startsWith('open:')
    const rest = isOpen ? qid.slice(5) : qid
    const [templateStr, itemId] = rest.split(':') as [Template, string]
    const item = list.find(x => String(x.id) === String(itemId))
    const template = templateStr as Template
    if (!item) return null as unknown as Question
    return isOpen
      ? buildOpenQuestionFor(item, list, template, timedSec, lang)
      : buildQuestionFor(item, list, template, timedSec, lang)
  }).filter(Boolean) as Question[]
}

function buildQuestions(list: ElementItem[], config: QuizConfig, lang: 'he' | 'en', seedQids?: string[]): Question[] {
  const seed = seedQids && seedQids.length ? seedQids : (config as any)?.seedQids
  if (seed && Array.isArray(seed) && seed.length > 0) {
    return buildFromSeed(list, seed, config, lang)
  }

  const count = Math.max(1, config.count)
  const timedSec = typeof config.timer === 'number' ? config.timer : 0
  const random = config.mode === 'random'
  const pool = pickN(list, count)

  return pool.map(item => {
    const tpl = makeTemplate(config, random)
    const isMcq = config.mode === 'random' ? Math.random() < 0.5 : config.form === 'mcq'
    if (isMcq) return buildQuestionFor(item, list, tpl, timedSec, lang)
    return buildOpenQuestionFor(item, list, tpl, timedSec, lang)
  })
}

export function useQuizRun(list: ElementItem[], config: QuizConfig, lang: 'he' | 'en', seedQids?: string[]): Return {
  const questionsRef = React.useRef<Question[] | null>(null)
  if (!questionsRef.current) {
    questionsRef.current = buildQuestions(list, config, lang, seedQids)
  }

  const [state, setState] = React.useState<State>({
    questions: questionsRef.current,
    index: 0,
    finished: questionsRef.current.length === 0,
    results: [],
  })

  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [locked, setLocked] = React.useState(false)
  const [remaining, setRemaining] = React.useState<number>(() => state.questions[0]?.timeLimitSec ?? 0)

  const intervalRef = React.useRef<number | null>(null)

  const stopTimer = React.useCallback(() => {
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startTimer = React.useCallback((limit: number) => {
    stopTimer()
    setRemaining(limit)
    if (limit === 0) return
    const id = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(id)
          intervalRef.current = null
          return 0
        }
        return prev - 1
      })
    }, 1000) as unknown as number
    intervalRef.current = id
  }, [stopTimer])

  React.useEffect(() => {
    const q = state.questions[state.index]
    startTimer(q?.timeLimitSec ?? 0)
    setLocked(false)
    setSelectedId(null)
  }, [state.index])

  const onChoose = React.useCallback((id: string) => {
    if (locked) return
    setSelectedId(id)
  }, [locked])

  const onSubmit = React.useCallback((sel: string | null, selectedText: string | null = null) => {
    const q = state.questions[state.index]
    if (!q) return
    const ok = sel != null && sel === q.correct.id
    const labelFromMcq = sel != null && q.options ? (q.options.find(o => o.id === sel)?.label) : undefined
    setState(prev => ({
      ...prev,
      results: [
        ...prev.results,
        {
          qid: q.id,
          selectedId: sel,
          correct: ok,
          selectedText: selectedText === '' ? '' : (selectedText ?? labelFromMcq),
        },
      ],
    }))
    setLocked(true)
    stopTimer()
  }, [state])

  const next = React.useCallback(() => {
    setState(prev => {
      const nextIndex = prev.index + 1
      if (nextIndex >= prev.questions.length) {
        return { ...prev, index: prev.index, finished: true }
      }
      return { ...prev, index: nextIndex }
    })
  }, [])

  React.useEffect(() => {
    return () => stopTimer()
  }, [stopTimer])

  return { state, selectedId, remaining, locked, onChoose, onSubmit, next }
}
