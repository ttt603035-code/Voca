import { useNavigate } from "react-router-dom"
import * as React from "react"
import {
  AppleButton,
  EmptyState,
  InsetGroup,
  LargeTitle,
  ListRow,
} from "@/components/kit/primitives"
import { CheckCircle2 } from "lucide-react"
import { WordSheet } from "@/components/word-sheet"
import { useVoca } from "@/store/voca-context"
import type { Word } from "@/lib/types"

export function MistakesPage() {
  const { state } = useVoca()
  const navigate = useNavigate()
  const [sheet, setSheet] = React.useState<{ word: Word | null } | null>(null)

  const selectedWord = sheet?.word
    ? (state.words.find((w) => w.id === sheet.word!.id) ?? null)
    : null

  const mistakes = state.words
    .map((w) => ({ w, p: state.progress[w.id] }))
    .filter((x) => x.p && x.p.wrong > 0)
    .sort(
      (a, b) =>
        b.p!.wrong - a.p!.wrong ||
        (b.p!.lastReviewed ?? "").localeCompare(a.p!.lastReviewed ?? ""),
    )

  return (
    <div className="space-y-5">
      <LargeTitle title="Mistakes" />

      {mistakes.length > 0 ? (
        <>
          <InsetGroup>
            {mistakes.map(({ w, p }) => (
              <ListRow
                key={w.id}
                as="button"
                onClick={() => setSheet({ word: w })}
                primary={
                  <span className="flex items-baseline gap-2">
                    {w.word}
                    <span className="text-[13px] font-normal text-muted-foreground/80">
                      {w.ipa}
                    </span>
                  </span>
                }
                secondary={w.meaning}
                trailing={
                  <span className="text-[13px] font-medium tabular-nums text-[#FF3B30] dark:text-[#FF453A]">
                    Wrong ×{p!.wrong}
                  </span>
                }
              />
            ))}
          </InsetGroup>
          <AppleButton
            variant="tinted"
            className="w-fit px-6"
            onClick={() => navigate("/review?filter=mistakes")}
          >
            Review Mistakes
          </AppleButton>
        </>
      ) : (
        <EmptyState
          icon={CheckCircle2}
          tint="#34C759"
          title="No Mistakes"
          description="答错的单词会出现在这里，随时回来巩固。"
        />
      )}

      <WordSheet
        open={!!sheet}
        word={selectedWord}
        onClose={() => setSheet(null)}
      />
    </div>
  )
}
