import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Info,
  Target,
} from "lucide-react"
import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { LEVELS, type Level } from "@/lib/types"
import { todayStr } from "@/lib/srs"
import { useVoca } from "@/store/voca-context"

function lastNDays(n: number): string[] {
  const days: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(todayStr(d))
  }
  return days
}

const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"]

export function ProgressPage() {
  const { state, setDailyGoal, resetAll } = useVoca()
  const [confirmReset, setConfirmReset] = React.useState(false)
  const [goalDraft, setGoalDraft] = React.useState(
    String(state.settings.dailyGoal),
  )

  const total = state.words.length
  const mastered = state.words.filter(
    (w) => state.progress[w.id]?.status === "mastered",
  ).length
  const learning = state.words.filter(
    (w) => state.progress[w.id]?.status === "learning",
  ).length
  const fresh = total - mastered - learning
  const totalReviews = Object.values(state.activity).reduce<number>(
    (sum, d) => sum + d.reviews,
    0,
  )
  const totalCorrect = Object.values(state.activity).reduce<number>(
    (sum, d) => sum + d.correct,
    0,
  )
  const totalWrong = Object.values(state.activity).reduce<number>(
    (sum, d) => sum + d.wrong,
    0,
  )
  const accuracy =
    totalCorrect + totalWrong > 0
      ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100)
      : 100

  const days = lastNDays(7)
  const maxDay = Math.max(1, ...days.map((d) => state.activity[d]?.reviews ?? 0))

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

  function saveGoal() {
    const n = Number(goalDraft)
    if (Number.isFinite(n) && n >= 1 && n <= 100) setDailyGoal(n)
  }

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

      <div className="grid gap-4 lg:grid-cols-2">
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

        {/* 近 7 天复习 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">近 7 天复习量</CardTitle>
            <CardDescription>卡片学习 + 测试均计入</CardDescription>
          </CardHeader>
          <CardContent>
            {totalReviews === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                还没有复习记录，去学第一个单词吧
              </div>
            ) : (
              <div className="flex h-40 items-end gap-3">
                {days.map((d) => {
                  const count = state.activity[d]?.reviews ?? 0
                  const isToday = d === todayStr()
                  return (
                    <div
                      key={d}
                      className="flex flex-1 flex-col items-center gap-1.5"
                      title={`${d}：${count} 次`}
                    >
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {count > 0 ? count : ""}
                      </span>
                      <div
                        className={`w-full rounded-md ${
                          count > 0
                            ? isToday
                              ? "bg-primary"
                              : "bg-primary/40"
                            : "bg-muted"
                        }`}
                        style={{
                          height: `${Math.max(count > 0 ? 8 : 4, (count / maxDay) * 100)}%`,
                        }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {WEEKDAY_LABELS[new Date(`${d}T00:00:00`).getDay()]}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">设置</CardTitle>
          <CardDescription>数据保存在浏览器本地（localStorage）</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid w-48 gap-2">
              <label className="text-sm font-medium" htmlFor="goal">
                每日目标（个）
              </label>
              <Input
                id="goal"
                type="number"
                min={1}
                max={100}
                value={goalDraft}
                onChange={(e) => setGoalDraft(e.target.value)}
              />
            </div>
            <Button
              variant="secondary"
              onClick={saveGoal}
              disabled={String(state.settings.dailyGoal) === goalDraft}
            >
              保存目标
            </Button>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="size-3.5" />
              影响“卡片学习”每轮学习的新单词数量
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t pt-5">
            <Button variant="outline" className="text-destructive" onClick={() => setConfirmReset(true)}>
              <AlertTriangle className="size-4" />
              重置全部数据
            </Button>
            <p className="text-xs text-muted-foreground">
              将清空所有学习进度并恢复内置词库（自定义单词会丢失）
            </p>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定重置全部数据？</AlertDialogTitle>
            <AlertDialogDescription>
              所有学习进度、自定义单词和统计记录都会被清空，并恢复为内置的 100
              个单词。此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                resetAll()
                setConfirmReset(false)
              }}
            >
              确认重置
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
