import { CheckCircle2, X, XCircle } from "lucide-react"
import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  AppleButton,
  InsetGroup,
  LargeTitle,
  ListRow,
} from "@/components/kit/primitives"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { speak } from "@/lib/speech"
import { shuffle } from "@/lib/srs"
import type { Word } from "@/lib/types"
import { useVoca } from "@/store/voca-context"
import { cn } from "@/lib/utils"

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

function buildQuestions(words: Word[], count: number, mode: Mode): Question[] {
  return shuffle(words)
    .slice(0, count)
    .map((word) => {
      const sameLevel = words.filter(
        (w) => w.id !== word.id && w.level === word.level,
      )
      const otherLevel = words.filter(
        (w) => w.id !== word.id && w.level !== word.level,
      )
      const distractors = [
        ...shuffle(sameLevel).slice(0, 3),
        ...shuffle(otherLevel),
      ].slice(0, 3)
      const toOption = (w: Word) => (mode === "word2meaning" ? w.meaning : w.word)
      const answer = toOption(word)
      return { word, answer, options: shuffle([answer, ...distractors.map(toOption)]) }
    })
}

export function TestPage() {
  const { state, recordQuizAnswer, recordTime } = useVoca()
  const navigate = useNavigate()
  const [count, setCount] = React.useState("10")
  const [mode, setMode] = React.useState<Mode>("word2meaning")

  const [questions, setQuestions] = React.useState<Question[] | null>(null)
  const [index, setIndex] = React.useState(0)
  const [picked, setPicked] = React.useState<string | null>(null)
  const [answered, setAnswered] = React.useState<Answered[]>([])
  const [done, setDone] = React.useState(false)
  const timer = React.useRef<number | null>(null)
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
      if (timer.current !== null) window.clearTimeout(timer.current)
      flushTime()
    },
    [flushTime],
  )

  const goNext = () => {
    if (!questions) return
    if (index + 1 >= questions.length) setDone(true)
    else {
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
    timer.current = window.setTimeout(() => {
      timer.current = null
      goNext()
    }, 1100)
  }

  function next() {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
    goNext()
  }

  /* ── 设置 ── */
  if (!questions) {
    return (
      <div className="space-y-5">
        <LargeTitle title="Practice Test" />
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-[13px] text-muted-foreground">
              Questions
            </span>
            <Select value={count} onValueChange={setCount}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] text-muted-foreground">
              Mode
            </span>
            <Select
              value={mode}
              onValueChange={(v) => setMode(v as Mode)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="word2meaning">Word → Meaning</SelectItem>
                <SelectItem value="meaning2word">Meaning → Word</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </div>
        <AppleButton onClick={start} disabled={state.words.length === 0}>
          Start Test
        </AppleButton>
      </div>
    )
  }

  /* ── 结果 ── */
  if (done) {
    const score = answered.filter((a) => a.correct).length
    const pct = answered.length > 0 ? Math.round((score / answered.length) * 100) : 0
    return (
      <div className="space-y-6">
        <LargeTitle title="Practice Test" />
        <div className="pt-2 text-center">
          <p className="text-[56px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
            {score}
            <span className="text-[28px] font-medium text-muted-foreground">
              {" "}/ {answered.length}
            </span>
          </p>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Accuracy {pct}%
          </p>
        </div>
        <InsetGroup>
          {answered.map((a, i) => (
            <ListRow
              key={i}
              primary={a.word.word}
              secondary={a.word.meaning}
              trailing={
                a.correct ? (
                  <CheckCircle2 className="size-5 text-[#34C759]" />
                ) : (
                  <XCircle className="size-5 text-[#FF3B30]" />
                )
              }
            />
          ))}
        </InsetGroup>
        <div className="flex gap-3">
          <AppleButton variant="tinted" className="flex-1" onClick={start}>
            再测一轮
          </AppleButton>
          <AppleButton variant="plain" className="flex-1" onClick={() => navigate("/")}>
            Done
          </AppleButton>
        </div>
      </div>
    )
  }

  /* ── 答题 ── */
  if (!current) return null

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (timer.current !== null) window.clearTimeout(timer.current)
            setQuestions(null)
          }}
          aria-label="退出测试"
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground active:bg-foreground/[0.06]"
        >
          <X className="size-5" />
        </button>
        <span className="text-[14px] text-muted-foreground tabular-nums">
          {index + 1} / {questions.length}
        </span>
        <span className="w-9" />
      </div>

      <div className="pt-4 text-center">
        {mode === "word2meaning" ? (
          <div className="flex items-center justify-center gap-3">
            <span className="text-[36px] font-semibold tracking-[-0.02em] sm:text-[42px]">
              {current.word.word}
            </span>
            <button
              type="button"
              onClick={() => speak(current.word.word)}
              aria-label="朗读"
              className="flex size-9 items-center justify-center rounded-full text-primary active:bg-foreground/[0.06]"
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5 6 9H2v6h4l5 4V5z" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            </button>
          </div>
        ) : (
          <span className="text-[20px] font-medium text-primary sm:text-[24px]">
            {current.word.pos} {current.word.meaning}
          </span>
        )}
      </div>

      <InsetGroup>
        {current.options.map((opt) => {
          const isAnswer = opt === current.answer
          const isPicked = opt === picked
          return (
            <ListRow
              key={opt}
              as="button"
              onClick={() => pick(opt)}
              className={cn(
                "min-h-[52px]",
                picked !== null && isAnswer && "bg-[#34C759]/8",
                picked !== null && isPicked && !isAnswer && "bg-[#FF3B30]/8",
                picked !== null && !isAnswer && !isPicked && "opacity-50",
              )}
              primary={
                <span className="text-[16px]">{opt}</span>
              }
              trailing={
                picked !== null && isAnswer ? (
                  <CheckCircle2 className="size-5 text-[#34C759]" />
                ) : picked !== null && isPicked ? (
                  <XCircle className="size-5 text-[#FF3B30]" />
                ) : undefined
              }
            />
          )
        })}
      </InsetGroup>

      {picked !== null && (
        <div className="flex animate-fade-in items-center justify-between gap-3 rounded-[14px] bg-foreground/[0.04] p-4">
          <p className="min-w-0 text-[14px] text-muted-foreground">
            <span
              className={cn(
                "font-medium",
                picked === current.answer ? "text-[#34C759]" : "text-[#FF3B30]",
              )}
            >
              {picked === current.answer
                ? "Correct"
                : `Answer: ${current.answer}`}
            </span>
          </p>
          <AppleButton size="sm" onClick={next} className="shrink-0">
            {index + 1 >= questions.length ? "结果" : "Next"}
          </AppleButton>
        </div>
      )}
    </div>
  )
}
