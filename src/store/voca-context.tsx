import * as React from "react"
import { SEED_SIMILAR_GROUPS, linkGroupWordIds } from "@/lib/confusables"
import { loadAllBooks } from "@/services/vocabulary"
import { defaultProgress, rateProgress, todayStr } from "@/lib/srs"
import type { ImportPayload } from "@/lib/import-vocab"
import type { BuiltInBookData } from "@/types/vocabulary"
import type {
  Book,
  DayStat,
  Rating,
  SessionRecord,
  SimilarCategory,
  SimilarGroup,
  SimilarWordEntry,
  VocaList,
  VocaState,
  Word,
  WordProgress,
} from "@/lib/types"

const STORAGE_KEY = "voca-state-v1"

/** 用户词库：我的单词（Reading / Writing / Daily） */
export const MINE_BOOK_ID = "book-mine"
export const MINE_DAILY_LIST_ID = "list-mine-daily"

const USER_DEFAULT_BOOKS: Book[] = [
  { id: MINE_BOOK_ID, name: "我的单词 My Words", builtIn: false },
]
const USER_DEFAULT_LISTS: VocaList[] = [
  { id: "list-mine-reading", bookId: MINE_BOOK_ID, name: "Reading", listOrder: 1 },
  { id: "list-mine-writing", bookId: MINE_BOOK_ID, name: "Writing", listOrder: 2 },
  { id: MINE_DAILY_LIST_ID, bookId: MINE_BOOK_ID, name: "Daily", listOrder: 3 },
]

/* ─────────────── 内置词库（JSON）→ 统一 Word 模型 ─────────────── */

export function toAppWord(w: BuiltInBookData["lists"][number]["words"][number], listId: string): Word {
  return {
    id: w.id,
    listId,
    wordOrder: w.wordOrder,
    word: w.word,
    ipa: w.phonetic ?? "",
    pos: w.partOfSpeech ?? "",
    meaning: w.meaning ?? "",
    example: w.example ?? "",
    exampleZh: "",
    builtIn: true,
  }
}

function builtInToAppState(books: BuiltInBookData[]) {
  const outBooks: Book[] = []
  const outLists: VocaList[] = []
  const outWords: Word[] = []
  for (const book of books) {
    outBooks.push({ id: book.id, name: book.name, builtIn: true })
    for (const list of book.lists) {
      outLists.push({
        id: list.id,
        bookId: book.id,
        name: list.name,
        listOrder: list.order,
        builtIn: true,
      })
      for (const w of list.words) {
        outWords.push(toAppWord(w, list.id))
      }
    }
  }
  return { books: outBooks, lists: outLists, words: outWords }
}

/** 易混词组建立与词库的 wordId 关联（只补不删） */
function linkGroups(groups: SimilarGroup[], words: Word[]): SimilarGroup[] {
  const idByWord = new Map(words.map((w) => [w.word.toLowerCase(), w.id]))
  return linkGroupWordIds(groups, idByWord)
}

/* ─────────────── 旧数据迁移 ─────────────── */

// 旧内置 List → 新 JSON id 前缀
const OLD_LIST_TO_NEW_PREFIX: Record<string, string> = {
  "list-tem4-1": "tem4-list01-",
  "list-tem4-2": "tem4-list02-",
  "list-tem4-3": "tem4-list03-",
  "list-cet6-1": "cet6-list01-",
  "list-cet6-2": "cet6-list02-",
}
// 旧扁平词库 level → 新 JSON id 前缀
const OLD_LEVEL_TO_NEW_PREFIX: Record<string, string> = {
  A1: "tem4-list01-",
  A2: "tem4-list02-",
  B1: "tem4-list03-",
  B2: "cet6-list01-",
  C1: "cet6-list02-",
}

