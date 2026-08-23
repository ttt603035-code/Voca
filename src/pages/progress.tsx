import {
  BarChart3,
  CheckCircle2,
  LineChart,
  Target,
} from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { LEVELS, type Level } from "@/lib/types"
import { useVoca } from "@/store/voca-context"

export function ProgressPage() {
  const { state } = useVoca()

  const total = state.words.length
  const mastered = state.words.filter(
    (w) => state.progress[w.id]?.status === "mastered",
  ).length
  const learning = state.words.filter(
    (w) => state.progress[w.id]?.status === "learning",
  ).length
  const fresh = total - mastered - learning

  let totalReviews = 0
  let totalCorrect = 0
  let totalWrong = 0
  for (const p of Object.values(state.progress)) {
    totalReviews += p.reps
    totalCorrect += p.correct
    totalWrong += p.wrong
  }
  const accuracy =
    totalCorrect + totalWrong > 0
      ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100)
      : 100

  const levelStats = LEVELS.map((lv: Level) => {
    const wordsOfLevel = state.words.filter((w) => w.level === lv)
    const m = wordsOfLevel.filter(
      (w) => state.progress[w.id]?.status === "mastered",
    ).length
    const l = wordsOfLevel.filter(
      (w) => state.progress[w.id]?.status === "learning",
    ).length
    return {
      level: lv,
      total: wordsOfLevel.length,
      mastered: m,
      learning: l,
      fresh: wordsOfLevel.length - m - l,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">学习进度</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          累计复习 {totalReviews} 次 · 整体正确率 {accuracy}%
        </p>
      </div>

      {/* 总览 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="size-4 text-emerald-500" />
              已掌握
            </CardTitle>
            <CardDescription>
              记忆间隔 ≥ 21 天，基本形成长期记忆
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-semibold tabular-nums">
              {mastered}
              <span className="ml-1 text-base font-normal text-muted-foreground">
                / {total}
              </span>
            </div>
            <Progress value={total > 0 ? (mastered / total) * 100 : 0} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4 text-sky-500" />
              学习中
            </CardTitle>
            <CardDescription>正在间隔重复周期里的单词</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-semibold tabular-nums">
              {learning}
              <span className="ml-1 text-base font-normal text-muted-foreground">
                / {total}
              </span>
            </div>
            <Progress
              value={total > 0 ? (learning / total) * 100 : 0}
              className="bg-sky-500/20"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="size-4 text-muted-foreground" />
              未学习
            </CardTitle>
            <CardDescription>还没进入复习循环的新单词</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-semibold tabular-nums">
              {fresh}
              <span className="ml-1 text-base font-normal text-muted-foreground">
                / {total}
              </span>
            </div>
            <Progress value={total > 0 ? (fresh / total) * 100 : 0} />
          </CardContent>
        </Card>
      </div>

      {/* 按级别分布 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">按级别分布</CardTitle>
          <CardDescription>
            <span className="mr-3 inline-flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-500" /> 已掌握
            </span>
            <span className="mr-3 inline-flex items-center gap-1">
              <span className="size-2 rounded-full bg-sky-500" /> 学习中
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full bg-muted-foreground/30" /> 未学习
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {levelStats.map((s) => (
            <div key={s.level} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{s.level}</span>
                <span className="tabular-nums text-muted-foreground">
                  {s.mastered}/{s.total}
                </span>
              </div>
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                {s.total > 0 && (
                  <>
                    <div
                      className="bg-emerald-500"
                      style={{ width: `${(s.mastered / s.total) * 100}%` }}
                    />
                    <div
                      className="bg-sky-500"
                      style={{ width: `${(s.learning / s.total) * 100}%` }}
                    />
                  </>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-6 text-center">
          <LineChart className="size-7 text-primary" />
          <p className="text-sm text-muted-foreground">
            想看每日词量分布和学习时长曲线？
          </p>
          <Button size="sm" variant="secondary" asChild>
            <Link to="/trends">查看学习趋势</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
