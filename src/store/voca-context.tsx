import * as React from "react"
import { SEED_WORDS } from "@/lib/seed-words"
import { defaultProgress, rateProgress, todayStr } from "@/lib/srs"
import type {
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
    settings: { dailyGoal: 10 },
    activity: {},
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
        return {
          words: parsed.words,
          progress: parsed.progress ?? {},
          settings: { ...base.settings, ...parsed.settings },
          activity: parsed.activity ?? {},
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
  | { type: "delete-word"; id: string }
  | { type: "reset-progress"; id: string }
  | { type: "rate"; wordId: string; rating: Rating }
  | { type: "quiz-answer"; wordId: string; correct: boolean }
  | { type: "set-goal"; goal: number }
  | { type: "reset-all" }

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
      const next = rateProgress(prev, action.rating, today)
      const day = state.activity[today] ?? { reviews: 0, correct: 0, wrong: 0 }
      return {
        ...state,
        progress: { ...state.progress, [action.wordId]: next },
        activity: {
          ...state.activity,
          [today]: {
            ...day,
            reviews: day.reviews + 1,
            correct: day.correct + (action.rating !== "again" ? 1 : 0),
            wrong: day.wrong + (action.rating === "again" ? 1 : 0),
          },
        },
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
      const day = state.activity[today] ?? { reviews: 0, correct: 0, wrong: 0 }
      return {
        ...state,
        progress: { ...state.progress, [action.wordId]: next },
        activity: {
          ...state.activity,
          [today]: {
            ...day,
            reviews: day.reviews + 1,
            correct: day.correct + (action.correct ? 1 : 0),
            wrong: day.wrong + (action.correct ? 0 : 1),
          },
        },
      }
    }
    case "set-goal":
      return {
        ...state,
        settings: {
          ...state.settings,
          dailyGoal: Math.max(1, Math.min(100, Math.round(action.goal))),
        },
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
  deleteWord: (id: string) => void
  resetWordProgress: (id: string) => void
  rateWord: (wordId: string, rating: Rating) => void
  recordQuizAnswer: (wordId: string, correct: boolean) => void
  setDailyGoal: (goal: number) => void
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
      deleteWord: (id) => dispatch({ type: "delete-word", id }),
      resetWordProgress: (id) => dispatch({ type: "reset-progress", id }),
      rateWord: (wordId, rating) =>
        dispatch({ type: "rate", wordId, rating }),
      recordQuizAnswer: (wordId, correct) =>
        dispatch({ type: "quiz-answer", wordId, correct }),
      setDailyGoal: (goal) => dispatch({ type: "set-goal", goal }),
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
