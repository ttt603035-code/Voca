import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react"
import * as React from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  AppleButton,
  EmptyState,
  GroupHeader,
  InsetGroup,
  LargeTitle,
  ListRow,
  SectionTitle,
} from "@/components/kit/primitives"
import { speak } from "@/lib/speech"
import {
  CONFUSABLE_GROUPS,
  type ConfusableGroup,
  type ConfusableSentence,
} from "@/lib/confusables"
import { shuffle } from "@/lib/srs"
import { cn } from "@/lib/utils"

function buildOptions(group: ConfusableGroup): string[] {
  const own = group.words.map((w) => w.word)
  const others = shuffle(
    CONFUSABLE_GROUPS.filter((g) => g.id !== group.id)
      .flatMap((g) => g.words.map((w) => w.word)),
  ).slice(0, Math.max(0, 4 - own.length))
  return shuffle([...own, ...others])
}

/* ─────────────── 对比练习 ─────────────── */

function Practice({ group, onBack }: { group: ConfusableGroup; onBack: () => void }) {
  const [order, setOrder] = React.useState<ConfusableSentence[]>(() =>
    shuffle(group.sentences),
  )
  const [options, setOptions] = React.useState<string[]>(() => buildOptions(group))
  const [index, setIndex] = React.useState(0)
  const [picked, setPicked] = React.useState<string | null>(null)
  const [results, setResults] = React.useState<
    { s: ConfusableSentence; picked: string; correct: boolean }[]
  >([])
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
    if (index + 1 >= order.length) setDone(true)
    else {
      setIndex((i) => i + 1)
      setPicked(null)
    }
  }

  function pick(option: string) {
    if (!current || picked !== null) return
    setPicked(option)
    const correct = option.toLowerCase() === current.answer.toLowerCase()
    setResults((r) => [...r, { s: current, picked: option, correct }])
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

  if (done) {
    const score = results.filter((r) => r.correct).length
    return (
      <div className="mx-auto max-w-md">
        <EmptyState
          icon={CheckCircle2}
          tint="#34C759"
          title={`Practice Complete`}
          description={`${score} / ${results.length} · ${
            score === results.length ? "这组词已经分清了" : "看看错在哪，再来一遍"
          }`}
        >
          <ul className="w-full max-w-md divide-y divide-border/70 rounded-[19px] bg-card py-1 text-left">
            {results.map((r, i) => (
              <li key={i} className="flex items-start gap-2.5 px-4 py-3 text-[15px]">
                {r.correct ? (
                  <CheckCircle2 className="mt-0.5 size-[18px] shrink-0 text-[#34C759]" />
                ) : (
                  <XCircle className="mt-0.5 size-[18px] shrink-0 text-[#FF3B30]" />
                )}
                <span className="min-w-0">
                  <span className="italic text-muted-foreground">
                    {r.s.text.replace("___", `【${r.s.answer}】`)}
                  </span>
                  {!r.correct && (
                    <span className="mt-0.5 block text-[13px] text-[#FF3B30]">
                      你选了：{r.picked}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex w-56 flex-col gap-2">
            <AppleButton variant="tinted" onClick={restart}>
              再练一遍
            </AppleButton>
            <button
              type="button"
              onClick={onBack}
              className="text-center text-[17px] font-medium text-primary"
            >
              返回对比
            </button>
          </div>
        </EmptyState>
      </div>
    )
  }

  if (!current) return null

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-0.5 text-[17px] font-medium text-primary"
        >
          <ArrowLeft className="size-5" />
          返回
        </button>
        <span className="text-[14px] text-muted-foreground tabular-nums">
          {index + 1} / {order.length}
        </span>
      </div>

      <div className="pt-6 text-center">
        <p className="text-[20px] leading-relaxed font-medium">
          {current.text.split("___").map((part, i, arr) => (
            <React.Fragment key={i}>
              {part}
              {i < arr.length - 1 && (
                <span className="mx-1 inline-block min-w-14 border-b-2 border-dashed border-primary/50 px-1 text-center text-primary">
                  {picked ?? ""}
                </span>
              )}
            </React.Fragment>
          ))}
        </p>
      </div>

      <InsetGroup>
        {options.map((opt) => {
          const isAnswer =
            opt.toLowerCase() === current.answer.toLowerCase()
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
              primary={opt}
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
          <p className="min-w-0 text-[14px] leading-snug text-muted-foreground">
            <span
              className={cn(
                "font-medium",
                picked.toLowerCase() === current.answer.toLowerCase()
                  ? "text-[#34C759]"
                  : "text-[#FF3B30]",
              )}
            >
              {picked.toLowerCase() === current.answer.toLowerCase()
                ? "Correct"
                : `Answer: ${current.answer}`}
            </span>
            <span className="mt-0.5 block">{current.zh}</span>
          </p>
          <AppleButton size="sm" onClick={next} className="shrink-0">
            {index + 1 >= order.length ? "结果" : "Next"}
          </AppleButton>
        </div>
      )}
    </div>
  )
}

/* ─────────────── 词组列表 ─────────────── */

export function SimilarPage() {
  const navigate = useNavigate()
  return (
    <div className="space-y-5">
      <LargeTitle title="Similar Words" />
      <GroupHeader>容易混淆的单词组，点进去对比练习</GroupHeader>
      <InsetGroup>
        {CONFUSABLE_GROUPS.map((g) => (
          <ListRow
            key={g.id}
            as="button"
            onClick={() => navigate(`/similar/${g.id}`)}
            primary={g.words.map((w) => w.word).join(" · ")}
            secondary={`${g.words.length} words`}
            chevron
          />
        ))}
      </InsetGroup>
    </div>
  )
}

/* ─────────────── 词组对比 ─────────────── */

export function SimilarGroupPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const group = CONFUSABLE_GROUPS.find((g) => g.id === id) ?? null
  const [practicing, setPracticing] = React.useState(false)

  if (!group) {
    return (
      <div className="space-y-5">
        <LargeTitle title="Similar Words" back={() => navigate("/similar")} />
        <EmptyState icon={XCircle} tint="#FF3B30" title="未找到该词组" />
      </div>
    )
  }

  if (practicing) {
    return <Practice group={group} onBack={() => setPracticing(false)} />
  }

  return (
    <div className="space-y-7">
      <LargeTitle
        title={group.words.map((w) => w.word).join(" · ")}
        back={() => navigate("/similar")}
      />

      {/* 对比布局：iPad 两列，iPhone 堆叠 */}
      <div className="grid gap-3 lg:grid-cols-2">
        {group.words.map((w, i) => (
          <div
            key={w.word}
            className={cn(
              "rounded-[19px] bg-card p-5",
              i > 0 && "lg:border-l-0",
            )}
          >
            <button
              type="button"
              onClick={() => speak(w.word)}
              className="text-left"
            >
              <span className="text-[26px] font-semibold tracking-[-0.02em]">
                {w.word}
              </span>
            </button>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {w.pos} · {w.ipa}
            </p>
            <p className="mt-2 text-[17px]">{w.meaning}</p>
            <p className="mt-2 text-[14px] leading-snug text-muted-foreground">
              {w.diff}
            </p>
          </div>
        ))}
      </div>

      {/* Key Difference */}
      <section className="space-y-2">
        <SectionTitle>Key Difference</SectionTitle>
        <p className="text-[16px] leading-relaxed">{group.tip}</p>
      </section>

      <AppleButton onClick={() => setPracticing(true)}>Practice</AppleButton>
      <Link
        to="/words"
        className="inline-block text-[17px] font-medium text-primary"
      >
        去单词本查看这些词
      </Link>
    </div>
  )
}
