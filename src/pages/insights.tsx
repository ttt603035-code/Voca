import { useNavigate } from "react-router-dom"
import * as React from "react"
import {
  AppleArea,
  AppleBars,
  AppleStackedBar,
  ChartDot,
  type BarPoint,
} from "@/components/kit/charts"
import {
  GroupHeader,
  InsetGroup,
  LargeTitle,
  ListRow,
  SectionTitle,
  StatTile,
} from "@/components/kit/primitives"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fmtDuration, useT } from "@/lib/i18n"
import { buildTrend, pendingCount, trendLabelStep } from "@/lib/trends"
import { calcStreak, todayStr } from "@/lib/srs"
import { useVoca } from "@/store/voca-context"

type Range = 7 | 30 | 90

export function InsightsPage() {
  const { state } = useVoca()
  const { t, lang } = useT()
  const navigate = useNavigate()
  const [range, setRange] = React.useState<Range>(7)
  const today = todayStr()

  const points = buildTrend(state, range, lang === "zh" ? "zh" : "en", t as never)
  const barData: BarPoint[] = points.map((p) => ({
    label: p.label,
    highlight: p.date === today,
    segments: [
      { value: p.learned, className: "bg-[#FF9500]/85" },
      { value: p.reviewed, className: "bg-[#FF9EBB]/90" },
      { value: p.pending ?? 0, className: "bg-foreground/[0.12]" },
    ],
  }))
  const timePoints = points.map((p) => ({
    label: p.label,
    value: Math.round(((state.activity[p.date]?.seconds ?? 0) / 60) * 10) / 10,
  }))

  /* 窗口内指标 */
  const windowDates = new Set(points.filter((p) => p.pending === undefined).map((p) => p.date))
  let seconds = 0
  let reviews = 0
  for (const d of windowDates) {
    const s = state.activity[d]
    if (s) {
      seconds += s.seconds
      reviews += s.reviews
    }
  }
  let correct = 0
  let wrong = 0
  for (const p of Object.values(state.progress)) {
    if (p.lastReviewed && windowDates.has(p.lastReviewed)) {
      correct += p.correct
      wrong += p.wrong
    }
  }
  const accuracy = correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : null
  const streak = calcStreak(state.activity)
  const pending = pendingCount(state)

  /* 掌握分布 */
  const total = state.words.length
  const mastered = state.words.filter((w) => state.progress[w.id]?.status === "mastered").length
  const learning = state.words.filter((w) => state.progress[w.id]?.status === "learning").length
  const fresh = total - mastered - learning

  const mistakes = state.words
    .map((w) => ({ w, p: state.progress[w.id] }))
    .filter((x) => x.p && x.p.wrong > 0)
    .sort((a, b) => b.p!.wrong - a.p!.wrong)
    .slice(0, 3)

  const rangeOptions: { value: string; label: string }[] = [
    { value: "7", label: t("range7") },
    { value: "30", label: t("range30") },
    { value: "90", label: t("range90") },
  ]

  return (
    <div className="space-y-7">
      <LargeTitle
        title={t("tabInsights")}
        actions={
          <Select
            value={String(range)}
            onValueChange={(v) => setRange(Number(v) as Range)}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {rangeOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* 窗口指标 */}
      <InsetGroup dividers={false} className="grid grid-cols-2 gap-px">
        <StatTile label={t("studyTime")} value={fmtDuration(seconds, t, lang)} />
        <StatTile
          label={t("wordsReviewed")}
          value={t("wordsShort", { n: reviews })}
        />
        <StatTile
          label={t("accuracy")}
          value={accuracy === null ? "—" : `${accuracy}%`}
        />
        <StatTile
          label={t("currentStreak")}
          value={streak > 0 ? `${streak}${lang === "zh" ? "天" : "d"}` : "0"}
        />
      </InsetGroup>

      {/* 学习词数趋势 */}
      <section className="space-y-2.5">
        <GroupHeader>{t("wordsTrend")}</GroupHeader>
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <ChartDot className="bg-[#FF9500]/85" label={t("legendLearned")} />
            <ChartDot className="bg-[#FF9EBB]/90" label={t("legendReviewed")} />
            <ChartDot
              className="bg-foreground/[0.15]"
              label={t("pendingNow", { n: pending })}
            />
          </div>
          <AppleBars data={barData} height={170} labelStep={trendLabelStep(range)} />
        </div>
      </section>

      {/* 学习时长趋势 */}
      <section className="space-y-2.5">
        <GroupHeader>{t("timeTrend")}</GroupHeader>
        <AppleArea points={timePoints} height={140} labelStep={trendLabelStep(range)} />
      </section>

      {/* 掌握度 */}
      <section className="space-y-2.5">
        <GroupHeader>{t("mastery")}</GroupHeader>
        <div className="space-y-3">
          <AppleStackedBar
            parts={[
              { value: mastered, className: "bg-[#34C759] dark:bg-[#30D158]" },
              { value: learning, className: "bg-[#32ADE6]" },
              { value: fresh, className: "bg-foreground/[0.12]" },
            ]}
          />
          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            <ChartDot
              className="bg-[#34C759] dark:bg-[#30D158]"
              label={t("mastered")}
              count={mastered}
            />
            <ChartDot className="bg-[#32ADE6]" label={t("learning")} count={learning} />
            <ChartDot
              className="bg-foreground/[0.15]"
              label={t("newWords")}
              count={fresh}
            />
          </div>
        </div>
      </section>

      {/* 错题入口 */}
      {mistakes.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-0">
            <SectionTitle>{t("mistakes")}</SectionTitle>
            <button
              type="button"
              onClick={() => navigate("/mistakes")}
              className="text-[15px] text-primary"
            >
              {t("seeAll")}
            </button>
          </div>
          <InsetGroup>
            {mistakes.map(({ w, p }) => (
              <ListRow
                key={w.id}
                as="button"
                onClick={() => navigate("/mistakes")}
                primary={w.word}
                secondary={w.meaning}
                trailing={
                  <span className="text-[13px] font-medium tabular-nums text-[#FF3B30] dark:text-[#FF453A]">
                    {t("wrongTimes", { n: p!.wrong })}
                  </span>
                }
              />
            ))}
          </InsetGroup>
        </section>
      )}
    </div>
  )
}
