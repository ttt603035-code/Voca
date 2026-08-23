import { Flame, Settings2, Sparkles } from "lucide-react"
import * as React from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  AppleArea,
  AppleBars,
  ChartDot,
  type BarPoint,
} from "@/components/kit/charts"
import {
  AppleButton,
  EmptyState,
  GroupHeader,
  IconBtn,
  InsetGroup,
  LargeTitle,
  ListRow,
  ProgressBar,
} from "@/components/kit/primitives"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { dateStr, fmtDuration, greetingKey, useT } from "@/lib/i18n"
import { buildTrend, pendingCount, trendLabelStep } from "@/lib/trends"
import { calcStreak, todayStr } from "@/lib/srs"
import {
  dueWords,
  newWords,
  overviewStats,
  useVoca,
} from "@/store/voca-context"

type Range = 7 | 30 | 90

function OverviewTile({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3.5">
      <span className="text-[20px] leading-tight font-semibold tracking-[-0.01em] tabular-nums">
        {value}
      </span>
      <span className="text-[12px] text-muted-foreground">{label}</span>
    </div>
  )
}

export function TodayPage() {
  const { state } = useVoca()
  const { t, lang } = useT()
  const navigate = useNavigate()
  const today = todayStr()
  const [range, setRange] = React.useState<Range>(7)

  const due = dueWords(state)
  const newCount = newWords(state).length
  const todayStat = state.activity[today]
  const reviewedToday = todayStat?.reviews ?? 0
  const streak = calcStreak(state.activity)
  const ov = overviewStats(state)
  const pending = pendingCount(state)

  const difficult = state.words
    .map((w) => ({ w, p: state.progress[w.id] }))
    .filter((x) => x.p && x.p.wrong > 0)
    .sort((a, b) => b.p!.wrong - a.p!.wrong || a.w.word.localeCompare(b.w.word))
    .slice(0, 3)

  const queueSize = due.length + newCount
  const goal = state.settings.dailyGoal
  const progressPct =
    reviewedToday > 0
      ? Math.min(100, (reviewedToday / Math.max(goal, reviewedToday)) * 100)
      : 0

  /* 趋势数据 */
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
    value:
      Math.round(((state.activity[p.date]?.seconds ?? 0) / 60) * 10) / 10,
  }))

  const rangeOptions: { value: string; label: string }[] = [
    { value: "7", label: t("range7") },
    { value: "30", label: t("range30") },
    { value: "90", label: t("range90") },
  ]

  return (
    <div className="space-y-7">
      <LargeTitle
        title={t("tabToday")}
        actions={
          <IconBtn
            icon={Settings2}
            label={t("settings")}
            onClick={() => navigate("/settings")}
          />
        }
      />

      <p className="-mt-4 text-[17px] text-muted-foreground">
        {t(greetingKey())} · {dateStr(lang === "zh" ? "zh-CN" : "en-US")}
      </p>

      {/* 学习概况 */}
      <section className="space-y-2.5">
        <GroupHeader>{t("overviewTitle")}</GroupHeader>
        <InsetGroup dividers={false} className="grid grid-cols-3 divide-x divide-border/60">
          <OverviewTile
            label={t("statTodayLearned")}
            value={t("wordsShort", { n: ov.todayLearned })}
          />
          <OverviewTile
            label={t("statTodayReviewed")}
            value={t("wordsShort", { n: ov.todayReviewed })}
          />
          <OverviewTile
            label={t("statTodayTime")}
            value={fmtDuration(ov.todaySeconds, t, lang)}
          />
        </InsetGroup>
        <InsetGroup dividers={false} className="grid grid-cols-2 divide-x divide-border/60">
          <OverviewTile
            label={t("statTotalLearned")}
            value={t("wordsShort", { n: ov.totalLearnedWords })}
          />
          <OverviewTile
            label={t("statTotalTime")}
            value={fmtDuration(ov.totalSeconds, t, lang)}
          />
        </InsetGroup>
      </section>

      {/* Today's Review */}
      <section className="space-y-4">
        <GroupHeader>{t("todaysReview")}</GroupHeader>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-[56px] leading-[1.05] font-semibold tracking-[-0.03em] tabular-nums">
              {due.length}
            </span>
            <span className="text-[15px] text-muted-foreground">
              {t("wordsToReview")}
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
            {streak > 0 ? t("streak", { n: streak }) : t("startStreak")}
          </p>
        </div>
        <AppleButton onClick={() => navigate("/review")} disabled={queueSize === 0}>
          {t("startReview")}
        </AppleButton>
        {queueSize === 0 && (
          <p className="text-center text-[13px] text-muted-foreground">
            {t("noWordsToLearn")}
          </p>
        )}
      </section>

      {/* 学习趋势 */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <GroupHeader className="!px-0">{t("trendTitle")}</GroupHeader>
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
        </div>

        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <ChartDot className="bg-[#FF9500]/85" label={t("legendLearned")} />
            <ChartDot className="bg-[#FF9EBB]/90" label={t("legendReviewed")} />
            <ChartDot
              className="bg-foreground/[0.15]"
              label={t("pendingNow", { n: pending })}
            />
          </div>
          <AppleBars data={barData} height={140} labelStep={trendLabelStep(range)} />
        </div>

        <div className="space-y-1.5">
          <span className="text-[13px] text-muted-foreground">
            {t("timeTrend")}
          </span>
          <AppleArea
            points={timePoints}
            height={110}
            labelStep={trendLabelStep(range)}
          />
        </div>
      </section>

      {/* Difficult Words */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-0">
          <GroupHeader className="!px-0">{t("difficultWords")}</GroupHeader>
          {difficult.length > 0 && (
            <button
              type="button"
              onClick={() => navigate("/mistakes")}
              className="text-[15px] text-primary"
            >
              {t("seeAll")}
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
                    {t("wrongTimes", { n: p!.wrong })}
                  </span>
                }
              />
            ))}
          </InsetGroup>
        ) : (
          <EmptyState
            icon={Flame}
            tint="#34C759"
            title={t("noDifficult")}
            description={t("noDifficultDesc")}
          />
        )}
      </section>

      {/* AI Reading */}
      <section className="space-y-2.5">
        <GroupHeader>{t("aiReading")}</GroupHeader>
        <InsetGroup>
          <ListRow
            icon={Sparkles}
            tint="#AF52DE"
            as="button"
            onClick={() =>
              toast(t("aiReadingToast"), {
                description: t("aiReadingToastDesc"),
              })
            }
            primary={t("generateReading")}
            secondary={t("generateReadingDesc")}
            chevron
          />
        </InsetGroup>
      </section>
    </div>
  )
}
