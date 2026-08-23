import * as React from "react"
import { SEED_WORDS } from "@/lib/seed-words"
import { defaultProgress, rateProgress, todayStr } from "@/lib/srs"
import type {
  DayStat,
  Rating,
  VocaState,
  Word,
  WordProgress,
} from "@/lib/types"

const STORAGE_KEY = "voca-state-v1"

function defaultState(): VocaState {
  return {
    words: SEED_WORDS,
    progress: {},
    settings: {
      dailyGoal: 10,
      accentId: null,
      geminiKey: "",
    },
    activity: {},
  }
}

function normalizeDay(raw: Partial<DayStat> | undefined): DayStat {
  const learned = raw?.learned ?? 0
  const reviewed = raw?.reviewed ?? 0
  return {
    reviews: raw?.reviews ?? learned + reviewed,
    learned,
    reviewed,
    seconds: raw?.seconds ?? 0,
  }
}

function loadState(): VocaState {
  if (typeof window === "undefined") return defaultState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<VocaState>
      if (parsed && Array.isArray(parsed.words) && parsed.words.length > 0) {
        const base = defaultState()
        const activity: Record<string, DayStat> = {}
        for (const [k, v] of Object.entries(parsed.activity ?? {})) {
          activity[k] = normalizeDay(v)
        }
        return {
          words: parsed.words,
          progress: parsed.progress ?? {},
          settings: { ...base.settings, ...parsed.settings },
          activity,
        }
      }
    }
  } catch {
    // 数据损坏时回退到默认状态
  }
  return defaultState()
}

type Action =
  | { type: "add-word"; word: Omit<Word, "id"> }
  | { type: "update-word"; id: string; word: Omit<Word, "id"> }
  | { type: "toggle-favorite"; id: string }
  | { type: "delete-word"; id: string }
  | { type: "reset-progress"; id: string }
  | { type: "rate"; wordId: string; rating: Rating }
  | { type: "quiz-answer"; wordId: string; correct: boolean }
  | { type: "record-time"; seconds: number }
  | { type: "set-goal"; goal: number }
  | { type: "set-accent"; id: string | null }
  | { type: "set-gemini-key"; key: string }
  | { type: "reset-all" }

function touchDay(
  activity: Record<string, DayStat>,
  today: string,
  patch: Partial<DayStat>,
): Record<string, DayStat> {
  const day = activity[today] ?? {
    reviews: 0,
    learned: 0,
    reviewed: 0,
    seconds: 0,
  }
  return {
    ...activity,
    [today]: {
      reviews: day.reviews + (patch.learned ?? 0) + (patch.reviewed ?? 0),
      learned: day.learned + (patch.learned ?? 0),
      reviewed: day.reviewed + (patch.reviewed ?? 0),
      seconds: day.seconds + (patch.seconds ?? 0),
    },
  }
}

function reducer(state: VocaState, action: Action): VocaState {
  switch (action.type) {
    case "add-word": {
      const word: Word = { ...action.word, id: crypto.randomUUID() }
      return { ...state, words: [word, ...state.words] }
    }
    case "update-word":
      return {
        ...state,
        words: state.words.map((w) =>
          w.id === action.id ? { ...action.word, id: w.id } : w,
        ),
      }
    case "toggle-favorite":
      return {
        ...state,
        words: state.words.map((w) =>
          w.id === action.id ? { ...w, favorite: !w.favorite } : w,
        ),
      }
    case "delete-word": {
      const progress = { ...state.progress }
      delete progress[action.id]
      return {
        ...state,
        words: state.words.filter((w) => w.id !== action.id),
        progress,
      }
    }
    case "reset-progress": {
      const progress = { ...state.progress }
      delete progress[action.id]
      return { ...state, progress }
    }
    case "rate": {
      const today = todayStr()
      const prev = state.progress[action.wordId] ?? defaultProgress(action.wordId)
      const rated = rateProgress(prev, action.rating, today)
      const next = {
        ...rated,
        correct: rated.correct + (action.rating !== "again" ? 1 : 0),
        wrong: rated.wrong + (action.rating === "again" ? 1 : 0),
      }
      const learned = prev.reps === 0
      return {
        ...state,
        progress: { ...state.progress, [action.wordId]: next },
        activity: touchDay(state.activity, today, {
          learned: learned ? 1 : 0,
          reviewed: learned ? 0 : 1,
        }),
      }
    }
    case "quiz-answer": {
      const today = todayStr()
      const prev = state.progress[action.wordId] ?? defaultProgress(action.wordId)
      const next: WordProgress = {
        ...prev,
        correct: prev.correct + (action.correct ? 1 : 0),
        wrong: prev.wrong + (action.correct ? 0 : 1),
      }
      const learned = prev.reps === 0
      return {
        ...state,
        progress: { ...state.progress, [action.wordId]: next },
        activity: touchDay(state.activity, today, {
          learned: learned ? 1 : 0,
          reviewed: learned ? 0 : 1,
        }),
      }
    }
    case "record-time":
      if (action.seconds <= 0) return state
      return {
        ...state,
        activity: touchDay(state.activity, todayStr(), {
          seconds: Math.round(action.seconds),
        }),
      }
    case "set-goal":
      return {
        ...state,
        settings: {
          ...state.settings,
          dailyGoal: Math.max(1, Math.min(100, Math.round(action.goal))),
        },
      }
    case "set-accent":
      return {
        ...state,
        settings: { ...state.settings, accentId: action.id },
      }
    case "set-gemini-key":
      return {
        ...state,
        settings: { ...state.settings, geminiKey: action.key.trim() },
      }
    case "reset-all":
      return defaultState()
    default:
      return state
  }
}

