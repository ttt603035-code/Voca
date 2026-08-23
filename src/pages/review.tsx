import { Brain, CheckCircle2, Volume2 } from "lucide-react"
import * as React from "react"
import { Link, useSearchParams } from "react-router-dom"
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
import type { Rating } from "@/lib/types"
import { dueWords, newWords, useVoca } from "@/store/voca-context"
import { shuffle, todayStr } from "@/lib/srs"
import { cn } from "@/lib/utils"

type Filter = "all" | "due" | "difficult" | "mistakes" | "favorites"

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "due", label: "Due Today" },
  { value: "difficult", label: "Difficult" },
  { value: "mistakes", label: "Mistakes" },
  { value: "favorites", label: "Favorites" },
]

const RATINGS: { value: Rating; label: string; color: string }[] = [
  { value: "again", label: "Again", color: "text-[#FF3B30] dark:text-[#FF453A]" },
  { value: "hard", label: "Hard", color: "text-[#FF9500] dark:text-[#FF9F0A]" },
  { value: "good", label: "Good", color: "text-primary" },
  { value: "easy", label: "Easy", color: "text-[#34C759] dark:text-[#30D158]" },
]

const MAX_REQUEUE = 2

export function ReviewPage() {
  const { state, rateWord, recordTime } = useVoca()
  const [params, setParams] = useSearchParams()
  const initialFilter = (params.get("filter") as Filter) || "all"

  const wordMap = React.useMemo(
    () => new Map(state.words.map((w) => [w.id, w])),
    [state.words],
  )

  const buildQueue = React.useCallback(
    (filter: Filter): string[] => {
      const today = todayStr()
      const withP = (id: string) => state.progress[id]
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
          const dueFavs = favs.filter((w) => withP(w.id) && withP(w.id)!.due <= today)
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
    },
    [state],
  )

  const [filter, setFilter] = React.useState<Filter>(initialFilter)
  const [queue, setQueue] = React.useState<string[]>(() => buildQueue(initialFilter))
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

  const lastTickRef = React.useRef(0)
  const flushTime = React.useCallback(() => {
    const now = Date.now()
    const delta = (now - lastTickRef.current) / 1000
    if (delta >= 1) {
      recordTime(delta)
      lastTickRef.current = now
    }
  }, [recordTime])
  React.useEffect(() => () => flushTime(), [flushTime])
  React.useEffect(() => {
    if (finished) flushTime()
  }, [finished, flushTime])

  function startSession(f: Filter) {
    setQueue(buildQueue(f))
    setProcessed(0)
    setFlipped(false)
    setRequeues({})
    setFinished(false)
    setStats({ again: 0, hard: 0, good: 0, easy: 0 })
    lastTickRef.current = Date.now()
  }

  function changeFilter(f: Filter) {
    setFilter(f)
    startSession(f)
    setParams(f === "all" ? {} : { filter: f }, { replace: true })
  }

  const currentId = finished ? null : (queue[processed] ?? null)
  const word = currentId ? (wordMap.get(currentId) ?? null) : null

  function handleRate(rating: Rating) {
    if (!currentId || !flipped || !queue) return
    flushTime()
    rateWord(currentId, rating)
    setStats((s) => ({ ...s, [rating]: s[rating] + 1 }))
    setFlipped(false)

    let nextLength = queue.length
    if (rating === "again") {
      const count = requeues[currentId] ?? 0
      if (count < MAX_REQUEUE) {
        setRequeues((r) => ({ ...r, [currentId]: count + 1 }))
        nextLength += 1
        setQueue((q) => (q ? [...q, currentId] : q))
      }
    }

    const nextProcessed = processed + 1
    setProcessed(nextProcessed)
    if (nextProcessed >= nextLength) setFinished(true)
  }

  // 键盘：空格翻卡，1-4 评分
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement
      if (target.closest("input, textarea, select, [contenteditable='true']")) return
      if (finished || !word) return
      if ((e.key === " " || e.key === "Enter") && !flipped) {
        e.preventDefault()
        setFlipped(true)
      }
      const idx = ["1", "2", "3", "4"].indexOf(e.key)
      if (idx >= 0 && flipped) handleRate(RATINGS[idx].value)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped, finished, word, queue, processed, requeues])

  /* ─────────────── 完成 ─────────────── */
  if (finished) {
    const total = stats.again + stats.hard + stats.good + stats.easy
    return (
      <div className="mx-auto max-w-md">
        <EmptyState
          icon={CheckCircle2}
          tint="#34C759"
          title="Review Complete"
          description={`本轮共复习 ${total} 个单词，已自动安排下次复习。`}
        >
          <div className="flex items-center gap-5 pt-1 text-[14px] text-muted-foreground">
            {RATINGS.map((r) => (
              <span key={r.value} className={r.color}>
                {r.label} · {stats[r.value]}
              </span>
            ))}
          </div>
          <div className="mt-5 flex w-56 flex-col gap-2">
            <AppleButton onClick={() => startSession(filter)}>
              再来一轮
            </AppleButton>
            <Link
              to="/"
              className="text-center text-[17px] font-medium text-primary"
            >
              Done
            </Link>
          </div>
        </EmptyState>
      </div>
    )
  }

  /* ─────────────── 空队列 ─────────────── */
  if (!word) {
    return (
      <div className="mx-auto max-w-md">
        <div className="mb-2 flex justify-end">
          <Select value={filter} onValueChange={(v) => changeFilter(v as Filter)}>
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILTER_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <EmptyState
          icon={Brain}
          title="No Reviews Due"
          description="当前筛选下没有可复习的单词。"
        >
          <div className="mt-5 flex w-56 flex-col gap-2">
            <AppleButton variant="tinted" onClick={() => changeFilter("all")}>
              复习全部
            </AppleButton>
            <Link
              to="/words"
              className="text-center text-[17px] font-medium text-primary"
            >
              浏览单词
            </Link>
          </div>
        </EmptyState>
      </div>
    )
  }

  /* ─────────────── 学习卡片 ─────────────── */
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-170px)] max-w-xl flex-col lg:min-h-[calc(100dvh-140px)]">
      {/* 顶部：筛选 + 进度 */}
      <div className="flex items-center justify-between">
        <Select value={filter} onValueChange={(v) => changeFilter(v as Filter)}>
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-[14px] text-muted-foreground tabular-nums">
          {processed + 1} / {queue.length}
        </span>
      </div>
      <ProgressBar
        value={(processed / queue.length) * 100}
        className="mt-3"
      />

      {/* 单词区（点按显示释义） */}
      <button
        type="button"
        onClick={() => setFlipped(true)}
        className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-3 py-10 text-center select-none"
        aria-label="显示释义"
      >
        <span className="text-[46px] leading-tight font-semibold tracking-[-0.02em] sm:text-[54px]">
          {word.word}
        </span>
        {word.ipa && (
          <span className="text-[17px] text-muted-foreground">{word.ipa}</span>
        )}
        {word.pos && (
          <span className="text-[15px] text-muted-foreground/80">
            {word.pos} · {word.level}
          </span>
        )}

        {!flipped ? (
          <span className="mt-8 flex items-center gap-1.5 text-[13px] text-muted-foreground/60">
            <Volume2 className="size-3.5" />
            点按显示释义
          </span>
        ) : (
          <span className="mt-4 flex animate-fade-in flex-col items-center gap-3 border-t border-border pt-5">
            <span className="text-[22px] font-medium text-primary">
              {word.pos} {word.meaning}
            </span>
            {word.example && (
              <span className="max-w-md text-[15px] italic text-muted-foreground">
                “{word.example}”
              </span>
            )}
            {word.exampleZh && (
              <span className="text-[15px] text-muted-foreground">
                {word.exampleZh}
              </span>
            )}
          </span>
        )}
      </button>

      {/* 底部操作：Again / Hard / Good / Easy */}
      <div
        className="fixed inset-x-0 z-40 border-t border-black/[0.06] bg-card/95 backdrop-blur-xl lg:static lg:border-black/[0.06] lg:bg-transparent lg:backdrop-blur-none dark:border-white/[0.08] dark:lg:bg-transparent"
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
                !flipped
                  ? "opacity-30"
                  : "active:opacity-60",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
