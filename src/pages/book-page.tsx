import { useNavigate, useParams } from "react-router-dom"
import { List } from "lucide-react"
import * as React from "react"
import {
  EmptyState,
  InsetGroup,
  LargeTitle,
  ListRow,
} from "@/components/kit/primitives"
import { ImportVocabSheet } from "@/components/import-vocab-sheet"
import { WordSheet } from "@/components/word-sheet"
import { bookStats, listWords, useVoca } from "@/store/voca-context"
import { useT } from "@/lib/i18n"

export function BookPage() {
  const { bookId } = useParams()
  const { state } = useVoca()
  const { t } = useT()
  const navigate = useNavigate()
  const [importOpen, setImportOpen] = React.useState(false)
  const [addOpen, setAddOpen] = React.useState(false)

  const book = state.books.find((b) => b.id === bookId) ?? null
  const lists = state.lists
    .filter((l) => l.bookId === bookId)
    .sort((a, b) => a.listOrder - b.listOrder)
  const stats = book ? bookStats(state, book.id) : { total: 0, mastered: 0, lists: 0 }

  if (!book) {
    return (
      <div className="space-y-5">
        <LargeTitle title={t("vocabulary")} back={() => navigate("/words")} />
        <EmptyState title={t("noData")} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <LargeTitle
        title={book.name}
        back={() => navigate("/words")}
        actions={
          <>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="text-[17px] font-medium text-primary"
            >
              {t("import")}
            </button>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="text-[17px] font-medium text-primary"
            >
              + {t("addWord")}
            </button>
          </>
        }
      />
      <p className="-mt-3 text-[15px] text-muted-foreground">
        {t("bookSubtitle", { lists: stats.lists, words: stats.total })} ·{" "}
        <span className="text-[#34C759]">
          {stats.mastered} {t("mastered")}
        </span>
      </p>

      {lists.length > 0 ? (
        <InsetGroup>
          {lists.map((l) => {
            const ws = listWords(state, l.id)
            const mastered = ws.filter(
              (w) => state.progress[w.id]?.status === "mastered",
            ).length
            return (
              <ListRow
                key={l.id}
                icon={List}
                tint="#8E8E93"
                as="button"
                onClick={() =>
                  navigate(`/words/books/${book.id}/lists/${l.id}`)
                }
                primary={l.name}
                secondary={`${ws.length} ${t("wordsNoun")}`}
                trailing={
                  mastered > 0 ? (
                    <span className="text-[13px] tabular-nums text-[#34C759]">
                      {mastered} {t("mastered")}
                    </span>
                  ) : undefined
                }
                chevron
              />
            )
          })}
        </InsetGroup>
      ) : (
        <EmptyState title={t("noData")} description={t("emptyVocabularyDesc")} />
      )}

      <ImportVocabSheet open={importOpen} onClose={() => setImportOpen(false)} />
      <WordSheet open={addOpen} word={null} onClose={() => setAddOpen(false)} />
    </div>
  )
}
