import { CheckCircle2, ChevronRight } from "lucide-react"
import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  AppleButton,
  EmptyState,
  InsetGroup,
  LargeTitle,
  ListRow,
} from "@/components/kit/primitives"
import { WordSheet } from "@/components/word-sheet"
import { fmtShortDate, useT } from "@/lib/i18n"
import { todayStr } from "@/lib/srs"
import type { Word } from "@/lib/types"
import {
  lastMistakeDate,
  mistakeDates,
  useVoca,
  wordsByMistakeDate,
} from "@/store/voca-context"

export function MistakesPage() {
  const { state } = useVoca()
  const { t } = useT()
  const navigate = useNavigate()
  const [selected, setSelected] = React.useState<string | null>(null)
  const [sheet, setSheet] = React.useState<Word | null>(null)

  const wordMap = React.useMemo(
    () => new Map(state.words.map((w) => [w.id, w])),
    [state.words],
  )
  const liveWord = sheet
    ? (state.words.find((w) => w.id === sheet.id) ?? null)
    : null
  const today = todayStr()

  /* 更早：有错误计数但无日志日期的词（历史迁移数据） */
  const earlierWords = React.useMemo(() => {
    return state.words
      .filter((w) => (state.progress[w.id]?.wrong ?? 0) > 0)
      .filter((w) => !lastMistakeDate(state, w.id))
      .sort(
        (a, b) =>
          (state.progress[b.id]?.wrong ?? 0) -
          (state.progress[a.id]?.wrong ?? 0),
      )
  }, [state])

  const dates = mistakeDates(state)

  /* ─────────────── 日期详情 ─────────────── */
  if (selected) {
    const isEarlier = selected === "earlier"
    const ids = isEarlier
      ? earlierWords.map((w) => w.id)
      : wordsByMistakeDate(state, selected)
    const words = ids
      .map((id) => wordMap.get(id))
      .filter(Boolean) as Word[]

    return (
      <div className="space-y-5">
        <LargeTitle
          title={
            isEarlier
              ? t("earlier")
              : selected === today
                ? t("mistakeToday")
                : fmtShortDate(selected)
          }
          back={() => setSelected(null)}
        />
        <p className="-mt-3 text-[15px] text-muted-foreground">
          {t("wordsOnDate", { n: words.length })}
        </p>

        {words.length > 0 ? (
          <>
            <InsetGroup>
              {words.map((w) => {
                const p = state.progress[w.id]
                const wrong = isEarlier
                  ? (p?.wrong ?? 0)
                  : (state.mistakeLog[selected]?.[w.id] ?? 0)
                const last = lastMistakeDate(state, w.id)
                return (
                  <ListRow
                    key={w.id}
                    as="button"
                    onClick={() => setSheet(w)}
                    primary={
                      <span className="flex items-baseline gap-2">
                        {w.word}
                        <span className="text-[13px] font-normal text-muted-foreground">
                          {w.ipa}
                        </span>
                      </span>
                    }
                    secondary={
                      last
                        ? `${t("lastWrong")} ${fmtShortDate(last)}`
                        : w.meaning
                    }
                    trailing={
                      <span className="text-[13px] font-medium tabular-nums text-[#FF3B30] dark:text-[#FF453A]">
                        {t("wrongTimes", { n: wrong })}
                      </span>
                    }
                  />
                )
              })}
            </InsetGroup>
            <AppleButton
              variant="tinted"
              className="w-fit px-6"
              onClick={() =>
                navigate(
                  isEarlier
                    ? `/review?scope=mistakes-date&date=earlier`
                    : `/review?scope=mistakes-date&date=${selected}`,
                )
              }
            >
              {t("practiceAgain")}
            </AppleButton>
          </>
        ) : (
          <EmptyState
            icon={CheckCircle2}
            tint="#34C759"
            title={t("noMistakes")}
          />
        )}

        <WordSheet
          open={!!sheet}
          word={liveWord}
          onClose={() => setSheet(null)}
        />
      </div>
    )
  }

  /* ─────────────── 日期列表 ─────────────── */
  if (dates.length === 0 && earlierWords.length === 0) {
    return (
      <div className="space-y-5">
        <LargeTitle title={t("mistakes")} back={() => navigate("/words")} />
        <EmptyState
          icon={CheckCircle2}
          tint="#34C759"
          title={t("noMistakes")}
          description={t("noMistakesDesc")}
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <LargeTitle title={t("mistakes")} back={() => navigate("/words")} />

      {dates.length > 0 && (
        <InsetGroup>
          {dates.map((d) => {
            const count = Object.keys(state.mistakeLog[d]).length
            return (
              <ListRow
                key={d}
                as="button"
                onClick={() => setSelected(d)}
                primary={
                  d === today ? (
                    <span className="font-medium">{t("mistakeToday")}</span>
                  ) : (
                    fmtShortDate(d)
                  )
                }
                secondary={t("wordsOnDate", { n: count })}
                trailing={
                  <ChevronRight className="size-4 text-muted-foreground/40" />
                }
              />
            )
          })}
        </InsetGroup>
      )}

      {earlierWords.length > 0 && (
        <InsetGroup>
          <ListRow
            as="button"
            onClick={() => setSelected("earlier")}
            primary={t("earlier")}
            secondary={t("wordsOnDate", { n: earlierWords.length })}
            trailing={
              <ChevronRight className="size-4 text-muted-foreground/40" />
            }
          />
        </InsetGroup>
      )}
    </div>
  )
}
