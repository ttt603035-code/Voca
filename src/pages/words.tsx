import { Heart, Plus } from "lucide-react"
import * as React from "react"
import {
  InsetGroup,
  LargeTitle,
  ListRow,
  SearchField,
} from "@/components/kit/primitives"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { WordSheet } from "@/components/word-sheet"
import { isWordDue, newWords, useVoca } from "@/store/voca-context"
import { WordStatusText } from "@/components/word-status-badge"
import { LEVELS, type Level, type Word } from "@/lib/types"
import { cn } from "@/lib/utils"

type SortKey = "original" | "learned" | "difficult" | "reviewed"
type StatusKey = "all" | "new" | "learning" | "due" | "mastered" | "favorites"

export function WordsPage() {
  const { state, toggleFavorite } = useVoca()
  const [query, setQuery] = React.useState("")
  const [level, setLevel] = React.useState<"all" | Level>("all")
  const [sort, setSort] = React.useState<SortKey>("original")
  const [status, setStatus] = React.useState<StatusKey>("all")
  const [sheet, setSheet] = React.useState<{ word: Word | null } | null>(null)

  // 始终读取最新的单词数据（编辑后保持同步）
  const selectedWord = sheet?.word
    ? (state.words.find((w) => w.id === sheet.word!.id) ?? null)
    : null

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = state.words.filter((w) => {
      if (level !== "all" && w.level !== level) return false
      const p = state.progress[w.id]
      if (status === "new" && p) return false
      if (status === "due" && !isWordDue(state, w.id)) return false
      if (
        status === "learning" &&
        (!p || p.status !== "learning" || isWordDue(state, w.id))
      )
        return false
      if (status === "mastered" && p?.status !== "mastered") return false
      if (status === "favorites" && !w.favorite) return false
      if (!q) return true
      return (
        w.word.toLowerCase().includes(q) ||
        w.meaning.toLowerCase().includes(q) ||
        w.example.toLowerCase().includes(q)
      )
    })
    list = [...list]
    switch (sort) {
      case "learned":
        list.sort(
          (a, b) =>
            (state.progress[b.id]?.createdAt ?? "").localeCompare(
              state.progress[a.id]?.createdAt ?? "",
            ),
        )
        break
      case "difficult":
        list.sort(
          (a, b) =>
            (state.progress[b.id]?.ease ?? 2.5) -
              (state.progress[a.id]?.ease ?? 2.5) ||
            (state.progress[b.id]?.wrong ?? 0) -
              (state.progress[a.id]?.wrong ?? 0),
        )
        break
      case "reviewed":
        list.sort(
          (a, b) =>
            (state.progress[b.id]?.lastReviewed ?? "").localeCompare(
              state.progress[a.id]?.lastReviewed ?? "",
            ),
        )
        break
      default:
        list.sort((a, b) =>
          a.level === b.level
            ? a.word.localeCompare(b.word)
            : a.level.localeCompare(b.level),
        )
    }
    return list
  }, [state, query, level, sort, status])

  return (
    <div className="space-y-5">
      <LargeTitle title="Words" />

      <AddWordButton onAdd={() => setSheet({ word: null })} />

      <SearchField
        value={query}
        onChange={setQuery}
        placeholder="Search words"
      />

      {/* 筛选：统一 Apple Select */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
        <Select
          value={level}
          onValueChange={(v) => setLevel(v as "all" | Level)}
        >
          <SelectTrigger size="sm" className="shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Books</SelectItem>
            {LEVELS.map((l) => (
              <SelectItem key={l} value={l}>
                {l} Book
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as StatusKey)}
        >
          <SelectTrigger size="sm" className="shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Words</SelectItem>
            <SelectItem value="due">Due Today</SelectItem>
            <SelectItem value="learning">Learning</SelectItem>
            <SelectItem value="mastered">Mastered</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="favorites">Favorites</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sort}
          onValueChange={(v) => setSort(v as SortKey)}
        >
          <SelectTrigger size="sm" className="shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="original">Original Order</SelectItem>
            <SelectItem value="learned">Recently Learned</SelectItem>
            <SelectItem value="difficult">Most Difficult</SelectItem>
            <SelectItem value="reviewed">Recently Reviewed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 单词列表：Apple grouped list */}
      {filtered.length > 0 ? (
        <InsetGroup>
          {filtered.map((w) => {
            const p = state.progress[w.id]
            return (
              <ListRow
                key={w.id}
                as="button"
                onClick={() => setSheet({ word: w })}
                primary={
                  <span className="flex items-baseline gap-2">
                    {w.word}
                    {w.ipa && (
                      <span className="text-[13px] font-normal text-muted-foreground/80">
                        {w.ipa}
                      </span>
                    )}
                  </span>
                }
                secondary={w.meaning}
                trailing={
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(w.id)
                      }}
                      aria-label={w.favorite ? "取消收藏" : "收藏"}
                      className={cn(
                        "-mr-1 flex size-8 items-center justify-center rounded-full transition-colors active:bg-foreground/[0.06]",
                        w.favorite
                          ? "text-[#FF3B30]"
                          : "text-muted-foreground/40",
                      )}
                    >
                      <Heart
                        className="size-[19px]"
                        fill={w.favorite ? "currentColor" : "none"}
                      />
                    </button>
                    {p && <WordStatusText progress={p} className="w-16 justify-end" />}
                  </>
                }
              />
            )
          })}
        </InsetGroup>
      ) : (
        <p className="py-10 text-center text-[15px] text-muted-foreground">
          没有匹配的单词
        </p>
      )}

      <p className="pb-1 text-center text-[13px] text-muted-foreground tabular-nums">
        {filtered.length} of {state.words.length} words ·{" "}
        {newWords(state).length} new
      </p>

      <WordSheet
        open={!!sheet}
        word={selectedWord}
        onClose={() => setSheet(null)}
      />
    </div>
  )
}

/** 列表上方的新增按钮（Apple 列表页常用底部大按钮） */
function AddWordButton({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="-mx-2 flex min-h-[44px] w-fit items-center gap-1.5 rounded-full bg-primary/10 px-4 text-[15px] font-medium text-primary transition-colors active:bg-primary/20"
    >
      <Plus className="size-4" />
      添加单词
    </button>
  )
}
