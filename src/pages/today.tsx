import { Flame, Settings2, Sparkles } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  AppleButton,
  EmptyState,
  IconBtn,
  InsetGroup,
  ListRow,
  LargeTitle,
  ProgressBar,
  SectionTitle,
} from "@/components/kit/primitives"
import { calcStreak, todayStr } from "@/lib/srs"
import { dueWords, useVoca } from "@/store/voca-context"

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return "Good night"
  if (h < 11) return "Good morning"
  if (h < 13) return "Good noon"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

export function TodayPage() {
  const { state } = useVoca()
  const navigate = useNavigate()
  const today = todayStr()

  const due = dueWords(state)
  const newCount = state.words.filter((w) => !state.progress[w.id]).length
  const todayStat = state.activity[today]
  const reviewedToday = todayStat?.reviews ?? 0
  const streak = calcStreak(state.activity)

  const difficult = state.words
    .map((w) => ({ w, p: state.progress[w.id] }))
    .filter((x) => x.p && x.p.wrong > 0)
    .sort((a, b) => (b.p!.wrong - a.p!.wrong) || a.w.word.localeCompare(b.w.word))
    .slice(0, 3)

  const queueSize = due.length + newCount
  const goal = state.settings.dailyGoal
  const progressPct =
    reviewedToday > 0
      ? Math.min(100, (reviewedToday / Math.max(goal, reviewedToday)) * 100)
      : 0

  const dateStr = new Date().toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  })

  return (
    <div className="space-y-8">
      <LargeTitle
        title="Today"
        actions={
          <IconBtn
            icon={Settings2}
            label="Settings"
            onClick={() => navigate("/settings")}
          />
        }
      />

      <p className="-mt-4 text-[17px] text-muted-foreground">
        {greeting()} · {dateStr}
      </p>

      {/* Today's Review */}
      <section className="space-y-4">
        <SectionTitle>Today&apos;s Review</SectionTitle>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-[56px] leading-[1.05] font-semibold tracking-[-0.03em] tabular-nums">
              {due.length}
            </span>
            <span className="text-[15px] text-muted-foreground">
              words to review
            </span>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <ProgressBar value={progressPct} className="flex-1" />
            <span className="shrink-0 text-[13px] text-muted-foreground tabular-nums">
              {reviewedToday}/{Math.max(goal, reviewedToday)}
            </span>
          </div>
          <p className="mt-2.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <Flame
              className="size-3.5"
              style={{ color: streak > 0 ? "#FF9500" : "#8E8E93" }}
            />
            {streak > 0 ? `${streak}-day streak` : "Start your streak today"}
          </p>
        </div>
        <AppleButton
          onClick={() => navigate("/review")}
          disabled={queueSize === 0}
        >
          Start Review
        </AppleButton>
        {queueSize === 0 && (
          <p className="text-center text-[13px] text-muted-foreground">
            暂无可学习单词
          </p>
        )}
      </section>

      {/* Difficult Words */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionTitle>Difficult Words</SectionTitle>
          {difficult.length > 0 && (
            <button
              type="button"
              onClick={() => navigate("/mistakes")}
              className="text-[15px] text-primary"
            >
              全部
            </button>
          )}
        </div>
        {difficult.length > 0 ? (
          <InsetGroup>
            {difficult.map(({ w, p }) => (
              <ListRow
                key={w.id}
                as="button"
                onClick={() => navigate("/mistakes")}
                primary={
                  <span className="flex items-baseline gap-2">
                    {w.word}
                    <span className="text-[13px] font-normal text-muted-foreground">
                      {w.ipa}
                    </span>
                  </span>
                }
                secondary={w.meaning}
                trailing={
                  <span className="text-[13px] font-medium tabular-nums text-[#FF3B30] dark:text-[#FF453A]">
                    Wrong ×{p!.wrong}
                  </span>
                }
              />
            ))}
          </InsetGroup>
        ) : (
          <EmptyState
            icon={Flame}
            tint="#34C759"
            title="No difficult words"
            description="还没有错误记录，保持这个节奏"
          />
        )}
      </section>

      {/* AI Reading */}
      <section className="space-y-3">
        <SectionTitle>AI Reading</SectionTitle>
        <InsetGroup>
          <ListRow
            icon={Sparkles}
            tint="#AF52DE"
            as="button"
            onClick={() =>
              toast("AI Reading 即将上线：将基于你的词汇生成短文", {
                description: "在 Settings 中配置 Gemini API Key 后启用",
              })
            }
            primary="Generate Reading"
            secondary="基于你的词汇生成阅读短文"
            chevron
          />
        </InsetGroup>
      </section>
    </div>
  )
}
