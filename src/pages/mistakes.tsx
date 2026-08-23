import { useNavigate } from "react-router-dom"
import * as React from "react"
import { CheckCircle2 } from "lucide-react"
import {
  AppleButton,
  EmptyState,
  LargeTitle,
} from "@/components/kit/primitives"
import { WordList } from "@/components/word-rows"
import { useT } from "@/lib/i18n"
import { useVoca } from "@/store/voca-context"

export function MistakesPage() {
  const { state } = useVoca()
  const { t } = useT()
  const navigate = useNavigate()

  const mistakes = React.useMemo(
    () =>
      state.words
        .filter((w) => (state.progress[w.id]?.wrong ?? 0) > 0)
        .sort(
          (a, b) =>
            (state.progress[b.id]?.wrong ?? 0) -
              (state.progress[a.id]?.wrong ?? 0) ||
            (state.progress[b.id]?.lastReviewed ?? "").localeCompare(
              state.progress[a.id]?.lastReviewed ?? "",
            ),
        ),
    [state.words, state.progress],
  )

  return (
    <div className="space-y-5">
      <LargeTitle title={t("mistakes")} back={() => navigate("/words")} />
      {mistakes.length > 0 ? (
        <>
          <p className="-mt-3 text-[15px] text-muted-foreground">
            {mistakes.length} {t("wordsNoun")}
          </p>
          <WordList
            words={mistakes}
            emptyTitle={t("noMistakes")}
            emptyDesc={t("noMistakesDesc")}
          />
          <AppleButton
            variant="tinted"
            className="w-fit px-6"
            onClick={() => navigate("/review?filter=mistakes")}
          >
            {t("reviewMistakes")}
          </AppleButton>
        </>
      ) : (
        <EmptyState
          icon={CheckCircle2}
          tint="#34C759"
          title={t("noMistakes")}
          description={t("noMistakesDesc")}
        />
      )}
    </div>
  )
}
