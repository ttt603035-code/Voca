import { useNavigate, useParams } from "react-router-dom"
import * as React from "react"
import {
  AppleButton,
  LargeTitle,
  ProgressBar,
} from "@/components/kit/primitives"
import { WordList } from "@/components/word-rows"
import { useT } from "@/lib/i18n"
import { todayStr } from "@/lib/srs"
import { listWords, useVoca } from "@/store/voca-context"

export function ListPage() {
  const { bookId, listId } = useParams()
  const { state } = useVoca()
  const { t } = useT()
  const navigate = useNavigate()

  const book = state.books.find((b) => b.id === bookId) ?? null
  const list = state.lists.find((l) => l.id === listId) ?? null
  const words = React.useMemo(
    () => (listId ? listWords(state, listId) : []),
    [state, listId],
  )

  const mastered = words.filter(
    (w) => state.progress[w.id]?.status === "mastered",
  ).length
  const studied = words.filter((w) => state.progress[w.id]).length
  const pct = words.length > 0 ? Math.round((mastered / words.length) * 100) : 0
  let lastReviewed = ""
  for (const w of words) {
    const lr = state.progress[w.id]?.lastReviewed
    if (lr && lr > lastReviewed) lastReviewed = lr
  }

  if (!book || !list) {
    return (
      <div className="space-y-5">
        <LargeTitle title={t("tabWords")} back={() => navigate("/words")} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <LargeTitle
        title={list.name}
        back={() => navigate(`/words/books/${book.id}`)}
      />

      <div className="-mt-2 space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[15px] text-muted-foreground">
            {t("listWords", { n: words.length })} · {book.name}
            <span
              className={
                studied === 0
                  ? "text-muted-foreground/70"
                  : lastReviewed === todayStr()
                    ? "font-medium text-primary"
                    : "text-muted-foreground"
              }
            >
              {" "}
              ·{" "}
              {studied === 0
                ? t("notStarted")
                : lastReviewed === todayStr()
                  ? t("recentlyStudied")
                  : t("masteredPct", { n: pct })}
            </span>
          </p>
          <AppleButton
            variant="tinted"
            size="sm"
            className="h-9 rounded-full px-4"
            onClick={() =>
              navigate(`/review?scope=list&listId=${list.id}`)
            }
          >
            {t("practice")}
          </AppleButton>
        </div>
        <ProgressBar value={pct} className="h-1" />
      </div>

      <WordList
        words={words}
        showOrder
        emptyTitle={t("emptyList")}
        emptyDesc={t("emptyListDesc")}
      />
    </div>
  )
}
