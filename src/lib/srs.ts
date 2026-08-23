import type { Rating, Word, WordProgress, WordStatus } from "./types"

export function todayStr(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + days)
  return todayStr(d)
}

export function daysUntil(dateStr: string, today = todayStr()): number {
  const a = new Date(`${today}T00:00:00`).getTime()
  const b = new Date(`${dateStr}T00:00:00`).getTime()
  return Math.round((b - a) / 86_400_000)
}

export function defaultProgress(wordId: string): WordProgress {
  return {
    wordId,
    status: "new",
    ease: 2.5,
    interval: 0,
    due: todayStr(),
    reps: 0,
    lapses: 0,
    correct: 0,
    wrong: 0,
    lastRating: null,
    lastReviewed: null,
    createdAt: todayStr(),
  }
}

/** 简化版 SM-2：根据自评更新记忆状态 */
export function rateProgress(
  prev: WordProgress,
  rating: Rating,
  today = todayStr(),
): WordProgress {
  let { ease, interval } = prev
  let lapses = prev.lapses
  let status: WordStatus = prev.status === "new" ? "learning" : prev.status

  if (rating === "again") {
    if (prev.status !== "new") lapses += 1
    ease = Math.max(1.3, ease - 0.2)
    interval = 0
  } else if (rating === "hard") {
    ease = Math.max(1.3, ease - 0.15)
    interval = interval <= 0 ? 1 : Math.max(2, Math.round(interval * 1.2))
  } else if (rating === "good") {
    interval = interval <= 0 ? 1 : Math.max(2, Math.round(interval * ease))
  } else {
    ease = Math.min(3.0, ease + 0.15)
    interval = interval <= 0 ? 2 : Math.max(3, Math.round(interval * ease * 1.3))
  }

  if (interval >= 21) status = "mastered"

  return {
    ...prev,
    ease,
    interval,
    lapses,
    status,
    reps: prev.reps + 1,
    due: addDays(today, interval),
    lastRating: rating,
    lastReviewed: today,
  }
}

export function isDue(
  p: WordProgress | undefined,
  today = todayStr(),
): p is WordProgress {
  if (!p || p.status === "new") return false
  return p.due <= today
}

/** 连续学习天数（今天或昨天开始往前数） */
export function calcStreak(activity: Record<string, { reviews: number }>): number {
  let day = new Date()
  // 如果今天还没复习，从昨天开始算，保留昨天的连续记录
  if (!activity[todayStr(day)]?.reviews) day = new Date(day.getTime() - 86_400_000)
  let streak = 0
  for (;;) {
    if (activity[todayStr(day)]?.reviews) {
      streak += 1
      day = new Date(day.getTime() - 86_400_000)
    } else break
  }
  return streak
}

export function pickWordOfTheDay(words: Word[]): Word | null {
  if (words.length === 0) return null
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const dayOfYear = Math.floor(
    (now.getTime() - start.getTime()) / 86_400_000,
  )
  return words[dayOfYear % words.length]
}

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
