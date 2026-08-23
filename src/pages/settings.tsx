import {
  AlertTriangle,
  Check,
  Dices,
  Download,
  Moon,
  Monitor,
  Sparkles,
  Sun,
} from "lucide-react"
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
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useTheme } from "@/components/theme-provider"
import { ACCENTS } from "@/lib/accents"
import { cn } from "@/lib/utils"
import { useVoca } from "@/store/voca-context"

const THEME_OPTIONS = [
  { value: "light", label: "浅色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
  { value: "system", label: "跟随系统", icon: Monitor },
] as const

function exportData(state: unknown) {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `voca-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function SettingsPage() {
  const { state, setDailyGoal, setAccent, setGeminiKey, resetAll } = useVoca()
  const { theme, setTheme } = useTheme()
  const [goalDraft, setGoalDraft] = React.useState(
    String(state.settings.dailyGoal),
  )
  const [keyDraft, setKeyDraft] = React.useState(state.settings.geminiKey)
  const [keyVisible, setKeyVisible] = React.useState(false)
  const [confirmReset, setConfirmReset] = React.useState(false)

  const accentId = state.settings.accentId
  const storageKB = (
    JSON.stringify(state).length / 1024
  ).toFixed(1)

  function randomAccent() {
    const others = ACCENTS.filter((a) => a.id !== accentId)
    const next = others[Math.floor(Math.random() * others.length)]
    setAccent(next.id)
    toast.success(`已切换到「${next.name}」`)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">设置</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          外观、学习偏好与数据管理
        </p>
      </div>

      {/* 外观 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">外观</CardTitle>
          <CardDescription>界面主题与主题色</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-2">
            <span className="text-sm font-medium">模式</span>
            <div className="flex w-fit rounded-lg border bg-muted/50 p-1">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
                    theme === opt.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <opt.icon className="size-4" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">主题色</span>
              <Button variant="ghost" size="sm" onClick={randomAccent}>
                <Dices className="size-4" />
                随机一个
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {ACCENTS.map((a) => {
                const active = (accentId ?? "default") === a.id
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setAccent(a.id)
                      toast.success(`已切换到「${a.name}」`)
                    }}
                    className={cn(
                      "group flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-colors",
                      active
                        ? "border-foreground/40 bg-accent"
                        : "hover:bg-accent/60",
                    )}
                    title={a.name}
                  >
                    <span
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full",
                        active && "ring-2 ring-foreground/30 ring-offset-2",
                      )}
                      style={{ backgroundColor: a.primary }}
                    >
                      {active && (
                        <Check
                          className="size-3.5"
                          style={{ color: a.primaryFg }}
                        />
                      )}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {a.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 学习偏好 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">学习</CardTitle>
          <CardDescription>影响卡片学习每轮的新单词数量</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="grid w-44 gap-2">
            <label className="text-sm font-medium" htmlFor="goal">
              每日目标（个）
            </label>
            <Input
              id="goal"
              type="number"
              min={1}
              max={100}
              value={goalDraft}
              onChange={(e) => setGoalDraft(e.target.value)}
            />
          </div>
          <Button
            variant="secondary"
            disabled={String(state.settings.dailyGoal) === goalDraft}
            onClick={() => {
              const n = Number(goalDraft)
              if (Number.isFinite(n) && n >= 1 && n <= 100) {
                setDailyGoal(n)
                toast.success(`每日目标已设为 ${Math.round(n)} 个`)
              }
            }}
          >
            保存
          </Button>
        </CardContent>
      </Card>

      {/* Gemini API */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-primary" />
            Gemini API
          </CardTitle>
          <CardDescription>
            预留功能：后续用于 AI 生成释义、例句与智能复习建议
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-0 flex-1">
              <Input
                type={keyVisible ? "text" : "password"}
                placeholder="AIza…"
                value={keyDraft}
                onChange={(e) => setKeyDraft(e.target.value)}
                className="pr-16"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-1/2 right-1 -translate-y-1/2 px-2 text-xs"
                onClick={() => setKeyVisible((v) => !v)}
              >
                {keyVisible ? "隐藏" : "显示"}
              </Button>
            </div>
            <Button
              onClick={() => {
                setGeminiKey(keyDraft)
                toast.success(
                  keyDraft.trim() ? "API Key 已保存" : "API Key 已清除",
                )
              }}
            >
              保存
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Key 仅保存在本机浏览器 localStorage 中，不会上传到任何服务器。
          </p>
        </CardContent>
      </Card>

      {/* 数据与存储 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">数据与存储</CardTitle>
          <CardDescription>
            所有数据保存在浏览器本地（localStorage），当前占用约 {storageKB} KB
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => exportData(state)}>
            <Download className="size-4" />
            导出数据（JSON）
          </Button>
          <Button
            variant="outline"
            className="text-destructive"
            onClick={() => setConfirmReset(true)}
          >
            <AlertTriangle className="size-4" />
            重置全部数据
          </Button>
          <p className="w-full text-xs text-muted-foreground">
            重置将清空所有学习进度、自定义单词和统计记录，并恢复内置词库。
          </p>
        </CardContent>
      </Card>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定重置全部数据？</AlertDialogTitle>
            <AlertDialogDescription>
              所有学习进度、自定义单词和统计记录都会被清空，并恢复为内置词库。此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                resetAll()
                setConfirmReset(false)
                toast.success("数据已重置")
              }}
            >
              确认重置
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
