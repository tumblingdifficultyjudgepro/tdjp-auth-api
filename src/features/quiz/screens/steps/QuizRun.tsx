import React from 'react'
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { Audio } from 'expo-av'
import { useLang } from '@/shared/state/lang'
import { useAppTheme } from '@/shared/theme/theme'
import { useQuizRun } from '../../hooks/useQuizRun'
import { QuizConfig, ElementItem } from '../../types'
import QuestionHeader from '../../components/QuestionHeader'
import McqOption from '../../components/McqOption'
import OpenAnswerBar from '../../components/OpenAnswerBar'
import { ELEMENTS } from '@/shared/data/elements'
import { useFonts, FrankRuhlLibre_700Bold } from '@expo-google-fonts/frank-ruhl-libre'
import { evaluateOpenAnswer, toVal } from '@/features/quiz/utils/answerRules'

type RouteParams = { config: QuizConfig; seedQids?: string[] }

const KEYBOARD_BOTTOM_GAP = -30

export default function QuizRun() {
  const route = useRoute<any>()
  const nav = useNavigation<any>()
  const { config, seedQids } = route.params as RouteParams
  const { lang } = useLang()
  const { colors } = useAppTheme()

  const [fontsLoaded] = useFonts({ FrankRuhlLibre_700Bold })

  const successRef = React.useRef<Audio.Sound | null>(null)
  const failRef = React.useRef<Audio.Sound | null>(null)

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true })
        const [s, f] = await Promise.all([
          Audio.Sound.createAsync(require('../../../../../assets/success.mp3'), { shouldPlay: false }),
          Audio.Sound.createAsync(require('../../../../../assets/fail.mp3'), { shouldPlay: false }),
        ])
        if (!mounted) {
          await s.sound.unloadAsync()
          await f.sound.unloadAsync()
          return
        }
        successRef.current = s.sound
        failRef.current = f.sound
      } catch {}
    })()
    return () => {
      mounted = false
      if (successRef.current) {
        successRef.current.unloadAsync().catch(() => {})
        successRef.current = null
      }
      if (failRef.current) {
        failRef.current.unloadAsync().catch(() => {})
        failRef.current = null
      }
    }
  }, [])

  const play = async (snd: Audio.Sound | null) => {
    if (!snd) return
    try {
      const st = await snd.getStatusAsync()
      if ('isLoaded' in st && st.isLoaded) {
        await snd.setPositionAsync(0)
        await snd.playAsync()
      }
    } catch {}
  }

  const playSuccess = () => play(successRef.current)
  const playFail = () => play(failRef.current)

  const list = React.useMemo<ElementItem[]>(() => ELEMENTS as unknown as ElementItem[], [])
  const { state, selectedId, remaining, locked, onChoose, onSubmit, next } = useQuizRun(list, config, lang, seedQids)

  React.useEffect(() => {
    if (state.finished) {
      const qids = state.results.map(r => r.qid)
      nav.navigate('QuizSummary', { results: state.results, config, qids })
    }
  }, [state.finished])

  const q = state.questions[state.index]
  if (!q) return null

  const isRTL = lang === 'he'
  const showOptions = Array.isArray(q.options)
  const timeLimit = q.timeLimitSec
  const [statusById, setStatusById] = React.useState<Record<string, 'idle' | 'correct' | 'wrong'>>({})
  const [answerText, setAnswerText] = React.useState('')

  const [openStatus, setOpenStatus] = React.useState<'idle' | 'correct' | 'wrong'>('idle')
  const [openCorrectText, setOpenCorrectText] = React.useState<string>('')
  const [openCorrectSymbol, setOpenCorrectSymbol] = React.useState<string>('')

  React.useEffect(() => {
    setStatusById({})
    setAnswerText('')
    setOpenStatus('idle')
    setOpenCorrectText('')
    setOpenCorrectSymbol('')
  }, [state.index])

  const handleOptionPress = (optId: string) => {
    if (locked) return
    onChoose(optId)
    const isCorrect = optId === q.correct.id
    const statuses: Record<string, 'idle' | 'correct' | 'wrong'> = {}
    q.options!.forEach(o => { if (o.id === q.correct.id) statuses[o.id] = 'correct' })
    if (!isCorrect) statuses[optId] = 'wrong'
    setStatusById(statuses)
    isCorrect ? playSuccess() : playFail()
    onSubmit(optId)
    setTimeout(() => next(), 2000)
  }

  const deriveOpenMode = (): 'name' | 'value' | 'symbol' => {
    if (q.template === 'nameToValue' || q.template === 'symbolToValue') return 'value'
    if (q.template === 'valueToName') return 'name'
    return 'symbol'
  }

  const normalizeNumeric = (s: string) => {
    const n = Number((s || '').replace(',', '.'))
    if (!isFinite(n)) return s.trim()
    return Number.isInteger(n) ? n.toFixed(1) : String(n)
  }

  const handleOpenSubmit = () => {
    if (locked) return
    const expected = q.correct.value
    const user = answerText.trim()
    if (user.length === 0 && user !== '0') return

    const evalRes = evaluateOpenAnswer({
      template: q.template as any,
      userText: user,
      correctValue: expected,
      valueForPrompt: (q as any).value,
      list,
      lang,
    })

    if (evalRes.ok) {
      setOpenStatus('correct')
      setOpenCorrectText('')
      setOpenCorrectSymbol('')
      playSuccess()
    } else {
      setOpenStatus('wrong')
      setOpenCorrectText(lang === 'he' ? 'התשובה הנכונה:' : 'Correct answer:')
      const correctForUi =
        q.template === 'valueToName'
          ? (evalRes.correctText ?? expected)
          : q.template === 'valueToSymbol'
          ? (evalRes.correctSymbol ?? expected)
          : toVal(expected)
      setOpenCorrectSymbol(String(correctForUi))
      playFail()
    }

    onSubmit(evalRes.ok ? q.correct.id : null, user)
    setTimeout(() => next(), 2000)
  }

  React.useEffect(() => {
    if (timeLimit === 0) return
    if (remaining === 0 && !locked) {
      if (showOptions) {
        const s: Record<string, 'idle' | 'correct' | 'wrong'> = {}
        if (q?.options) q.options.forEach(o => { if (o.id === q.correct.id) s[o.id] = 'correct' })
        setStatusById(s)
        onSubmit(null)
      } else {
        setOpenStatus('wrong')
        setOpenCorrectText(lang === 'he' ? 'התשובה הנכונה:' : 'Correct answer:')
        const evalRes = evaluateOpenAnswer({
          template: q.template as any,
          userText: '',
          correctValue: q.correct.value,
          valueForPrompt: (q as any).value,
          list,
          lang,
        })
        const correctForUi =
          q.template === 'valueToName'
            ? (evalRes.correctText ?? q.correct.value)
            : q.template === 'valueToSymbol'
            ? (evalRes.correctSymbol ?? q.correct.value)
            : toVal(q.correct.value)
        setOpenCorrectSymbol(String(correctForUi))
        playFail()
        onSubmit(null, '')
      }
      setTimeout(() => next(), 2000)
    }
  }, [remaining, locked])

  const symbolForPrompt = String((q as any).symbol ?? '')
  const nameForPrompt   = String((q as any).name   ?? '')
  const valueForPrompt  = String((q as any).value  ?? '')

  const showSymbol = q.template === 'symbolToValue' && !!symbolForPrompt
  const showName   = q.template === 'nameToValue'   && !!nameForPrompt
  const showValue  = (q.template === 'valueToName' || q.template === 'valueToSymbol') && !!valueForPrompt

  const PromptNode = (
    <View style={styles.promptWrap}>
      <Text style={[styles.promptTop, { color: colors.text, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
        {q.prompt}
      </Text>

      {showSymbol && (
        <Text
          style={[
            styles.promptBig,
            {
              color: colors.text,
              fontFamily: fontsLoaded ? 'FrankRuhlLibre_700Bold' : Platform.select({ ios: 'Courier New', android: 'monospace', default: undefined }),
              fontWeight: 'normal',
              writingDirection: 'ltr',
            },
          ]}
        >
          {'\u2066'}{symbolForPrompt}{'\u2069'}
        </Text>
      )}

      {showName && (
        <Text
          style={[
            styles.promptBig,
            {
              color: colors.text,
              fontFamily: fontsLoaded ? 'FrankRuhlLibre_700Bold' : undefined,
              fontWeight: 'normal',
              writingDirection: isRTL ? 'rtl' : 'ltr',
            },
          ]}
        >
          {nameForPrompt}
        </Text>
      )}

      {showValue && (
        <Text
          style={[
            styles.promptBig,
            {
              color: colors.text,
              fontFamily: fontsLoaded ? 'FrankRuhlLibre_700Bold' : Platform.select({ ios: 'Courier New', android: 'monospace', default: undefined }),
              fontWeight: 'normal',
              writingDirection: 'ltr',
            },
          ]}
        >
          {'\u2066'}{valueForPrompt}{'\u2069'}
        </Text>
      )}
    </View>
  )

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <QuestionHeader index={state.index} total={state.questions.length} remainingSec={remaining} timeLimitSec={timeLimit} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {PromptNode}
        {showOptions && (
          <View style={styles.options}>
            {q.options!.map(opt => (
              <McqOption
                key={opt.id}
                label={opt.label}
                selected={selectedId === opt.id}
                colors={colors}
                onPress={() => handleOptionPress(opt.id)}
                status={statusById[opt.id] ?? 'idle'}
                minHeight={72}
                paddingH={16}
                paddingV={16}
                borderRadius={16}
                borderWidth={2}
                labelSize={18}
                spacing={12}
                align="stretch"
              />
            ))}
          </View>
        )}
      </ScrollView>
      {!showOptions && (
        <OpenAnswerBar
          mode={deriveOpenMode()}
          colors={colors}
          value={answerText}
          onChange={setAnswerText}
          onSubmit={handleOpenSubmit}
          lang={lang}
          isRTL={isRTL}
          placeholder=""
          status={openStatus}
          correctAnswerText={openCorrectText}
          correctAnswerSymbol={openCorrectSymbol}
          bottomOffset={KEYBOARD_BOTTOM_GAP}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  promptWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  promptTop: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  promptBig: {
    fontSize: 36,
    marginTop: 8,
    textAlign: 'center',
    includeFontPadding: false,
  },
  options: { marginTop: 16, alignItems: 'stretch', width: '100%' },
})
