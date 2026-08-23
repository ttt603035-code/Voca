import { useNavigate } from "react-router-dom"
import * as React from "react"
import { AppleArea, AppleBars, AppleStackedBar, ChartDot } from "@/components/kit/charts"
import {
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
import { addDays, calcStreak, todayStr } from "@/lib/srs"
import { useVoca } from "@/store/voca-context"

type Range = "day" | "week" | "month" | "year"

const RANGES: { value: Range; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
]

function fmtDuration(sec: number): string {
  const m = Math.round(sec / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${h}h ${String(mm).padStart(2, "0")}m`
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"]

export function InsightsPage() {
  const { state } = useVoca()
  const navigate = useNavigate()
  const [range, setRange] = React.useState<Range>("week")

  const today = todayStr()

  /* 窗口内的每日序列 */
  const series = React.useMemo(() => {
    const pts: { date: string; label: string; value?: number }[] = []
    if (range === "day") {
      pts.push({ date: today, label: "今天" })
    } else if (range === "week") {
      for (let i = 6; i >= 0; i--) {
        const d = addDays(today, -i)
        pts.push({
          date: d,
          label: i === 0 ? "今天" : WEEKDAYS[new Date(`${d}T00:00:00`).getDay()],
        })
      }
    } else if (range === "month") {
      for (let i = 29; i >= 0; i--) {
        const d = addDays(today, -i)
        const dt = new Date(`${d}T00:00:00`)
        pts.push({ date: d, label: `${dt.getMonth() + 1}/${dt.getDate()}` })
      }
    } else {
      // 12 个月
      const now = new Date()
      for (let i = 11; i >= 0; i--) {
        const dt = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const y = dt.getFullYear()
        const m = dt.getMonth() + 1
        const key = `${y}-${String(m).padStart(2, "0")}`
        let total = 0
        for (const [date, s] of Object.entries(state.activity)) {
          if (date.slice(0, 7) === key) total += s.reviews
        }
        pts.push({ date: key, label: `${m}月`, value: total })
      }
    }
    return pts
  }, [range, today, state.activity])

  /* 窗口内的指标 */
  const metrics = React.useMemo(() => {
    let seconds = 0
    let reviews = 0
    let correct = 0
    let wrong = 0

    if (range === "year") {
      for (const p of Object.values(state.progress)) {
        correct += p.correct
        wrong += p.wrong
      }
      for (const s of Object.values(state.activity)) {
        seconds += s.seconds
        reviews += s.reviews
      }
    } else {
      for (const pt of series) {
        const s = state.activity[pt.date]
        if (s) {
          seconds += s.seconds
          reviews += s.reviews
        }
      }
      // 正确率：窗口内复习过的词（以其累计正确/错误计）
      const seen = new Set(series.map((p) => p.date))
      for (const p of Object.values(state.progress)) {
        if (p.lastReviewed && seen.has(p.lastReviewed)) {
          correct += p.correct
          wrong += p.wrong
        }
      }
    }

    return {
      seconds,
      reviews,
      accuracy:
        correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : null,
    }
  }, [range, series, state.activity, state.progress])

  const streak = calcStreak(state.activity)

  /* 图表数据 */
  const wordBars = series.map((p) => ({
    label: p.label,
    value:
      p.value ?? (state.activity[p.date]?.reviews ?? 0),
  }))
  const timeSeries = series.map((p) => {
    if (p.value !== undefined && range === "year") {
      const sec = Object.entries(state.activity)
        .filter(([d]) => d.slice(0, 7) === p.date)
        .reduce((s, [, v]) => s + v.seconds, 0)
      return { label: p.label, value: Math.round(sec / 6) / 10 }
    }
    return {
      label: p.label,
      value: Math.round(((state.activity[p.date]?.seconds ?? 0) / 60) * 10) / 10,
    }
  })

  /* 掌握分布 */
  const total = state.words.length
  const mastered = state.words.filter(
    (w) => state.progress[w.id]?.status === "mastered",
  ).length
  const learning = state.words.filter(
    (w) => state.progress[w.id]?.status === "learning",
  ).length
  const fresh = total - mastered - learning

  const mistakes = state.words
    .map((w) => ({ w, p: state.progress[w.id] }))
    .filter((x) => x.p && x.p.wrong > 0)
    .sort((a, b) => b.p!.wrong - a.p!.wrong)
    .slice(0, 3)

  const isDay = range === "day"
  const todayStat = state.activity[today]

  return (
    <div className="space-y-8">
      <LargeTitle
        title="Insights"
        actions={
          <Select value={range} onValueChange={(v) => setRange(v as Range)}>
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* 核心指标：2×2 分组，不 Card 化 */}
      <InsetGroup dividers={false} className="grid grid-cols-2 gap-px overflow-hidden bg-border/70">
        <StatTile label="Study Time" value={fmtDuration(metrics.seconds)} />
        <StatTile label="Words Reviewed" value={metrics.reviews} />
        <StatTile
          label="Accuracy"
          value={metrics.accuracy === null ? "—" : `${metrics.accuracy}%`}
        />
        <StatTile
          label="Current Streak"
          value={streak > 0 ? `${streak} days` : "0"}
        />
      </InsetGroup>

      {/* 词量趋势 */}
      <section className="space-y-3">
        <SectionTitle>Words Reviewed</SectionTitle>
        {isDay ? (
          <InsetGroup>
            <ListRow
              primary="Learned"
              secondary="今天新学的单词"
              trailing={
                <span className="text-[17px] font-medium tabular-nums">
                  {todayStat?.learned ?? 0}
                </span>
              }
            />
            <ListRow
              primary="Reviewed"
              secondary="今天复习的单词"
              trailing={
                <span className="text-[17px] font-medium tabular-nums">
                  {todayStat?.reviewed ?? 0}
                </span>
              }
            />
          </InsetGroup>
        ) : (
          <AppleBars
            data={wordBars}
            labelStep={range === "month" ? 5 : 1}
          />
        )}
      </section>

      {/* 学习时长 */}
      <section className="space-y-3">
        <SectionTitle>Study Time</SectionTitle>
        {isDay ? (
          <p className="text-[15px] text-muted-foreground">
            今天学习了{" "}
            <span className="font-medium text-foreground">
              {fmtDuration(todayStat?.seconds ?? 0)}
            </span>
          </p>
        ) : (
          <AppleArea points={timeSeries} />
        )}
      </section>

      {/* 掌握分布 */}
      <section className="space-y-3">
        <SectionTitle>Mastery</SectionTitle>
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
              label="Mastered"
              count={mastered}
            />
            <ChartDot className="bg-[#32ADE6]" label="Learning" count={learning} />
            <ChartDot
              className="bg-foreground/[0.15]"
              label="New"
              count={fresh}
            />
          </div>
        </div>
      </section>

      {/* 易错词入口 */}
      {mistakes.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionTitle>Mistakes</SectionTitle>
            <button
              type="button"
              onClick={() => navigate("/mistakes")}
              className="text-[15px] text-primary"
            >
              全部
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
                    Wrong ×{p!.wrong}
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
