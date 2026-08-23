/* ─────────────────────── 词库结构（Book → List → Word 三层，顺序永久保留） ─────────────────────── */

export interface Book {
  id: string
  name: string
  /** 内置词库（来自 public/vocabulary/*.json，只读） */
  builtIn?: boolean
}

export interface VocaList {
  id: string
  bookId: string
  name: string
  listOrder: number
  builtIn?: boolean
}

export interface Word {
  id: string
  listId: string
  /** 词书内原始序号，永久保留，不可重排 */
  wordOrder: number
  word: string
  ipa: string
  pos: string
  meaning: string
  example: string
  exampleZh: string
  custom?: boolean
  favorite?: boolean
  /** 内置词库单词（只读） */
  builtIn?: boolean
}

/* ─────────────────────── 学习进度 ─────────────────────── */

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
  reps: number
  lapses: number
  correct: number
  wrong: number
  lastRating: Rating | null
  lastReviewed: string | null
  createdAt: string
}

export interface DayStat {
  reviews: number
  learned: number
  reviewed: number
  seconds: number
}

/* ─────────────────────── 易混词（Similar Words） ─────────────────────── */

export interface SimilarWordEntry {
  word: string
  ipa?: string
  pos?: string
  meaning?: string
  diff?: string
  /** 若该词存在于词库中，记录 word id 以便关联 */
  wordId?: string
}

export interface SimilarGroup {
  id: string
  title: string
  tip?: string
  words: SimilarWordEntry[]
  builtIn?: boolean
}

/* ─────────────────────── 全局状态 ─────────────────────── */

export type Lang = "zh" | "en"

export interface VocaState {
  books: Book[]
  lists: VocaList[]
  words: Word[]
  similarGroups: SimilarGroup[]
  progress: Record<string, WordProgress>
  settings: {
    dailyGoal: number
    accentId: string | null
    geminiKey: string
    /** 界面语言 */
    language: Lang
    /** 发音声音 */
    voice: "en-US" | "en-GB"
    /** 是否启用发音 */
    sound: boolean
  }
  /** key: yyyy-mm-dd */
  activity: Record<string, DayStat>
  /** 内置词库加载状态（不持久化，每次启动从 JSON 读取） */
  builtIn: {
    loaded: boolean
    error: string | null
  }
}
