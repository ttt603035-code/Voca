import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Home,
  Layers,
  RotateCcw,
  Trophy,
  XCircle,
} from "lucide-react"
import * as React from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { speak } from "@/lib/speech"
import { shuffle } from "@/lib/srs"
import type { Word } from "@/lib/types"
import { useVoca } from "@/store/voca-context"

type Mode = "word2meaning" | "meaning2word"

interface Question {
  word: Word
  options: string[]
  answer: string
}

interface Answered {
  word: Word
  picked: string
  correct: boolean
}

function buildQuestions(stateWords: Word[], count: number, mode: Mode): Question[] {
  const chosen = shuffle(stateWords).slice(0, count)
  return chosen.map((word) => {
    const sameLevel = stateWords.filter(
      (w) => w.id !== word.id && w.level === word.level,
    )
    const otherLevel = stateWords.filter(
      (w) => w.id !== word.id && w.level !== word.level,
    )
    const distractors = [
      ...shuffle(sameLevel).slice(0, 3),
      ...shuffle(otherLevel),
    ].slice(0, 3)
    const toOption = (w: Word) => (mode === "word2meaning" ? w.meaning : w.word)
    const answer = toOption(word)
    const options = shuffle([
      answer,
      ...distractors.map(toOption),
    ])
    return { word, options, answer }
  })
}

