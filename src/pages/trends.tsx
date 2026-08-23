import * as React from "react"
import {
  ChartLegend,
  StackedBarChart,
  type BarPoint,
} from "@/components/charts/stacked-bar-chart"
import { TrendLineChart } from "@/components/charts/trend-line-chart"
import {
  Card,
  CardContent,
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
import { addDays, todayStr } from "@/lib/srs"
import { useVoca } from "@/store/voca-context"

const RANGES = [
  { id: "7", label: "近 7 日", past: 3, future: 3, lineDays: 7 },
  { id: "14", label: "近 14 日", past: 7, future: 6, lineDays: 14 },
]

function offsetLabel(offset: number): string {
  if (offset === 0) return "今天"
  if (offset === 1) return "明天"
  if (offset === 2) return "后天"
  if (offset === 3) return "3天后"
  if (offset === -1) return "昨天"
  if (offset === -2) return "前天"
  return offset > 0 ? `${offset}天后` : `${-offset}天前`
}

function StatCell({
  value,
  unit,
  label,
}: {
  value: string | number
  unit: string
  label: string
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 bg-card px-2 py-4">
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

export function TrendsPage() {
  const { state } = useVoca()
  const [rangeId, setRangeId] = React.useState("7")
  const range = RANGES.find((r) => r.id === rangeId) ?? RANGES[0]

  const today = todayStr()
  const todayStat = state.activity[today]

  // 累计
  let totalLearned = 0
  let totalSeconds = 0
  for (const d of Object.values(state.activity)) {
    totalLearned += d.learned
    totalSeconds += d.seconds
  }

  // 未来待复习：按到期日统计
  const scheduledByDate: Record<string, number> = {}
  for (const w of state.words) {
    const p = state.progress[w.id]
    if (!p || p.status === "new" || p.due <= today) continue
    scheduledByDate[p.due] = (scheduledByDate[p.due] ?? 0) + 1
  }

  // 堆叠柱状图
  const barData: BarPoint[] = []
  for (let offset = -range.past; offset <= range.future; offset++) {
    const date = addDays(today, offset)
    const day = state.activity[date]
    const learned = day?.learned ?? 0
    const reviewed = day?.reviewed ?? 0
    const scheduled = offset > 0 ? (scheduledByDate[date] ?? 0) : 0
    barData.push({
      label: offsetLabel(offset),
      highlight: offset === 0,
      segments: [
        { value: learned, className: "bg-orange-400 dark:bg-orange-500/80" },
        { value: reviewed, className: "bg-pink-300 dark:bg-pink-400/70" },
        {
          value: scheduled,
          className: "bg-zinc-300 dark:bg-zinc-600",
        },
      ],
    })
  }

  // 时长曲线
  const linePoints = []
  for (let i = range.lineDays - 1; i >= 0; i--) {
    const date = addDays(today, -i)
    linePoints.push({
      label: offsetLabel(-i),
      value: Math.round(((state.activity[date]?.seconds ?? 0) / 60) * 10) / 10,
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">学习趋势</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            词量分布与学习时长变化
          </p>
        </div>
        <Select value={rangeId} onValueChange={setRangeId}>
          <SelectTrigger className="w-30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGES.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 顶部统计 */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border/60 sm:grid-cols-4">
            <StatCell
              value={todayStat?.reviews ?? 0}
              unit="词"
              label="今日学习&复习"
            />
            <StatCell
              value={Math.floor((todayStat?.seconds ?? 0) / 60)}
              unit="分钟"
              label="今日时长"
            />
            <StatCell value={totalLearned} unit="词" label="累计学习" />
            <StatCell
              value={Math.floor(totalSeconds / 60)}
              unit="分钟"
              label="累计时长"
            />
          </div>
        </CardContent>
      </Card>

      {/* 词量堆叠柱状图 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">词量分布</CardTitle>
            <ChartLegend
              items={[
                { label: "学习词数", className: "bg-orange-400" },
                { label: "复习词数", className: "bg-pink-300" },
                { label: "待复习词数", className: "bg-zinc-300 dark:bg-zinc-600" },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent>
          <StackedBarChart data={barData} height={210} />
          <p className="mt-3 text-xs text-muted-foreground">
            灰色柱为按间隔重复计划安排的待复习词数（未来几天）
          </p>
        </CardContent>
      </Card>

      {/* 时长曲线 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-center gap-2">
            <span className="size-2.5 rounded-full border-2 border-primary" />
            <span className="h-0.5 w-6 rounded bg-primary" />
            <CardTitle className="text-sm">学习时长（分钟）</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <TrendLineChart points={linePoints} unit=" 分" />
        </CardContent>
      </Card>
    </div>
  )
}