/** 旧内置词 id → 新 JSON 词 id（用于迁移学习进度） */
function buildOldIdRemap(
  oldWords: Array<{ id: string; level?: string; listId?: string; wordOrder?: number }>,
): Map<string, string> {
  const remap = new Map<string, string>()
  const byGroup = new Map<string, { id: string; order: number }[]>()
  for (const w of oldWords) {
    const prefix = w.listId
      ? (OLD_LIST_TO_NEW_PREFIX[w.listId] ?? null)
      : w.level
        ? (OLD_LEVEL_TO_NEW_PREFIX[w.level] ?? null)
        : null
    if (!prefix) continue
    const arr = byGroup.get(prefix) ?? []
    arr.push({ id: w.id, order: w.listId ? (w.wordOrder ?? 0) : 0 })
    byGroup.set(prefix, arr)
  }
  for (const [prefix, arr] of byGroup) {
    if (arr.some((w) => w.order === 0)) {
      // 扁平词库：按 id 顺序（seed-XXX 本身按 List 内顺序编号）
      const sorted = [...arr].sort((a, b) =>
        a.id.localeCompare(b.id, "en", { numeric: true }),
      )
      sorted.forEach((w, i) =>
        remap.set(w.id, `${prefix}${String(i + 1).padStart(3, "0")}`),
      )
    } else {
      for (const w of arr) {
        remap.set(w.id, `${prefix}${String(w.order).padStart(3, "0")}`)
      }
    }
  }
  return remap
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

function isOldBuiltInBook(b: Book): boolean {
  return b.id === "book-tem4" || b.id === "book-cet6"
}

/** 迁移旧版状态（扁平词库 / 上一版结构）→ 当前结构 */
function migrateOldState(parsed: any): VocaState {
  const base = defaultState()
  const oldWords: any[] = Array.isArray(parsed.words) ? parsed.words : []
  const remap = buildOldIdRemap(oldWords)

  // 进度 key 迁移（seed-XXX → tem4-list01-XXX）
  const progress: Record<string, WordProgress> = {}
  for (const [oldId, p] of Object.entries<any>(parsed.progress ?? {})) {
    const newId = remap.get(oldId) ?? oldId
    progress[newId] = { ...p, wordId: newId }
  }

  // 用户自定义单词 → 我的单词/Daily
  const dailyList = USER_DEFAULT_LISTS.find((l) => l.id === MINE_DAILY_LIST_ID)!
  let customOrder = 0
  const userWords: Word[] = oldWords
    .filter((w) => w.custom)
    .map((w) => {
      customOrder += 1
      return {
        id: String(w.id ?? crypto.randomUUID()),
        listId: dailyList.id,
        wordOrder: customOrder,
        word: String(w.word ?? ""),
        ipa: String(w.ipa ?? ""),
        pos: String(w.pos ?? ""),
        meaning: String(w.meaning ?? ""),
        example: String(w.example ?? ""),
        exampleZh: String(w.exampleZh ?? ""),
        custom: true,
        favorite: w.favorite ? true : undefined,
      }
    })
    .filter((w) => w.word !== "")

  // 上一版结构中的用户词书（非内置）保留
  let books = [...USER_DEFAULT_BOOKS]
  let lists = [...USER_DEFAULT_LISTS]
  let words = [...userWords]
  if (Array.isArray(parsed.books) && Array.isArray(parsed.lists)) {
    const userBookIds = new Set(
      (parsed.books as Book[]).filter((b) => !isOldBuiltInBook(b)).map((b) => b.id),
    )
    books = books.concat(parsed.books.filter((b: Book) => userBookIds.has(b.id)))
    const userListIds = new Set(
      (parsed.lists as VocaList[]).filter((l) => userBookIds.has(l.bookId)).map((l) => l.id),
    )
    lists = lists.concat(parsed.lists.filter((l: VocaList) => userListIds.has(l.id)))
    const oldUserWordListIds = userListIds
    for (const w of oldWords) {
      if (w.custom || !w.listId || !oldUserWordListIds.has(w.listId)) continue
      words.push({
        id: String(w.id),
        listId: w.listId,
        wordOrder: w.wordOrder ?? 1,
        word: String(w.word ?? ""),
        ipa: String(w.ipa ?? ""),
        pos: String(w.pos ?? ""),
        meaning: String(w.meaning ?? ""),
        example: String(w.example ?? ""),
        exampleZh: String(w.exampleZh ?? ""),
        custom: true,
        favorite: w.favorite ? true : undefined,
      })
    }
  }

  // 易混词组：wordId 也迁移
  const groups = Array.isArray(parsed.similarGroups)
    ? parsed.similarGroups.map((g: SimilarGroup) => ({
        ...g,
        words: g.words.map((e) => ({ ...e, wordId: e.wordId ? (remap.get(e.wordId) ?? e.wordId) : undefined })),
      }))
    : SEED_SIMILAR_GROUPS.map((g) => ({ ...g, words: g.words.map((e) => ({ ...e })) }))

  return {
    books,
    lists,
    words,
    similarGroups: groups,
    progress,
    settings: { ...base.settings, ...parsed.settings },
    activity: Object.fromEntries(
      Object.entries(
        (parsed.activity ?? {}) as Record<string, Partial<DayStat>>,
      ).map(([k, v]) => [k, normalizeDay(v)]),
    ),
    mistakeLog:
      parsed.mistakeLog && typeof parsed.mistakeLog === "object"
        ? parsed.mistakeLog
        : {},
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    builtIn: { loaded: false, error: null },
  }
}

function defaultState(): VocaState {
  return {
    books: [...USER_DEFAULT_BOOKS],
    lists: [...USER_DEFAULT_LISTS],
    words: [],
    similarGroups: SEED_SIMILAR_GROUPS.map((g) => ({ ...g, words: g.words.map((e) => ({ ...e })) })),
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
    mistakeLog: {},
    sessions: [],
    builtIn: { loaded: false, error: null },
  }
}

function loadState(): VocaState {
  if (typeof window === "undefined") {
    return { ...defaultState(), builtIn: { loaded: false, error: null } }
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.words) && parsed.words.length >= 0) {
        const firstWord = parsed.words[0]
        const hasBooks = Array.isArray(parsed.books) && Array.isArray(parsed.lists)
        const hasOldBuiltIn =
          hasBooks && parsed.books.some((b: Book) => isOldBuiltInBook(b))
        const isOldFlat = !hasBooks || (firstWord && firstWord.level !== undefined)

        if (hasOldBuiltIn || isOldFlat) {
          return migrateOldState(parsed)
        }
        // 当前版本持久化格式（仅用户数据）→ 直接恢复
        const base = defaultState()
        return {
          books: parsed.books.length > 0 ? parsed.books : base.books,
          lists: parsed.lists.length > 0 ? parsed.lists : base.lists,
          words: parsed.words,
          similarGroups: Array.isArray(parsed.similarGroups)
            ? parsed.similarGroups
            : base.similarGroups,
          progress: parsed.progress ?? {},
          settings: { ...base.settings, ...parsed.settings },
          activity: Object.fromEntries(
            Object.entries(
              (parsed.activity ?? {}) as Record<string, Partial<DayStat>>,
            ).map(([k, v]) => [k, normalizeDay(v)]),
          ),
          mistakeLog:
            parsed.mistakeLog && typeof parsed.mistakeLog === "object"
              ? parsed.mistakeLog
              : {},
          sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
          builtIn: { loaded: false, error: null },
        }
      }
    }
  } catch {
    // 数据损坏时回退到默认状态
  }
  return defaultState()
}

