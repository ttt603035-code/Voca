import { BookOpen, Heart, Import, Plus, Copy, CircleX } from "lucide-react"
import * as React from "react"
import { useNavigate } from "react-router-dom"
import { ImportVocabSheet } from "@/components/import-vocab-sheet"
import {
  GroupHeader,
  IconBtn,
  InsetGroup,
  LargeTitle,
  ListRow,
} from "@/components/kit/primitives"
import { WordSheet } from "@/components/word-sheet"
import { bookStats, useVoca } from "@/store/voca-context"
import { useT } from "@/lib/i18n"

export function WordsPage() {
  const { state } = useVoca()
  const { t } = useT()
  const navigate = useNavigate()
  const [importOpen, setImportOpen] = React.useState(false)
  const [addOpen, setAddOpen] = React.useState(false)

  const favorites = state.words.filter((w) => w.favorite).length
  const mistakes = state.words.filter(
    (w) => (state.progress[w.id]?.wrong ?? 0) > 0,
  ).length
  const groups = state.similarGroups.length

  return (
    <div className="space-y-7">
      <LargeTitle
        title={t("tabWords")}
        actions={
          <>
            <IconBtn
              icon={Import}
              label={t("importVocabulary")}
              onClick={() => setImportOpen(true)}
            />
            <IconBtn
              icon={Plus}
              label={t("addWord")}
              onClick={() => setAddOpen(true)}
            />
          </>
        }
      />

      {/* 单词本 */}
      <section className="space-y-2.5">
        <GroupHeader>{t("vocabulary")}</GroupHeader>
        {state.books.length > 0 ? (
          <InsetGroup>
            {state.books.map((b) => {
              const s = bookStats(state, b.id)
              return (
                <ListRow
                  key={b.id}
                  icon={BookOpen}
                  tint="#007AFF"
                  as="button"
                  onClick={() => navigate(`/words/books/${b.id}`)}
                  primary={b.name}
                  secondary={t("bookSubtitle", {
                    lists: s.lists,
                    words: s.total,
                  })}
                  trailing={
                    <span className="flex items-center gap-2">
                      <span className="text-[13px] tabular-nums text-[#34C759]">
                        {s.mastered} {t("mastered")}
                      </span>
                    </span>
                  }
                  chevron
                />
              )
            })}
          </InsetGroup>
        ) : (
          <InsetGroup>
            <ListRow
              icon={Import}
              tint="#007AFF"
              as="button"
              onClick={() => setImportOpen(true)}
              primary={t("emptyVocabulary")}
              secondary={t("emptyVocabularyDesc")}
              chevron
            />
          </InsetGroup>
        )}
      </section>

      {/* 快捷入口：Favorites / Mistakes / Similar Words */}
      <section className="space-y-2.5">
        <InsetGroup>
          <ListRow
            icon={Heart}
            tint="#FF3B30"
            as="button"
            onClick={() => navigate("/words/favorites")}
            primary={t("favorites")}
            trailing={
              <span className="text-[14px] tabular-nums text-muted-foreground">
                {favorites}
              </span>
            }
            chevron
          />
          <ListRow
            icon={CircleX}
            tint="#FF9500"
            as="button"
            onClick={() => navigate("/mistakes")}
            primary={t("mistakes")}
            trailing={
              <span className="text-[14px] tabular-nums text-muted-foreground">
                {mistakes}
              </span>
            }
            chevron
          />
          <ListRow
            icon={Copy}
            tint="#30B0C7"
            as="button"
            onClick={() => navigate("/similar")}
            primary={t("similarWords")}
            trailing={
              <span className="text-[14px] tabular-nums text-muted-foreground">
                {groups}
              </span>
            }
            chevron
          />
        </InsetGroup>
      </section>

      <ImportVocabSheet open={importOpen} onClose={() => setImportOpen(false)} />
      <WordSheet open={addOpen} word={null} onClose={() => setAddOpen(false)} />
    </div>
  )
}
