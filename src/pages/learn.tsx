import {
  Brain,
  CheckCheck,
  Home,
  Keyboard,
  PartyPopper,
  Sparkles,
} from "lucide-react"
import * as React from "react"
import { Link, useSearchParams } from "react-router-dom"
import { WordStatusBadge } from "@/components/word-status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Kbd } from "@/components/ui/kbd"
import { Progress } from "@/components/ui/progress"
import { speak } from "@/lib/speech"
import type { Rating } from "@/lib/types"
import {
  dueWords,
  getProgress,
  newWords,
  useVoca,
} from "@/store/voca-context"
import { shuffle } from "@/lib/srs"

const RATINGS: {
  value: Rating
  label: string
  key: string
  className: string
}[] = [
  {
    value: "again",
    label: "不认识",
    key: "1",
    className: "bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400",
  },
  {
    value: "hard",
    label: "有点印象",
    key: "2",
    className: "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400",
  },
  {
    value: "good",
    label: "认识",
    key: "3",
    className: "bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 dark:text-sky-400",
  },
  {
    value: "easy",
    label: "很简单",
    key: "4",
    className: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400",
  },
]

const MAX_REQUEUE = 2

export function LearnPage() {
  const { state, rateWord, recordTime } = useVoca()
  const [params] = useSearchParams()
  const focusId = params.get("word")

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

  // 学习时长统计：记录上次结算的时间点
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

  const wordMap = React.useMemo(
    () => new Map(state.words.map((w) => [w.id, w])),
    [state.words],
  )

  // 构建学习队列：到期待复习 + 新单词
  const buildQueue = React.useCallback(
    (initial?: string) => {
      if (initial && wordMap.has(initial)) return [initial]
      const due = dueWords(state).slice(0, 30).map((w) => w.id)
      const fresh = shuffle(newWords(state).map((w) => w.id)).slice(
        0,
        state.settings.dailyGoal,
      )
      return [...due, ...fresh]
    },
    [state, wordMap],
  )

  // 首次渲染即构建队列，避免闪烁
  const [queue, setQueue] = React.useState<string[]>(() =>
    buildQueue(focusId ?? undefined),
  )

  const startSession = React.useCallback(
    (initial?: string) => {
      setQueue(buildQueue(initial))
      setProcessed(0)
      setFlipped(false)
      setRequeues({})
      setFinished(false)
      setStats({ again: 0, hard: 0, good: 0, easy: 0 })
      lastTickRef.current = Date.now()
    },
    [buildQueue],
  )

  // 本轮结束时结算剩余时长
  React.useEffect(() => {
    if (finished) flushTime()
  }, [finished, flushTime])

  const currentId = finished ? null : (queue?.[processed] ?? null)
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

  // 键盘快捷键
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement
      if (target.closest("input, textarea, select, [contenteditable=true]")) return
      if (finished || !word) return
      if ((e.key === " " || e.key === "Enter") && !flipped) {
        e.preventDefault()
        setFlipped(true)
      }
      const r = RATINGS.find((r) => r.key === e.key)
      if (r && flipped) handleRate(r.value)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [flipped, finished, word, queue, processed, requeues, stats])

  /* ─────────────── 完成页 ─────────────── */
  if (finished) {
    const total = stats.again + stats.hard + stats.good + stats.easy
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/15">
              <PartyPopper className="size-8 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">本轮学习完成！</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                共复习 {total} 个单词，间隔重复算法已自动安排下次复习。
              </p>
            </div>
            <div className="grid w-full grid-cols-4 gap-2">
              {RATINGS.map((r) => (
                <div
                  key={r.value}
                  className="rounded-lg border bg-muted/40 py-3"
                >
                  <div className="text-lg font-semibold tabular-nums">
                    {stats[r.value]}
                  </div>
                  <div className="text-xs text-muted-foreground">{r.label}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Button asChild>
                <Link to="/">
                  <Home className="size-4" />
                  返回首页
                </Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link to="/quiz">
                  <Brain className="size-4" />
                  去测试
                </Link>
              </Button>
              <Button variant="outline" onClick={() => startSession()}>
                再来一轮
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  /* ─────────────── 空队列 ─────────────── */
  if (!word) {
    const remaining = dueWords(state).length + newWords(state).length
    return (
      <div className="mx-auto max-w-xl">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Sparkles className="size-10 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">没有可学习的单词了</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {remaining > 0
                  ? "到期的单词都已复习完毕，稍等它们到点再来。"
                  : "全部单词都在记忆周期中，明天见！"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link to="/words">管理单词本</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link to="/quiz">
                  <Brain className="size-4" />
                  来一轮测试
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  /* ─────────────── 学习卡片 ─────────────── */
  const due = dueWords(state).length
  const progressPct = queue?.length
    ? Math.round((processed / queue.length) * 100)
    : 0

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">卡片学习</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {queue?.length ? `${processed + 1} / ${queue.length}` : "—"}
            {due > 0 && ` · 还有 ${due} 个到期单词`}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => startSession()}>
          重新开始
        </Button>
      </div>

      <Progress value={progressPct} />

      {/* 3D 翻转卡片 */}
      <div
        className="relative h-80 cursor-pointer select-none [perspective:1200px] sm:h-72"
        onClick={() => setFlipped(true)}
        role="button"
        aria-label="翻转卡片"
      >
        <div
          className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
            flipped ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          {/* 正面：单词 */}
          <div className="absolute inset-0 flex flex-col rounded-2xl border bg-card p-6 shadow-sm [backface-visibility:hidden]">
            <div className="flex items-center justify-between">
              <Badge variant="outline">{word.level}</Badge>
              <Button
                variant="ghost"
                size="icon"
                className="size-9"
                onClick={(e) => {
                  e.stopPropagation()
                  speak(word.word)
                }}
                aria-label="朗读单词"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5 6 9H2v6h4l5 4V5z" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              </Button>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center gap-3">
              <span className="text-4xl font-semibold tracking-wide sm:text-5xl">
                {word.word}
              </span>
              {word.ipa && (
                <span className="text-lg text-muted-foreground">{word.ipa}</span>
              )}
              {word.pos && (
                <span className="text-sm text-muted-foreground">{word.pos}</span>
              )}
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="size-3.5" />
              点击卡片或按 <Kbd>空格</Kbd> 查看释义
            </div>
          </div>

          {/* 背面：释义 */}
          <div className="absolute inset-0 flex flex-col rounded-2xl border bg-card p-6 shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="flex items-center justify-between">
              <Badge variant="outline">{word.level}</Badge>
              <Button
                variant="ghost"
                size="icon"
                className="size-9"
                onClick={(e) => {
                  e.stopPropagation()
                  speak(word.word)
                }}
                aria-label="朗读单词"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5 6 9H2v6h4l5 4V5z" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              </Button>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center gap-3">
              <span className="text-3xl font-semibold">{word.word}</span>
              <p className="text-center text-xl text-primary">
                {word.pos} {word.meaning}
              </p>
              {word.example && (
                <div className="max-w-md space-y-1 text-center">
                  <p className="text-sm italic text-muted-foreground">
                    “{word.example}”
                  </p>
                  {word.exampleZh && (
                    <p className="text-sm">{word.exampleZh}</p>
                  )}
                </div>
              )}
            </div>
            <div className="text-center text-sm text-muted-foreground">
              再听一遍或按 <Kbd>空格</Kbd> 收起
            </div>
          </div>
        </div>
      </div>

      {/* 评分按钮 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {RATINGS.map((r) => (
          <Button
            key={r.value}
            variant="outline"
            className={r.className}
            disabled={!flipped}
            onClick={() => handleRate(r.value)}
          >
            {r.label}
            <span className="ml-1 opacity-60">{r.key}</span>
          </Button>
        ))}
      </div>

      {!flipped ? (
        <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Keyboard className="size-3.5" />
          空格翻卡 · 1-4 评分：{RATINGS.map((r) => `${r.key} ${r.label}`).join("，")}
        </p>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          凭记忆回答，再看答案就“偷看”啦 😉
        </p>
      )}

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <CheckCheck className="size-3.5" />
        评分后自动安排下次复习 · 当前状态：
        <WordStatusBadge progress={getProgress(state, word.id)} />
      </div>
    </div>
  )
}
