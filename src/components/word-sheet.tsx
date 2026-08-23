import { Heart, Pencil, RotateCcw, Trash2, Volume2, X } from "lucide-react"
import * as React from "react"
import { AppleAlert, AppleButton, InsetGroup, ListRow } from "@/components/kit/primitives"
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
import { speak } from "@/lib/speech"
import { LEVELS, type Level, type Word } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useVoca, getProgress } from "@/store/voca-context"
import { WordStatusText } from "@/components/word-status-badge"

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
  "h-11 w-full rounded-[10px] bg-foreground/[0.055] px-3 text-[15px] outline-none transition-shadow focus:ring-2 focus:ring-ring/40 dark:bg-white/[0.08]"

const EMPTY: Omit<Word, "id"> = {
  word: "",
  ipa: "",
  pos: "",
  meaning: "",
  example: "",
  exampleZh: "",
  level: "A1",
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
  const { state, addWord, updateWord, toggleFavorite, deleteWord, resetWordProgress } =
    useVoca()
  const [mode, setMode] = React.useState<"view" | "edit">("view")
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [form, setForm] = React.useState<Omit<Word, "id">>(EMPTY)
  const [error, setError] = React.useState("")

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
        level: word.level,
      })
    } else {
      setMode("edit")
      setForm(EMPTY)
    }
    setError("")
  }, [open, word])

  const progress = word ? getProgress(state, word.id) : null

  function submit() {
    if (!form.word.trim() || !form.meaning.trim()) {
      setError("单词和释义为必填项")
      return
    }
    if (word) {
      updateWord(word.id, { ...form, word: form.word.trim() })
    } else {
      addWord({ ...form, word: form.word.trim(), custom: true })
    }
    onClose()
  }

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
          {word && mode === "view" ? (
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
                    <span> · {word.level}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFavorite(word.id)}
                  aria-label="收藏"
                  className={cn(
                    "-mr-1 -mt-1 flex size-10 items-center justify-center rounded-full transition-colors active:bg-foreground/[0.06]",
                    word.favorite ? "text-[#FF3B30]" : "text-muted-foreground/50",
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

              <div className="mt-5 border-t border-border pt-4">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  {progress && <WordStatusText progress={progress} />}
                  {progress && progress.reps > 0 && (
                    <span className="text-[13px] text-muted-foreground">
                      间隔 {progress.interval} 天 · 下次 {progress.due}
                    </span>
                  )}
                  {progress && progress.correct + progress.wrong > 0 && (
                    <span className="text-[13px] text-muted-foreground tabular-nums">
                      正确 {progress.correct} · 错误 {progress.wrong}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-5">
                <InsetGroup>
                  <ListRow
                    icon={Volume2}
                    tint="#007AFF"
                    primary="朗读"
                    as="button"
                    onClick={() => speak(word.word)}
                  />
                  <ListRow
                    icon={Heart}
                    tint="#FF3B30"
                    primary={word.favorite ? "取消收藏" : "收藏"}
                    as="button"
                    onClick={() => toggleFavorite(word.id)}
                  />
                  <ListRow
                    icon={Pencil}
                    tint="#8E8E93"
                    primary="编辑"
                    as="button"
                    onClick={() => setMode("edit")}
                    chevron
                  />
                  {progress && progress.reps > 0 && (
                    <ListRow
                      icon={RotateCcw}
                      tint="#FF9500"
                      primary="重置学习进度"
                      as="button"
                      onClick={() => resetWordProgress(word.id)}
                    />
                  )}
                  <ListRow
                    icon={Trash2}
                    tint="#FF3B30"
                    primary={
                      <span className="text-destructive">删除单词</span>
                    }
                    as="button"
                    onClick={() => setConfirmDelete(true)}
                  />
                </InsetGroup>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[20px] font-semibold">
                  {word ? "编辑单词" : "添加单词"}
                </h2>
                {word && (
                  <button
                    type="button"
                    onClick={() => setMode("view")}
                    aria-label="关闭编辑"
                    className="flex size-9 items-center justify-center rounded-full text-muted-foreground active:bg-foreground/[0.06]"
                  >
                    <X className="size-5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <Field label="单词 *">
                    <input
                      className={inputCls}
                      value={form.word}
                      onChange={(e) => setForm((f) => ({ ...f, word: e.target.value }))}
                    />
                  </Field>
                </div>
                <div className="col-span-1">
                  <Field label="音标">
                    <input
                      className={inputCls}
                      placeholder="/ˈæpl/"
                      value={form.ipa}
                      onChange={(e) => setForm((f) => ({ ...f, ipa: e.target.value }))}
                    />
                  </Field>
                </div>
                <div className="col-span-1">
                  <Field label="词性">
                    <input
                      className={inputCls}
                      placeholder="n."
                      value={form.pos}
                      onChange={(e) => setForm((f) => ({ ...f, pos: e.target.value }))}
                    />
                  </Field>
                </div>
              </div>
              <Field label="释义 *">
                <input
                  className={inputCls}
                  value={form.meaning}
                  onChange={(e) => setForm((f) => ({ ...f, meaning: e.target.value }))}
                />
              </Field>
              <Field label="例句">
                <input
                  className={inputCls}
                  value={form.example}
                  onChange={(e) => setForm((f) => ({ ...f, example: e.target.value }))}
                />
              </Field>
              <Field label="例句翻译">
                <input
                  className={inputCls}
                  value={form.exampleZh}
                  onChange={(e) => setForm((f) => ({ ...f, exampleZh: e.target.value }))}
                />
              </Field>
              <div className="w-36">
                <Field label="级别">
                  <Select
                    value={form.level}
                    onValueChange={(v) => setForm((f) => ({ ...f, level: v as Level }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVELS.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              {error && (
                <p className="text-[14px] text-destructive">{error}</p>
              )}
              <AppleButton onClick={submit}>
                {word ? "保存" : "添加"}
              </AppleButton>
            </div>
          )}
        </div>

        <SheetTitle className="sr-only">单词详情</SheetTitle>

        <AppleAlert
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="删除单词？"
          description="学习进度会一并删除，此操作无法撤销。"
          confirmLabel="删除"
          destructive
          onConfirm={() => {
            if (word) deleteWord(word.id)
            onClose()
          }}
        />
      </SheetContent>
    </Sheet>
  )
}