export function QuizPage() {
  const { state, recordQuizAnswer, recordTime } = useVoca()
  const [count, setCount] = React.useState("10")
  const [mode, setMode] = React.useState<Mode>("word2meaning")

  const [questions, setQuestions] = React.useState<Question[] | null>(null)
  const [index, setIndex] = React.useState(0)
  const [picked, setPicked] = React.useState<string | null>(null)
  const [answered, setAnswered] = React.useState<Answered[]>([])
  const [done, setDone] = React.useState(false)
  const advanceTimer = React.useRef<number | null>(null)

  // 学习时长统计
  const lastTickRef = React.useRef(0)
  const flushTime = React.useCallback(() => {
    const now = Date.now()
    const delta = (now - lastTickRef.current) / 1000
    if (delta >= 1) {
      recordTime(delta)
      lastTickRef.current = now
    }
  }, [recordTime])

  React.useEffect(
    () => () => {
      if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current)
      flushTime()
    },
    [flushTime],
  )

  React.useEffect(() => {
    if (done) flushTime()
  }, [done, flushTime])

  const goNext = () => {
    if (!questions) return
    if (index + 1 >= questions.length) {
      setDone(true)
    } else {
      setIndex((i) => i + 1)
      setPicked(null)
    }
  }

  const start = () => {
    const n = Math.min(Number(count), state.words.length)
    if (n <= 0) return
    setQuestions(buildQuestions(state.words, n, mode))
    setIndex(0)
    setPicked(null)
    setAnswered([])
    setDone(false)
    lastTickRef.current = Date.now()
  }

  const current = questions?.[index] ?? null

  function pick(option: string) {
    if (!current || picked !== null) return
    flushTime()
    setPicked(option)
    const correct = option === current.answer
    recordQuizAnswer(current.word.id, correct)
    setAnswered((a) => [...a, { word: current.word, picked: option, correct }])
    // 自动进入下一题
    advanceTimer.current = window.setTimeout(() => {
      advanceTimer.current = null
      goNext()
    }, 1100)
  }

  function next() {
    if (advanceTimer.current !== null) {
      window.clearTimeout(advanceTimer.current)
      advanceTimer.current = null
    }
    goNext()
  }

  /* ─────────────── 开始页 ─────────────── */
  if (!questions) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">快速测试</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            四选一检验记忆，答错会记入复习统计
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">设置</CardTitle>
            <CardDescription>从单词本中随机抽题</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <span className="text-sm font-medium">题量</span>
              <Select value={count} onValueChange={setCount}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 题</SelectItem>
                  <SelectItem value="10">10 题</SelectItem>
                  <SelectItem value="15">15 题</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <span className="text-sm font-medium">题型</span>
              <Select
                value={mode}
                onValueChange={(v) => setMode(v as Mode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="word2meaning">
                    看单词选释义
                  </SelectItem>
                  <SelectItem value="meaning2word">
                    看释义选单词
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              size="lg"
              onClick={start}
              className="w-full"
              disabled={state.words.length === 0}
            >
              <Brain className="size-4" />
              {state.words.length === 0 ? "单词本为空" : "开始测试"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  /* ─────────────── 结果页 ─────────────── */
  if (done) {
    const score = answered.filter((a) => a.correct).length
    const pct = answered.length > 0 ? Math.round((score / answered.length) * 100) : 0
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <div
              className={cn(
                "flex size-16 items-center justify-center rounded-full",
                pct >= 80
                  ? "bg-emerald-500/15"
                  : pct >= 50
                    ? "bg-amber-500/15"
                    : "bg-red-500/15",
              )}
            >
              <Trophy
                className={cn(
                  "size-8",
                  pct >= 80
                    ? "text-emerald-500"
                    : pct >= 50
                      ? "text-amber-500"
                      : "text-red-500",
                )}
              />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">
                {score} / {answered.length}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                正确率 {pct}%
                {pct >= 80 ? "，表现出色！" : pct >= 50 ? "，继续加油！" : "，多翻几轮卡片吧。"}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Button onClick={start}>
                <RotateCcw className="size-4" />
                再测一轮
              </Button>
              <Button variant="secondary" asChild>
                <Link to="/">
                  <Home className="size-4" />
                  返回首页
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/learn">
                  <Layers className="size-4" />
                  卡片学习
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">答题回顾</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {answered.map((a, i) => (
                <li key={i} className="flex items-start gap-3 py-3">
                  {a.correct ? (
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="mt-0.5 size-5 shrink-0 text-red-500" />
                  )}
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-medium">{a.word.word}</span>
                      <span className="text-xs text-muted-foreground">{a.word.ipa}</span>
                      <span className="text-muted-foreground">{a.word.meaning}</span>
                    </div>
                    {!a.correct && (
                      <p className="mt-0.5 text-xs text-red-500">
                        你选了：{a.picked}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    )
  }

  /* ─────────────── 答题页 ─────────────── */
  if (!current) return null

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium tabular-nums">
          第 {index + 1} / {questions.length} 题
        </div>
        <span className="text-sm text-muted-foreground">
          {mode === "word2meaning" ? "看单词选释义" : "看释义选单词"}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${(index / questions.length) * 100}%` }}
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-6 flex items-center justify-center gap-3">
            {mode === "word2meaning" ? (
              <>
                <span className="text-3xl font-semibold sm:text-4xl">
                  {current.word.word}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9"
                  onClick={() => speak(current.word.word)}
                  aria-label="朗读"
                >
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 5 6 9H2v6h4l5 4V5z" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </svg>
                </Button>
              </>
            ) : (
              <span className="text-center text-xl text-primary sm:text-2xl">
                {current.word.pos} {current.word.meaning}
              </span>
            )}
          </div>

          <div className="grid gap-2.5">
            {current.options.map((opt) => {
              const isAnswer = opt === current.answer
              const isPicked = opt === picked
              const showState = picked !== null
              return (
                <Button
                  key={opt}
                  variant="outline"
                  size="lg"
                  className={cn(
                    "h-auto justify-start px-4 py-3 text-left text-base",
                    showState && isAnswer &&
                      "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                    showState && isPicked && !isAnswer &&
                      "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400",
                    showState && !isAnswer && !isPicked && "opacity-50",
                  )}
                  disabled={picked !== null}
                  onClick={() => pick(opt)}
                >
                  {showState && isAnswer && (
                    <CheckCircle2 className="mr-2 size-5 shrink-0" />
                  )}
                  {showState && isPicked && !isAnswer && (
                    <XCircle className="mr-2 size-5 shrink-0" />
                  )}
                  <span className="line-clamp-2">{opt}</span>
                </Button>
              )
            })}
          </div>

          {picked !== null && (
            <div className="mt-5 flex items-center justify-between">
              <p
                className={cn(
                  "text-sm font-medium",
                  picked === current.answer
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-500",
                )}
              >
                {picked === current.answer
                  ? "回答正确！"
                  : `正确答案：${current.answer}`}
              </p>
              <Button onClick={next}>
                {index + 1 >= questions.length ? "查看结果" : "下一题"}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
