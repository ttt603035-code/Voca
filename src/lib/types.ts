export type Level = "A1" | "A2" | "B1" | "B2" | "C1"

export const LEVELS: Level[] = ["A1", "A2", "B1", "B2", "C1"]

export interface Word {
  id: string
  word: string
  ipa: string
  pos: string
  meaning: string
  example: string
  exampleZh: string
  level: Level
  custom?: boolean
}

export type WordStatus = "new" | "learning" | "mastered"

export type Rating = "again" | "hard" | "good" | "easy"

export interface WordProgress {
  wordId: string
  status: WordStatus
  /** SM-2 记忆因子 */
  ease: number
  /** 当前记忆间隔（天） */
  interval: number
  /** 下次复习日期（yyyy-mm-dd） */
  due: string
  /** 总复习次数 */
  reps: number
  /** 遗忘次数 */
  lapses: number
  correct: number
  wrong: number
  lastRating: Rating | null
  lastReviewed: string | null
  createdAt: string
}

export interface DayStat {
  reviews: number
  correct: number
  wrong: number
}

export interface VocaState {
  words: Word[]
  progress: Record<string, WordProgress>
  settings: {
    dailyGoal: number
  }
  /** key: yyyy-mm-dd */
  activity: Record<string, DayStat>
}
