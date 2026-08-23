import * as React from "react"
import { EmptyState, InsetGroup, ListRow } from "@/components/kit/primitives"
import { WordSheet } from "@/components/word-sheet"
import { WordStatusText } from "@/components/word-status-badge"
import { speakText } from "@/lib/speech"
import { getProgress, useVoca } from "@/store/voca-context"
import type { Word } from "@/lib/types"

export function WordRow({
  word,
  showOrder,
  onOpen,
}: {
  word: Word
  showOrder?: boolean
  onOpen: (w: Word) => void
}) {
  const { state } = useVoca()
  const p = getProgress(state, word.id)
  return (
    <ListRow
      as="button"
      onClick={() => onOpen(word)}
      primary={
        <span className="flex items-baseline gap-2">
          {showOrder && (
            <span className="w-6 text-right text-[13px] font-normal tabular-nums text-muted-foreground/60">
              {String(word.wordOrder).padStart(2, "0")}
            </span>
          )}
          {word.word}
          {word.ipa && (
            <span className="text-[13px] font-normal text-muted-foreground/80">
              {word.ipa}
            </span>
          )}
        </span>
      }
      secondary={word.meaning}
      trailing={
        <span className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (state.settings.sound) {
                speakText(word.word, state.settings.voice)
              }
            }}
            aria-label="发音"
            className="-mr-1.5 flex size-8 shrink-0 items-center justify-center rounded-full text-primary/70 transition-colors active:bg-tint active:text-primary"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5 6 9H2v6h4l5 4V5z" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          </button>
          {word.favorite && (
            <svg
              className="size-3.5 text-primary"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          )}
          <WordStatusText progress={p} />
        </span>
      }
    />
  )
}

/** 单词列表（保持传入顺序 = 词书原始顺序，内部自带详情 Sheet） */
export function WordList({
  words,
  showOrder,
  emptyTitle,
  emptyDesc,
}: {
  words: Word[]
  showOrder?: boolean
  emptyTitle: string
  emptyDesc?: string
}) {
  const { state } = useVoca()
  const [selected, setSelected] = React.useState<Word | null>(null)
  const liveWord = selected
    ? (state.words.find((w) => w.id === selected.id) ?? null)
    : null

  if (words.length === 0) {
    return (
      <EmptyState title={emptyTitle} description={emptyDesc} />
    )
  }

  return (
    <>
      <InsetGroup>
        {words.map((w) => (
          <WordRow
            key={w.id}
            word={w}
            showOrder={showOrder}
            onOpen={setSelected}
          />
        ))}
      </InsetGroup>
      <WordSheet
        open={!!selected}
        word={liveWord}
        onClose={() => setSelected(null)}
      />
    </>
  )
}
