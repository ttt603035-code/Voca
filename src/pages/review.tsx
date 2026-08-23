import { Brain, Volume2, X } from "lucide-react"
import * as React from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import {
  AppleButton,
  EmptyState,
  ProgressBar,
} from "@/components/kit/primitives"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fmtDuration, fmtShortDate, useT } from "@/lib/i18n"
import type { Rating, SessionRecord, Word } from "@/lib/types"
import {
  bookWords,
  dueWords,
  isWordDue,
  lastMistakeDate,
  listWords,
  newWords,
  useVoca,
  wordsByMistakeDate,
} from "@/store/voca-context"
import { shuffle, todayStr } from "@/lib/srs"
import { useSpeak } from "@/lib/speech"
import { cn } from "@/lib/utils"

const RATINGS: {
  value: Rating
  labelKey: "again" | "hard" | "good" | "easy"
  color: string
}[] = [
  { value: "again", labelKey: "again", color: "text-[#FF3B30] dark:text-[#FF453A]" },
  { value: "hard", labelKey: "hard", color: "text-[#FF9500] dark:text-[#FF9F0A]" },
  { value: "good", labelKey: "good", color: "text-primary" },
  { value: "easy", labelKey: "easy", color: "text-[#34C759] dark:text-[#30D158]" },
]

const MAX_REQUEUE = 2
type ScopeRange = "all" | "unmastered" | "due" | "mistakes" | "favorites"

interface Scope {
  key: "default" | "list" | "book" | "similar-all" | "mistakes-date" | "missed"
  title: string
  ids: string[]
  bookId?: string
  listId?: string
}

