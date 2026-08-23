import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Flame,
  Sparkles,
  Timer,
} from "lucide-react"
import { Link } from "react-router-dom"
import { WordStatusBadge } from "@/components/word-status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  dueWords,
  getProgress,
  newWords,
  todayReviews,
  useVoca,
} from "@/store/voca-context"
import { speak } from "@/lib/speech"
import { calcStreak, pickWordOfTheDay } from "@/lib/srs"

function greeting(): string {
  const h = new Date().getHours()
  if (h < 6) return "夜深了"
  if (h < 12) return "早上好"
  if (h < 18) return "下午好"
  return "晚上好"
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  hint?: string
  accent?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${accent ?? "bg-primary/10 text-primary"}`}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-semibold tabular-nums">{value}</div>
          <div className="truncate text-sm text-muted-foreground">
            {label}
            {hint && <span className="ml-1 text-xs">（{hint}）</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { state } = useVoca()
  const total = state.words.length
  const due = dueWords(state)
  const fresh = newWords(state)
  const mastered = state.words.filter(
    (w) => state.progress[w.id]?.status === "mastered",
  ).length
  const streak = calcStreak(state.activity)
  const reviewsToday = todayReviews(state)
  const goal = state.settings.dailyGoal
  const goalPct = Math.min(100, Math.round((reviewsToday / goal) * 100))
  const wod = pickWordOfTheDay(state.words)

  const dateStr = new Date().toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting()} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {dateStr}
            {due.length > 0
              ? ` · 今天有 ${due.length} 个单词等你复习`
              : " · 今天没有待复习的单词，保持节奏继续学新词吧"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/learn">
              开始学习
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/quiz">
              <Brain className="size-4" />
              快速测试
            </Link>
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label="单词总数"
          value={total}
          hint={`新词 ${fresh.length}`}
        />
        <StatCard
          icon={Timer}
          label="今日待复习"
          value={due.length}
          accent="bg-amber-500/15 text-amber-600 dark:text-amber-400"
        />
        <StatCard
          icon={CheckCircle2}
          label="已掌握"
          value={mastered}
          hint={total > 0 ? `${Math.round((mastered / total) * 100)}%` : undefined}
          accent="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          icon={Flame}
          label="连续学习"
          value={`${streak} 天`}
          accent="bg-orange-500/15 text-orange-600 dark:text-orange-400"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* 今日目标 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">今日目标</CardTitle>
            <CardDescription>
              每天复习 {goal} 个单词，积少成多
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">今日已复习</span>
              <span className="font-medium tabular-nums">
                {reviewsToday} / {goal}
              </span>
            </div>
            <Progress value={goalPct} />
            {goalPct >= 100 ? (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                🎉 目标达成！可以挑战更多。
              </p>
            ) : (
              <Button variant="secondary" size="sm" asChild>
                <Link to="/learn">去完成目标</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* 待复习列表 */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">今日待复习</CardTitle>
            <CardDescription>
              {due.length > 0
                ? "趁记忆还热乎，现在就去看看它们"
                : "全部复习完毕，太棒了"}
            </CardDescription>
            {due.length > 0 && (
              <CardAction>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/learn">
                    全部学习
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </CardAction>
            )}
          </CardHeader>
          <CardContent>
            {due.length > 0 ? (
              <ul className="divide-y">
                {due.slice(0, 5).map((w) => (
                  <li
                    key={w.id}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium">{w.word}</span>
                        <span className="text-xs text-muted-foreground">
                          {w.ipa}
                        </span>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {w.meaning}
                      </p>
                    </div>
                    <WordStatusBadge progress={getProgress(state, w.id)} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <CheckCircle2 className="size-8 text-emerald-500" />
                <p className="text-sm text-muted-foreground">
                  暂无待复习单词
                </p>
                {fresh.length > 0 && (
                  <Button size="sm" variant="secondary" asChild>
                    <Link to="/learn">
                      学习 {Math.min(fresh.length, goal)} 个新单词
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 每日一词 */}
      {wod && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" />
              每日一词
            </CardTitle>
            <CardDescription>坚持下来，词汇量会给你惊喜</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">{wod.word}</span>
                  <span className="text-sm text-muted-foreground">{wod.ipa}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {wod.pos} {wod.meaning}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => speak(wod.word)}
                aria-label="朗读单词"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5 6 9H2v6h4l5 4V5z" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              </Button>
            </div>
            <div className="min-w-0 flex-1 basis-64">
              <p className="text-sm italic text-muted-foreground">
                “{wod.example}”
              </p>
              <p className="mt-0.5 text-sm">{wod.exampleZh}</p>
            </div>
            <Badge variant="outline">{wod.level}</Badge>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/learn?word=${wod.id}`}>马上复习</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