/** 持久化：只存用户数据（内置词库每次从 JSON 重新读取） */
function persist(state: VocaState) {
  try {
    const user = {
      books: state.books.filter((b) => !b.builtIn),
      lists: state.lists.filter((l) => !l.builtIn),
      words: state.words.filter((w) => !w.builtIn),
      similarGroups: state.similarGroups,
      progress: state.progress,
      settings: state.settings,
      activity: state.activity,
      mistakeLog: state.mistakeLog,
      sessions: state.sessions,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } catch {
    // 存储不可用时忽略
  }
}

/* ─────────────────────── Actions ─────────────────────── */

type Action =
  | { type: "load-built-in"; books: BuiltInBookData[] }
  | { type: "load-built-in-failed"; error: string }
  | { type: "add-word"; word: Omit<Word, "id" | "wordOrder"> }
  | { type: "update-word"; id: string; word: Partial<Word> }
  | { type: "toggle-favorite"; id: string }
  | { type: "delete-word"; id: string }
  | { type: "reset-progress"; id: string }
  | { type: "rate"; wordId: string; rating: Rating }
  | { type: "quiz-answer"; wordId: string; correct: boolean }
  | { type: "record-time"; seconds: number }
  | { type: "record-session"; session: SessionRecord }
  | { type: "toggle-group-favorite"; groupId: string }
  | { type: "set-goal"; goal: number }
  | { type: "set-accent"; id: string | null }
  | { type: "set-gemini-key"; key: string }
  | { type: "set-language"; lang: "zh" | "en" }
  | { type: "set-voice"; voice: "en-US" | "en-GB" }
  | { type: "set-sound"; on: boolean }
  | { type: "import"; payload: ImportPayload; mode: "update" | "duplicate" }
  | { type: "create-group"; group: SimilarGroup; category?: SimilarCategory }
  | { type: "add-to-group"; groupId: string; entry: SimilarWordEntry }
  | { type: "remove-from-group"; groupId: string; word: string }
  | { type: "reset-all" }

function logMistake(
  mistakeLog: Record<string, Record<string, number>>,
  date: string,
  wordId: string,
): Record<string, Record<string, number>> {
  const day = { ...(mistakeLog[date] ?? {}) }
  day[wordId] = (day[wordId] ?? 0) + 1
  return { ...mistakeLog, [date]: day }
}

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

/** 内置词库只读：替换/合并内置部分，保留用户数据与进度 */
function mergeBuiltIn(state: VocaState, books: BuiltInBookData[]): VocaState {
  const bi = builtInToAppState(books)
  const userBooks = state.books.filter((b) => !b.builtIn)
  const userLists = state.lists.filter((l) => !l.builtIn)
  const userWords = state.words.filter((w) => !w.builtIn)
  return {
    ...state,
    books: [...userBooks, ...bi.books],
    lists: [...userLists, ...bi.lists],
    words: [...userWords, ...bi.words],
    similarGroups: linkGroups(state.similarGroups, [
      ...userWords,
      ...bi.words,
    ]),
    builtIn: { loaded: true, error: null },
  }
}

function reducer(state: VocaState, action: Action): VocaState {
  switch (action.type) {
    case "load-built-in":
      return mergeBuiltIn(state, action.books)
    case "load-built-in-failed":
      return { ...state, builtIn: { loaded: true, error: action.error } }

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
    case "update-word": {
      const target = state.words.find((w) => w.id === action.id)
      if (!target || target.builtIn) return state // 内置词库只读
      return {
        ...state,
        words: state.words.map((w) =>
          w.id === action.id ? { ...w, ...action.word, id: w.id, builtIn: undefined } : w,
        ),
      }
    }
    case "toggle-favorite":
      return {
        ...state,
        words: state.words.map((w) =>
          w.id === action.id ? { ...w, favorite: !w.favorite } : w,
        ),
      }
    case "delete-word": {
      const target = state.words.find((w) => w.id === action.id)
      if (!target || target.builtIn) return state // 内置词库只读
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
      const prev = state.progress[action.wordId] ?? defaultProgress(action.wordId)
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
        mistakeLog:
          action.rating === "again"
            ? logMistake(state.mistakeLog, today, action.wordId)
            : state.mistakeLog,
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
        mistakeLog: action.correct
          ? state.mistakeLog
          : logMistake(state.mistakeLog, today, action.wordId),
      }
    }
    case "record-session":
      return { ...state, sessions: [...state.sessions, action.session] }
    case "toggle-group-favorite":
      return {
        ...state,
        similarGroups: state.similarGroups.map((g) =>
          g.id === action.groupId ? { ...g, favorite: !g.favorite } : g,
        ),
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

      const builtInNames = new Set(
        state.books.filter((b) => b.builtIn).map((b) => b.name.toLowerCase()),
      )
      const userBooks = books.filter((b) => !b.builtIn)

      const existingWordInList = new Map<string, Word>()
      for (const w of words) {
        if (w.builtIn) continue
        existingWordInList.set(`${w.listId}::${w.word.toLowerCase()}`, w)
      }

      for (const impBook of action.payload.books) {
        const isBuiltInName = builtInNames.has(impBook.name.toLowerCase())
        let book = isBuiltInName
          ? null
          : userBooks.find((b) => b.name.toLowerCase() === impBook.name.toLowerCase())

        if (!book) {
          // 内置词库同名 → 强制创建副本；普通冲突按 mode 处理
          let name = impBook.name
          if (isBuiltInName || action.mode === "duplicate") {
            let n = 1
            do {
              n += 1
              name = `${impBook.name} (${n})`
            } while (
              books.some((b) => b.name.toLowerCase() === name.toLowerCase())
            )
          }
          book = { id: crypto.randomUUID(), name, builtIn: false }
          books.push(book)
          userBooks.push(book)
        }

        for (const impList of impBook.lists) {
          const bookLists = lists.filter(
            (l) => l.bookId === book!.id && !l.builtIn,
          )
          let list = bookLists.find(
            (l) => l.name.toLowerCase() === impList.name.toLowerCase(),
          )
          if (!list) {
            list = {
              id: crypto.randomUUID(),
              bookId: book.id,
              name: impList.name,
              listOrder: impList.listOrder ?? bookLists.length + 1,
            }
            lists.push(list)
            bookLists.push(list)
          }

          const listWords = words
            .filter((w) => w.listId === list!.id && !w.builtIn)
            .sort((a, b) => a.wordOrder - b.wordOrder)

          for (const impWord of impList.words) {
            const key = `${list!.id}::${impWord.word.toLowerCase()}`
            const existing = existingWordInList.get(key)
            if (existing) {
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

      // 补 listOrder（用户词书内未指定的按出现顺序）
      const orderCount = new Map<string, number>()
      lists = lists.map((l) => {
        if (l.builtIn) return l
        if (l.listOrder !== undefined && l.listOrder > 0) return l
        const c = (orderCount.get(l.bookId) ?? 0) + 1
        orderCount.set(l.bookId, c)
        return { ...l, listOrder: c }
      })
      // 补 wordOrder（重复/缺失序号）
      const seenOrder = new Map<string, Set<number>>()
      words = words.map((w) => {
        if (w.builtIn) return w
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
        similarGroups: [
          ...state.similarGroups,
          action.category ? { ...action.group, category: action.category } : action.group,
        ],
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
    case "reset-all": {
      // 重置用户数据，保留已加载的内置词库
      const fresh = defaultState()
      const keepBooks = state.books.filter((b) => b.builtIn)
      const keepLists = state.lists.filter((l) => l.builtIn)
      const keepWords = state.words.filter((w) => w.builtIn)
      return {
        ...fresh,
        books: [...fresh.books, ...keepBooks],
        lists: [...fresh.lists, ...keepLists],
        words: [...fresh.words, ...keepWords],
        similarGroups: linkGroups(fresh.similarGroups, [
          ...fresh.words,
          ...keepWords,
        ]),
        builtIn: { loaded: state.builtIn.loaded, error: null },
      }
    }
    default:
      return state
  }
}

/* ─────────────────────── Context ─────────────────────── */

interface BuiltInStatus {
  loaded: boolean
  error: string | null
}

interface VocaContextValue {
  state: VocaState
  /** 内置词库加载状态（来自 public/vocabulary/*.json） */
  builtIn: BuiltInStatus
  reloadBuiltIn: () => void
  addWord: (word: Omit<Word, "id" | "wordOrder">) => void
  updateWord: (id: string, word: Partial<Word>) => void
  toggleFavorite: (id: string) => void
  deleteWord: (id: string) => void
  resetWordProgress: (id: string) => void
  rateWord: (wordId: string, rating: Rating) => void
  recordQuizAnswer: (wordId: string, correct: boolean) => void
  recordTime: (seconds: number) => void
  recordSession: (session: SessionRecord) => void
  toggleGroupFavorite: (groupId: string) => void
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
  createGroup: (title: string, category?: SimilarCategory) => SimilarGroup
  addToGroup: (groupId: string, entry: SimilarWordEntry) => void
  removeFromGroup: (groupId: string, word: string) => void
  resetAll: () => void
}

const VocaContext = React.createContext<VocaContextValue | null>(null)

export function VocaProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, undefined, loadState)

  // 内置词库：启动时从 public/vocabulary/*.json 读取
  const loadBuiltIn = React.useCallback(() => {
    loadAllBooks()
      .then((books) => dispatch({ type: "load-built-in", books }))
      .catch((e) =>
        dispatch({ type: "load-built-in-failed", error: String(e?.message ?? e) }),
      )
  }, [])

  React.useEffect(() => {
    loadBuiltIn()
  }, [loadBuiltIn])

  React.useEffect(() => {
    persist(state)
  }, [state])

  const value = React.useMemo<VocaContextValue>(
    () => ({
      state,
      builtIn: state.builtIn,
      reloadBuiltIn: loadBuiltIn,
      addWord: (word) => dispatch({ type: "add-word", word }),
      updateWord: (id, word) => dispatch({ type: "update-word", id, word }),
      toggleFavorite: (id) => dispatch({ type: "toggle-favorite", id }),
      deleteWord: (id) => dispatch({ type: "delete-word", id }),
      resetWordProgress: (id) => dispatch({ type: "reset-progress", id }),
      rateWord: (wordId, rating) => dispatch({ type: "rate", wordId, rating }),
      recordQuizAnswer: (wordId, correct) =>
        dispatch({ type: "quiz-answer", wordId, correct }),
      recordTime: (seconds) => dispatch({ type: "record-time", seconds }),
      recordSession: (session) => dispatch({ type: "record-session", session }),
      toggleGroupFavorite: (groupId) =>
        dispatch({ type: "toggle-group-favorite", groupId }),
      setDailyGoal: (goal) => dispatch({ type: "set-goal", goal }),
      setAccent: (id) => dispatch({ type: "set-accent", id }),
      setGeminiKey: (key) => dispatch({ type: "set-gemini-key", key }),
      setLanguage: (lang) => dispatch({ type: "set-language", lang }),
      setVoice: (voice) => dispatch({ type: "set-voice", voice }),
      setSound: (on) => dispatch({ type: "set-sound", on }),
      importVocabulary: (payload, mode) =>
        dispatch({ type: "import", payload, mode }),
      createGroup: (title, category) => {
        const group: SimilarGroup = {
          id: crypto.randomUUID(),
          title: title.trim(),
          words: [],
        }
        dispatch({ type: "create-group", group, category })
        return group
      },
      addToGroup: (groupId, entry) =>
        dispatch({ type: "add-to-group", groupId, entry }),
      removeFromGroup: (groupId, word) =>
        dispatch({ type: "remove-from-group", groupId, word }),
      resetAll: () => dispatch({ type: "reset-all" }),
    }),
    [state, loadBuiltIn],
  )

  return <VocaContext.Provider value={value}>{children}</VocaContext.Provider>
}

export function useVoca(): VocaContextValue {
  const ctx = React.useContext(VocaContext)
  if (!ctx) throw new Error("useVoca must be used within a VocaProvider")
  return ctx
}

/** 仅供架构验证测试使用 */
export const __testing = {
  reducer,
  loadState,
  defaultState,
  persist,
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

/* ─────────────── 错题选择器 ─────────────── */

/** 某次学习会话中答错的词（按日期），返回 wordId 列表 */
export function wordsByMistakeDate(
  state: VocaState,
  date: string,
): string[] {
  const day = state.mistakeLog[date]
  if (!day) return []
  return Object.entries(day)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
}

/** 最近一次答错日期 */
export function lastMistakeDate(
  state: VocaState,
  wordId: string,
): string | null {
  const dates = Object.keys(state.mistakeLog)
    .filter((d) => state.mistakeLog[d][wordId])
    .sort()
    .reverse()
  return dates[0] ?? null
}

/** 全部错题日期（倒序） */
export function mistakeDates(state: VocaState): string[] {
  return Object.keys(state.mistakeLog)
    .filter((d) => Object.keys(state.mistakeLog[d]).length > 0)
    .sort()
    .reverse()
}

/* ─────────────── 学习概览选择器 ─────────────── */

export function overviewStats(state: VocaState) {
  const today = state.activity[todayStr()]
  let totalLearnedWords = 0
  let totalSeconds = 0
  for (const s of Object.values(state.activity)) totalSeconds += s.seconds
  for (const w of state.words) if (state.progress[w.id]) totalLearnedWords += 1
  return {
    todayLearned: today?.learned ?? 0,
    todayReviewed: today?.reviewed ?? 0,
    todaySeconds: today?.seconds ?? 0,
    totalLearnedWords,
    totalSeconds,
  }
}
