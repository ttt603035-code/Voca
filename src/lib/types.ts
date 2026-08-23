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
  /** 当天学习的单词总数（learned + reviewed） */
  reviews: number
  /** 当天新学的词数 */
  learned: number
  /** 当天复习的词数 */
  reviewed: number
  /** 当天学习时长（秒） */
  seconds: number
}

export interface VocaState {
  words: Word[]
  progress: Record<string, WordProgress>
  settings: {
    dailyGoal: number
    /** 主题色预设 id，null 为默认翡翠绿 */
    accentId: string | null
    /** Gemini API Key（预留，后续接入 AI 功能） */
    geminiKey: string
  }
  /** key: yyyy-mm-dd */
  activity: Record<string, DayStat>
}
