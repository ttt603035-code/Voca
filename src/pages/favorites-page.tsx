import { useNavigate } from "react-router-dom"
import * as React from "react"
import { LargeTitle } from "@/components/kit/primitives"
import { WordList } from "@/components/word-rows"
import { useVoca } from "@/store/voca-context"
import { useT } from "@/lib/i18n"

export function FavoritesPage() {
  const { state } = useVoca()
  const { t } = useT()
  const navigate = useNavigate()

  const favorites = React.useMemo(
    () =>
      state.words
        .filter((w) => w.favorite)
        .sort((a, b) =>
          a.wordOrder === b.wordOrder
            ? a.word.localeCompare(b.word)
            : a.wordOrder - b.wordOrder,
        ),
    [state.words],
  )

  return (
    <div className="space-y-5">
      <LargeTitle title={t("favorites")} back={() => navigate("/words")} />
      {favorites.length > 0 && (
        <p className="-mt-3 text-[15px] text-muted-foreground">
          {favorites.length} {t("wordsNoun")}
        </p>
      )}
      <WordList
        words={favorites}
        emptyTitle={t("noData")}
        emptyDesc=""
      />
    </div>
  )
}
