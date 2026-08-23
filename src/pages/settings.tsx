import {
  Cloud,
  Dices,
  Download,
  ShieldCheck,
  Trash2,
  Wifi,
} from "lucide-react"
import * as React from "react"
import { toast } from "sonner"
import {
  AppleAlert,
  GroupHeader,
  InsetGroup,
  LargeTitle,
  ListRow,
  SegmentedControl,
  Stepper,
} from "@/components/kit/primitives"
import { useTheme } from "@/components/theme-provider"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { ACCENTS, DEFAULT_ACCENT_ID } from "@/lib/accents"
import { cn } from "@/lib/utils"
import { useVoca } from "@/store/voca-context"

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
  const [keySheet, setKeySheet] = React.useState(false)
  const [keyDraft, setKeyDraft] = React.useState(state.settings.geminiKey)
  const [confirmReset, setConfirmReset] = React.useState(false)

  const accentId = state.settings.accentId
  const storageKB = (JSON.stringify(state).length / 1024).toFixed(1)
  const hasKey = !!state.settings.geminiKey

  function randomAccent() {
    const others = ACCENTS.filter((a) => a.id !== accentId)
    const next = others[Math.floor(Math.random() * others.length)]
    setAccent(next.id)
    toast(`Accent: ${next.name}`)
  }

  return (
    <div className="space-y-7">
      <LargeTitle title="Settings" />

      {/* Appearance */}
      <section className="space-y-2.5">
        <GroupHeader>Appearance</GroupHeader>
        <InsetGroup>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-[17px]">Theme</span>
            <SegmentedControl
              value={theme}
              onChange={(v) => setTheme(v as "light" | "dark" | "system")}
              options={[
                { value: "light", label: "Light" },
                { value: "system", label: "Auto" },
                { value: "dark", label: "Dark" },
              ]}
            />
          </div>
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[17px]">Accent Color</span>
              <button
                type="button"
                onClick={randomAccent}
                className="flex items-center gap-1 text-[15px] text-primary"
              >
                <Dices className="size-4" />
                随机
              </button>
            </div>
            <div className="mt-3 grid grid-cols-6 gap-3">
              {ACCENTS.map((a) => {
                const active = (accentId ?? DEFAULT_ACCENT_ID) === a.id
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAccent(a.id)}
                    aria-label={a.name}
                    className={cn(
                      "mx-auto size-8 rounded-full transition-transform",
                      active
                        ? "scale-100 ring-2 ring-foreground/60 ring-offset-2 ring-offset-background"
                        : "active:scale-90",
                    )}
                    style={{
                      backgroundColor:
                        theme === "dark" ? a.dark : a.light,
                    }}
                  />
                )
              })}
            </div>
          </div>
        </InsetGroup>
      </section>

      {/* Learning */}
      <section className="space-y-2.5">
        <GroupHeader>Learning</GroupHeader>
        <InsetGroup>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-[17px]">Daily Goal</p>
              <p className="text-[13px] text-muted-foreground">
                每天学习的新单词数量
              </p>
            </div>
            <Stepper
              value={state.settings.dailyGoal}
              onChange={setDailyGoal}
              min={1}
              max={100}
            />
          </div>
        </InsetGroup>
      </section>

      {/* AI */}
      <section className="space-y-2.5">
        <GroupHeader>Gemini API</GroupHeader>
        <InsetGroup>
          <ListRow
            icon={Cloud}
            tint="#AF52DE"
            as="button"
            onClick={() => {
              setKeyDraft(state.settings.geminiKey)
              setKeySheet(true)
            }}
            primary="Gemini API Key"
            secondary="用于 AI Reading（即将上线）"
            trailing={
              <span
                className={cn(
                  "text-[14px]",
                  hasKey ? "text-[#34C759]" : "text-muted-foreground/60",
                )}
              >
                {hasKey ? "已配置" : "未配置"}
              </span>
            }
            chevron
          />
        </InsetGroup>
      </section>

      {/* Data */}
      <section className="space-y-2.5">
        <GroupHeader>Data</GroupHeader>
        <InsetGroup>
          <ListRow
            icon={Wifi}
            tint="#32ADE6"
            primary="Local Storage"
            secondary="数据仅保存在本机浏览器"
            trailing={
              <span className="text-[14px] text-muted-foreground tabular-nums">
                {storageKB} KB
              </span>
            }
          />
          <ListRow
            icon={Download}
            tint="#34C759"
            as="button"
            onClick={() => {
              exportData(state)
              toast("已导出 JSON 备份")
            }}
            primary="Export Data"
            chevron
          />
          <ListRow
            icon={Trash2}
            tint="#FF3B30"
            as="button"
            onClick={() => setConfirmReset(true)}
            primary={<span className="text-destructive">Reset All Data</span>}
          />
        </InsetGroup>
      </section>

      {/* About */}
      <section className="space-y-2.5">
        <GroupHeader>About</GroupHeader>
        <InsetGroup>
          <ListRow
            icon={ShieldCheck}
            tint="#8E8E93"
            primary="Voca · 英语词汇学习"
            secondary="Version 1.0 · Apple-style UI"
          />
        </InsetGroup>
      </section>

      {/* API Key 输入 Sheet */}
      <Sheet open={keySheet} onOpenChange={setKeySheet}>
        <SheetContent
          side="bottom"
          className="gap-0 overflow-y-auto rounded-t-[22px] p-0 pb-[env(safe-area-inset-bottom)]"
        >
          <div className="sticky top-0 z-10 flex justify-center bg-background/90 pt-2.5 pb-1 backdrop-blur">
            <div className="h-1 w-9 rounded-full bg-foreground/20" />
          </div>
          <div className="space-y-4 px-5 pt-2 pb-6">
            <h2 className="text-[20px] font-semibold">Gemini API Key</h2>
            <input
              type="password"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              placeholder="AIza…"
              className="h-11 w-full rounded-[10px] bg-foreground/[0.055] px-3 text-[15px] outline-none focus:ring-2 focus:ring-ring/40 dark:bg-white/[0.08]"
            />
            <p className="text-[13px] leading-snug text-muted-foreground">
              Key 仅保存在本机 localStorage，不会上传到任何服务器。
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setGeminiKey("")
                  setKeyDraft("")
                  toast("API Key 已清除")
                }}
                disabled={!hasKey && !keyDraft}
                className="h-12 flex-1 rounded-[12px] text-[17px] font-medium text-destructive disabled:opacity-40"
              >
                清除
              </button>
              <button
                type="button"
                onClick={() => {
                  setGeminiKey(keyDraft)
                  setKeySheet(false)
                  toast(
                    keyDraft.trim() ? "API Key 已保存" : "API Key 已清除",
                  )
                }}
                className="h-12 flex-1 rounded-[12px] bg-primary text-[17px] font-medium text-primary-foreground"
              >
                保存
              </button>
            </div>
          </div>
          <SheetTitle className="sr-only">Gemini API Key</SheetTitle>
        </SheetContent>
      </Sheet>

      <AppleAlert
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset All Data?"
        description="所有学习进度、自定义单词和统计记录都会被清空，此操作无法撤销。"
        confirmLabel="Reset"
        destructive
        onConfirm={() => {
          resetAll()
          toast("数据已重置")
        }}
      />
    </div>
  )
}
