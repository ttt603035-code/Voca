import { useNavigate, useParams } from "react-router-dom"
import * as React from "react"
import {
  EmptyState,
  InsetGroup,
  LargeTitle,
  ProgressBar,
} from "@/components/kit/primitives"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ImportVocabSheet } from "@/components/import-vocab-sheet"
import { WordSheet } from "@/components/word-sheet"
import { useT } from "@/lib/i18n"
import { todayStr } from "@/lib/srs"
import { bookStats, listWords, useVoca } from "@/store/voca-context"

type ScopeRange = "all" | "unmastered" | "due" | "mistakes" | "favorites"

function listSummary(
  state: ReturnType<typeof useVoca>["state"],
  listId: string,
) {
  const ws = listWords(state, listId)
  const mastered = ws.filter(
    (w) => state.progress[w.id]?.status === "mastered",
  ).length
  const studied = ws.filter((w) => state.progress[w.id]).length
  let lastReviewed = ""
  for (const w of ws) {
    const lr = state.progress[w.id]?.lastReviewed
    if (lr && lr > lastReviewed) lastReviewed = lr
  }
  return {
    total: ws.length,
    mastered,
    studied,
    pct: ws.length > 0 ? Math.round((mastered / ws.length) * 100) : 0,
    recentlyStudied: lastReviewed === todayStr(),
  }
}

export function BookPage() {
  const { bookId } = useParams()
  const { state } = useVoca()
  const { t } = useT()
  const navigate = useNavigate()
  const [importOpen, setImportOpen] = React.useState(false)
  const [addOpen, setAddOpen] = React.useState(false)
  const [range, setRange] = React.useState<ScopeRange>("all")

  const book = state.books.find((b) => b.id === bookId) ?? null
  const lists = state.lists
    .filter((l) => l.bookId === bookId)
    .sort((a, b) => a.listOrder - b.listOrder)
  const stats = book ? bookStats(state, book.id) : { total: 0, mastered: 0, lists: 0 }

  if (!book) {
    return (
      <div className="space-y-5">
        <LargeTitle title={t("tabWords")} back={() => navigate("/words")} />
        <EmptyState title={t("noData")} />
      </div>
    )
  }

  function startPracticeAll() {
    const params: Record<string, string> = {
      scope: "book",
      bookId: book!.id,
    }
    if (range !== "all") params.range = range
    navigate(`/review?${new URLSearchParams(params).toString()}`)
  }

  return (
    <div className="space-y-5">
      <LargeTitle
        title={book.name}
        back={() => navigate("/words")}
        actions={
          book.builtIn ? undefined : (
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
          )
        }
      />

      <p className="-mt-3 text-[15px] text-muted-foreground">
        {stats.lists} Lists · {stats.total} words ·{" "}
        <span className="text-[#34C759]">
          {stats.mastered} {t("mastered")}
        </span>
      </p>

      {/* Practice All（整个词书） */}
      <div className="flex items-center gap-3">
        <Select value={range} onValueChange={(v) => setRange(v as ScopeRange)}>
          <SelectTrigger
            size="sm"
            className="h-10 rounded-full bg-primary/10 px-4 font-medium text-primary hover:bg-primary/15 dark:bg-primary/15"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("rangeAll")}</SelectItem>
            <SelectItem value="unmastered">{t("rangeUnmastered")}</SelectItem>
            <SelectItem value="due">{t("rangeDue")}</SelectItem>
            <SelectItem value="mistakes">{t("rangeMistakes")}</SelectItem>
            <SelectItem value="favorites">{t("rangeFavorites")}</SelectItem>
          </SelectContent>
        </Select>
        <button
          type="button"
          onClick={startPracticeAll}
          className="h-10 rounded-full bg-primary px-5 text-[15px] font-medium text-primary-foreground transition-opacity active:opacity-80"
        >
          {t("practiceAll")}
        </button>
      </div>

      {/* List 列表 */}
      {lists.length > 0 ? (
        <InsetGroup>
          {lists.map((l) => {
            const s = listSummary(state, l.id)
            return (
              <button
                key={l.id}
                type="button"
                onClick={() =>
                  navigate(`/words/books/${book.id}/lists/${l.id}`)
                }
                className="w-full px-4 pt-3.5 pb-3 text-left transition-colors active:bg-foreground/[0.03]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[17px] font-medium">{l.name}</span>
                  <span className="flex items-center gap-2.5">
                    <span className="text-[13px] text-muted-foreground tabular-nums">
                      {t("listWords", { n: s.total })}
                    </span>
                    <span
                      className={
                        s.studied === 0
                          ? "text-[13px] text-muted-foreground/70"
                          : s.recentlyStudied
                            ? "text-[13px] font-medium text-primary"
                            : "text-[13px] text-muted-foreground"
                      }
                    >
                      {s.studied === 0
                        ? t("notStarted")
                        : s.recentlyStudied
                          ? t("recentlyStudied")
                          : t("masteredPct", { n: s.pct })}
                    </span>
                  </span>
                </div>
                <ProgressBar
                  value={s.pct}
                  className="mt-2.5 h-1"
                  barClassName={
                    s.recentlyStudied ? "bg-primary" : "bg-[#34C759] dark:bg-[#30D158]"
                  }
                />
              </button>
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