interface VocaContextValue {
  state: VocaState
  addWord: (word: Omit<Word, "id">) => void
  updateWord: (id: string, word: Omit<Word, "id">) => void
  toggleFavorite: (id: string) => void
  deleteWord: (id: string) => void
  resetWordProgress: (id: string) => void
  rateWord: (wordId: string, rating: Rating) => void
  recordQuizAnswer: (wordId: string, correct: boolean) => void
  recordTime: (seconds: number) => void
  setDailyGoal: (goal: number) => void
  setAccent: (id: string | null) => void
  setGeminiKey: (key: string) => void
  resetAll: () => void
}

const VocaContext = React.createContext<VocaContextValue | null>(null)

export function VocaProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [state, dispatch] = React.useReducer(reducer, undefined, loadState)

  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // 存储不可用时忽略
    }
  }, [state])

  const value = React.useMemo<VocaContextValue>(
    () => ({
      state,
      addWord: (word) => dispatch({ type: "add-word", word }),
      updateWord: (id, word) => dispatch({ type: "update-word", id, word }),
      toggleFavorite: (id) => dispatch({ type: "toggle-favorite", id }),
      deleteWord: (id) => dispatch({ type: "delete-word", id }),
      resetWordProgress: (id) => dispatch({ type: "reset-progress", id }),
      rateWord: (wordId, rating) => dispatch({ type: "rate", wordId, rating }),
      recordQuizAnswer: (wordId, correct) =>
        dispatch({ type: "quiz-answer", wordId, correct }),
      recordTime: (seconds) => dispatch({ type: "record-time", seconds }),
      setDailyGoal: (goal) => dispatch({ type: "set-goal", goal }),
      setAccent: (id) => dispatch({ type: "set-accent", id }),
      setGeminiKey: (key) => dispatch({ type: "set-gemini-key", key }),
      resetAll: () => dispatch({ type: "reset-all" }),
    }),
    [state],
  )

  return <VocaContext.Provider value={value}>{children}</VocaContext.Provider>
}

export function useVoca(): VocaContextValue {
  const ctx = React.useContext(VocaContext)
  if (!ctx) throw new Error("useVoca must be used within a VocaProvider")
  return ctx
}

/* ─────────────────────── 选择器 ─────────────────────── */

export function getProgress(
  state: VocaState,
  wordId: string,
): WordProgress {
  return state.progress[wordId] ?? defaultProgress(wordId)
}

export function isWordDue(
  state: VocaState,
  wordId: string,
  today = todayStr(),
): boolean {
  const p = state.progress[wordId]
  if (!p || p.status === "new") return false
  return p.due <= today
}

export function dueWords(state: VocaState, today = todayStr()): Word[] {
  return state.words
    .filter((w) => isWordDue(state, w.id, today))
    .sort(
      (a, b) =>
        (state.progress[a.id]?.due ?? "").localeCompare(
          state.progress[b.id]?.due ?? "",
        ) || a.word.localeCompare(b.word),
    )
}

export function newWords(state: VocaState): Word[] {
  return state.words
    .filter((w) => !state.progress[w.id])
    .sort((a, b) => a.word.localeCompare(b.word))
}

export function todayReviews(state: VocaState, today = todayStr()): number {
  return state.activity[today]?.reviews ?? 0
}
