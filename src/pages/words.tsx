import { MoreHorizontal, Pencil, Plus, RotateCcw, Search, Trash2, Volume2 } from "lucide-react"
import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { speak } from "@/lib/speech"
import {
  LEVELS,
  type Level,
  type Word,
} from "@/lib/types"
import { WordStatusBadge } from "@/components/word-status-badge"
import { getProgress, isWordDue, useVoca } from "@/store/voca-context"

type StatusFilter = "all" | "new" | "learning" | "due" | "mastered"

interface WordFormValues {
  word: string
  ipa: string
  pos: string
  meaning: string
  example: string
  exampleZh: string
  level: Level
}

function WordForm({
  initial,
  onSubmit,
  onClose,
}: {
  initial?: Word
  onSubmit: (values: WordFormValues) => void
  onClose: () => void
}) {
  const [values, setValues] = React.useState<WordFormValues>(
    initial
      ? {
          word: initial.word,
          ipa: initial.ipa,
          pos: initial.pos,
          meaning: initial.meaning,
          example: initial.example,
          exampleZh: initial.exampleZh,
          level: initial.level,
        }
      : {
          word: "",
          ipa: "",
          pos: "",
          meaning: "",
          example: "",
          exampleZh: "",
          level: "A1",
        },
  )
  const [error, setError] = React.useState("")

  function set<K extends keyof WordFormValues>(key: K, value: WordFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!values.word.trim() || !values.meaning.trim()) {
      setError("单词和中文释义为必填项")
      return
    }
    onSubmit({ ...values, word: values.word.trim(), meaning: values.meaning.trim() })
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2 sm:col-span-1">
          <Label htmlFor="w-word">单词 *</Label>
          <Input
            id="w-word"
            placeholder="如：serendipity"
            value={values.word}
            onChange={(e) => set("word", e.target.value)}
            autoFocus
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="w-ipa">音标</Label>
          <Input
            id="w-ipa"
            placeholder="如：/ˌserənˈdɪpət̬i/"
            value={values.ipa}
            onChange={(e) => set("ipa", e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="w-pos">词性</Label>
          <Input
            id="w-pos"
            placeholder="如：n. / v. / adj."
            value={values.pos}
            onChange={(e) => set("pos", e.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="w-meaning">中文释义 *</Label>
        <Input
          id="w-meaning"
          placeholder="如：机缘巧合；意外发现珍宝"
          value={values.meaning}
          onChange={(e) => set("meaning", e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="w-example">例句</Label>
        <Textarea
          id="w-example"
          rows={2}
          placeholder="It's a lovely piece of serendipity."
          value={values.example}
          onChange={(e) => set("example", e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="w-example-zh">例句翻译</Label>
        <Textarea
          id="w-example-zh"
          rows={2}
          value={values.exampleZh}
          onChange={(e) => set("exampleZh", e.target.value)}
        />
      </div>
      <div className="grid gap-2 sm:w-40">
        <Label>级别</Label>
        <Select value={values.level} onValueChange={(v) => set("level", v as Level)}>
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
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button type="submit">{initial ? "保存修改" : "添加单词"}</Button>
      </DialogFooter>
    </form>
  )
}

export function WordsPage() {
  const { state, addWord, updateWord, deleteWord, resetWordProgress } = useVoca()
  const [query, setQuery] = React.useState("")
  const [level, setLevel] = React.useState<"all" | Level>("all")
  const [status, setStatus] = React.useState<StatusFilter>("all")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Word | null>(null)
  const [deleting, setDeleting] = React.useState<Word | null>(null)

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return state.words
      .filter((w) => {
        if (level !== "all" && w.level !== level) return false
        const p = state.progress[w.id]
        if (status === "new" && p) return false
        if (status === "due" && !isWordDue(state, w.id)) return false
        if (status === "learning" && (!p || p.status !== "learning" || isWordDue(state, w.id))) return false
        if (status === "mastered" && p?.status !== "mastered") return false
        if (!q) return true
        return (
          w.word.toLowerCase().includes(q) ||
          w.meaning.toLowerCase().includes(q) ||
          w.example.toLowerCase().includes(q)
        )
      })
      .sort((a, b) =>
        a.level === b.level
          ? a.word.localeCompare(b.word)
          : a.level.localeCompare(b.level),
      )
  }, [state, query, level, status])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">单词本</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            共 {state.words.length} 个单词 · 当前显示 {filtered.length} 个
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="size-4" />
          添加单词
        </Button>
      </div>

      {/* 筛选工具栏 */}
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-52 flex-1 sm:max-w-xs">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="搜索单词、释义或例句…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={level} onValueChange={(v) => setLevel(v as "all" | Level)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="级别" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部级别</SelectItem>
            {LEVELS.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="new">未学习</SelectItem>
            <SelectItem value="learning">学习中</SelectItem>
            <SelectItem value="due">待复习</SelectItem>
            <SelectItem value="mastered">已掌握</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">单词</TableHead>
              <TableHead>释义</TableHead>
              <TableHead className="hidden w-16 sm:table-cell">级别</TableHead>
              <TableHead className="w-24">状态</TableHead>
              <TableHead className="w-12 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  没有匹配的单词
                </TableCell>
              </TableRow>
            )}
            {filtered.map((w) => {
              const p = state.progress[w.id]
              return (
                <TableRow key={w.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="font-medium hover:underline"
                        onClick={() => speak(w.word)}
                        title="点击朗读"
                      >
                        {w.word}
                      </button>
                      {w.ipa && (
                        <span className="hidden text-xs text-muted-foreground md:inline">
                          {w.ipa}
                        </span>
                      )}
                      {w.custom && (
                        <Badge variant="secondary" className="text-[10px]">
                          自定义
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-60 truncate text-sm" title={w.meaning}>
                      {w.pos && <span className="text-muted-foreground">{w.pos} </span>}
                      {w.meaning}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline">{w.level}</Badge>
                  </TableCell>
                  <TableCell>
                    <WordStatusBadge progress={getProgress(state, w.id)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">{w.word} 的操作</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => speak(w.word)}>
                          <Volume2 />
                          朗读
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(w)
                            setDialogOpen(true)
                          }}
                        >
                          <Pencil />
                          编辑
                        </DropdownMenuItem>
                        {p && (
                          <DropdownMenuItem
                            onClick={() => resetWordProgress(w.id)}
                          >
                            <RotateCcw />
                            重置进度
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleting(w)}
                        >
                          <Trash2 />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* 添加 / 编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "编辑单词" : "添加单词"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "修改单词信息，学习进度不受影响"
                : "加入你的单词本，支持音标、例句和级别"}
            </DialogDescription>
          </DialogHeader>
          <WordForm
            initial={editing ?? undefined}
            onClose={() => setDialogOpen(false)}
            onSubmit={(values) => {
              if (editing) {
                updateWord(editing.id, values)
              } else {
                addWord({ ...values, custom: true })
              }
              setDialogOpen(false)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除单词？</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「{deleting?.word}」吗？它的学习进度也会一并清除，此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deleting) deleteWord(deleting.id)
                setDeleting(null)
              }}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
