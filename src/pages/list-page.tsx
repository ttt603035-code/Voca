import { useNavigate, useParams } from "react-router-dom"
import * as React from "react"
import { LargeTitle } from "@/components/kit/primitives"
import { WordList } from "@/components/word-rows"
import { listWords, useVoca } from "@/store/voca-context"
import { useT } from "@/lib/i18n"

export function ListPage() {
  const { bookId, listId } = useParams()
  const { state } = useVoca()
  const { t } = useT()
  const navigate = useNavigate()

  const book = state.books.find((b) => b.id === bookId) ?? null
  const list = state.lists.find((l) => l.id === listId) ?? null
  // 严格保持词书原始顺序（wordOrder），不做任何重排
  const words = React.useMemo(
    () => (listId ? listWords(state, listId) : []),
    [state, listId],
  )

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
      <p className="-mt-3 text-[15px] text-muted-foreground">
        {words.length} {t("wordsNoun")} · {book.name}
      </p>
      <WordList
        words={words}
        showOrder
        emptyTitle={t("emptyList")}
        emptyDesc={t("emptyListDesc")}
      />
    </div>
  )
}
