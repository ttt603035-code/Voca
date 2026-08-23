import * as React from "react"
import {
  SEED_BOOKS,
  SEED_LISTS,
  SEED_WORDS,
  LEVEL_TO_LIST,
} from "@/lib/seed-words"
import {
  SEED_SIMILAR_GROUPS,
  linkGroupWordIds,
} from "@/lib/confusables"
import { defaultProgress, rateProgress, todayStr } from "@/lib/srs"
import type { ImportPayload } from "@/lib/import-vocab"
import type {
  DayStat,
  Rating,
  SimilarGroup,
  SimilarWordEntry,
  VocaState,
  Word,
  WordProgress,
} from "@/lib/types"

const STORAGE_KEY = "voca-state-v1"

function seedSimilarGroups(): SimilarGroup[] {
  const idByWord = new Map(SEED_WORDS.map((w) => [w.word.toLowerCase(), w.id]))
  return linkGroupWordIds(SEED_SIMILAR_GROUPS, idByWord)
}

function defaultState(): VocaState {
  return {
    books: SEED_BOOKS,
    lists: SEED_LISTS,
    words: SEED_WORDS,
    similarGroups: seedSimilarGroups(),
    progress: {},
    settings: {
      dailyGoal: 10,
      accentId: null,
      geminiKey: "",
      language: "zh",
      voice: "en-US",
      sound: true,
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

/**
 * 迁移：旧版扁平词库（words.level）→ Book/List 结构。
 * 单词 id 保持稳定，学习进度可继续生效。
 */
function migrateOldState(parsed: any): VocaState {
  const base = defaultState()
  const oldWords: Array<Partial<Word> & { level?: string }> = parsed.words ?? []
  const dailyList = SEED_LISTS.find((l) => l.id === "list-mine-daily")!
  let seq = 1000

  const words: Word[] = oldWords.map((w) => {
    const listId = LEVEL_TO_LIST[w.level ?? ""] ?? dailyList.id
    return {
      id: String(w.id ?? `migrated-${seq++}`),
      listId,
      wordOrder: 0, // 稍后按 List 内顺序补
      word: String(w.word ?? ""),
      ipa: String(w.ipa ?? ""),
      pos: String(w.pos ?? ""),
      meaning: String(w.meaning ?? ""),
      example: String(w.example ?? ""),
      exampleZh: String(w.exampleZh ?? ""),
      custom: w.custom ? true : undefined,
      favorite: w.favorite ? true : undefined,
    }
  }).filter((w) => w.word !== "")

  // 自定义单词已在上方归入 我的单词/Daily（listId 已设置），按 List 顺序编号即可
  const ordered: Word[] = []
  for (const list of SEED_LISTS) {
    const inList = words
      .filter((w) => w.listId === list.id)
      .sort((a, b) => a.id.localeCompare(b.id))
    inList.forEach((w, idx) => ordered.push({ ...w, wordOrder: idx + 1 }))
  }

  const books = base.books
  const lists = base.lists
  const idByWord = new Map(ordered.map((w) => [w.word.toLowerCase(), w.id]))

  return {
    books,
    lists,
    words: ordered,
    similarGroups: linkGroupWordIds(
      SEED_SIMILAR_GROUPS,
      idByWord,
    ),
    progress: parsed.progress ?? {},
    settings: { ...base.settings, ...parsed.settings },
    activity: Object.fromEntries(
      Object.entries((parsed.activity ?? {}) as Record<string, Partial<DayStat>>).map(([k, v]) => [k, normalizeDay(v)]),
    ),
  }
}

function loadState(): VocaState {
  if (typeof window === "undefined") return defaultState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.words) && parsed.words.length > 0) {
        if (Array.isArray(parsed.books) && Array.isArray(parsed.lists)) {
          // 新版结构
          const base = defaultState()
          return {
            books: parsed.books,
            lists: parsed.lists,
            words: parsed.words,
            similarGroups: Array.isArray(parsed.similarGroups)
              ? parsed.similarGroups
              : seedSimilarGroups(),
            progress: parsed.progress ?? {},
            settings: { ...base.settings, ...parsed.settings },
            activity: Object.fromEntries(
              Object.entries(
                (parsed.activity ?? {}) as Record<string, Partial<DayStat>>,
              ).map(([k, v]) => [k, normalizeDay(v)]),
            ),
          }
        }
        // 旧版扁平结构 → 迁移
        return migrateOldState(parsed)
      }
    }
  } catch {
    // 数据损坏时回退到默认状态
  }
  return defaultState()
}

/* ─────────────────────── Actions ─────────────────────── */

