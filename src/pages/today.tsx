import { Flame, Settings2, Sparkles } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
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
import { dateStr, greetingKey, useT } from "@/lib/i18n"
import { calcStreak, todayStr } from "@/lib/srs"
import { dueWords, newWords, useVoca } from "@/store/voca-context"

export function TodayPage() {
  const { state } = useVoca()
  const { t, locale } = useT()
  const navigate = useNavigate()
  const today = todayStr()

  const due = dueWords(state)
  const newCount = newWords(state).length
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
        {t(greetingKey())} · {dateStr(locale)}
      </p>

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

      {/* Difficult Words */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[17px] font-semibold">{t("difficultWords")}</span>
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
                    {t("wrong", { n: p!.wrong })}
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
              toast(t("aiReadingToast"), { description: t("aiReadingToastDesc") })
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
