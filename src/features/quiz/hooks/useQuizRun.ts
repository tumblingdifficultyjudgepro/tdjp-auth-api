import { useEffect, useMemo, useRef, useState } from 'react'
import { QuizRunState, QuizConfig, QuestionResult, ElementItem } from '../types'
import { buildQuestions } from '../utils/questionFactory'

export function useQuizRun(elements: ElementItem[], config: QuizConfig, lang: 'he' | 'en') {
  const questions = useMemo(() => buildQuestions(elements, config, lang), [elements, config, lang])
  const [state, setState] = useState<QuizRunState>({ questions, index: 0, finished: false, results: [] })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)
  const t0 = useRef<number | null>(null)
  const [remaining, setRemaining] = useState<number>(questions[0]?.timeLimitSec ?? 0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    startTimer()
    return stopTimer
  }, [state.index])

  function startTimer() {
    stopTimer()
    const limit = state.questions[state.index]?.timeLimitSec ?? 0
    setRemaining(limit)
    t0.current = Date.now()
    if (limit === 0) return
    timerRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          onSubmit(null)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }

  function onChoose(optionId: string) {
    if (locked) return
    setSelectedId(optionId)
  }

  function onSubmit(optId: string | null) {
    if (locked) return
    setLocked(true)
    const q = state.questions[state.index]
    const correct = optId ? optId === q.correct.id : false
    const elapsed = t0.current ? Date.now() - t0.current : 0
    const result: QuestionResult = { questionId: q.id, correct, chosenOptionId: optId ?? undefined, elapsedMs: elapsed }
    setState(s => ({ ...s, results: [...s.results, result] }))
    setTimeout(() => next(), 400)
  }

  function next() {
    stopTimer()
    setLocked(false)
    setSelectedId(null)
    setState(s => {
      const last = s.index >= s.questions.length - 1
      if (last) return { ...s, finished: true }
      return { ...s, index: s.index + 1 }
    })
  }

  return {
    state,
    selectedId,
    remaining,
    onChoose,
    onSubmit,
  }
}
