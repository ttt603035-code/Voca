import {
  BookOpen,
  CircleX,
  Copy,
  Heart,
  Import,
  Loader2,
  Plus,
  RefreshCw,
} from "lucide-react"
import * as React from "react"
import { useNavigate } from "react-router-dom"
import { ImportVocabSheet } from "@/components/import-vocab-sheet"
import {
  GlassGroup,
  GlassIconButton,
  GlassItem,
} from "@/components/ui/glass-item"
import { GroupHeader, LargeTitle } from "@/components/kit/primitives"
import { WordSheet } from "@/components/word-sheet"
import { publicAsset } from "@/services/vocabulary"
import { bookStats, useVoca } from "@/store/voca-context"
import { useT } from "@/lib/i18n"

export function WordsPage() {
  const { state, builtIn, reloadBuiltIn } = useVoca()
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
            <GlassIconButton
              icon={Import}
              label={t("importVocabulary")}
              onClick={() => setImportOpen(true)}
            />
            <GlassIconButton
              icon={Plus}
              label={t("addWord")}
              onClick={() => setAddOpen(true)}
            />
          </>
        }
      />

      {/* 单词本 */}
      <section className="space-y-3">
        <GroupHeader>{t("vocabulary")}</GroupHeader>
        <GlassGroup>
          {state.books.map((b) => {
            const s = bookStats(state, b.id)
            return (
              <GlassItem
                key={b.id}
                icon={BookOpen}
                iconNode={
                  b.cover ? (
                    <img
                      src={publicAsset(b.cover)}
                      alt={b.name}
                      className="size-8 shrink-0 rounded-[10px] border border-white/35 object-cover dark:border-white/[0.07]"
                    />
                  ) : undefined
                }
                tint={b.builtIn ? "#007AFF" : "#34C759"}
                onClick={() => navigate(`/words/books/${b.id}`)}
                primary={
                  b.builtIn ? (
                    <span className="flex items-center gap-2">
                      {b.name}
                      <span className="rounded-[5px] bg-tint px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        {t("builtInBook")}
                      </span>
                    </span>
                  ) : (
                    b.name
                  )
                }
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
          {/* 内置词库加载状态 */}
          {!builtIn.loaded && (
            <GlassItem
              icon={Loader2}
              tint="#8E8E93"
              primary={
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  {t("loadingBooks")}
                </span>
              }
            />
          )}
          {builtIn.loaded && builtIn.error && (
            <GlassItem
              icon={RefreshCw}
              tint="#FF3B30"
              primary={
                <span className="text-destructive">{t("booksLoadError")}</span>
              }
              onClick={reloadBuiltIn}
              trailing={
                <span className="text-[14px] text-primary">{t("retry")}</span>
              }
            />
          )}
        </GlassGroup>
        {state.books.length === 0 && !builtIn.loaded && (
          <p className="px-1 text-[13px] text-muted-foreground">
            {t("emptyVocabularyDesc")}
          </p>
        )}
      </section>

      {/* 快捷入口：Favorites / Mistakes / Similar Words */}
      <section className="space-y-3">
        <GlassGroup>
          <GlassItem
            icon={Heart}
            tint="#FF3B30"
            onClick={() => navigate("/words/favorites")}
            primary={t("favorites")}
            trailing={
              <span className="text-[14px] tabular-nums text-muted-foreground">
                {favorites}
              </span>
            }
            chevron
          />
          <GlassItem
            icon={CircleX}
            tint="#FF9500"
            onClick={() => navigate("/mistakes")}
            primary={t("mistakes")}
            trailing={
              <span className="text-[14px] tabular-nums text-muted-foreground">
                {mistakes}
              </span>
            }
            chevron
          />
          <GlassItem
            icon={Copy}
            tint="#30B0C7"
            onClick={() => navigate("/similar")}
            primary={t("similarWords")}
            trailing={
              <span className="text-[14px] tabular-nums text-muted-foreground">
                {groups}
              </span>
            }
            chevron
          />
        </GlassGroup>
      </section>

      <ImportVocabSheet open={importOpen} onClose={() => setImportOpen(false)} />
      <WordSheet open={addOpen} word={null} onClose={() => setAddOpen(false)} />
    </div>
  )
}
