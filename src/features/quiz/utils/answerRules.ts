// src/features/quiz/utils/answerRules.ts
import type { ElementItem } from "../types"

/* ------------------------- text normalization & fuzzy match ------------------------- */

function norm(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0591-\u05C7]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function tokenSimilarity(a: string, b: string): number {
  const A = new Set(norm(a).split(" ").filter(Boolean))
  const B = new Set(norm(b).split(" ").filter(Boolean))
  if (A.size === 0 || B.size === 0) return 0
  let inter = 0
  for (const t of A) if (B.has(t)) inter++
  return inter / Math.max(A.size, B.size)
}

function levenshtein(a: string, b: string): number {
  a = norm(a); b = norm(b)
  const m = a.length, n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      )
    }
  }
  return dp[m][n]
}

function fuzzyEqualsName(user: string, candidate: string): boolean {
  const sim = tokenSimilarity(user, candidate)
  if (sim >= 0.6) return true
  const a = norm(user), b = norm(candidate)
  if (a && b && (a.includes(b) || b.includes(a))) return true
  const dist = levenshtein(user, candidate)
  const maxLen = Math.max(a.length, b.length) || 1
  return dist / maxLen <= 0.3
}

/* ------------------------- value helpers ------------------------- */

export function toVal(v: string | number): string {
  const n = Number(v)
  if (!Number.isNaN(n) && Number.isFinite(n) && Number.isInteger(n)) return n.toFixed(1)
  return String(v)
}

function numericEqual(a: string, b: string): boolean {
  const pa = Number((a || "").replace(",", "."))
  const pb = Number((b || "").replace(",", "."))
  if (!Number.isFinite(pa) || !Number.isFinite(pb)) return a.trim() === b.trim()
  const fa = Number.isInteger(pa) ? pa.toFixed(1) : String(pa)
  const fb = Number.isInteger(pb) ? pb.toFixed(1) : String(pb)
  return fa === fb
}

/* ------------------------- value grouping ------------------------- */

function getNamesByValue(value: number | string, list: ElementItem[], lang: 'he'|'en'): string[] {
  const v = Number(value)
  return list
    .filter(x => Number(x.value) === v)
    .map(x => (lang === 'he' ? x.name.he : x.name.en))
}

function getSymbolsByValue(value: number | string, list: ElementItem[]): string[] {
  const v = Number(value)
  return list
    .filter(x => Number(x.value) === v)
    .map(x => x.symbol)
}

/* ------------------------- tiny util ------------------------- */

function pickOne<T>(arr: T[]): T | undefined {
  if (!arr || arr.length === 0) return undefined
  return arr[Math.floor(Math.random() * arr.length)]
}

/* ------------------------- open questions evaluator ------------------------- */

export type OpenEvalResult = {
  ok: boolean
  correctText?: string
  correctSymbol?: string
}

export function evaluateOpenAnswer(args: {
  template: 'nameToValue' | 'symbolToValue' | 'valueToName' | 'valueToSymbol',
  userText: string,
  correctValue: string,
  valueForPrompt?: string,
  list: ElementItem[],
  lang: 'he'|'en'
}): OpenEvalResult {
  const { template, userText, correctValue, valueForPrompt, list, lang } = args
  const user = (userText || "").trim()
  if (!user) return { ok: false }

  if (template === 'valueToName') {
    const names = getNamesByValue(valueForPrompt ?? correctValue, list, lang)
    const matched = names.some(nm => fuzzyEqualsName(user, nm))
    return matched ? { ok: true } : { ok: false, correctText: pickOne(names) || correctValue }
  }

  if (template === 'valueToSymbol') {
    const symbols = getSymbolsByValue(valueForPrompt ?? correctValue, list)
    const matched = symbols.some(sym => user === sym)
    return matched ? { ok: true } : { ok: false, correctSymbol: pickOne(symbols) || correctValue }
  }

  return { ok: numericEqual(user, correctValue) }
}

/* ------------------------- MCQ generators (harder & unique) ------------------------- */

/** returns unique numeric values (as numbers) present in bank */
function uniqueNumericValues(bank: ElementItem[]): number[] {
  return Array.from(new Set(bank.map(b => Number(b.value)))).filter(v => Number.isFinite(v))
}

/** pick 3 closest unique values to correct (excluding correct), formatted with toVal */
export function closestValueDistractors(
  bank: ElementItem[],
  correctValue: number,
  take = 3
): string[] {
  const uniq = uniqueNumericValues(bank)
  const others = uniq.filter(v => v !== correctValue)
  const sorted = others.sort((a, b) => Math.abs(a - correctValue) - Math.abs(b - correctValue))
  return sorted.slice(0, take).map(toVal)
}

/** representative label (name/symbol) for a given value to avoid duplicate-value options */
export function representativeForValue(
  bank: ElementItem[],
  value: number,
  pick: 'name-he' | 'name-en' | 'symbol'
): string | undefined {
  const found = bank.find(x => Number(x.value) === value)
  if (!found) return undefined
  if (pick === 'symbol') return found.symbol
  return pick === 'name-he' ? found.name.he : found.name.en
}

/** shuffle helper */
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Build MCQ options for "…toValue" templates:
 * - 1 correct value (formatted)
 * - 3 closest unique distractors (formatted)
 * - shuffled
 * - strictly unique labels (no duplicates)
 */
export function makeValueMcqOptions(bank: ElementItem[], correctValue: number): string[] {
  const correct = toVal(correctValue)
  const dists = closestValueDistractors(bank, correctValue, 3)
  const set = new Set<string>([correct, ...dists])
  const labels = Array.from(set)
  if (labels.length < 4) {
    const more = uniqueNumericValues(bank)
      .filter(v => v !== correctValue && !set.has(toVal(v)))
      .sort((a, b) => Math.abs(a - correctValue) - Math.abs(b - correctValue))
      .map(toVal)
    for (const v of more) {
      set.add(v)
      if (set.size >= 4) break
    }
  }
  return shuffle(Array.from(set).slice(0, 4))
}
