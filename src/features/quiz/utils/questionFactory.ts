import { QuizConfig, QuestionTemplateType, QuizQuestion, ElementItem, QuestionOption } from '../types'
import { t } from '@/shared/i18n'

export function buildQuestions(elements: ElementItem[], config: QuizConfig, lang: 'he' | 'en'): QuizQuestion[] {
  const N = Math.max(1, config.count)
  const pool = [...elements]
  const takeUnique = <T,>(arr: T[], n: number) => arr.sort(() => Math.random() - 0.5).slice(0, Math.min(n, arr.length))
  const sampleElement = () => pool[Math.floor(Math.random() * pool.length)]
  const nearestValues = (value: number, exclude: number, k: number) => {
    const uniques = Array.from(new Set(pool.map(e => e.value).filter(v => v !== exclude)))
    return uniques.sort((a,b) => Math.abs(a - value) - Math.abs(b - value)).slice(0, k)
  }
  const byCloseValue = (value: number, k: number, excludeIds: Set<string>) => {
    const sorted = [...pool].filter(e => !excludeIds.has(e.id)).sort((a,b) => Math.abs(a.value - value) - Math.abs(b.value - value))
    return sorted.slice(0, k)
  }
  const makeId = () => Math.random().toString(36).slice(2)
  const nameFor = (e: ElementItem) => lang === 'he' ? e.name.he : e.name.en
  const fmtVal = (v: number) => String(v)
  const timeLimit = config.timer === 'unlimited' ? 0 : config.timer

  const fill = (key: string, params: Record<string, string | number>) => {
    let s = t(lang, key) as string
    for (const [k, v] of Object.entries(params)) {
      s = s.replace(new RegExp(`{{${k}}}`, 'g'), String(v))
    }
    return s
  }

  const pickTemplateRandom = (): QuestionTemplateType => {
    const all: QuestionTemplateType[] = ['nameToValue','symbolToValue','valueToName','valueToSymbol']
    return all[Math.floor(Math.random() * all.length)]
  }

  const resolveTemplateFromCustom = (cfg: QuizConfig): QuestionTemplateType => {
    if (cfg.mapping === 'elementToValue') {
      if (cfg.prompt === 'name') return 'nameToValue'
      return 'symbolToValue'
    }
    if (cfg.mapping === 'valueToElement') {
      if (cfg.prompt === 'name') return 'valueToName'
      return 'valueToSymbol'
    }
    return 'nameToValue'
  }

  const shouldOpen = (template: QuestionTemplateType) => {
    if (config.mode === 'custom') return config.form === 'open'
    if (config.mode === 'random') return Math.random() < 0.5
    return false
  }

  const buildOne = (template: QuestionTemplateType): QuizQuestion => {
    const el = sampleElement()
    if (!el) throw new Error('No elements')

    if (template === 'nameToValue') {
      const prompt = fill('quiz.templates.nameToValue', { name: nameFor(el) })
      const correct: QuestionOption = { id: 'c', label: fmtVal(el.value), value: fmtVal(el.value) }
      if (shouldOpen(template)) {
        return { id: makeId(), template, prompt, correct, options: null, elementId: el.id, timeLimitSec: timeLimit }
      }
      const vals = nearestValues(el.value, el.value, 6)
      const distract = takeUnique(vals, 3).map((v,i) => ({ id: `d${i}`, label: fmtVal(v), value: fmtVal(v) }))
      const options = shuffle([correct, ...distract])
      return { id: makeId(), template, prompt, correct: options.find(o => o.value === correct.value)!, options, elementId: el.id, timeLimitSec: timeLimit }
    }

    if (template === 'symbolToValue') {
      const prompt = fill('quiz.templates.symbolToValue', { symbol: el.symbol })
      const correct: QuestionOption = { id: 'c', label: fmtVal(el.value), value: fmtVal(el.value) }
      if (shouldOpen(template)) {
        return { id: makeId(), template, prompt, correct, options: null, elementId: el.id, timeLimitSec: timeLimit }
      }
      const vals = nearestValues(el.value, el.value, 6)
      const distract = takeUnique(vals, 3).map((v,i) => ({ id: `d${i}`, label: fmtVal(v), value: fmtVal(v) }))
      const options = shuffle([correct, ...distract])
      return { id: makeId(), template, prompt, correct: options.find(o => o.value === correct.value)!, options, elementId: el.id, timeLimitSec: timeLimit }
    }

    if (template === 'valueToName') {
      const base = sampleElement()
      const target = base.value
      const prompt = fill('quiz.templates.valueToName', { value: fmtVal(target) })
      const correct: QuestionOption = { id: 'c', label: nameFor(base), value: base.id }
      if (shouldOpen(template)) {
        return { id: makeId(), template, prompt, correct, options: null, elementId: base.id, targetValue: target, timeLimitSec: timeLimit }
      }
      const exclude = new Set<string>([base.id])
      const near = byCloseValue(target, 8, exclude)
      const distract = takeUnique(near, 3).map((e,i) => ({ id: `d${i}`, label: nameFor(e), value: e.id }))
      const options = shuffle([correct, ...distract])
      return { id: makeId(), template, prompt, correct: options.find(o => o.value === correct.value)!, options, elementId: base.id, targetValue: target, timeLimitSec: timeLimit }
    }

    const base = sampleElement()
    const target = base.value
    const prompt = fill('quiz.templates.valueToSymbol', { value: fmtVal(target) })
    const correct: QuestionOption = { id: 'c', label: base.symbol, value: base.id }
    if (shouldOpen('valueToSymbol')) {
      return { id: makeId(), template: 'valueToSymbol', prompt, correct, options: null, elementId: base.id, targetValue: target, timeLimitSec: timeLimit }
    }
    const exclude = new Set<string>([base.id])
    const near = byCloseValue(target, 8, exclude)
    const distract = takeUnique(near, 3).map((e,i) => ({ id: `d${i}`, label: e.symbol, value: e.id }))
    const options = shuffle([correct, ...distract])
    return { id: makeId(), template: 'valueToSymbol', prompt, correct: options.find(o => o.value === correct.value)!, options, elementId: base.id, targetValue: target, timeLimitSec: timeLimit }
  }

  const list: QuizQuestion[] = []
  if (config.mode === 'custom') {
    const template = resolveTemplateFromCustom(config)
    for (let i = 0; i < N; i++) list.push(buildOne(template))
  } else {
    for (let i = 0; i < N; i++) list.push(buildOne(pickTemplateRandom()))
  }
  return list
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
