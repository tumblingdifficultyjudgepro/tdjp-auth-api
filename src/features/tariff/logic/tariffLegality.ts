import { ELEMENTS } from '@/shared/data/elements'

export type PassLegality = {
  badIdx: number[]
  messages: string[]
}

export type TariffLegalityResult = {
  pass1: PassLegality
  pass2: PassLegality
  crossMessages: string[]
  hasAnyIllegal: boolean

  p1: PassLegality
  p2: PassLegality
  both: string[]
  isLegal: boolean
}

function findIdByNameHe(name: string): string | null {
  const e = ELEMENTS.find(x => x.name.he === name)
  return e ? e.id : null
}

const ID_ARABIT = findIdByNameHe('ערבית')
const ID_BORG = findIdByNameHe('בורג')
const ID_TEMPO = findIdByNameHe('טמפו')
const ID_FLICK = findIdByNameHe('פליק פלאק')

const ALLOWED_INTRA_REPEAT = new Set<string>(
  [ID_TEMPO, ID_FLICK, ID_BORG].filter(Boolean) as string[]
)

const ALLOWED_CROSS_REPEAT = new Set<string>(
  [ID_TEMPO, ID_FLICK, ID_BORG, ID_ARABIT].filter(Boolean) as string[]
)

export function validatePasses(
  pass1Ids: Array<string | null | undefined> = [],
  pass2Ids: Array<string | null | undefined> = [],
  lang: 'he' | 'en' = 'he'
): TariffLegalityResult {
  const he = lang === 'he'

  const mkIdxMap = (arr: Array<string | null | undefined>) => {
    const m = new Map<string, number[]>()
    arr.forEach((id, i) => {
      if (!id) return
      if (!m.has(id)) m.set(id, [])
      m.get(id)!.push(i)
    })
    return m
  }

  function checkSinglePass(arr: Array<string | null | undefined>): PassLegality {
    const badIdxSet = new Set<number>()
    const messagesSet = new Set<string>()
    const m = mkIdxMap(arr)

    for (const [id, idxs] of m.entries()) {
      if (ALLOWED_INTRA_REPEAT.has(id)) continue
      if (idxs.length > 1) {
        idxs.forEach(i => badIdxSet.add(i))
        messagesSet.add(he ? 'חזרה על אלמנט בתוך הפס' : 'Element repeated in pass')
      }
    }

    const borgIdxs = m.get(ID_BORG || '') || []
    if (borgIdxs.length > 3) {
      borgIdxs.slice(3).forEach(i => badIdxSet.add(i))
      messagesSet.add(he ? 'מותר עד 3 ברגים אחורה בפס' : 'Max 3 back fulls per pass')
    }

    return { badIdx: Array.from(badIdxSet), messages: Array.from(messagesSet) }
  }

  const p1 = checkSinglePass(pass1Ids)
  const p2 = checkSinglePass(pass2Ids)

  const m1 = new Map<string, number[]>()
  pass1Ids.forEach((id, i) => {
    if (!id) return
    if (!m1.has(id)) m1.set(id, [])
    m1.get(id)!.push(i)
  })

  const m2 = new Map<string, number[]>()
  pass2Ids.forEach((id, i) => {
    if (!id) return
    if (!m2.has(id)) m2.set(id, [])
    m2.get(id)!.push(i)
  })

  const crossMsgs = new Set<string>()
  let hasCrossDup = false

  for (const [id, idxs1] of m1.entries()) {
    if (!id || ALLOWED_CROSS_REPEAT.has(id)) continue
    const idxs2 = m2.get(id) || []
    if (idxs1.length && idxs2.length) {
      hasCrossDup = true
      idxs1.forEach(i => {
        if (!p1.badIdx.includes(i)) p1.badIdx.push(i)
      })
      idxs2.forEach(i => {
        if (!p2.badIdx.includes(i)) p2.badIdx.push(i)
      })
    }
  }

  if (hasCrossDup) {
    crossMsgs.add(
      he ? 'חזרה על אלמנט בין פס 1 לפס 2' : 'Element repeated across passes'
    )
  }

  const lastIdx1 = (() => {
    for (let i = pass1Ids.length - 1; i >= 0; i--) if (pass1Ids[i]) return i
    return -1
  })()

  const lastIdx2 = (() => {
    for (let i = pass2Ids.length - 1; i >= 0; i--) if (pass2Ids[i]) return i
    return -1
  })()

  const p1EndsWithBorg = lastIdx1 >= 0 && pass1Ids[lastIdx1] === ID_BORG
  const p2EndsWithBorg = lastIdx2 >= 0 && pass2Ids[lastIdx2] === ID_BORG

  if (p1EndsWithBorg && p2EndsWithBorg) {
    if (lastIdx1 >= 0 && !p1.badIdx.includes(lastIdx1)) p1.badIdx.push(lastIdx1)
    if (lastIdx2 >= 0 && !p2.badIdx.includes(lastIdx2)) p2.badIdx.push(lastIdx2)
    crossMsgs.add(
      he
        ? 'רק אחד מהפסים יכול להסתיים ב״בורג אחורה״'
        : 'Only one pass may end with Back Full'
    )
  }

  const forwardIds = new Set<string>()
  const backwardIds = new Set<string>()

  ELEMENTS.forEach(e => {
    if (e.direction === 'forward') forwardIds.add(e.id)
    else if (e.direction === 'backward') backwardIds.add(e.id)
  })

  function analyzeDirectionRules(
    arr: Array<string | null | undefined>,
    passLeg: PassLegality
  ) {
    const n = arr.length
    let lastNonEmpty = -1
    for (let i = n - 1; i >= 0; i--) {
      if (arr[i]) {
        lastNonEmpty = i
        break
      }
    }

    for (let i = 0; i < n - 1; i++) {
      const id = arr[i]
      const nextId = arr[i + 1]
      if (!id || !nextId) continue

      const isCurrBack = backwardIds.has(id)
      const isNextForward = forwardIds.has(nextId)

      if ((id === ID_FLICK || id === ID_TEMPO) && isNextForward) {
        if (!passLeg.badIdx.includes(i)) passLeg.badIdx.push(i)
        if (!passLeg.badIdx.includes(i + 1)) passLeg.badIdx.push(i + 1)
        const msg =
          id === ID_FLICK
            ? he
              ? 'פליק פלאק לאלמנט קדימה'
              : 'Flick/Back Handspring into forward element'
            : he
            ? 'טמפו לאלמנט קדימה'
            : 'Tempo/Whip into forward element'
        if (!passLeg.messages.includes(msg)) passLeg.messages.push(msg)
      }

      if (isCurrBack && isNextForward) {
        if (i + 1 !== lastNonEmpty) {
          if (!passLeg.badIdx.includes(i)) passLeg.badIdx.push(i)
          if (!passLeg.badIdx.includes(i + 1)) passLeg.badIdx.push(i + 1)
          const msg = he
            ? 'שינוי כיוון תנועה באמצע פס'
            : 'Change of movement direction in middle of pass'
          if (!passLeg.messages.includes(msg)) passLeg.messages.push(msg)
        }
      }
    }
  }

  analyzeDirectionRules(pass1Ids, p1)
  analyzeDirectionRules(pass2Ids, p2)

  const hasAnyIllegal =
    p1.badIdx.length > 0 || p2.badIdx.length > 0 || crossMsgs.size > 0

  const result: TariffLegalityResult = {
    pass1: p1,
    pass2: p2,
    crossMessages: Array.from(crossMsgs),
    hasAnyIllegal,

    p1,
    p2,
    both: Array.from(crossMsgs),
    isLegal: !hasAnyIllegal,
  }

  return result
}
