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
  GlassToggleGroup,
  GlassToggleItem,
} from "@/components/ui/glass-toggle-group"
import { fmtDuration, useT } from "@/lib/i18n"
import { buildWindowTrend, windowLabelStep, type TrendMode } from "@/lib/trends"
import { calcStreak, todayStr } from "@/lib/srs"
import { useVoca } from "@/store/voca-context"

export function InsightsPage() {
  const { state } = useVoca()
  const { t, lang } = useT()
  const navigate = useNavigate()
  const [range, setRange] = React.useState<TrendMode>("week")
  const today = todayStr()

  const points = buildWindowTrend(state, range, lang === "zh" ? "zh" : "en", t as never)
  const barData: BarPoint[] = points.map((p) => ({
    label: p.label,
    highlight: p.date === today,
    segments: [
      { value: p.learned, className: "bg-primary/90" },
      { value: p.reviewed, className: "bg-primary/45" },
    ],
  }))
  const timePoints = points.map((p) => ({
    label: p.label,
    value: Math.round(((state.activity[p.date]?.seconds ?? 0) / 60) * 10) / 10,
  }))
  const labelStep = windowLabelStep(points.length)

  /* 窗口内指标：背了多少 / 复习了多少 / 用了多少时间 */
  const windowDates = new Set(points.map((p) => p.date))
  let learned = 0
  let reviews = 0
  let seconds = 0
  for (const d of windowDates) {
    const s = state.activity[d]
    if (s) {
      learned += s.learned
      reviews += s.reviews
      seconds += s.seconds
    }
  }
  const streak = calcStreak(state.activity)

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

  const rangeOptions: { value: TrendMode; label: string }[] = [
    { value: "day", label: t("rangeDay") },
    { value: "week", label: t("rangeWeek") },
    { value: "month", label: t("rangeMonth") },
  ]

  return (
    <div className="space-y-7">
      <LargeTitle title={t("tabInsights")} />

      {/* 今日 / 本周 / 本月 分段控件 */}
      <div className="flex justify-center">
        <GlassToggleGroup
          value={range}
          onValueChange={(v) => setRange(v as TrendMode)}
          tint={0.25}
          className="w-fit"
        >
          {rangeOptions.map((o) => (
            <GlassToggleItem key={o.value} value={o.value} className="px-4">
              {o.label}
            </GlassToggleItem>
          ))}
        </GlassToggleGroup>
      </div>

      {/* 学习数据：背了多少 / 复习了多少 / 用了多少时间 / 连续打卡 */}
      <InsetGroup dividers={false} className="grid grid-cols-2 gap-px">
        <StatTile label={t("statLearned")} value={t("wordsShort", { n: learned })} />
        <StatTile
          label={t("wordsReviewed")}
          value={t("wordsShort", { n: reviews })}
        />
        <StatTile label={t("studyTime")} value={fmtDuration(seconds, t, lang)} />
        <StatTile
          label={t("currentStreak")}
          value={streak > 0 ? `${streak}${lang === "zh" ? "天" : "d"}` : "0"}
        />
      </InsetGroup>

      {/* 学习趋势 */}
      <section className="space-y-2.5">
        <GroupHeader>{t("trendTitle")}</GroupHeader>
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <ChartDot className="bg-primary/90" label={t("legendLearned")} />
            <ChartDot className="bg-primary/45" label={t("legendReviewed")} />
          </div>
          <AppleBars data={barData} height={170} labelStep={labelStep} />
        </div>
      </section>

      {/* 学习时长趋势 */}
      <section className="space-y-2.5">
        <GroupHeader>{t("timeTrend")}</GroupHeader>
        <AppleArea points={timePoints} height={140} labelStep={labelStep} />
      </section>

      {/* 掌握度 */}
      <section className="space-y-2.5">
        <GroupHeader>{t("mastery")}</GroupHeader>
        <div className="space-y-3">
          <AppleStackedBar
            parts={[
              { value: mastered, className: "bg-primary" },
              { value: learning, className: "bg-primary/55" },
              { value: fresh, className: "bg-foreground/[0.10]" },
            ]}
          />
          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            <ChartDot
              className="bg-primary"
              label={t("mastered")}
              count={mastered}
            />
            <ChartDot
              className="bg-primary/55"
              label={t("learning")}
              count={learning}
            />
            <ChartDot
              className="bg-foreground/[0.12]"
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