export function ReviewPage() {
  const {
    state,
    rateWord,
    recordTime,
    recordSession,
  } = useVoca()
  const { t, lang } = useT()
  const { speak, speakingWord } = useSpeak()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  const wordMap = React.useMemo(
    () => new Map(state.words.map((w) => [w.id, w])),
    [state.words],
  )

  /* ─────────────── 队列构建 ─────────────── */

  const applyRange = React.useCallback(
    (words: Word[], range: ScopeRange): Word[] => {
      switch (range) {
        case "unmastered":
          return words.filter((w) => state.progress[w.id]?.status !== "mastered")
        case "due":
          return words.filter((w) => isWordDue(state, w.id))
        case "mistakes":
          return words.filter((w) => (state.progress[w.id]?.wrong ?? 0) > 0)
        case "favorites":
          return words.filter((w) => w.favorite)
        default:
          return words
      }
    },
    [state],
  )

  const rangeName = (range: ScopeRange) =>
    range === "all"
      ? ""
      : range === "unmastered"
        ? t("rangeUnmastered")
        : range === "due"
          ? t("rangeDue")
          : range === "mistakes"
            ? t("rangeMistakes")
            : t("rangeFavorites")

  const buildDefaultQueue = React.useCallback((): string[] => {
    const today = todayStr()
    const withP = (id: string) => state.progress[id]
    const filter = (params.get("filter") as
      | "all"
      | "due"
      | "difficult"
      | "mistakes"
      | "favorites") || "all"
    switch (filter) {
      case "due":
        return dueWords(state).slice(0, 50).map((w) => w.id)
      case "difficult":
        return state.words
          .filter((w) => {
            const p = withP(w.id)
            return (
              p &&
              p.status !== "new" &&
              (p.ease < 2.1 || p.lapses >= 2 || p.lastRating === "again")
            )
          })
          .sort((a, b) => withP(a.id)!.ease - withP(b.id)!.ease)
          .slice(0, 30)
          .map((w) => w.id)
      case "mistakes":
        return state.words
          .filter((w) => (withP(w.id)?.wrong ?? 0) > 0)
          .sort(
            (a, b) =>
              withP(b.id)!.wrong - withP(a.id)!.wrong ||
              (withP(b.id)!.lastReviewed ?? "").localeCompare(
                withP(a.id)!.lastReviewed ?? "",
              ),
          )
          .slice(0, 30)
          .map((w) => w.id)
      case "favorites": {
        const favs = state.words.filter((w) => w.favorite)
        const dueFavs = favs.filter(
          (w) => withP(w.id) && withP(w.id)!.due <= today,
        )
        const rest = favs.filter((w) => !dueFavs.includes(w))
        return [...dueFavs, ...rest].slice(0, 40).map((w) => w.id)
      }
      default: {
        const due = dueWords(state).slice(0, 30).map((w) => w.id)
        const fresh = shuffle(newWords(state).map((w) => w.id)).slice(
          0,
          state.settings.dailyGoal,
        )
        return [...due, ...fresh]
      }
    }
  }, [state, params])

  /** 根据 URL 参数构建范围队列 */
  const buildScope = React.useCallback((): Scope => {
    const scope = (params.get("scope") ?? "default") as Scope["key"]
    if (scope === "list") {
      const listId = params.get("listId") ?? ""
      const list = state.lists.find((l) => l.id === listId)
      if (list) {
        const book = state.books.find((b) => b.id === list.bookId)
        const ids = listWords(state, listId).map((w) => w.id)
        return {
          key: "list",
          title: `${list.name}${book ? ` · ${book.name}` : ""}`,
          ids,
          bookId: list.bookId,
          listId,
        }
      }
    } else if (scope === "book") {
      const bookId = params.get("bookId") ?? ""
      const range = (params.get("range") ?? "all") as ScopeRange
      const book = state.books.find((b) => b.id === bookId)
      if (book) {
        const words = applyRange(bookWords(state, bookId), range)
        const title = [book.name, t("practiceAll"), rangeName(range)]
          .filter(Boolean)
          .join(" · ")
        return { key: "book", title, ids: words.map((w) => w.id), bookId }
      }
    } else if (scope === "similar-all") {
      const range = (params.get("range") ?? "all") as ScopeRange
      const seen = new Set<string>()
      const words: Word[] = []
      for (const g of state.similarGroups) {
        for (const e of g.words) {
          if (e.wordId && !seen.has(e.wordId)) {
            const w = wordMap.get(e.wordId)
            if (w) {
              seen.add(e.wordId)
              words.push(w)
            }
          }
        }
      }
      return {
        key: "similar-all",
        title: [t("similarAll"), t("practiceAll"), rangeName(range)]
          .filter(Boolean)
          .join(" · "),
        ids: applyRange(words, range).map((w) => w.id),
      }
    } else if (scope === "mistakes-date") {
      const date = params.get("date") ?? ""
      if (date === "earlier") {
        const ids = state.words
          .filter((w) => (state.progress[w.id]?.wrong ?? 0) > 0)
          .filter((w) => !lastMistakeDate(state, w.id))
          .map((w) => w.id)
        return { key: "mistakes-date", title: t("earlier"), ids }
      }
      if (date) {
        const ids = wordsByMistakeDate(state, date)
        return {
          key: "mistakes-date",
          title: fmtShortDate(date),
          ids,
        }
      }
    }
    return { key: "default", title: "", ids: buildDefaultQueue() }
  }, [params, state, wordMap, applyRange, rangeName, buildDefaultQueue, t])

  const [scope, setScope] = React.useState<Scope>(() => buildScope())
  const [queue, setQueue] = React.useState<string[]>(() => scope.ids)
  const [processed, setProcessed] = React.useState(0)
  const [flipped, setFlipped] = React.useState(false)
  const [requeues, setRequeues] = React.useState<Record<string, number>>({})
  const [finished, setFinished] = React.useState(false)
  const [stats, setStats] = React.useState<Record<Rating, number>>({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  })
  const [sessionMissed, setSessionMissed] = React.useState<string[]>([])

  const startIsoRef = React.useRef(new Date().toISOString())
  const lastTickRef = React.useRef(0)
  const sessionRecordedRef = React.useRef(false)

  const flushTime = React.useCallback(() => {
    const now = Date.now()
    const delta = (now - lastTickRef.current) / 1000
    if (delta >= 1) {
      recordTime(delta)
      lastTickRef.current = now
    }
  }, [recordTime])
  React.useEffect(() => () => flushTime(), [flushTime])

  /** 切换范围（URL 参数变化） */
  React.useEffect(() => {
    const s = buildScope()
    setScope(s)
    setQueue(s.ids)
    setProcessed(0)
    setFlipped(false)
    setRequeues({})
    setFinished(false)
    setStats({ again: 0, hard: 0, good: 0, easy: 0 })
    setSessionMissed([])
    startIsoRef.current = new Date().toISOString()
    lastTickRef.current = Date.now()
    sessionRecordedRef.current = false
  }, [params]) // eslint-disable-line react-hooks/exhaustive-deps

  function startSession(ids: string[], s: Scope) {
    setScope(s)
    setQueue(ids)
    setProcessed(0)
    setFlipped(false)
    setRequeues({})
    setFinished(false)
    setStats({ again: 0, hard: 0, good: 0, easy: 0 })
    setSessionMissed([])
    startIsoRef.current = new Date().toISOString()
    lastTickRef.current = Date.now()
    sessionRecordedRef.current = false
  }

  function clearScope() {
    setParams({})
  }

  const currentId = finished ? null : (queue[processed] ?? null)
  const word = currentId ? (wordMap.get(currentId) ?? null) : null
  const list = word ? state.lists.find((l) => l.id === word.listId) : null

  /** 翻转卡片：翻到背面时自动朗读单词 */
  function flipCard() {
    if (!word) return
    const next = !flipped
    if (next) speak(word.word)
    setFlipped(next)
  }

  /* 完成时：记录会话（副作用放在 effect 中，渲染期只做纯计算） */
  React.useEffect(() => {
    if (!finished || sessionRecordedRef.current) return
    sessionRecordedRef.current = true
    flushTime()
    const today = todayStr()
    const correct = stats.hard + stats.good + stats.easy
    const wrong = stats.again
    const total = correct + wrong
    const record: SessionRecord = {
      id: crypto.randomUUID(),
      date: today,
      start: startIsoRef.current,
      end: new Date().toISOString(),
      seconds: Math.max(
        0,
        Math.round(
          (Date.now() - new Date(startIsoRef.current).getTime()) / 1000,
        ),
      ),
      scope: scope.title || t("tabReview"),
      bookId: scope.bookId,
      listId: scope.listId,
      reviewed: total,
      correct,
      wrong,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 100,
    }
    recordSession(record)
  }, [finished]) // eslint-disable-line react-hooks/exhaustive-deps

  /** 纯计算：范围内单词的掌握情况 */
  function scopeMastery() {
    const today = todayStr()
    const scopeWords = queue
      .map((id) => wordMap.get(id))
      .filter(Boolean) as Word[]
    const mastered = scopeWords.filter(
      (w) => state.progress[w.id]?.status === "mastered",
    ).length
    const needReview = scopeWords.filter(
      (w) =>
        isWordDue(state, w.id, today) &&
        state.progress[w.id]?.status !== "mastered",
    ).length
    return { mastered, needReview }
  }

  function handleRate(rating: Rating) {
    if (!currentId || !flipped || !queue) return
    flushTime()
    rateWord(currentId, rating)
    setStats((s) => ({ ...s, [rating]: s[rating] + 1 }))
    setFlipped(false)
    if (rating === "again") {
      setSessionMissed((m) => (m.includes(currentId) ? m : [...m, currentId]))
      const count = requeues[currentId] ?? 0
      if (count < MAX_REQUEUE) {
        setRequeues((r) => ({ ...r, [currentId]: count + 1 }))
        setQueue((q) => (q ? [...q, currentId] : q))
      }
    }

    const nextProcessed = processed + 1
    setProcessed(nextProcessed)
    if (nextProcessed >= queue.length) setFinished(true)
  }

  // 键盘：空格/回车翻转，1-4 评分
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement
      if (
        target.closest(
          "input, textarea, select, [contenteditable='true'], [role='dialog']",
        )
      )
        return
      if (finished || !word) return
      if ((e.key === " " || e.key === "Enter") && !flipped) {
        e.preventDefault()
        flipCard()
      }
      const idx = ["1", "2", "3", "4"].indexOf(e.key)
      if (idx >= 0 && flipped) handleRate(RATINGS[idx].value)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped, finished, word, queue, processed, requeues])

  const scopeIsBookish = scope.key === "book" || scope.key === "similar-all"

  /* ─────────────── 完成弹窗（StudyHub 清透风格） ─────────────── */
  if (finished) {
    const { mastered, needReview } = scopeMastery()
    const total = stats.again + stats.hard + stats.good + stats.easy
    const correct = stats.hard + stats.good + stats.easy
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 100
    const elapsed =
      new Date().getTime() - new Date(startIsoRef.current).getTime()

    return (
      <div className="mx-auto flex min-h-[calc(100dvh-170px)] max-w-xl items-center justify-center lg:min-h-[calc(100dvh-140px)]">
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-[3px] animate-fade-in"
          />
          <div className="relative w-full max-w-[340px] rounded-[22px] bg-popover/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.14)] backdrop-blur-2xl animate-pop-in">
            <p className="text-[13px] font-medium text-muted-foreground">
              {scope.title || t("tabReview")}
            </p>
            <h2 className="mt-0.5 text-[22px] font-semibold tracking-[-0.02em]">
              {t("completionTitle")}
            </h2>
            <p className="mt-3 text-[40px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
              {total}
              <span className="text-[22px] font-medium text-muted-foreground">
                {" "}/ {total}
              </span>
            </p>
            <div className="mt-5 space-y-2.5 border-t border-border/70 pt-4">
              <div className="flex items-center justify-between text-[15px]">
                <span className="text-muted-foreground">
                  {t("wordsReviewedStat")}
                </span>
                <span className="font-medium tabular-nums">{total}</span>
              </div>
              <div className="flex items-center justify-between text-[15px]">
                <span className="text-muted-foreground">
                  {t("masteredStat")}
                </span>
                <span className="font-medium tabular-nums text-primary">
                  {mastered}
                </span>
              </div>
              <div className="flex items-center justify-between text-[15px]">
                <span className="text-muted-foreground">
                  {t("needReviewStat")}
                </span>
                <span className="font-medium tabular-nums text-primary/60">
                  {needReview}
                </span>
              </div>
              <div className="flex items-center justify-between text-[15px]">
                <span className="text-muted-foreground">
                  {t("studyTimeStat")}
                </span>
                <span className="font-medium tabular-nums">
                  {fmtDuration(elapsed / 1000, t, lang)}
                </span>
              </div>
              {scopeIsBookish && (
                <div className="flex items-center justify-between text-[15px]">
                  <span className="text-muted-foreground">
                    {t("accuracyStat")}
                  </span>
                  <span className="font-medium tabular-nums">{accuracy}%</span>
                </div>
              )}
            </div>
            <div className="mt-6 space-y-2">
              <AppleButton onClick={() => navigate("/")}>
                {t("done")}
              </AppleButton>
              <div className="grid grid-cols-2 gap-2">
                <AppleButton
                  variant="tinted"
                  size="sm"
                  onClick={() => startSession(queue, scope)}
                >
                  {t("reviewAgain")}
                </AppleButton>
                {sessionMissed.length > 0 ? (
                  <AppleButton
                    variant="tinted"
                    size="sm"
                    onClick={() =>
                      startSession(sessionMissed, {
                        key: "missed",
                        title: t("reviewDifficult"),
                        ids: sessionMissed,
                        bookId: scope.bookId,
                        listId: scope.listId,
                      })
                    }
                  >
                    {t("reviewDifficult")}
                  </AppleButton>
                ) : (
                  <span />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ─────────────── 空队列 ─────────────── */
  if (!word) {
    return (
      <div className="mx-auto max-w-md">
        {scope.key !== "default" && (
          <ScopeChip title={scope.title} onClear={clearScope} />
        )}
        <div className="mb-2 flex justify-end">
          <Select
            value={params.get("filter") ?? "all"}
            onValueChange={(v) =>
              setParams(v === "all" ? {} : { filter: v }, { replace: true })
            }
            disabled={scope.key !== "default"}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filterAll")}</SelectItem>
              <SelectItem value="due">{t("filterDue")}</SelectItem>
              <SelectItem value="difficult">{t("filterDifficult")}</SelectItem>
              <SelectItem value="mistakes">{t("filterMistakes")}</SelectItem>
              <SelectItem value="favorites">{t("filterFavorites")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <EmptyState
          icon={Brain}
          title={t("noReviewsDue")}
          description={t("noReviewsDueDesc")}
        >
          <div className="mt-5 flex w-56 flex-col gap-2">
            <AppleButton
              variant="tinted"
              onClick={() =>
                startSession(buildDefaultQueue(), {
                  key: "default",
                  title: "",
                  ids: buildDefaultQueue(),
                })
              }
            >
              {t("reviewAll")}
            </AppleButton>
            <Link
              to="/words"
              className="text-center text-[17px] font-medium text-primary"
            >
              {t("browseWords")}
            </Link>
          </div>
        </EmptyState>
      </div>
    )
  }

  /* ─────────────── 卡片 ─────────────── */
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-170px)] max-w-xl flex-col lg:min-h-[calc(100dvh-140px)]">
      {/* 顶部：范围 / 筛选 + 进度 */}
      <div className="flex items-center justify-between gap-2">
        {scope.key === "default" ? (
          <Select
            value={params.get("filter") ?? "all"}
            onValueChange={(v) =>
              setParams(v === "all" ? {} : { filter: v }, { replace: true })
            }
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filterAll")}</SelectItem>
              <SelectItem value="due">{t("filterDue")}</SelectItem>
              <SelectItem value="difficult">{t("filterDifficult")}</SelectItem>
              <SelectItem value="mistakes">{t("filterMistakes")}</SelectItem>
              <SelectItem value="favorites">{t("filterFavorites")}</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <ScopeChip title={scope.title} onClear={clearScope} />
        )}
        <span className="shrink-0 text-[14px] text-muted-foreground tabular-nums">
          {processed + 1} / {queue.length}
        </span>
      </div>
      <ProgressBar value={(processed / queue.length) * 100} className="mt-3" />

      {/* 3D 翻转卡片 */}
      <div className="flex flex-1 items-center py-6">
        <div
          className="h-full w-full cursor-pointer select-none [perspective:1600px]"
          onClick={flipCard}
          role="button"
          aria-label={flipped ? t("tapToHide") : t("tapToReveal")}
        >
          <div
            className={cn(
              "relative h-full min-h-[340px] w-full transition-transform duration-500 ease-out [transform-style:preserve-3d] sm:min-h-[420px]",
              flipped && "[transform:rotateY(180deg)]",
            )}
          >
            {/* 正面 */}
            <div className="absolute inset-0 flex flex-col rounded-[22px] border border-border/50 bg-card p-6 shadow-[0_2px_16px_rgba(0,0,0,0.04)] [backface-visibility:hidden] dark:border-white/[0.06]">
              <div className="flex items-start justify-between">
                <span className="text-[13px] font-medium text-muted-foreground/70">
                  {list?.name ?? ""}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    speak(word.word)
                  }}
                  aria-label={t("speak")}
                  className={cn(
                    "flex size-11 items-center justify-center rounded-full bg-tint text-primary transition-transform active:scale-90",
                    speakingWord === word.word && "animate-pulse",
                  )}
                >
                  <Volume2 className="size-5" />
                </button>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center gap-3">
                <span className="text-[44px] leading-tight font-semibold tracking-[-0.02em] sm:text-[52px]">
                  {word.word}
                </span>
                {word.ipa && (
                  <span className="text-[17px] text-muted-foreground">
                    {word.ipa}
                  </span>
                )}
                {word.pos && (
                  <span className="text-[14px] text-muted-foreground/70">
                    {word.pos}
                  </span>
                )}
              </div>
              <p className="text-center text-[13px] text-muted-foreground/60">
                {t("tapToReveal")}
              </p>
            </div>

            {/* 背面 */}
            <div className="absolute inset-0 flex flex-col rounded-[22px] border border-border/50 bg-card p-6 shadow-[0_2px_16px_rgba(0,0,0,0.04)] [backface-visibility:hidden] [transform:rotateY(180deg)] dark:border-white/[0.06]">
              <div className="flex items-start justify-between">
                <span className="text-[13px] font-medium text-muted-foreground/70">
                  {word.pos}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    speak(word.word)
                  }}
                  aria-label={t("speak")}
                  className={cn(
                    "flex size-11 items-center justify-center rounded-full bg-tint text-primary transition-transform active:scale-90",
                    speakingWord === word.word && "animate-pulse",
                  )}
                >
                  <Volume2 className="size-5" />
                </button>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center gap-2.5">
                <span className="text-[20px] font-semibold">{word.word}</span>
                {word.ipa && (
                  <span className="text-[15px] text-muted-foreground">
                    {word.ipa}
                  </span>
                )}
                <span className="text-center text-[22px] font-medium text-primary">
                  {word.meaning}
                </span>
                {word.example && (
                  <span className="max-w-md text-center text-[14px] leading-relaxed italic text-muted-foreground">
                    “{word.example}”
                  </span>
                )}
                {word.exampleZh && (
                  <span className="max-w-md text-center text-[14px] leading-relaxed text-muted-foreground/80">
                    {word.exampleZh}
                  </span>
                )}
              </div>
              <p className="text-center text-[13px] text-muted-foreground/60">
                {t("tapToHide")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 底部操作：Again / Hard / Good / Easy */}
      <div
        className="fixed inset-x-0 z-40 border-t border-black/[0.06] bg-background/90 backdrop-blur-xl lg:static dark:border-white/[0.08]"
        style={{ bottom: "calc(var(--tabbar-h))" }}
      >
        <div className="mx-auto grid max-w-xl grid-cols-4">
          {RATINGS.map((r, i) => (
            <button
              key={r.value}
              type="button"
              disabled={!flipped}
              onClick={() => handleRate(r.value)}
              className={cn(
                "h-[58px] text-[16px] font-medium transition-opacity",
                r.color,
                i > 0 && "border-l border-black/[0.06] dark:border-white/[0.08]",
                !flipped ? "opacity-30" : "active:opacity-60",
              )}
            >
              {t(r.labelKey)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/** 范围标签（可清除） */
function ScopeChip({ title, onClear }: { title: string; onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="flex min-w-0 items-center gap-1.5 rounded-full bg-tint py-1.5 pr-2 pl-3.5 text-[14px] font-medium text-primary"
    >
      <span className="truncate">{title}</span>
      <X className="size-3.5 shrink-0 opacity-60" />
    </button>
  )
}
