import { useNavigate } from "react-router-dom"
import * as React from "react"
import {
  GroupHeader,
  InsetGroup,
  LargeTitle,
  ListRow,
} from "@/components/kit/primitives"
import { WordList } from "@/components/word-rows"
import { useT } from "@/lib/i18n"
import { useVoca } from "@/store/voca-context"

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
  const favGroups = state.similarGroups.filter((g) => g.favorite)

  return (
    <div className="space-y-6">
      <LargeTitle title={t("favorites")} back={() => navigate("/words")} />

      {favorites.length > 0 ? (
        <section className="space-y-2.5">
          <GroupHeader>
            {t("tabWords")} · {favorites.length}
          </GroupHeader>
          <WordList
            words={favorites}
            emptyTitle={t("noData")}
            emptyDesc=""
          />
        </section>
      ) : favGroups.length === 0 ? (
        <p className="px-1 py-6 text-center text-[15px] text-muted-foreground">
          {t("noData")}
        </p>
      ) : null}

      {favGroups.length > 0 && (
        <section className="space-y-2.5">
          <GroupHeader>{t("favGroups")}</GroupHeader>
          <InsetGroup>
            {favGroups.map((g) => (
              <ListRow
                key={g.id}
                as="button"
                onClick={() => navigate(`/similar/${g.id}`)}
                primary={g.title}
                secondary={t("wordsPlural", { n: g.words.length })}
              />
            ))}
          </InsetGroup>
        </section>
      )}
    </div>
  )
}