type Action =
  | { type: "add-word"; word: Omit<Word, "id" | "wordOrder"> }
  | { type: "update-word"; id: string; word: Partial<Word> }
  | { type: "toggle-favorite"; id: string }
  | { type: "delete-word"; id: string }
  | { type: "reset-progress"; id: string }
  | { type: "rate"; wordId: string; rating: Rating }
  | { type: "quiz-answer"; wordId: string; correct: boolean }
  | { type: "record-time"; seconds: number }
  | { type: "set-goal"; goal: number }
  | { type: "set-accent"; id: string | null }
  | { type: "set-gemini-key"; key: string }
  | { type: "set-language"; lang: "zh" | "en" }
  | { type: "set-voice"; voice: "en-US" | "en-GB" }
  | { type: "set-sound"; on: boolean }
  | { type: "import"; payload: ImportPayload; mode: "update" | "duplicate" }
  | { type: "create-group"; group: SimilarGroup }
  | { type: "add-to-group"; groupId: string; entry: SimilarWordEntry }
  | { type: "remove-from-group"; groupId: string; word: string }
  | { type: "reset-all" }

function touchDay(
  activity: Record<string, DayStat>,
  today: string,
  patch: Partial<DayStat>,
): Record<string, DayStat> {
  const day = activity[today] ?? { reviews: 0, learned: 0, reviewed: 0, seconds: 0 }
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
      const order =
        state.words
          .filter((w) => w.listId === action.word.listId)
          .reduce((m, w) => Math.max(m, w.wordOrder), 0) + 1
      const word: Word = {
        ...action.word,
        id: crypto.randomUUID(),
        wordOrder: order,
      }
      return { ...state, words: [...state.words, word] }
    }
    case "update-word":
      return {
        ...state,
        words: state.words.map((w) =>
          w.id === action.id ? { ...w, ...action.word, id: w.id } : w,
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
        similarGroups: state.similarGroups.map((g) => ({
          ...g,
          words: g.words.filter((e) => e.wordId !== action.id),
        })),
      }
    }
    case "reset-progress": {
      const progress = { ...state.progress }
      delete progress[action.id]
      return { ...state, progress }
    }
    case "rate": {
      const today = todayStr()
      const prev =
        state.progress[action.wordId] ?? defaultProgress(action.wordId)
      const rated = rateProgress(prev, action.rating, today)
      const next: WordProgress = {
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
      const prev =
        state.progress[action.wordId] ?? defaultProgress(action.wordId)
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
      return { ...state, settings: { ...state.settings, accentId: action.id } }
    case "set-gemini-key":
      return {
        ...state,
        settings: { ...state.settings, geminiKey: action.key.trim() },
      }
    case "set-language":
      return { ...state, settings: { ...state.settings, language: action.lang } }
    case "set-voice":
      return { ...state, settings: { ...state.settings, voice: action.voice } }
    case "set-sound":
      return { ...state, settings: { ...state.settings, sound: action.on } }

    case "import": {
      let books = [...state.books]
      let lists = [...state.lists]
      let words = [...state.words]

      const existingWordInList = new Map<string, Word>()
      for (const w of words) {
        existingWordInList.set(`${w.listId}::${w.word.toLowerCase()}`, w)
      }

      for (const impBook of action.payload.books) {
        let book = books.find(
          (b) => b.name.toLowerCase() === impBook.name.toLowerCase(),
        )
        if (!book) {
          book = { id: crypto.randomUUID(), name: impBook.name }
          books.push(book)
        } else if (action.mode === "duplicate") {
          let n = 2
          let name = `${impBook.name} (${n})`
          while (books.some((b) => b.name.toLowerCase() === name.toLowerCase())) {
            n += 1
            name = `${impBook.name} (${n})`
          }
          book = { id: crypto.randomUUID(), name, builtIn: false }
          books.push(book)
        }

        for (const impList of impBook.lists) {
          let list = lists.find(
            (l) =>
              l.bookId === book!.id &&
              l.name.toLowerCase() === impList.name.toLowerCase(),
          )
          if (!list) {
            list = {
              id: crypto.randomUUID(),
              bookId: book.id,
              name: impList.name,
              listOrder: impList.listOrder ?? 0,
            }
            lists.push(list)
          } else if (impList.listOrder !== undefined) {
            list = { ...list, listOrder: impList.listOrder }
          }

          const listWords = words
            .filter((w) => w.listId === list!.id)
            .sort((a, b) => a.wordOrder - b.wordOrder)

          for (const impWord of impList.words) {
            const key = `${list!.id}::${impWord.word.toLowerCase()}`
            const existing = existingWordInList.get(key)
            if (existing) {
              // 更新现有词（保留 wordOrder 与学习进度）
              words = words.map((w) =>
                w.id === existing.id
                  ? {
                      ...w,
                      ipa: impWord.ipa ?? w.ipa,
                      pos: impWord.pos ?? w.pos,
                      meaning: impWord.meaning ?? w.meaning,
                      example: impWord.example ?? w.example,
                      exampleZh: impWord.exampleZh ?? w.exampleZh,
                    }
                  : w,
              )
            } else {
              const newWord: Word = {
                id: crypto.randomUUID(),
                listId: list.id,
                wordOrder: impWord.wordOrder ?? listWords.length + 1,
                word: impWord.word,
                ipa: impWord.ipa ?? "",
                pos: impWord.pos ?? "",
                meaning: impWord.meaning ?? "",
                example: impWord.example ?? "",
                exampleZh: impWord.exampleZh ?? "",
                custom: true,
              }
              words.push(newWord)
              existingWordInList.set(key, newWord)
              listWords.push(newWord)
            }
          }
        }
      }

      // 补 listOrder（未指定的按出现顺序）
      const orderCount = new Map<string, number>()
      lists = lists.map((l) => {
        if (l.listOrder !== undefined && l.listOrder > 0) return l
        const c = (orderCount.get(l.bookId) ?? 0) + 1
        orderCount.set(l.bookId, c)
        return { ...l, listOrder: c }
      })
      // 补 wordOrder（空 List 或重复序号）
      const seenOrder = new Map<string, Set<number>>()
      words = words.map((w) => {
        const set = seenOrder.get(w.listId) ?? new Set<number>()
        let order = w.wordOrder
        if (!order || order <= 0 || set.has(order)) {
          order = set.size + 1
          while (set.has(order)) order += 1
        }
        set.add(order)
        seenOrder.set(w.listId, set)
        return order === w.wordOrder ? w : { ...w, wordOrder: order }
      })

      return { ...state, books, lists, words }
    }

    case "create-group":
      return {
        ...state,
        similarGroups: [...state.similarGroups, action.group],
      }
    case "add-to-group":
      return {
        ...state,
        similarGroups: state.similarGroups.map((g) =>
          g.id === action.groupId &&
          !g.words.some((e) => e.word.toLowerCase() === action.entry.word.toLowerCase())
            ? { ...g, words: [...g.words, action.entry] }
            : g,
        ),
      }
    case "remove-from-group":
      return {
        ...state,
        similarGroups: state.similarGroups.map((g) =>
          g.id === action.groupId
            ? {
                ...g,
                words: g.words.filter(
                  (e) => e.word.toLowerCase() !== action.word.toLowerCase(),
                ),
              }
            : g,
        ),
      }
    case "reset-all":
      return defaultState()
    default:
      return state
  }
}

