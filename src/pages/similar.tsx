import { ArrowLeft, CheckCircle2, Heart, Plus, XCircle } from "lucide-react"
import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  AppleButton,
  EmptyState,
  InsetGroup,
  LargeTitle,
  ListRow,
  SectionTitle,
} from "@/components/kit/primitives"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import { useT } from "@/lib/i18n"
import { shuffle } from "@/lib/srs"
import type { SimilarCategory, SimilarGroup, SimilarWordEntry } from "@/lib/types"
import { useVoca } from "@/store/voca-context"
import { cn } from "@/lib/utils"
import { useSpeak } from "@/lib/speech"

type ScopeRange = "all" | "unmastered" | "mistakes" | "favorites"

function categoryKey(
  c?: SimilarCategory,
): "catSpelling" | "catForm" | "catMeaning" | "catCustom" {
  if (c === "spelling") return "catSpelling"
  if (c === "form") return "catForm"
  if (c === "meaning") return "catMeaning"
  return "catCustom"
}

/* ─────────────── 组内练习 ─────────────── */

function Practice({ group, onBack }: { group: SimilarGroup; onBack: () => void }) {
  const { state } = useVoca()
  const { t } = useT()
  const { speak } = useSpeak()

  const [order, setOrder] = React.useState<SimilarWordEntry[]>(() =>
    shuffle(group.words),
  )
  const [options, setOptions] = React.useState<string[]>(() => {
    const own = group.words.map((w) => w.word)
    const others = shuffle(
      state.similarGroups
        .filter((g) => g.id !== group.id)
        .flatMap((g) => g.words.map((w) => w.word)),
    ).slice(0, Math.max(0, 4 - own.length))
    return shuffle([...own, ...others])
  })
  const [index, setIndex] = React.useState(0)
  const [picked, setPicked] = React.useState<string | null>(null)
  const [results, setResults] = React.useState<
    { entry: SimilarWordEntry; picked: string; correct: boolean }[]
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
    setOrder(shuffle(group.words))
    setOptions(
      shuffle([
        ...group.words.map((w) => w.word),
        ...shuffle(
          state.similarGroups
            .filter((g) => g.id !== group.id)
            .flatMap((g) => g.words.map((w) => w.word)),
        ).slice(0, Math.max(0, 4 - group.words.length)),
      ]),
    )
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
    const correct = option.toLowerCase() === current.word.toLowerCase()
    setResults((r) => [...r, { entry: current, picked: option, correct }])
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
          title={t("practiceComplete")}
          description={`${score} / ${results.length}`}
        >
          <ul className="w-full max-w-md divide-y divide-border/70 rounded-[19px] bg-grouped py-1 text-left">
            {results.map((r, i) => (
              <li key={i} className="flex items-start gap-2.5 px-4 py-3 text-[15px]">
                {r.correct ? (
                  <CheckCircle2 className="mt-0.5 size-[18px] shrink-0 text-[#34C759]" />
                ) : (
                  <XCircle className="mt-0.5 size-[18px] shrink-0 text-[#FF3B30]" />
                )}
                <span className="min-w-0">
                  <span className="font-medium">{r.entry.word}</span>
                  {r.entry.meaning && (
                    <span className="text-muted-foreground">
                      {" "}
                      · {r.entry.meaning}
                    </span>
                  )}
                  {!r.correct && (
                    <span className="mt-0.5 block text-[13px] text-[#FF3B30]">
                      {t("youPicked")}：{r.picked}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex w-56 flex-col gap-2">
            <AppleButton variant="tinted" onClick={restart}>
              {t("practiceAgain")}
            </AppleButton>
            <button
              type="button"
              onClick={onBack}
              className="text-center text-[17px] font-medium text-primary"
            >
              {t("backToCompare")}
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
          {t("back")}
        </button>
        <span className="text-[14px] text-muted-foreground tabular-nums">
          {index + 1} / {order.length}
        </span>
      </div>

      <div className="flex flex-col items-center gap-3 pt-4 text-center">
        <button
          type="button"
          onClick={() => speak(current.word)}
          aria-label={t("speak")}
          className="flex size-12 items-center justify-center rounded-full bg-tint text-primary transition-transform active:scale-90"
        >
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H2v6h4l5 4V5z" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        </button>
        <span className="text-[32px] font-semibold tracking-[-0.02em]">
          {current.word}
        </span>
        {current.ipa && (
          <span className="text-[15px] text-muted-foreground">{current.ipa}</span>
        )}
        <p className="text-[14px] text-muted-foreground">{t("meaningLabel")}</p>
      </div>

      <InsetGroup>
        {options.map((opt) => {
          const entry =
            group.words.find((w) => w.word.toLowerCase() === opt.toLowerCase()) ??
            state.similarGroups
              .flatMap((g) => g.words)
              .find((w) => w.word.toLowerCase() === opt.toLowerCase())
          const isAnswer = opt.toLowerCase() === current.word.toLowerCase()
          const isPicked = opt === picked
          return (
            <ListRow
              key={opt}
              as="button"
              onClick={() => pick(opt)}
              className={cn(
                "min-h-[52px]",
                picked !== null && isAnswer && "bg-[#34C759]/10",
                picked !== null && isPicked && !isAnswer && "bg-[#FF3B30]/10",
                picked !== null && !isAnswer && !isPicked && "opacity-50",
              )}
              primary={<span className="text-[16px]">{opt}</span>}
              secondary={entry?.meaning}
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
        <div className="flex animate-fade-in items-center justify-between gap-3 rounded-[14px] bg-grouped p-4">
          <p className="min-w-0 text-[14px] text-muted-foreground">
            <span
              className={cn(
                "font-medium",
                picked.toLowerCase() === current.word.toLowerCase()
                  ? "text-[#34C759]"
                  : "text-[#FF3B30]",
              )}
            >
              {picked.toLowerCase() === current.word.toLowerCase()
                ? t("correctLabel")
                : `${t("answerLabel")}: ${current.word}`}
            </span>
            {current.meaning && (
              <span className="mt-0.5 block">{current.meaning}</span>
            )}
          </p>
          <AppleButton size="sm" onClick={next} className="shrink-0">
            {index + 1 >= order.length ? t("result") : t("next")}
          </AppleButton>
        </div>
      )}
    </div>
  )
}

/* ─────────────── 易混词列表 ─────────────── */

export function SimilarPage() {
  const { state, createGroup, toggleGroupFavorite } = useVoca()
  const { t } = useT()
  const navigate = useNavigate()
  const [category, setCategory] = React.useState<"all" | SimilarCategory>("all")
  const [newOpen, setNewOpen] = React.useState(false)
  const [newTitle, setNewTitle] = React.useState("")
  const [range, setRange] = React.useState<ScopeRange>("all")

  const groups = state.similarGroups.filter(
    (g) => category === "all" || (g.category ?? "custom") === category,
  )

  function startPracticeAll() {
    const params: Record<string, string> = { scope: "similar-all" }
    if (range !== "all") params.range = range
    navigate(`/review?${new URLSearchParams(params).toString()}`)
  }

  return (
    <div className="space-y-5">
      <LargeTitle
        title={t("similarWords")}
        back={() => navigate("/words")}
        actions={
          <button
            type="button"
            onClick={() => setNewOpen(true)}
            className="flex size-9 items-center justify-center rounded-full bg-tint text-primary"
            aria-label={t("newGroup")}
          >
            <Plus className="size-5" />
          </button>
        }
      />
      <GroupHeaderText text={t("similarDesc")} />

      {/* Practice All（整个模块） */}
      <div className="flex items-center gap-3">
        <Select
          value={range}
          onValueChange={(v) => setRange(v as ScopeRange)}
        >
          <SelectTrigger
            size="sm"
            className="h-10 rounded-full bg-tint px-4 font-medium text-primary hover:opacity-80"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("rangeAll")}</SelectItem>
            <SelectItem value="unmastered">{t("rangeUnmastered")}</SelectItem>
            <SelectItem value="mistakes">{t("rangeMistakes")}</SelectItem>
            <SelectItem value="favorites">{t("rangeFavorites")}</SelectItem>
          </SelectContent>
        </Select>
        <button
          type="button"
          onClick={startPracticeAll}
          className="h-10 rounded-full bg-primary px-5 text-[15px] font-medium text-primary-foreground transition-opacity active:opacity-80"
        >
          {t("practiceAll")}
        </button>
      </div>

      {/* 分类筛选 */}
      <Select
        value={category}
        onValueChange={(v) => setCategory(v as "all" | SimilarCategory)}
      >
        <SelectTrigger size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("catAll")}</SelectItem>
          <SelectItem value="spelling">{t("catSpelling")}</SelectItem>
          <SelectItem value="form">{t("catForm")}</SelectItem>
          <SelectItem value="meaning">{t("catMeaning")}</SelectItem>
          <SelectItem value="custom">{t("catCustom")}</SelectItem>
        </SelectContent>
      </Select>

      {/* 词组列表 */}
      {groups.length > 0 ? (
        <InsetGroup>
          {groups.map((g) => (
            <ListRow
              key={g.id}
              as="button"
              onClick={() => navigate(`/similar/${g.id}`)}
              primary={
                <span className="flex items-center gap-2">
                  {g.title}
                  <span className="rounded-[5px] bg-tint px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    {t(categoryKey(g.category))}
                  </span>
                </span>
              }
              secondary={t("wordsPlural", { n: g.words.length })}
              trailing={
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleGroupFavorite(g.id)
                  }}
                  aria-label={t("favorite")}
                  className={cn(
                    "-mr-2 flex size-8 items-center justify-center rounded-full transition-colors active:bg-foreground/[0.05]",
                    g.favorite ? "text-primary" : "text-muted-foreground/40",
                  )}
                >
                  <Heart
                    className="size-[18px]"
                    fill={g.favorite ? "currentColor" : "none"}
                  />
                </button>
              }
            />
          ))}
        </InsetGroup>
      ) : (
        <EmptyState title={t("noData")} description={t("similarDesc")} />
      )}

      {/* 新建词组 */}
      <Sheet open={newOpen} onOpenChange={setNewOpen}>
        <SheetContent
          side="bottom"
          className="gap-0 rounded-t-[22px] p-0 pb-[env(safe-area-inset-bottom)]"
        >
          <div className="sticky top-0 z-10 flex justify-center bg-background/90 pt-2.5 pb-1 backdrop-blur">
            <div className="h-1 w-9 rounded-full bg-foreground/20" />
          </div>
          <div className="space-y-4 px-5 pt-2 pb-6">
            <h2 className="text-[20px] font-semibold">{t("newGroup")}</h2>
            <input
              className="h-12 w-full rounded-[12px] bg-grouped px-4 text-[16px] outline-none focus:ring-2 focus:ring-ring/40"
              placeholder={t("groupTitle")}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
            />
            <AppleButton
              onClick={() => {
                if (!newTitle.trim()) return
                createGroup(newTitle)
                setNewTitle("")
                setNewOpen(false)
              }}
              disabled={!newTitle.trim()}
            >
              {t("add")}
            </AppleButton>
          </div>
          <SheetTitle className="sr-only">{t("newGroup")}</SheetTitle>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function GroupHeaderText({ text }: { text: string }) {
  return <p className="-mt-3 text-[14px] leading-snug text-muted-foreground">{text}</p>
}

/* ─────────────── 词组对比 ─────────────── */

export function SimilarGroupPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state, toggleGroupFavorite } = useVoca()
  const { t } = useT()
  const { speak } = useSpeak()
  const [practicing, setPracticing] = React.useState(false)

  const group = state.similarGroups.find((g) => g.id === id) ?? null

  if (!group) {
    return (
      <div className="space-y-5">
        <LargeTitle title={t("similarWords")} back={() => navigate("/similar")} />
        <EmptyState title={t("similarNotFound")} />
      </div>
    )
  }

  if (practicing) {
    return (
      <Practice key={group.id} group={group} onBack={() => setPracticing(false)} />
    )
  }

  return (
    <div className="space-y-7">
      <LargeTitle
        title={group.title}
        back={() => navigate("/similar")}
        actions={
          <button
            type="button"
            onClick={() => toggleGroupFavorite(group.id)}
            aria-label={t("favorite")}
            className={cn(
              "flex size-9 items-center justify-center rounded-full transition-colors active:bg-foreground/[0.05]",
              group.favorite ? "text-primary" : "text-muted-foreground/50",
            )}
          >
            <Heart
              className="size-[20px]"
              fill={group.favorite ? "currentColor" : "none"}
            />
          </button>
        }
      />

      {/* 对比布局：iPad 两列 */}
      <div className="grid gap-3 lg:grid-cols-2">
        {group.words.map((w) => (
          <div key={w.word} className="rounded-[19px] bg-grouped p-5">
            <button
              type="button"
              onClick={() => speak(w.word)}
              className="flex items-center gap-2 text-left"
            >
              <span className="text-[26px] font-semibold tracking-[-0.02em]">
                {w.word}
              </span>
              <svg className="size-4 text-muted-foreground/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5 6 9H2v6h4l5 4V5z" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            </button>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {[w.pos, w.ipa].filter(Boolean).join(" · ")}
            </p>
            {w.meaning && <p className="mt-2 text-[17px]">{w.meaning}</p>}
            {w.diff && (
              <p className="mt-2 text-[14px] leading-snug text-muted-foreground">
                {w.diff}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Key Difference */}
      {group.tip && (
        <section className="space-y-2">
          <SectionTitle>{t("keyDifference")}</SectionTitle>
          <p className="text-[16px] leading-relaxed">{group.tip}</p>
        </section>
      )}

      {group.words.length >= 2 && (
        <AppleButton onClick={() => setPracticing(true)}>
          {t("practiceThisGroup")}
        </AppleButton>
      )}
    </div>
  )
}
