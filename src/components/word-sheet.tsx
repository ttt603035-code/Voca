import {
  Check,
  Copy,
  Heart,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Volume2,
  X,
} from "lucide-react"
import * as React from "react"
import { toast } from "sonner"
import {
  AppleAlert,
  AppleButton,
  InsetGroup,
  ListRow,
} from "@/components/kit/primitives"
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getProgress, useVoca } from "@/store/voca-context"
import { useT } from "@/lib/i18n"
import { useSpeak } from "@/lib/speech"
import { WordStatusText } from "@/components/word-status-badge"
import { cn } from "@/lib/utils"
import type { Word } from "@/lib/types"

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  )
}

const inputCls =
  "h-11 w-full rounded-[10px] bg-grouped px-3 text-[15px] outline-none transition-shadow focus:ring-2 focus:ring-ring/40"

type Form = {
  word: string
  ipa: string
  pos: string
  meaning: string
  example: string
  exampleZh: string
  listId: string
}

export function WordSheet({
  open,
  word,
  onClose,
}: {
  open: boolean
  /** 编辑/查看时传单词；新增时传 null */
  word: Word | null
  onClose: () => void
}) {
  const {
    state,
    addWord,
    updateWord,
    toggleFavorite,
    deleteWord,
    resetWordProgress,
    createGroup,
    addToGroup,
  } = useVoca()
  const { t } = useT()
  const { speak, speakingWord } = useSpeak()

  const [mode, setMode] = React.useState<"view" | "edit" | "similar">("view")
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [form, setForm] = React.useState<Form>({
    word: "",
    ipa: "",
    pos: "",
    meaning: "",
    example: "",
    exampleZh: "",
    listId: "",
  })
  const [error, setError] = React.useState("")
  const [groupTitle, setGroupTitle] = React.useState("")

  const isAdd = open && !word

  // 默认 List：我的单词 / Daily（或第一个）
  const defaultList = React.useMemo(() => {
    const mine = state.books.find((b) => b.id === "book-mine") ?? state.books[0]
    if (!mine) return ""
    const lists = state.lists
      .filter((l) => l.bookId === mine.id)
      .sort((a, b) => a.listOrder - b.listOrder)
    return lists[0]?.id ?? ""
  }, [state.books, state.lists])

  React.useEffect(() => {
    if (!open) return
    if (word) {
      setMode("view")
      setForm({
        word: word.word,
        ipa: word.ipa,
        pos: word.pos,
        meaning: word.meaning,
        example: word.example,
        exampleZh: word.exampleZh,
        listId: word.listId,
      })
    } else {
      setMode("edit")
      setForm({
        word: "",
        ipa: "",
        pos: "",
        meaning: "",
        example: "",
        exampleZh: "",
        listId: defaultList,
      })
    }
    setError("")
    setGroupTitle("")
  }, [open, word, defaultList])

  const progress = word ? getProgress(state, word.id) : null
  const list = word ? state.lists.find((l) => l.id === word.listId) : null
  const book = list ? state.books.find((b) => b.id === list.bookId) : null

  function submit() {
    if (!form.word.trim() || !form.meaning.trim() || !form.listId) {
      setError(t("requiredField"))
      return
    }
    if (word) {
      updateWord(word.id, {
        word: form.word.trim(),
        ipa: form.ipa,
        pos: form.pos,
        meaning: form.meaning,
        example: form.example,
        exampleZh: form.exampleZh,
        listId: form.listId,
      })
      toast.success(t("wordSaved"))
    } else {
      addWord({
        listId: form.listId,
        word: form.word.trim(),
        ipa: form.ipa,
        pos: form.pos,
        meaning: form.meaning,
        example: form.example,
        exampleZh: form.exampleZh,
        custom: true,
      })
      toast.success(t("wordAdded"))
    }
    onClose()
  }

  function chooseGroup(groupId: string) {
    if (!word) return
    if (
      state.similarGroups
        .find((g) => g.id === groupId)
        ?.words.some((e) => e.word.toLowerCase() === word.word.toLowerCase())
    ) {
      toast(t("alreadyInGroup"))
      return
    }
    addToGroup(groupId, {
      word: word.word,
      ipa: word.ipa,
      pos: word.pos,
      meaning: word.meaning,
      wordId: word.id,
    })
    toast.success(t("addedToSimilar"))
    setMode("view")
  }

  function makeGroup() {
    if (!word) return
    const title = groupTitle.trim() || word.word
    const g = createGroup(title)
    addToGroup(g.id, {
      word: word.word,
      ipa: word.ipa,
      pos: word.pos,
      meaning: word.meaning,
      wordId: word.id,
    })
    toast.success(t("groupCreated"))
    setMode("view")
  }

  const bookOfList = (listId: string) =>
    state.lists.find((l) => l.id === listId)?.bookId

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="max-h-[88dvh] gap-0 overflow-y-auto rounded-t-[22px] p-0 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="sticky top-0 z-10 flex justify-center bg-background/90 pt-2.5 pb-1 backdrop-blur">
          <div className="h-1 w-9 rounded-full bg-foreground/20" />
        </div>

        <div className="px-5 pt-2 pb-6">
          {/* ── 查看 ── */}
          {word && mode === "view" && (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-[30px] leading-tight font-semibold tracking-[-0.02em]">
                    {word.word}
                  </h2>
                  <p className="mt-1 text-[15px] text-muted-foreground">
                    {word.ipa && <span>{word.ipa}</span>}
                    {word.ipa && word.pos && <span> · </span>}
                    {word.pos && <span>{word.pos}</span>}
                  </p>
                  {book && list && (
                    <p className="mt-1 text-[13px] text-muted-foreground/70">
                      {book.name} · {list.name} ·{" "}
                      {String(word.wordOrder).padStart(2, "0")}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => toggleFavorite(word.id)}
                  aria-label={t("favorite")}
                  className={cn(
                    "-mr-1 -mt-1 flex size-11 items-center justify-center rounded-full transition-colors active:bg-foreground/[0.06]",
                    word.favorite
                      ? "text-[#FF3B30]"
                      : "text-muted-foreground/50",
                  )}
                >
                  <Heart
                    className="size-[22px]"
                    fill={word.favorite ? "currentColor" : "none"}
                  />
                </button>
              </div>

              <p className="mt-3 text-[17px]">{word.meaning}</p>
              {word.example && (
                <p className="mt-2 text-[15px] italic text-muted-foreground">
                  “{word.example}”
                </p>
              )}
              {word.exampleZh && (
                <p className="mt-0.5 text-[15px] text-muted-foreground">
                  {word.exampleZh}
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4">
                {progress && <WordStatusText progress={progress} />}
                {progress && progress.reps > 0 && (
                  <span className="text-[13px] text-muted-foreground">
                    {t("interval")} {progress.interval} {t("daysUnit")} ·{" "}
                    {t("nextReview")} {progress.due}
                  </span>
                )}
                {progress && progress.correct + progress.wrong > 0 && (
                  <span className="text-[13px] tabular-nums text-muted-foreground">
                    {t("correctCount")} {progress.correct} · {t("wrongCount")}{" "}
                    {progress.wrong}
                  </span>
                )}
              </div>

              <div className="mt-5">
                <InsetGroup>
                  <ListRow
                    icon={Volume2}
                    tint="#007AFF"
                    primary={t("speak")}
                    as="button"
                    onClick={() => speak(word.word)}
                    trailing={
                      speakingWord === word.word ? (
                        <Volume2 className="size-5 animate-pulse text-[#007AFF]" />
                      ) : undefined
                    }
                  />
                  <ListRow
                    icon={Heart}
                    tint="#FF3B30"
                    primary={word.favorite ? t("unfavorite") : t("favorite")}
                    as="button"
                    onClick={() => toggleFavorite(word.id)}
                  />
                  <ListRow
                    icon={Copy}
                    tint="#30B0C7"
                    primary={t("addToSimilar")}
                    as="button"
                    onClick={() => setMode("similar")}
                    chevron
                  />
                  {!word.builtIn && (
                    <ListRow
                      icon={Pencil}
                      tint="#8E8E93"
                      primary={t("edit")}
                      as="button"
                      onClick={() => setMode("edit")}
                      chevron
                    />
                  )}
                  {progress && progress.reps > 0 && (
                    <ListRow
                      icon={RotateCcw}
                      tint="#FF9500"
                      primary={t("resetProgress")}
                      as="button"
                      onClick={() => {
                        resetWordProgress(word.id)
                        toast.success(t("progressReset"))
                      }}
                    />
                  )}
                  {!word.builtIn && (
                    <ListRow
                      icon={Trash2}
                      tint="#FF3B30"
                      primary={
                        <span className="text-destructive">
                          {t("deleteWord")}
                        </span>
                      }
                      as="button"
                      onClick={() => setConfirmDelete(true)}
                    />
                  )}
                </InsetGroup>
              </div>
            </>
          )}

          {/* ── 编辑 / 新增 ── */}
          {mode === "edit" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[20px] font-semibold">
                  {isAdd ? t("addWordTitle") : t("editWordTitle")}
                </h2>
                {word && (
                  <button
                    type="button"
                    onClick={() => setMode("view")}
                    aria-label={t("back")}
                    className="flex size-9 items-center justify-center rounded-full text-muted-foreground active:bg-foreground/[0.06]"
                  >
                    <X className="size-5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label={t("bookLabel")}>
                  <Select
                    value={bookOfList(form.listId) ?? ""}
                    onValueChange={(bid) => {
                      const first = state.lists
                        .filter((l) => l.bookId === bid)
                        .sort((a, b) => a.listOrder - b.listOrder)[0]
                      if (first) setForm((f) => ({ ...f, listId: first.id }))
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {state.books.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t("listLabel")}>
                  <Select
                    value={form.listId}
                    onValueChange={(v) => setForm((f) => ({ ...f, listId: v }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {state.lists
                        .filter(
                          (l) =>
                            !bookOfList(form.listId) ||
                            l.bookId === bookOfList(form.listId),
                        )
                        .sort((a, b) => a.listOrder - b.listOrder)
                        .map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <Field label={t("wordLabel")}>
                    <input
                      className={inputCls}
                      value={form.word}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, word: e.target.value }))
                      }
                    />
                  </Field>
                </div>
                <div className="col-span-1">
                  <Field label={t("ipaLabel")}>
                    <input
                      className={inputCls}
                      placeholder="/ˈæpl/"
                      value={form.ipa}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, ipa: e.target.value }))
                      }
                    />
                  </Field>
                </div>
                <div className="col-span-1">
                  <Field label={t("posLabel")}>
                    <input
                      className={inputCls}
                      placeholder="n."
                      value={form.pos}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, pos: e.target.value }))
                      }
                    />
                  </Field>
                </div>
              </div>
              <Field label={t("meaningLabel")}>
                <input
                  className={inputCls}
                  value={form.meaning}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, meaning: e.target.value }))
                  }
                />
              </Field>
              <Field label={t("exampleLabel")}>
                <input
                  className={inputCls}
                  value={form.example}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, example: e.target.value }))
                  }
                />
              </Field>
              <Field label={t("exampleZhLabel")}>
                <input
                  className={inputCls}
                  value={form.exampleZh}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, exampleZh: e.target.value }))
                  }
                />
              </Field>
              {error && (
                <p className="text-[14px] text-destructive">{error}</p>
              )}
              <AppleButton onClick={submit}>
                {isAdd ? t("add") : t("save")}
              </AppleButton>
            </div>
          )}

          {/* ── 加入易混词 ── */}
          {word && mode === "similar" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[20px] font-semibold">
                  {t("chooseGroup")}
                </h2>
                <button
                  type="button"
                  onClick={() => setMode("view")}
                  aria-label={t("back")}
                  className="flex size-9 items-center justify-center rounded-full text-muted-foreground active:bg-foreground/[0.06]"
                >
                  <X className="size-5" />
                </button>
              </div>
              {state.similarGroups.length > 0 && (
                <InsetGroup>
                  {state.similarGroups.map((g) => {
                    const inGroup = g.words.some(
                      (e) =>
                        e.word.toLowerCase() === word.word.toLowerCase(),
                    )
                    return (
                      <ListRow
                        key={g.id}
                        as="button"
                        onClick={() => chooseGroup(g.id)}
                        primary={g.title}
                        secondary={`${g.words.length} ${t("wordsNoun")}`}
                        trailing={
                          inGroup ? (
                            <Check className="size-5 text-[#34C759]" />
                          ) : (
                            <Plus className="size-5 text-muted-foreground/50" />
                          )
                        }
                      />
                    )
                  })}
                </InsetGroup>
              )}
              <div className="space-y-2 rounded-[19px] bg-grouped p-4">
                <p className="text-[15px] font-medium">
                  + {t("newGroup")}
                </p>
                <input
                  className={inputCls}
                  placeholder={t("groupTitle")}
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                />
                <AppleButton
                  variant="tinted"
                  size="sm"
                  onClick={makeGroup}
                >
                  {t("add")}
                </AppleButton>
              </div>
            </div>
          )}
        </div>

        <SheetTitle className="sr-only">{t("edit")}</SheetTitle>

        <AppleAlert
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={t("deleteWordTitle")}
          description={t("deleteWordDesc")}
          confirmLabel={t("delete")}
          destructive
          onConfirm={() => {
            if (word) deleteWord(word.id)
            toast.success(t("wordDeleted"))
            onClose()
          }}
        />
      </SheetContent>
    </Sheet>
  )
}