/* ─────────────────────── Context ─────────────────────── */

interface VocaContextValue {
  state: VocaState
  addWord: (word: Omit<Word, "id" | "wordOrder">) => void
  updateWord: (id: string, word: Partial<Word>) => void
  toggleFavorite: (id: string) => void
  deleteWord: (id: string) => void
  resetWordProgress: (id: string) => void
  rateWord: (wordId: string, rating: Rating) => void
  recordQuizAnswer: (wordId: string, correct: boolean) => void
  recordTime: (seconds: number) => void
  setDailyGoal: (goal: number) => void
  setAccent: (id: string | null) => void
  setGeminiKey: (key: string) => void
  setLanguage: (lang: "zh" | "en") => void
  setVoice: (voice: "en-US" | "en-GB") => void
  setSound: (on: boolean) => void
  importVocabulary: (
    payload: ImportPayload,
    mode: "update" | "duplicate",
  ) => void
  createGroup: (title: string) => SimilarGroup
  addToGroup: (groupId: string, entry: SimilarWordEntry) => void
  removeFromGroup: (groupId: string, word: string) => void
  resetAll: () => void
}

const VocaContext = React.createContext<VocaContextValue | null>(null)

export function VocaProvider({ children }: { children: React.ReactNode }) {
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
      setLanguage: (lang) => dispatch({ type: "set-language", lang }),
      setVoice: (voice) => dispatch({ type: "set-voice", voice }),
      setSound: (on) => dispatch({ type: "set-sound", on }),
      importVocabulary: (payload, mode) =>
        dispatch({ type: "import", payload, mode }),
      createGroup: (title) => {
        const group: SimilarGroup = {
          id: crypto.randomUUID(),
          title: title.trim(),
          words: [],
        }
        dispatch({ type: "create-group", group })
        return group
      },
      addToGroup: (groupId, entry) =>
        dispatch({ type: "add-to-group", groupId, entry }),
      removeFromGroup: (groupId, word) =>
        dispatch({ type: "remove-from-group", groupId, word }),
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

export function getProgress(state: VocaState, wordId: string): WordProgress {
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
  return state.words.filter((w) => !state.progress[w.id])
}

export function todayReviews(state: VocaState, today = todayStr()): number {
  return state.activity[today]?.reviews ?? 0
}

export function bookWords(state: VocaState, bookId: string): Word[] {
  const listIds = new Set(
    state.lists.filter((l) => l.bookId === bookId).map((l) => l.id),
  )
  return state.words.filter((w) => listIds.has(w.listId))
}

export function listWords(state: VocaState, listId: string): Word[] {
  return state.words
    .filter((w) => w.listId === listId)
    .sort((a, b) => a.wordOrder - b.wordOrder)
}

export function bookStats(state: VocaState, bookId: string) {
  const ws = bookWords(state, bookId)
  const mastered = ws.filter((w) => state.progress[w.id]?.status === "mastered")
    .length
  const lists = state.lists.filter((l) => l.bookId === bookId)
  return { total: ws.length, mastered, lists: lists.length }
}
