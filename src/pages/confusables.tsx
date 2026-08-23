import {
  ArrowLeft,
  CheckCircle2,
  Lightbulb,
  Play,
  RotateCcw,
  XCircle,
} from "lucide-react"
import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { speak } from "@/lib/speech"
import { shuffle } from "@/lib/srs"
import {
  CONFUSABLE_GROUPS,
  type ConfusableGroup,
  type ConfusableSentence,
} from "@/lib/confusables"

interface Answered {
  sentence: ConfusableSentence
  picked: string
  correct: boolean
}

function buildOptions(group: ConfusableGroup): string[] {
  const own = group.words.map((w) => w.word)
  const others = shuffle(
    CONFUSABLE_GROUPS.filter((g) => g.id !== group.id)
      .flatMap((g) => g.words.map((w) => w.word)),
  ).slice(0, 4 - own.length)
  return shuffle([...own, ...others])
}

/** 单个词组的填空练习 */
function GroupPractice({
  group,
  onBack,
}: {
  group: ConfusableGroup
  onBack: () => void
}) {
  const [order, setOrder] = React.useState<ConfusableSentence[]>(() =>
    shuffle(group.sentences),
  )
  const [index, setIndex] = React.useState(0)
  const [options, setOptions] = React.useState<string[]>(() =>
    buildOptions(group),
  )
  const [picked, setPicked] = React.useState<string | null>(null)
  const [results, setResults] = React.useState<Answered[]>([])
  const [done, setDone] = React.useState(false)
  const timer = React.useRef<number | null>(null)

  React.useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    },
    [],
  )

  const current = order[index] ?? null

  function restart() {
    setOrder(shuffle(group.sentences))
    setOptions(buildOptions(group))
    setIndex(0)
    setPicked(null)
    setResults([])
    setDone(false)
  }

  function goNext() {
    if (index + 1 >= order.length) {
      setDone(true)
    } else {
      setIndex((i) => i + 1)
      setPicked(null)
    }
  }

  function pick(option: string) {
    if (!current || picked !== null) return
    setPicked(option)
    const correct = option.toLowerCase() === current.answer.toLowerCase()
    setResults((r) => [
      ...r,
      { sentence: current, picked: option, correct },
    ])
    timer.current = window.setTimeout(() => {
      timer.current = null
      goNext()
    }, 1400)
  }

  function next() {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
    goNext()
  }

  /* ── 结果 ── */
  if (done) {
    const score = results.filter((r) => r.correct).length
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
            <span className="text-xl font-semibold text-primary">
              {score} / {results.length}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold">「{group.title}」练习完成</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {score === results.length
                ? "全对！这组词已经分清了 👏"
                : "看看下面错在哪，再练一遍就记住了"}
            </p>
          </div>
          <ul className="w-full max-w-md divide-y text-left">
            {results.map((r, i) => (
              <li key={i} className="flex items-start gap-2.5 py-2.5 text-sm">
                {r.correct ? (
                  <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="mt-0.5 size-4.5 shrink-0 text-red-500" />
                )}
                <div className="min-w-0">
                  <p className="italic text-muted-foreground">
                    {r.sentence.text.replace("___", `【${r.sentence.answer}】`)}
                  </p>
                  {!r.correct && (
                    <p className="mt-0.5 text-xs text-red-500">
                      你选了：{r.picked}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={restart}>
              <RotateCcw className="size-4" />
              再练一遍
            </Button>
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="size-4" />
              返回词组
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  /* ── 答题 ── */
  if (!current) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="size-4" />
          返回词组
        </Button>
        <span className="text-sm text-muted-foreground tabular-nums">
          {index + 1} / {order.length}
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span>{group.emoji}</span>
            {group.title}
          </CardTitle>
          <CardDescription>选词填空，注意句中的时态变化</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="rounded-xl border bg-muted/40 p-4 text-base leading-relaxed">
            {current.text.split("___").map((part, i, arr) => (
              <React.Fragment key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span className="mx-1 inline-block min-w-16 border-b-2 border-dashed border-primary px-1 text-center text-primary">
                    {picked ?? ""}
                  </span>
                )}
              </React.Fragment>
            ))}
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            {options.map((opt) => {
              const isAnswer = opt.toLowerCase() === current.answer.toLowerCase()
              const isPicked = opt === picked
              return (
                <Button
                  key={opt}
                  variant="outline"
                  size="lg"
                  className={cn(
                    "h-auto justify-center px-4 py-3",
                    picked !== null && isAnswer &&
                      "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                    picked !== null && isPicked && !isAnswer &&
                      "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400",
                    picked !== null && !isAnswer && !isPicked && "opacity-50",
                  )}
                  disabled={picked !== null}
                  onClick={() => pick(opt)}
                >
                  {opt}
                </Button>
              )
            })}
          </div>

          {picked !== null && (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 p-3">
              <div className="min-w-0 text-sm">
                <p
                  className={cn(
                    "font-medium",
                    picked.toLowerCase() === current.answer.toLowerCase()
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-500",
                  )}
                >
                  {picked.toLowerCase() === current.answer.toLowerCase()
                    ? "回答正确！"
                    : `正确答案：${current.answer}`}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {current.zh} · {group.tip}
                </p>
              </div>
              <Button size="sm" onClick={next} className="shrink-0">
                {index + 1 >= order.length ? "看结果" : "下一题"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function ConfusablesPage() {
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const active = CONFUSABLE_GROUPS.find((g) => g.id === activeId) ?? null

  if (active) {
    return (
      <div className="mx-auto max-w-2xl">
        <GroupPractice
          key={active.id}
          group={active}
          onBack={() => setActiveId(null)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">近义词辨析</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          把总是记混的词放在一起：先看清区别，再填空巩固
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {CONFUSABLE_GROUPS.map((group) => (
          <Card key={group.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="text-lg">{group.emoji}</span>
                {group.title}
              </CardTitle>
              <Button size="sm" onClick={() => setActiveId(group.id)}>
                <Play className="size-3.5" />
                练习
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2">
                {group.words.map((w) => (
                  <button
                    key={w.word}
                    type="button"
                    className="rounded-lg border bg-muted/30 p-3 text-left transition-colors hover:bg-accent/60"
                    onClick={() => speak(w.word)}
                    title="点击朗读"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-medium">{w.word}</span>
                      <span className="text-xs text-muted-foreground">
                        {w.ipa}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {w.pos}
                      </span>
                      <Badge
                        variant="outline"
                        className="ml-auto text-[10px]"
                      >
                        {w.diff}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {w.meaning}
                    </p>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 rounded-lg bg-primary/8 p-3">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-sm leading-relaxed">{group.tip}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
